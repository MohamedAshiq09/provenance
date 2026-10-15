"""
Graph ingestion pipeline — inserts nodes and edges into FalkorDB.
All upserts are idempotent (MERGE not CREATE).
Every edge carries: valid_from, valid_to, ingested_at, source_id.
"""
from datetime import datetime, date, timezone
from typing import Optional, Any
from app.core.db import get_graph


def _graph(graph_name: str = None):
    return get_graph(graph_name)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _date_str(d) -> Optional[str]:
    if d is None:
        return None
    if isinstance(d, str):
        return d
    if isinstance(d, (date, datetime)):
        return d.isoformat()
    return str(d)


# ─────────────────────────────────────────────────────────────────────────────
# Node Upserts (MERGE = idempotent)
# ─────────────────────────────────────────────────────────────────────────────

def upsert_person(data: dict, graph_name: str = None):
    q = """
    MERGE (p:Person {id: $id})
    SET p.name = $name,
        p.email = $email,
        p.role = $role,
        p.active = $active,
        p.updated_at = $updated_at
    RETURN p
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "role": data.get("role", ""),
        "active": data.get("active", True),
        "updated_at": _now(),
    })


def upsert_team(data: dict, graph_name: str = None):
    q = """
    MERGE (t:Team {id: $id})
    SET t.name = $name, t.domain = $domain, t.updated_at = $updated_at
    RETURN t
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "name": data.get("name", ""),
        "domain": data.get("domain", ""),
        "updated_at": _now(),
    })


def upsert_system(data: dict, graph_name: str = None):
    q = """
    MERGE (s:System {id: $id})
    SET s.name = $name, s.type = $type, s.stack = $stack,
        s.owner_team = $owner_team, s.updated_at = $updated_at
    RETURN s
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "name": data.get("name", ""),
        "type": data.get("type", ""),
        "stack": data.get("stack", ""),
        "owner_team": data.get("owner_team", ""),
        "updated_at": _now(),
    })


def upsert_document(data: dict, graph_name: str = None):
    q = """
    MERGE (d:Document {id: $id})
    SET d.title = $title,
        d.content = $content,
        d.doc_type = $doc_type,
        d.url = $url,
        d.valid_from = $valid_from,
        d.valid_to = $valid_to,
        d.ingested_at = $ingested_at,
        d.source_id = $source_id
    RETURN d
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "title": data.get("title", ""),
        "content": data.get("content", "")[:2000],  # truncate for storage
        "doc_type": data.get("doc_type", "document"),
        "url": data.get("url", ""),
        "valid_from": _date_str(data.get("valid_from")),
        "valid_to": _date_str(data.get("valid_to")),
        "ingested_at": _now(),
        "source_id": data.get("source_id", data["id"]),
    })


def upsert_decision(data: dict, graph_name: str = None):
    q = """
    MERGE (d:Decision {id: $id})
    SET d.title = $title,
        d.rationale = $rationale,
        d.status = $status,
        d.made_at = $made_at,
        d.valid_from = $valid_from,
        d.valid_to = $valid_to,
        d.source_id = $source_id,
        d.stale = $stale,
        d.updated_at = $updated_at
    RETURN d
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "title": data.get("title", ""),
        "rationale": data.get("rationale", ""),
        "status": data.get("status", "active"),
        "made_at": _date_str(data.get("made_at")),
        "valid_from": _date_str(data.get("valid_from", data.get("made_at"))),
        "valid_to": _date_str(data.get("valid_to")),
        "source_id": data.get("source_id", data["id"]),
        "stale": data.get("stale", False),
        "updated_at": _now(),
    })


def upsert_ticket(data: dict, graph_name: str = None):
    q = """
    MERGE (t:Ticket {id: $id})
    SET t.title = $title, t.status = $status, t.priority = $priority,
        t.created_at = $created_at, t.resolved_at = $resolved_at, t.updated_at = $updated_at
    RETURN t
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "title": data.get("title", ""),
        "status": data.get("status", "open"),
        "priority": data.get("priority", "medium"),
        "created_at": _date_str(data.get("created_at")),
        "resolved_at": _date_str(data.get("resolved_at")),
        "updated_at": _now(),
    })


