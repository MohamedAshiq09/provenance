"""
Python PEPs Real-World Dataset High-Performance Ingestion for FalkorDB.
Batches 745 real architectural decisions, authors, and supersession edges via Cypher UNWIND.

Run: uv run --directory backend python ../scripts/load_peps_data.py
"""
import sys
import json
import re
import urllib.request
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.db import get_graph, reset_client, ping
from app.queries.graph_queries import get_graph_stats

PEPS_API_URL = "https://peps.python.org/api/peps.json"
CACHE_FILE = Path(__file__).parent.parent / "data" / "peps" / "peps.json"
GRAPH_NAME = "peps_brain"
BATCH_SIZE = 100


def parse_date(date_str: str) -> str:
    """Parse dates like '19-Aug-2004' or '2004-08-19' to ISO YYYY-MM-DD."""
    if not date_str:
        return "2000-01-01"
    date_str = str(date_str).strip()
    for fmt in ["%d-%b-%Y", "%Y-%m-%d", "%d-%B-%Y", "%Y/%m/%d", "%b-%Y"]:
        try:
            return datetime.strptime(date_str, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass
    m = re.search(r"\b(19\d\d|20\d\d)\b", date_str)
    if m:
        return f"{m.group(1)}-01-01"
    return "2000-01-01"


def slugify(text: str) -> str:
    """Create a safe alphanumeric ID."""
    s = re.sub(r"[^\w\s-]", "", text.lower()).strip()
    return re.sub(r"[-\s]+", "_", s)


def parse_pep_refs(val) -> list[int]:
    """Parse references like '387' or '1, 2' or 387 into a list of ints."""
    if not val:
        return []
    if isinstance(val, int):
        return [val]
    if isinstance(val, list):
        out = []
        for v in val:
            out.extend(parse_pep_refs(v))
        return out
    parts = re.split(r"[,;\s]+", str(val).strip())
    refs = []
    for p in parts:
        p_clean = re.sub(r"[^\d]", "", p)
        if p_clean:
            try:
                refs.append(int(p_clean))
            except ValueError:
                pass
    return refs


def fetch_or_load_peps() -> dict:
    """Fetch PEPs from official python.org API or load cached file."""
    if CACHE_FILE.exists():
        print(f"📂 Loading cached PEPs from {CACHE_FILE}...")
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️ Cache read error: {e}, fetching fresh...")

    print(f"🌐 Fetching official PEPs dataset from {PEPS_API_URL}...")
    req = urllib.request.Request(
        PEPS_API_URL,
        headers={"User-Agent": "Provenance-Company-Brain/1.0"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"💾 Cached {len(data)} PEPs to {CACHE_FILE}")
    return data


def batch_execute(g, query: str, items: list, item_name: str = "items"):
    """Execute a query in chunks of BATCH_SIZE using UNWIND."""
    for i in range(0, len(items), BATCH_SIZE):
        chunk = items[i:i + BATCH_SIZE]
        g.query(query, {"batch": chunk})
        print(f"  ✓ {item_name}: {min(i + BATCH_SIZE, len(items))}/{len(items)}")


def main():
    print(f"🚀 Ingesting Python PEPs Real-World Dataset into FalkorDB [{GRAPH_NAME}]...")

    if not ping():
        print("❌ FalkorDB is not reachable. Ensure it is running.")
        sys.exit(1)

    peps_data = fetch_or_load_peps()
    print(f"📦 Loaded {len(peps_data)} PEP specifications.")

    g = get_graph(GRAPH_NAME)

    # 1. Initialize Indexes
    print("🔧 Initializing indexes on peps_brain...")
    try:
        g.query("CREATE INDEX FOR (d:Decision) ON (d.id)")
        g.query("CREATE INDEX FOR (d:Decision) ON (d.number)")
        g.query("CREATE INDEX FOR (p:Person) ON (p.id)")
        g.query("CREATE INDEX FOR (s:System) ON (s.id)")
    except Exception as e:
        print(f"  (Index setup note: {e})")

    # 2. Upsert Core Subsystems
    systems = [
        {"id": "sys_cpython", "name": "CPython Core Language & Runtime", "domain": "Language Core"},
        {"id": "sys_packaging", "name": "Python Packaging & PyPI Ecosystem", "domain": "Packaging & Tooling"},
        {"id": "sys_typing", "name": "Python Static Type System & Annotations", "domain": "Type System"},
        {"id": "sys_asyncio", "name": "Asynchronous I/O & Concurrency", "domain": "Async Runtime"},
    ]
    print("🏢 Upserting Python Subsystems...")
    for s in systems:
        g.query("MERGE (node:System {id: $id}) SET node.name = $name, node.domain = $domain", s)

    # 3. Prepare Batches for Decisions, Authors, and Relationships
    decisions_batch = []
    authors_dict = {}
    authored_edges = []
    affects_edges = []
    supersedes_edges = []
    requires_edges = []

    for pep_key, pep in peps_data.items():
        pep_num = int(pep.get("number", pep_key))
        pep_id = f"pep_{pep_num:04d}"
        title = pep.get("title", f"PEP {pep_num}")
        status = pep.get("status", "Active")
        pep_type = pep.get("type", "Standards Track")
        created_raw = pep.get("created", "")
        iso_created = parse_date(created_raw)
        pep_url = pep.get("url", f"https://peps.python.org/pep-{pep_num:04d}/")
        is_stale = (status.lower() in ["superseded", "withdrawn", "rejected"])

        decisions_batch.append({
            "id": pep_id,
            "number": pep_num,
            "title": f"PEP {pep_num}: {title}",
            "status": status,
            "type": pep_type,
            "created_at": iso_created,
            "valid_from": iso_created,
            "valid_to": iso_created if is_stale else None,
            "url": pep_url,
            "stale": is_stale,
            "stale_reason": f"Status is {status}" if is_stale else None
        })

        # Determine Subsystem
        text_lower = (title + " " + (pep.get("topic") or "")).lower()
        if any(w in text_lower for w in ["typing", "type hint", "generics", "annotation"]):
            target_sys = "sys_typing"
        elif any(w in text_lower for w in ["wheel", "pip", "package", "distutils", "setuptools", "pypi"]):
            target_sys = "sys_packaging"
        elif any(w in text_lower for w in ["asyncio", "coroutine", "async", "await", "generator"]):
            target_sys = "sys_asyncio"
        else:
            target_sys = "sys_cpython"

        affects_edges.append({
            "pep_id": pep_id,
            "sys_id": target_sys,
            "valid_from": iso_created,
            "url": pep_url
        })

        # Authors
        author_names = pep.get("author_names") or []
        if not author_names and pep.get("authors"):
            author_names = [a.strip() for a in pep.get("authors").split(",") if a.strip()]

        for author in author_names[:5]:
            author_clean = author.strip()
            if not author_clean:
                continue
            author_id = f"person_{slugify(author_clean)}"
            authors_dict[author_id] = {"id": author_id, "name": author_clean}
            authored_edges.append({
                "author_id": author_id,
                "pep_id": pep_id,
                "valid_from": iso_created,
                "url": pep_url
            })

        # Replaces
        for old_num in parse_pep_refs(pep.get("replaces")):
            supersedes_edges.append({
                "newer_id": pep_id,
                "older_id": f"pep_{old_num:04d}",
                "valid_from": iso_created,
                "source_id": pep_url
            })

        # Superseded By
        for newer_num in parse_pep_refs(pep.get("superseded_by")):
            supersedes_edges.append({
                "newer_id": f"pep_{newer_num:04d}",
                "older_id": pep_id,
                "valid_from": iso_created,
                "source_id": pep_url
            })

        # Requires
        for req_num in parse_pep_refs(pep.get("requires")):
            requires_edges.append({
                "pep_id": pep_id,
                "req_id": f"pep_{req_num:04d}",
                "valid_from": iso_created
            })

    authors_batch = list(authors_dict.values())

    # Execute Batch UNWIND Upserts
    print(f"📦 Batch-upserting {len(decisions_batch)} Decision nodes...")
    batch_execute(
        g,
        """
        UNWIND $batch AS d
        MERGE (node:Decision {id: d.id})
        SET node.number = d.number,
            node.title = d.title,
            node.status = d.status,
            node.type = d.type,
            node.created_at = d.created_at,
            node.valid_from = d.valid_from,
            node.valid_to = d.valid_to,
            node.url = d.url,
            node.stale = d.stale,
            node.stale_reason = d.stale_reason
        """,
        decisions_batch,
        "Decisions"
    )

    print(f"👥 Batch-upserting {len(authors_batch)} Person nodes...")
    batch_execute(
        g,
        """
        UNWIND $batch AS a
        MERGE (p:Person {id: a.id})
        SET p.name = a.name,
            p.role = 'Python Core Contributor',
            p.active = true
        """,
        authors_batch,
        "Authors"
    )

    print(f"🔗 Batch-wiring {len(authored_edges)} AUTHORED edges...")
    batch_execute(
        g,
        """
        UNWIND $batch AS r
        MATCH (p:Person {id: r.author_id}), (d:Decision {id: r.pep_id})
        MERGE (p)-[rel:AUTHORED]->(d)
        SET rel.valid_from = r.valid_from, rel.source_id = r.url
        """,
        authored_edges,
        "AUTHORED"
    )

    print(f"🏢 Batch-wiring {len(affects_edges)} AFFECTS edges...")
    batch_execute(
        g,
        """
        UNWIND $batch AS r
        MATCH (d:Decision {id: r.pep_id}), (s:System {id: r.sys_id})
        MERGE (d)-[rel:AFFECTS]->(s)
        SET rel.valid_from = r.valid_from, rel.source_id = r.url
        """,
        affects_edges,
        "AFFECTS"
    )

    print(f"🔄 Batch-wiring {len(supersedes_edges)} SUPERSEDES edges...")
    batch_execute(
        g,
        """
        UNWIND $batch AS r
        MATCH (newer:Decision {id: r.newer_id}), (older:Decision {id: r.older_id})
        MERGE (newer)-[rel:SUPERSEDES]->(older)
        SET rel.valid_from = r.valid_from,
            rel.source_id = r.source_id,
            older.stale = true,
            older.valid_to = r.valid_from,
            older.stale_reason = 'Superseded by ' + newer.title
        """,
        supersedes_edges,
        "SUPERSEDES"
    )

    print(f"📌 Batch-wiring {len(requires_edges)} REQUIRES edges...")
    batch_execute(
        g,
        """
        UNWIND $batch AS r
        MATCH (d:Decision {id: r.pep_id}), (req:Decision {id: r.req_id})
        MERGE (d)-[rel:REQUIRES]->(req)
        SET rel.valid_from = r.valid_from
        """,
        requires_edges,
        "REQUIRES"
    )

    stats = get_graph_stats(GRAPH_NAME)
    print("\n" + "=" * 60)
    print(f"✅ PYTHON PEPS REAL WORKSPACE FULLY LOADED INTO [{GRAPH_NAME}]")
    print("=" * 60)
    for k, v in stats.items():
        print(f"   {k}: {v}")
    print(f"   Total Real Supersession Edges: {len(supersedes_edges)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
