"""
All FalkorDB Cypher queries for Provenance.
Each query has a comment explaining:
  - What it does
  - Why it REQUIRES the graph (cannot be done with plain vector search)
  
Rule: LLM never generates these queries at runtime. They are deterministic.
"""
from app.core.db import get_graph
from app.core.config import settings
from app.core.llm import extract_json
from datetime import datetime, timezone
from typing import Optional, Any
import uuid


def _graph(graph_name: str = None):
    return get_graph(graph_name)


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 1: Decision Trace
# WHY GRAPH: Follows multi-hop BASED_ON → SUPERSEDES chains that are impossible
# to traverse in a flat document store or vector DB. Each hop reveals a different
# source document from a potentially different year and author.
# ─────────────────────────────────────────────────────────────────────────────
TRACE_DECISION_QUERY = """
// Trace the full provenance chain of a decision
// Traverses BASED_ON, MADE_BY, SUPERSEDES, and multi-hop origins (RESOLVES <- Ticket - DISCUSSED_IN -> Message <- AUTHORED - Person)
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)-[:MADE_BY]->(maker:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(source)
OPTIONAL MATCH (d)-[:SUPERSEDES]->(old_d:Decision)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
OPTIONAL MATCH (old_d)-[:BASED_ON]->(old_source)
OPTIONAL MATCH (source)<-[:RESOLVES]-(ticket:Ticket)
OPTIONAL MATCH (ticket)-[:DISCUSSED_IN]->(msg:Message)
OPTIONAL MATCH (originator:Person)-[:AUTHORED]->(msg)
RETURN d, maker, collect(DISTINCT source) as sources,
       old_d, collect(DISTINCT old_source) as old_sources,
       collect(DISTINCT affected) as affected,
       collect(DISTINCT ticket) as tickets,
       collect(DISTINCT msg) as messages,
       collect(DISTINCT originator) as originators
"""

