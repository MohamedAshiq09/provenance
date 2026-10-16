"""
All FalkorDB Cypher queries for Provenance.
Each query has a comment explaining:
  - What it does
  - Why it REQUIRES the graph (cannot be done with plain vector search)
  
Rule: LLM never generates these queries at runtime. They are deterministic.
"""
from app.core.db import get_graph
from datetime import datetime, timezone
from typing import Optional, Any


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
    
    return {
        "person_id": person_id,
        "sole_expert_systems": sole_systems,
        "unique_active_decisions": critical_decisions,
        "risk_level": "CRITICAL" if len(sole_systems) >= 3 else "HIGH" if sole_systems else "LOW",
        "impact_summary": f"Loss of this person affects {len(sole_systems)} systems and {len(critical_decisions)} decisions",
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