def upsert_message(data: dict, graph_name: str = None):
    q = """
    MERGE (m:Message {id: $id})
    SET m.content = $content, m.channel = $channel,
        m.timestamp = $timestamp, m.thread_id = $thread_id, m.updated_at = $updated_at
    RETURN m
    """
    _graph(graph_name).query(q, {
        "id": data["id"],
        "content": data.get("content", "")[:500],
        "channel": data.get("channel", ""),
        "timestamp": _date_str(data.get("timestamp")),
        "thread_id": data.get("thread_id", ""),
        "updated_at": _now(),
    })


# ─────────────────────────────────────────────────────────────────────────────
# Edge Upserts — Every edge has temporal properties + source_id
# ─────────────────────────────────────────────────────────────────────────────

def upsert_edge(
    from_id: str, from_label: str,
    to_id: str, to_label: str,
    rel_type: str,
    props: dict = None,
    source_id: str = "",
    valid_from: str = None,
    valid_to: str = None,
    graph_name: str = None,
):
    """Generic edge upsert with temporal properties."""
    props = props or {}
    q = f"""
    MATCH (a:{from_label} {{id: $from_id}})
    MATCH (b:{to_label} {{id: $to_id}})
    MERGE (a)-[r:{rel_type}]->(b)
    SET r.valid_from = $valid_from,
        r.valid_to = $valid_to,
        r.ingested_at = $ingested_at,
        r.source_id = $source_id
    """
    # Add extra props
    for k, v in props.items():
        q += f"\nSET r.{k} = ${k}"
    q += "\nRETURN r"

    params = {
        "from_id": from_id,
        "to_id": to_id,
        "valid_from": valid_from or _now()[:10],
        "valid_to": valid_to,
        "ingested_at": _now(),
        "source_id": source_id,
        **props,
    }
    try:
        _graph(graph_name).query(q, params)
    except Exception as e:
        print(f"  [warn] Edge {from_label}({from_id})-[{rel_type}]->{to_label}({to_id}): {e}")


# ─────────────────────────────────────────────────────────────────────────────
# Bulk ingest from synthetic data
# ─────────────────────────────────────────────────────────────────────────────

def ingest_company_data(company: dict, graph_name: str = None):
    """
    Ingest a full synthetic company dataset into FalkorDB.
    Order: people → teams → systems → documents → decisions → tickets → messages → edges
    """
    print("📥 Ingesting company data into FalkorDB...")

    # Nodes
    for p in company.get("people", []):
        upsert_person(p, graph_name)
    print(f"  ✅ {len(company.get('people', []))} people")

    for t in company.get("teams", []):
        upsert_team(t, graph_name)
    print(f"  ✅ {len(company.get('teams', []))} teams")

    for s in company.get("systems", []):
        upsert_system(s, graph_name)
    print(f"  ✅ {len(company.get('systems', []))} systems")

    for d in company.get("documents", []):
        upsert_document(d, graph_name)
    print(f"  ✅ {len(company.get('documents', []))} documents")

    for d in company.get("decisions", []):
        upsert_decision(d, graph_name)
    print(f"  ✅ {len(company.get('decisions', []))} decisions")

    for t in company.get("tickets", []):
        upsert_ticket(t, graph_name)
    print(f"  ✅ {len(company.get('tickets', []))} tickets")

    for m in company.get("messages", []):
        upsert_message(m, graph_name)
    print(f"  ✅ {len(company.get('messages', []))} messages")

    # Edges
    edges = company.get("edges", [])
    for e in edges:
        upsert_edge(
            from_id=e["from_id"], from_label=e["from_label"],
            to_id=e["to_id"], to_label=e["to_label"],
            rel_type=e["rel_type"],
            props=e.get("props", {}),
            source_id=e.get("source_id", ""),
            valid_from=e.get("valid_from"),
            valid_to=e.get("valid_to"),
            graph_name=graph_name,
        )
    print(f"  ✅ {len(edges)} edges")
    print("✅ Company data ingestion complete")