def trace_decision(decision_id: str, graph_name: str = None) -> dict:
    """
    Trace full decision provenance: who made it, based on what, what it replaced,
    and root communication origins (messages/tickets).
    
    GRAPH NECESSITY: Multi-hop traversal across Decision→Document→Ticket→Message nodes,
    following time-ordered edges. Impossible in SQL or vector search.
    """
    result = _graph(graph_name).query(TRACE_DECISION_QUERY, {"decision_id": decision_id})
    rows = result.result_set
    if not rows:
        return {"error": f"Decision '{decision_id}' not found"}
    
    r = rows[0]
    decision = _node_to_dict(r[0]) if r[0] else {}
    maker = _node_to_dict(r[1]) if r[1] else None
    sources = [_node_to_dict(s) for s in (r[2] or []) if s]
    superseded = _node_to_dict(r[3]) if r[3] else None
    old_sources = [_node_to_dict(s) for s in (r[4] or []) if s]
    affected = [_node_to_dict(a) for a in (r[5] or []) if a]
    tickets = [_node_to_dict(t) for t in (r[6] or []) if t]
    messages = [_node_to_dict(m) for m in (r[7] or []) if m]
    originators = [_node_to_dict(o) for o in (r[8] or []) if o]
    
    return {
        "decision": decision,
        "made_by": maker,
        "based_on": sources,
        "supersedes": superseded,
        "superseded_was_based_on": old_sources,
        "affects": affected,
        "related_tickets": tickets,
        "origin_messages": messages,
        "originators": originators,
        "path_description": _build_path_desc(decision, maker, sources, superseded),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 2: Who Knows (Expertise Graph)
# WHY GRAPH: Uses graph centrality — the person who is most connected (via
# WORKED_ON, AUTHORED, OWNS edges) to a System is the real expert, not just
# whoever wrote the README. Vector search cannot rank people by graph centrality.
# ─────────────────────────────────────────────────────────────────────────────
WHO_KNOWS_QUERY = """
// Find people most connected to a system, weighted by recency and edge type
// WORKED_ON is primary, AUTHORED is secondary, team OWNS gives group context
MATCH (s:System {name: $system_name})
OPTIONAL MATCH (s)<-[w:WORKED_ON]-(p:Person)
OPTIONAL MATCH (p)-[a:AUTHORED]->(doc:Document)-[:AFFECTS]->(s)
WITH s, p,
     count(DISTINCT w) as work_score,
     count(DISTINCT a) as author_score,
     max(coalesce(w.to, date())) as last_worked
WHERE p IS NOT NULL
RETURN p, work_score, author_score, last_worked,
       (work_score * 3 + author_score * 1) as raw_score
ORDER BY raw_score DESC, last_worked DESC
LIMIT 10
"""

WHO_KNOWS_TEAM_QUERY = """
// Also get the team that owns the system for bus-factor context
MATCH (s:System {name: $system_name})
OPTIONAL MATCH (s)<-[:OWNS]-(t:Team)
OPTIONAL MATCH (t)<-[:MEMBER_OF]-(member:Person)
RETURN s, t, collect(DISTINCT member) as team_members
"""

def who_knows(system_name: str, graph_name: str = None) -> dict:
    """
    Find who has real expertise on a system via graph centrality.
    
    GRAPH NECESSITY: Centrality calculation over multi-type edges. Each edge type
    (WORKED_ON, AUTHORED, OWNS) contributes differently. Cannot be done with
    keyword/vector search — requires traversal of relationship structure.
    """
    g = _graph(graph_name)
    experts_result = g.query(WHO_KNOWS_QUERY, {"system_name": system_name})
    team_result = g.query(WHO_KNOWS_TEAM_QUERY, {"system_name": system_name})
    
    experts = []
    for row in experts_result.result_set:
        person = _node_to_dict(row[0])
        person["work_score"] = row[1]
        person["author_score"] = row[2]
        person["last_worked"] = str(row[3]) if row[3] else None
        person["expertise_score"] = row[4]
        experts.append(person)
    
    team_info = {}
    if team_result.result_set:
        r = team_result.result_set[0]
        if r[1]:
            team_info = {
                "team": _node_to_dict(r[1]),
                "members": [_node_to_dict(m) for m in (r[2] or []) if m]
            }
    
    return {
        "system": system_name,
        "experts": experts,
        "team_context": team_info,
        "bus_factor": len([e for e in experts if e.get("expertise_score", 0) > 5]),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 3: Staleness Detection
# WHY GRAPH: When a new document arrives, we traverse BASED_ON edges BACKWARD
# to find all decisions that depended on what this document supersedes or
# contradicts. This multi-hop backward traversal is inherently graph-native.
# ─────────────────────────────────────────────────────────────────────────────
STALENESS_QUERY = """
// Find decisions that are now potentially stale because a new document
// supersedes or contradicts their source documents.
// Traverses: new_doc → contradicts → old_doc ← BASED_ON ← Decision → DEPENDS_ON → more_decisions
MATCH (new_doc:Document {id: $new_doc_id})
MATCH (new_doc)-[:SUPERSEDES|CONTRADICTS]->(old_doc:Document)
MATCH (d:Decision)-[:BASED_ON]->(old_doc)
WHERE d.status <> 'superseded'
OPTIONAL MATCH (d)<-[:DEPENDS_ON*1..3]-(downstream:Decision)
WHERE downstream.status <> 'superseded'
RETURN d as stale_decision,
       old_doc as stale_source,
       new_doc as new_source,
       collect(DISTINCT downstream) as downstream_decisions,
       'BASED_ON_SUPERSEDED_DOC' as reason
"""

MARK_STALE_QUERY = """
// Mark a decision as stale with reason
MATCH (d:Decision {id: $decision_id})
SET d.stale = true,
    d.stale_reason = $reason,
    d.stale_detected_at = $detected_at
RETURN d
"""

def detect_staleness(new_doc_id: str, graph_name: str = None) -> dict:
    """
    When a new document is ingested, find all decisions that are now stale.
    
    GRAPH NECESSITY: Backward traversal (find who depended on what changed),
    then forward traversal (find downstream dependents). This is BFS/DFS on
    the graph — fundamentally impossible with document similarity search.
    """
    g = _graph(graph_name)
    result = g.query(STALENESS_QUERY, {"new_doc_id": new_doc_id})
    
    stale_items = []
    now = datetime.now(timezone.utc).isoformat()
    
    for row in result.result_set:
        stale_decision = _node_to_dict(row[0])
        stale_source = _node_to_dict(row[1])
        new_source = _node_to_dict(row[2])
        downstream = [_node_to_dict(d) for d in (row[3] or []) if d]
        reason = row[4]
        
        # Mark the decision as stale in the graph
        g.query(MARK_STALE_QUERY, {
            "decision_id": stale_decision.get("id"),
            "reason": f"Source document '{stale_source.get('title')}' was superseded by '{new_source.get('title')}'",
            "detected_at": now,
        })
        
        stale_items.append({
            "stale_decision": stale_decision,
            "stale_source": stale_source,
            "new_source": new_source,
            "downstream_decisions": downstream,
            "reason": reason,
            "severity": "HIGH" if downstream else "MEDIUM",
        })
    
    return {
        "new_document": new_doc_id,
        "stale_decisions_found": len(stale_items),
        "stale_items": stale_items,
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 4: Bus Factor Analysis
# WHY GRAPH: Finds systems/decisions where a single person is the sole node
# in the knowledge path. Requires counting distinct paths — graph-native.
# ─────────────────────────────────────────────────────────────────────────────
BUS_FACTOR_QUERY = """
// Systems where this person is the ONLY expert (bus factor = 1)
MATCH (p:Person {id: $person_id})
MATCH (s:System)
MATCH (s)<-[:WORKED_ON]-(expert:Person)
WITH s, collect(DISTINCT expert) as experts, p
WHERE size(experts) = 1 AND experts[0].id = p.id
RETURN s as sole_system, experts
ORDER BY s.name
"""

BUS_FACTOR_DECISIONS_QUERY = """
// Decisions this person made that have no successor and no one else involved
MATCH (p:Person {id: $person_id})<-[:MADE_BY]-(d:Decision)
WHERE d.status = 'active' AND NOT (d)-[:SUPERSEDES]->()
OPTIONAL MATCH (d)-[:BASED_ON]->(source)
OPTIONAL MATCH (d)-[:AFFECTS]->(affected)
RETURN d, collect(DISTINCT source) as sources, collect(DISTINCT affected) as affected_systems
"""

def bus_factor(person_id: str, graph_name: str = None) -> dict:
    """
    What breaks if this person leaves? Find sole-expert systems and critical decisions.
    
    GRAPH NECESSITY: Path enumeration and uniqueness counting over typed edges.
    We need to find nodes where this person is the ONLY connected node of a type.
    """
    if person_id and not person_id.startswith("person_"):
        person_id = f"person_{person_id.lower().strip().split()[0]}"
    g = _graph(graph_name)
    systems_result = g.query(BUS_FACTOR_QUERY, {"person_id": person_id})
    decisions_result = g.query(BUS_FACTOR_DECISIONS_QUERY, {"person_id": person_id})
    
    sole_systems = [_node_to_dict(row[0]) for row in systems_result.result_set if row[0]]
    critical_decisions = []
    for row in decisions_result.result_set:
        d = _node_to_dict(row[0])
        d["sources"] = [_node_to_dict(s) for s in (row[1] or []) if s]
        d["affects"] = [_node_to_dict(a) for a in (row[2] or []) if a]
        critical_decisions.append(d)
    
    sys_count = len(sole_systems)
    dec_count = len(critical_decisions)
    sys_noun = "system" if sys_count == 1 else "systems"
    dec_noun = "decision" if dec_count == 1 else "decisions"
    
    return {
        "person_id": person_id,
        "sole_expert_systems": sole_systems,
        "unique_active_decisions": critical_decisions,
        "risk_level": "CRITICAL" if len(sole_systems) >= 3 else "HIGH" if sole_systems else "LOW",
        "impact_summary": f"Loss of this person affects {sys_count} {sys_noun} and {dec_count} {dec_noun}",
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 5: Connection Path (Shortest Path)
# WHY GRAPH: FalkorDB's shortest path algorithm finds how A connects to B through
# any relationship type. This is a graph algorithm — not possible with search.
# ─────────────────────────────────────────────────────────────────────────────
CONNECTION_PATH_QUERY = """
// Find shortest connection path between any two nodes
// Uses FalkorDB's built-in shortestPath with WITH clause
MATCH (a {id: $node_a}), (b {id: $node_b})
WITH shortestPath((a)-[*..10]->(b)) as path
WHERE path IS NOT NULL
RETURN path, length(path) as hops
LIMIT 3
"""

CONNECTION_PATH_REVERSE_QUERY = """
// Check reverse direction if needed
MATCH (a {id: $node_a}), (b {id: $node_b})
WITH shortestPath((b)-[*..10]->(a)) as path
WHERE path IS NOT NULL
RETURN path, length(path) as hops
LIMIT 3
"""

def connection_path(node_a_id: str, node_b_id: str, graph_name: str = None) -> dict:
    """
    Find how two nodes are connected through the graph.
    
    GRAPH NECESSITY: Shortest path algorithm — textbook graph problem.
    FalkorDB's shortestPath() traverses up to 10 hops across any relationship type.
    """
    g = _graph(graph_name)
    result = g.query(CONNECTION_PATH_QUERY, {"node_a": node_a_id, "node_b": node_b_id})
    rows = result.result_set
    if not rows:
        result = g.query(CONNECTION_PATH_REVERSE_QUERY, {"node_a": node_a_id, "node_b": node_b_id})
        rows = result.result_set
    
    paths = []
    for row in rows:
        path = row[0]
        hops = row[1]
        nodes = []
        if hasattr(path, 'nodes'):
            raw_nodes = path.nodes() if callable(path.nodes) else path.nodes
            nodes = [_node_to_dict(n) for n in (raw_nodes or [])]
        paths.append({"hops": hops, "nodes": nodes})
    
    return {
        "from": node_a_id,
        "to": node_b_id,
        "paths": paths,
        "found": len(paths) > 0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 6: Time-aware "As Of" Query
# WHY GRAPH: Filters edges by valid_from/valid_to temporal properties.
# Reconstructs what the company graph looked like on a specific date.
# ─────────────────────────────────────────────────────────────────────────────
AS_OF_DECISIONS_QUERY = """
// Find decisions that were active on a specific date
MATCH (d:Decision)
WHERE d.valid_from <= $as_of_date
  AND (d.valid_to IS NULL OR d.valid_to >= $as_of_date)
  AND d.status <> 'draft'
OPTIONAL MATCH (d)-[:AFFECTS]->(s:System)
OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
RETURN d, collect(DISTINCT s) as affected_systems, p
ORDER BY d.valid_from DESC
LIMIT 20
"""

def as_of(date_str: str, topic: Optional[str] = None, graph_name: str = None) -> dict:
    """
    What did the company know/decide as of a specific date?
    
    GRAPH NECESSITY: Temporal edge filtering on valid_from/valid_to — each edge
    and node has its own timeline. This creates a "time-travel" view of the graph
    state that cannot be replicated with document search.
    """
    g = _graph(graph_name)
    result = g.query(AS_OF_DECISIONS_QUERY, {"as_of_date": date_str})
    
    decisions = []
    for row in result.result_set:
        d = _node_to_dict(row[0])
        d["affected_systems"] = [_node_to_dict(s) for s in (row[1] or []) if s]
        d["made_by"] = _node_to_dict(row[2]) if row[2] else None
        decisions.append(d)
    
    if topic:
        topic_lower = topic.lower()
        decisions = [d for d in decisions if topic_lower in str(d.get("title", "")).lower()
                     or topic_lower in str(d.get("rationale", "")).lower()]
    
    return {
        "as_of_date": date_str,
        "topic_filter": topic,
        "decisions": decisions,
        "count": len(decisions),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 7: Full-text search + graph context
# WHY GRAPH: After finding matching nodes, we expand context via graph traversal
# to return related nodes that a pure text search would miss.
# ─────────────────────────────────────────────────────────────────────────────
SEARCH_AND_EXPAND_QUERY = """
// Find documents/decisions matching keyword, then expand via graph
MATCH (d)
WHERE (d:Document OR d:Decision)
  AND (toLower(d.title) CONTAINS toLower($keyword)
       OR toLower(coalesce(d.content, d.rationale, '')) CONTAINS toLower($keyword))
OPTIONAL MATCH (d)-[:BASED_ON|DISCUSSES|AFFECTS]-(related)
RETURN d, collect(DISTINCT related) as related_nodes
LIMIT 15
"""

def search_and_expand(keyword: str, graph_name: str = None) -> list:
    """
    Search for a keyword, then expand via graph edges to get context.
    
    GRAPH NECESSITY: The expansion step — finding related decisions, systems, and
    people — is only possible via graph traversal. Plain search returns documents;
    graph search returns the knowledge network around those documents.
    """
    g = _graph(graph_name)
    result = g.query(SEARCH_AND_EXPAND_QUERY, {"keyword": keyword})
    
    items = []
    for row in result.result_set:
        item = _node_to_dict(row[0])
        item["related"] = [_node_to_dict(r) for r in (row[1] or []) if r]
        items.append(item)
    return items


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 8: Stale decisions dashboard
# WHY GRAPH: Aggregates stale decisions with their impact radius (how many
# systems/people are affected) — requires graph traversal to compute impact.
# ─────────────────────────────────────────────────────────────────────────────
STALE_DECISIONS_QUERY = """
// Get all stale decisions with impact radius
MATCH (d:Decision)
WHERE d.stale = true
OPTIONAL MATCH (d)-[:AFFECTS]->(s:System)
OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(src)
RETURN d,
       collect(DISTINCT s) as affected_systems,
       p as owner,
       collect(DISTINCT src) as sources,
       count(DISTINCT s) as impact_radius
ORDER BY impact_radius DESC, d.stale_detected_at DESC
"""

def get_stale_decisions(graph_name: str = None) -> list:
    """Return all stale decisions sorted by impact radius."""
    g = _graph(graph_name)
    result = g.query(STALE_DECISIONS_QUERY)
    
    items = []
    for row in result.result_set:
        d = _node_to_dict(row[0])
        d["affected_systems"] = [_node_to_dict(s) for s in (row[1] or []) if s]
        d["owner"] = _node_to_dict(row[2]) if row[2] else None
        d["sources"] = [_node_to_dict(s) for s in (row[3] or []) if s]
        d["impact_radius"] = row[4]
        items.append(d)
    return items


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 10: Action Workflow — Remediate Stale Decision
# Automatically identifies owner via MADE_BY / OWNS and creates remediation ticket
# ─────────────────────────────────────────────────────────────────────────────
REMEDIATE_STALE_QUERY = """
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
MERGE (t:Ticket {id: $ticket_id})
SET t.title = $title,
    t.status = 'action_required',
    t.priority = 'high',
    t.created_at = $created_at,
    t.action_type = 'STALENESS_REMEDIATION',
    t.notes = $notes,
    t.proof_path = d.stale_reason
MERGE (t)-[:REMEDIATES]->(d)
WITH t, d, p
WHERE p IS NOT NULL
MERGE (t)-[:ASSIGNED_TO]->(p)
RETURN t, d, p
"""

def remediate_stale_decision(decision_id: str, action_note: str = None, graph_name: str = None) -> dict:
    """
    Actionable remediation: Takes a stale decision, traces the original owner,
    creates a High-Priority Remediation Ticket in the graph, and assigns it to the owner.
    """
    g = _graph(graph_name)
    now = datetime.now(timezone.utc).isoformat()
    ticket_id = f"ticket_remediate_{decision_id}_{now[11:19].replace(':', '')}"
    params = {
        "decision_id": decision_id,
        "ticket_id": ticket_id,
        "title": f"Remediate Stale Decision: {decision_id}",
        "created_at": now,
        "notes": action_note or "Automated staleness remediation generated by Provenance Company Brain",
    }
    result = g.query(REMEDIATE_STALE_QUERY, params)
    if not result.result_set:
        return {"error": f"Decision '{decision_id}' not found"}
    
    r = result.result_set[0]
    ticket = _node_to_dict(r[0])
    decision = _node_to_dict(r[1])
    owner = _node_to_dict(r[2]) if r[2] else None
    return {
        "status": "ticket_created",
        "ticket": ticket,
        "decision": decision,
        "assigned_to": owner,
        "message": f"Remediation ticket '{ticket_id}' assigned to {owner.get('name', 'Team Lead') if owner else 'Unassigned'}"
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 11: Impact Simulation ("what breaks if we change X?")
# WHY GRAPH: Blast-radius analysis is forward/backward traversal over typed
# edges. Downstream: what the node impacts (AFFECTS/USES out, DEPENDS_ON
# dependents). Review set: what would need re-review if the node changes
# (decisions AFFECTing a system, decisions BASED_ON a document). A flat
# store cannot walk these chains; each hop changes the answer set.
# ─────────────────────────────────────────────────────────────────────────────
IMPACT_DOWNSTREAM_QUERY = """
// Things this node impacts: systems/projects it affects or is used by,
// plus decisions that depend on it (transitively)
MATCH (n) WHERE n.id = $node_id
OPTIONAL MATCH p1 = (n)-[:AFFECTS|USES*1..3]->(m1)
OPTIONAL MATCH p2 = (n)<-[:DEPENDS_ON*1..3]-(m2)
RETURN collect(DISTINCT [m1, length(p1), [r IN relationships(p1) | type(r)], [x IN nodes(p1) | x.id]]) as downstream,
       collect(DISTINCT [m2, length(p2), [r IN relationships(p2) | type(r)], [x IN nodes(p2) | x.id]]) as dependents
"""

IMPACT_REVIEW_QUERY = """
// Things that would need re-review if this node changes: decisions
// affecting it, decisions based on it (documents)
MATCH (n) WHERE n.id = $node_id
OPTIONAL MATCH (m)-[r:AFFECTS|BASED_ON]->(n)
RETURN collect(DISTINCT [m, type(r)]) as review_candidates
"""

def impact_of(node_id: str, graph_name: str = None) -> dict:
    """
    Simulate the blast radius of changing a node: downstream impacts plus
    the review set (decisions/docs that assumed the current state).

    GRAPH NECESSITY: Direction-aware multi-hop traversal. Downstream walks
    AFFECTS/USES out and DEPENDS_ON backwards; the review set walks AFFECTS/
    BASED_ON in reverse. Depth and via-path are computed per impacted node.
    """
    g = _graph(graph_name)
    exists = g.query("MATCH (n) WHERE n.id = $node_id RETURN n LIMIT 1", {"node_id": node_id})
    if not exists.result_set:
        return {"error": f"Node '{node_id}' not found"}

    down_result = g.query(IMPACT_DOWNSTREAM_QUERY, {"node_id": node_id})
    review_result = g.query(IMPACT_REVIEW_QUERY, {"node_id": node_id})

    # Merge downstream by node id, keeping minimum depth (shortest impact path)
    merged = {}
    for row in down_result.result_set:
        for entry in (row[0] or []) + (row[1] or []):
            node, depth, via, path = entry[0], entry[1], entry[2], entry[3]
            if node is None:
                continue
            d = _node_to_dict(node)
            nid = d.get("id")
            if nid is None or nid == node_id:
                continue
            if nid not in merged or (depth is not None and depth < merged[nid]["depth"]):
                merged[nid] = {"node": d, "depth": depth, "via": via or [], "path": path or []}

    downstream = sorted(merged.values(), key=lambda i: (i["depth"] if i["depth"] is not None else 99))

    review = []
    for row in review_result.result_set:
        for node, rel in (row[0] or []):
            if node is None:
                continue
            d = _node_to_dict(node)
            if d.get("id") == node_id:
                continue
            d["review_edge"] = rel
            review.append(d)

    return {
        "node_id": node_id,
        "downstream": downstream,
        "downstream_count": len(downstream),
        "needs_review": review,
        "needs_review_count": len(review),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 12: Decision Lifecycle Timeline ("how did our thinking evolve?")
# WHY GRAPH: A decision's evolution is the SUPERSEDES chain walked in BOTH
# directions and ordered by time — predecessors (what it replaced) and
# successors (what replaced it), each with maker and evidence. A flat store
# holds snapshots; only the graph holds the lineage in queryable form.
# ─────────────────────────────────────────────────────────────────────────────
TIMELINE_QUERY = """
// Full lifecycle of a decision: what it replaced, what replaced it, ordered by time
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)-[:SUPERSEDES*0..5]->(older:Decision)
OPTIONAL MATCH (newer:Decision)-[:SUPERSEDES*1..5]->(d)
WITH d, collect(DISTINCT older) + collect(DISTINCT newer) AS chain
UNWIND chain AS c
OPTIONAL MATCH (c)-[:MADE_BY]->(p:Person)
OPTIONAL MATCH (c)-[:BASED_ON]->(src)
RETURN c, p, collect(DISTINCT src) as sources
ORDER BY coalesce(c.valid_from, c.made_at, '')
"""

def decision_timeline(decision_id: str, graph_name: str = None) -> dict:
    """
    Show how a decision evolved: the ordered SUPERSEDES lineage with
    maker and evidence at each step.

    GRAPH NECESSITY: Bidirectional variable-length traversal over
    SUPERSEDES, time-ordered. Snapshots in a document store cannot
    reconstruct lineage — the chain exists only as graph edges.
    """
    g = _graph(graph_name)
    result = g.query(TIMELINE_QUERY, {"decision_id": decision_id})
    if not result.result_set:
        return {"error": f"Decision '{decision_id}' not found"}

    timeline = []
    for row in result.result_set:
        c = _node_to_dict(row[0])
        if not c.get("id"):
            continue
        c["made_by"] = _node_to_dict(row[1]) if row[1] else None
        c["based_on"] = [_node_to_dict(s) for s in (row[2] or []) if s]
        timeline.append(c)

    return {
        "anchor_id": decision_id,
        "timeline": timeline,
        "count": len(timeline),
        "current": timeline[-1] if timeline else {},
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 13: Knowledge Gaps ("what does the company NOT know?")
# WHY GRAPH: Orphans are defined by ABSENT relationships — systems no
# decision affects, decisions with no evidence, documents with no author,
# stale decisions with no remediation. Absence of an edge is only queryable
# where edges are first-class: the graph. A document store cannot ask
# "what points at nothing".
# ─────────────────────────────────────────────────────────────────────────────
GAPS_QUERY = """
// Systems no decision affects
MATCH (s:System) WHERE NOT ()-[:AFFECTS]->(s) RETURN s
"""
GAPS_DECISIONS_QUERY = """
// Decisions with no evidence behind them
MATCH (d:Decision) WHERE NOT (d)-[:BASED_ON]->() RETURN d
"""
GAPS_DOCS_QUERY = """
// Documents with no known author
MATCH (doc:Document) WHERE NOT ()-[:AUTHORED]->(doc) RETURN doc
"""
GAPS_STALE_QUERY = """
// Stale decisions nobody is remediating
MATCH (d:Decision) WHERE d.stale = true AND NOT ()-[:REMEDIATES]->(d) RETURN d
"""

_GAP_CAP = 20


def knowledge_gaps(graph_name: str = None) -> dict:
    """
    Find what the company doesn't know: orphan systems, evidenceless
    decisions, authorless documents, and stale decisions with no remediation.

    GRAPH NECESSITY: Every gap is a missing edge. Only the graph can
    observe its own incompleteness.
    """
    g = _graph(graph_name)

    def _collect(query):
        res = g.query(query)
        return [_node_to_dict(row[0]) for row in res.result_set if row[0]]

    docless = _collect(GAPS_QUERY)
    evidenceless = _collect(GAPS_DECISIONS_QUERY)
    authorless = _collect(GAPS_DOCS_QUERY)
    unremediated = _collect(GAPS_STALE_QUERY)

    return {
        "docless_systems": docless[:_GAP_CAP],
        "docless_systems_total": len(docless),
        "evidenceless_decisions": evidenceless[:_GAP_CAP],
        "evidenceless_decisions_total": len(evidenceless),
        "authorless_docs": authorless[:_GAP_CAP],
        "authorless_docs_total": len(authorless),
        "unremediated_stale": unremediated[:_GAP_CAP],
        "unremediated_stale_total": len(unremediated),
        "total_gaps": len(docless) + len(evidenceless) + len(authorless) + len(unremediated),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 14: Contradiction Candidates (review-gated, never auto-applied)
# WHY GRAPH: Overlap between a new document and existing knowledge is found
# by shared keyword + shared SYSTEM context (AFFECTS/BASED_ON traversal).
# A candidate lives as a node so a reviewer must CONFIRM it before a
# CONTRADICTS edge exists — nothing enters lineage without human action.
# ─────────────────────────────────────────────────────────────────────────────
CONTRADICTION_OVERLAP_QUERY = """
// Per-keyword overlap: existing Docs/Decisions whose TITLE (the indexing
// surface) contains a significant word from the new document. Content
// matching is deliberately excluded — unstructured bodies match generic
// words ('now', 'auth') and drown the review queue in noise.
MATCH (existing) WHERE (existing:Document OR existing:Decision)
  AND existing.id <> $new_doc_id
  AND toLower(existing.title) CONTAINS toLower($keyword)
  // lineage pairs (classic SUPERSEDES flow) are NOT contradictions
  AND NOT (existing)-[:SUPERSEDES]->() AND NOT ()-[:SUPERSEDES]->(existing)
RETURN existing
ORDER BY CASE WHEN existing:Decision THEN 0 ELSE 1 END, existing.id
LIMIT 8
"""

# Titles dominate: content matches pour in noise (every doc mentions "the").
_CONTRA_STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "use", "using",
    "new", "again", "back", "into", "our", "was", "have", "has", "not",
    "decision", "decisions", "system", "systems", "document", "doc",
}

def _contradiction_keywords(text: str, limit: int = 8) -> list:
    """Significant words from a title/first-line for overlap candidacy."""
    words = []
    for w in (text or "").split()[:30]:
        k = "".join(ch for ch in w.lower() if ch.isalnum())
        if len(k) >= 3 and k not in _CONTRA_STOPWORDS and k not in words:
            words.append(k)
        if len(words) >= limit:
            break
    return words

CONTRADICTION_CANDIDATES_QUERY = """
// Unresolved contradiction candidates, newest first
MATCH (c:ContradictionCandidate) WHERE c.status = 'candidate'
OPTIONAL MATCH (c)-[:CANDIDATE_SOURCE]->(source) WHERE source:Document
RETURN c, source ORDER BY c.detected_at DESC
"""

CONTRADICTION_CONFIRM_QUERY = """
// Human confirms a candidate → create the CONTRADICTS edge (new doc → old
// knowledge) with claim metadata. This is the ONLY path that creates it.
MATCH (c:ContradictionCandidate {id: $candidate_id})
WHERE c.status = 'candidate'
MATCH (c)-[:CANDIDATE_SOURCE]->(source:Document)
MATCH (c)-[:CANDIDATE_TARGET]->(target) WHERE target:Document OR target:Decision
CREATE (source)-[r:CONTRADICTS {
    claim: $claim,
    valid_from: $now,
    valid_to: null,
    ingested_at: $now,
    source_id: $candidate_id
}]->(target)
SET c.status = 'confirmed', c.confirmed_at = $now
RETURN c, target, source, id(r) as edge_id
"""


def find_contradiction_candidates(new_doc_id: str, new_text: str = None,
                                  graph_name: str = None) -> dict:
    """
    After ingesting a document, find existing knowledge that might contradict it.
    GUARDED: writes ContradictionCandidate nodes for HUMAN review — never a
    CONTRADICTS edge. The LLM (if configured) only labels an assessment
    (contradicts/confirms/neutral); without keys the candidate stays
    'unverified'. The reviewer decides via confirm_contradiction().

    GRAPH NECESSITY: Overlap is keyword-containment against the existing
    graph plus lineage exclusion (SUPERSEDES pairs are NOT contradictions) —
    only a graph knows which pairs are already lineage.
    """
    g = _graph(graph_name)
    now = datetime.now(timezone.utc).isoformat()
    candidate_root = f"cc_{uuid.uuid4().hex[:8]}"

    keywords = _contradiction_keywords((new_text or "").strip().split("\n")[0])

    persisted = []
    seen_ids = set()
    for kw in keywords:
        rows = g.query(CONTRADICTION_OVERLAP_QUERY, {"new_doc_id": new_doc_id, "keyword": kw}).result_set
        for row in rows:
            node = _node_to_dict(row[0])
            target_id = node.get("id")
            if not target_id or target_id in seen_ids:
                continue
            seen_ids.add(target_id)

            # LLM label if configured; guarded fallback keeps 'unverified'
            verdict, rationale = "unverified", "No LLM configured — human review required"
            if settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
                try:
                    verdict_json = extract_json(
                        f"NEW DOCUMENT:\n{(new_text or '')[:2000]}\n\n"
                        f"EXISTING {'DECISION' if 'Decision' in node.get('_labels', []) else 'DOCUMENT'}:\n"
                        f"title: {node.get('title')}\n"
                        f"text: {(node.get('content') or node.get('rationale') or '')[:2000]}\n\n"
                        "Does the new document CONTRADICT, CONFIRM, or NEUTRALLY mention the existing one? "
                        'Return ONLY JSON: {"verdict": "contradicts|confirms|neutral", "reason": "one sentence"}',
                        {"verdict": "string", "reason": "string"},
                    )
                    v = str(verdict_json.get("verdict", "")).lower()
                    if v in ("contradicts", "confirms", "neutral"):
                        verdict = v
                        rationale = verdict_json.get("reason", "")
                except Exception:
                    pass  # guarded: LLM failure leaves the candidate unverified

            cc_id = f"{candidate_root}_{target_id}"
            g.query("""
                MERGE (cc:ContradictionCandidate {id: $cc_id})
                SET cc.status = 'candidate', cc.verdict = $verdict, cc.rationale = $rationale,
                    cc.new_doc_id = $new_doc_id, cc.target_id = $target_id,
                    cc.target_title = $target_title, cc.target_type = $target_type,
                    cc.matched_keyword = $keyword, cc.detected_at = $now
                WITH cc
                MATCH (src:Document {id: $new_doc_id})
                MERGE (cc)-[:CANDIDATE_SOURCE]->(src)
                WITH cc
                MATCH (t) WHERE t.id = $target_id AND (t:Document OR t:Decision)
                MERGE (cc)-[:CANDIDATE_TARGET]->(t)
            """, {"cc_id": cc_id, "verdict": verdict, "rationale": rationale,
                  "new_doc_id": new_doc_id, "target_id": target_id,
                  "target_title": node.get("title", ""),
                  "target_type": "Decision" if "Decision" in node.get("_labels", []) else "Document",
                  "keyword": kw, "now": now})
            persisted.append({
                "candidate_id": cc_id, "target_id": target_id,
                "target_type": "Decision" if "Decision" in node.get("_labels", []) else "Document",
                "target_title": node.get("title"), "matched_keyword": kw,
                "verdict": verdict, "rationale": rationale,
            })

    return {
        "new_doc_id": new_doc_id,
        "candidate_root": candidate_root,
        "candidates": persisted,
        "candidate_count": len(persisted),
    }


def get_contradiction_candidates(graph_name: str = None) -> list:
    """Unresolved contradiction candidates awaiting human review."""
    g = _graph(graph_name)
    result = g.query(CONTRADICTION_CANDIDATES_QUERY)
    items = []
    for row in result.result_set:
        c = _node_to_dict(row[0])
        c["source_doc"] = _node_to_dict(row[1]) if row[1] else None
        items.append(c)
    return items


def confirm_contradiction(candidate_id: str, claim: str = None, graph_name: str = None) -> dict:
    """
    Human CONFIRMS a candidate → the CONTRADICTS edge is created (new doc →
    old knowledge) — the ONLY graph path to this edge. The staleness radar
    (detect_staleness) already traverses CONTRADICTS, so marking stale
    happens on the existing flow, no new staleness logic.
    """
    g = _graph(graph_name)
    now = datetime.now(timezone.utc).isoformat()
    result = g.query(CONTRADICTION_CONFIRM_QUERY, {
        "candidate_id": candidate_id,
        "claim": claim or "Confirmed by reviewer",
        "now": now,
    })
    if not result.result_set:
        return {"error": f"Candidate '{candidate_id}' not found or already resolved"}

    target = _node_to_dict(result.result_set[0][1])
    source = _node_to_dict(result.result_set[0][2]) if result.result_set[0][2] else None

    # Staleness radar reacts to the new CONTRADICTS edge via the source doc
    stale = detect_staleness(source.get("id"), graph_name) if source else {}

    return {
        "status": "contradiction_confirmed",
        "candidate": _node_to_dict(result.result_set[0][0]),
        "target": target,
        "source": source,
        "edge_relationship": "CONTRADICTS",
        "staleness_check": stale,
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 9: Graph statistics
# ─────────────────────────────────────────────────────────────────────────────
# QUERY 15: Ramp Plan ("you just joined — here's the map of system X")
# WHY GRAPH: An onboarding pack is a multi-query composition over typed
# edges: WHO to ask (WORKED_ON/AUTHORED centrality), WHAT decisions shaped
# the system (AFFECTS with makers), WHICH docs are the evidence trail
# (AUTHORED/AFFECTS), and WHAT is at risk (stale flags). A flat store can
# return documents matching 'X' — it cannot assemble the people + decisions
# + evidence + risk structure from relationship patterns.
# ─────────────────────────────────────────────────────────────────────────────
RAMP_DECISIONS_QUERY = """
// Key decisions that shaped this system, with maker and evidence
MATCH (s:System {name: $system_name})
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(s)
OPTIONAL MATCH (d)-[:MADE_BY]->(p:Person)
OPTIONAL MATCH (d)-[:BASED_ON]->(src)
RETURN d, p, collect(DISTINCT src) as sources
ORDER BY coalesce(d.valid_from, d.made_at, '')
"""
RAMP_DOCS_QUERY = """
// The evidence trail: source documents behind decisions that shaped this
// system (AFFECTS → BASED_ON → AUTHORED). Documents have no direct system
// edge in the schema — the provenance chain is the path.
MATCH (s:System {name: $system_name})
OPTIONAL MATCH (d:Decision)-[:AFFECTS]->(s)
OPTIONAL MATCH (d)-[:BASED_ON]->(doc:Document)
OPTIONAL MATCH (p:Person)-[:AUTHORED]->(doc)
WITH DISTINCT doc, p WHERE doc IS NOT NULL
RETURN doc, p
ORDER BY coalesce(doc.valid_from, '') DESC
LIMIT 10
"""


def ramp_plan(system_name: str, graph_name: str = None) -> dict:
    """
    Onboarding composer for one system: people to ask, decisions that shaped
    it, the evidence trail, and open risks. Deterministic composition —
    every section is a real graph query, no LLM anywhere in ranking.

    GRAPH NECESSITY: joins four distinct edge patterns (WORKED_ON centrality,
    AFFECTS + MADE_BY + BASED_ON, AUTHORED + AFFECTS, stale flags) into one
    structured plan; impossible without the typed edges.
    """
    g = _graph(graph_name)

    wk = who_knows(system_name, graph_name)
    if not wk["experts"] and not wk["team_context"]:
        exists = g.query(
            "MATCH (s:System {name: $system_name}) RETURN s LIMIT 1",
            {"system_name": system_name},
        )
        if not exists.result_set:
            return {"error": f"System '{system_name}' not found"}

    decisions = []
    for row in g.query(RAMP_DECISIONS_QUERY, {"system_name": system_name}).result_set:
        d = _node_to_dict(row[0])
        if not d.get("id"):
            continue
        d["made_by"] = _node_to_dict(row[1]) if row[1] else None
        d["evidence"] = [_node_to_dict(s) for s in (row[2] or []) if s]
        decisions.append(d)

    key_docs = []
    for row in g.query(RAMP_DOCS_QUERY, {"system_name": system_name}).result_set:
        doc = _node_to_dict(row[0])
        if not doc.get("id"):
            continue
        doc["author"] = _node_to_dict(row[1]) if row[1] else None
        key_docs.append(doc)

    stale = [d for d in decisions if d.get("stale")]

    ramp_sequence = (
        [f"Talk to {e.get('name', e.get('id'))}" for e in wk["experts"][:3]]
        + [f"Read decision: {d.get('title', d.get('id'))}" for d in decisions[:5]]
        + [f"Skim evidence: {doc.get('title', doc.get('id'))}" for doc in key_docs[:3]]
    )

    return {
        "system": system_name,
        "people_to_ask": wk["experts"][:5],
        "team": wk["team_context"],
        "decisions": decisions,
        "key_docs": key_docs,
        "open_risks": stale,
        "ramp_sequence": ramp_sequence,
        "counts": {
            "people": len(wk["experts"]),
            "decisions": len(decisions),
            "docs": len(key_docs),
            "stale": len(stale),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 16: Team Risk ("which teams are one resignation away from outage?")
# WHY GRAPH: Sole-expert systems require counting DISTINCT other PEOPLE per
# WORKED_ON edge — a centrality-over-people pattern, not a text search. Team
# risk aggregates two edge families (MEMBER_OF x WORKED_ON, MEMBER_OF x
# MADE_BY) that only exist as typed relationships.
# ─────────────────────────────────────────────────────────────────────────────
TEAM_MEMBER_DECISIONS_QUERY = """
// Per team member: decisions made / active / stale
MATCH (t:Team)
OPTIONAL MATCH (p:Person)-[:MEMBER_OF]->(t)
OPTIONAL MATCH (d:Decision)-[:MADE_BY]->(p)
WITH t, p,
     count(DISTINCT d) as made,
     count(DISTINCT CASE WHEN d.status <> 'superseded' THEN d END) as active,
     count(DISTINCT CASE WHEN d.stale = true THEN d END) as stale_made
RETURN t, p, made, active, stale_made
"""

TEAM_SOLE_SYSTEMS_QUERY = """
// Systems where a team member is the ONLY person still WORKED_ON
MATCH (t:Team)<-[:MEMBER_OF]-(p:Person)-[:WORKED_ON]->(s:System)
OPTIONAL MATCH (other:Person)-[:WORKED_ON]->(s) WHERE other <> p
WITH t, p, s, count(DISTINCT other) as others
WHERE others = 0
WITH t, s, collect(DISTINCT p) as sole_experts
WITH t, collect(
    {system: s.name, sole_experts: [e IN sole_experts | e.name]}
) as sole_list
RETURN t, sole_list
"""


def team_risk(graph_name: str = None) -> dict:
    """
    Per-team risk posture: members with their decision load, systems only
    the team (single person!) keeps working, and stale decision counts.

    GRAPH NECESSITY: sole-expert detection = "count the OTHER people on each
    WORKED_ON edge" — only the graph holds that multiplicity.
    """
    g = _graph(graph_name)

    members_by_team = {}
    for row in g.query(TEAM_MEMBER_DECISIONS_QUERY).result_set:
        team = _node_to_dict(row[0])
        tid = team.get("name") or team.get("id")
        if not tid:
            continue
        p = _node_to_dict(row[1])
        if p.get("id"):
            members_by_team.setdefault(tid, {"team": team, "members": {}, "sole": []})
            members_by_team[tid]["members"][p["id"]] = {
                "person": p, "made": row[2], "active": row[3], "stale": row[4],
            }
    for tid in members_by_team:
        members_by_team[tid]["members"] = list(members_by_team[tid]["members"].values())

    for row in g.query(TEAM_SOLE_SYSTEMS_QUERY).result_set:
        team = _node_to_dict(row[0])
        tid = team.get("name") or team.get("id")
        if tid in members_by_team:
            members_by_team[tid]["sole"] = row[1] or []

    teams = []
    for tid, data in members_by_team.items():
        members = data["members"]
        sole = data["sole"]
        stale_total = sum(m["stale"] for m in members)
        made_total = sum(m["made"] for m in members)
        risk = "CRITICAL" if len(sole) >= 2 or stale_total >= 2 else (
            "HIGH" if sole or stale_total else ("MEDIUM" if made_total else "LOW")
        )
        teams.append({
            "team_name": tid,
            "member_count": len(members),
            "members": [
                {"name": m["person"].get("name"), "role": m["person"].get("role"),
                 "decisions_made": m["made"], "active": m["active"], "stale": m["stale"]}
                for m in members
            ],
            "sole_expert_systems": sole,
            "stale_decisions_made": stale_total,
            "risk_level": risk,
        })

    teams.sort(key=lambda t: {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}[t["risk_level"]])

    return {
        "teams": teams,
        "team_count": len(teams),
        "total_sole_systems": sum(len(t["sole_expert_systems"]) for t in teams),
        "total_stale_made": sum(t["stale_decisions_made"] for t in teams),
    }


# ─────────────────────────────────────────────────────────────────────────────
# QUERY 9: Graph statistics
# ─────────────────────────────────────────────────────────────────────────────
STATS_QUERY = """
MATCH (n) RETURN labels(n)[0] as label, count(n) as count
"""

def get_graph_stats(graph_name: str = None) -> dict:
    """Return node counts by label for the dashboard."""
    g = _graph(graph_name)
    result = g.query(STATS_QUERY)
    stats = {}
    for row in result.result_set:
        label = row[0]
        count = row[1]
        if label:
            stats[label] = count
    return stats


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def _node_to_dict(node) -> dict:
    """Convert a FalkorDB Node to a plain dict."""
    if node is None:
        return {}
    try:
        props = dict(node.properties) if hasattr(node, 'properties') else {}
        if hasattr(node, 'labels'):
            props["_labels"] = list(node.labels)
        # Convert date/datetime objects to strings
        for k, v in props.items():
            if hasattr(v, 'isoformat'):
                props[k] = v.isoformat()
        return props
    except Exception:
        return {}


def _build_path_desc(decision: dict, maker: Optional[dict], sources: list, superseded: Optional[dict]) -> str:
    """Build a human-readable path description."""
    parts = [f"Decision: '{decision.get('title', '?')}'"]
    if maker:
        parts.append(f"→ Made by: {maker.get('name', '?')}")
    if sources:
        parts.append(f"→ Based on: {', '.join(s.get('title', '?') for s in sources[:3])}")
    if superseded:
        parts.append(f"→ Supersedes: '{superseded.get('title', '?')}'")
    return " ".join(parts)
