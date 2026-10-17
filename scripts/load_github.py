"""
FalkorDB Multi-Repository Real-World GitHub Dataset Ingestion for FalkorDB.
Ingests merged PRs, authors, reviewers, linked issues, and components for:
- FalkorDB/FalkorDB (Core Engine)
- FalkorDB/falkordb-py (Python SDK Client)
- FalkorDB/falkordb-browser (Web Canvas UI)

Caches raw API payloads to data/github/ to ensure completely offline demo operation.
Run: uv run --directory backend python ../scripts/load_github.py
"""
import sys
import os
import json
import re
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.db import get_graph, reset_client, ping
from app.queries.graph_queries import get_graph_stats

GRAPH_NAME = "falkordb_repos"
CACHE_DIR = Path(__file__).parent.parent / "data" / "github"
BATCH_SIZE = 100

REPOS_CONFIG = [
    {
        "repo": "FalkorDB/FalkorDB",
        "slug": "falkordb",
        "cache_file": "falkordb.json",
        "domain": "Database Engine & Storage",
        "components": [
            {"slug": "src", "name": "FalkorDB Core Engine (src/)", "path": "src/", "keywords": ["engine", "cypher", "graphblas", "matrix", "storage", "index", "vector"]},
            {"slug": "tests", "name": "Cypher Test Suite (tests/)", "path": "tests/", "keywords": ["test", "ci", "pytest", "valgrind", "benchmark"]},
            {"slug": "deps", "name": "Native Dependencies (deps/)", "path": "deps/", "keywords": ["graphblas", "suite", "alloc", "cjson", "deps"]},
            {"slug": "docs", "name": "Architecture & Query Specs (docs/)", "path": "docs/", "keywords": ["doc", "readme", "spec", "architecture"]},
            {"slug": "ci", "name": "CI & Build Workflows (.github/)", "path": ".github/", "keywords": ["workflow", "action", "docker", "release", "build"]}
        ],
        "default_component": "src"
    },
    {
        "repo": "FalkorDB/falkordb-py",
        "slug": "falkordb_py",
        "cache_file": "falkordb_py.json",
        "domain": "Python SDK & Drivers",
        "components": [
            {"slug": "client", "name": "Python Client Core (falkordb/)", "path": "falkordb/", "keywords": ["client", "connection", "query", "async", "cluster", "node", "edge"]},
            {"slug": "tests", "name": "Python Client Test Suite (tests/)", "path": "tests/", "keywords": ["test", "pytest", "mock", "assert"]},
            {"slug": "docs", "name": "Python SDK Docs & Examples (docs/)", "path": "docs/", "keywords": ["doc", "example", "tutorial", "readme"]},
            {"slug": "deps", "name": "SDK Dependencies & Packaging (deps/)", "path": "pyproject.toml", "keywords": ["bump", "deps", "mypy", "ruff", "wheel", "setup"]}
        ],
        "default_component": "client"
    },
    {
        "repo": "FalkorDB/falkordb-browser",
        "slug": "falkordb_browser",
        "cache_file": "falkordb_browser.json",
        "domain": "Web UI & Graph Visualization",
        "components": [
            {"slug": "ui", "name": "Web Canvas UI (src/)", "path": "src/", "keywords": ["ui", "canvas", "cytoscape", "sidebar", "component", "button", "theme", "view"]},
            {"slug": "visualizer", "name": "Graph Visualizer & Renderers (packages/)", "path": "packages/", "keywords": ["render", "node", "edge", "graph", "color", "layout"]},
            {"slug": "auth", "name": "Browser Security & Auth (src/auth/)", "path": "src/auth/", "keywords": ["auth", "mtls", "secret", "token", "login", "cert"]},
            {"slug": "deps", "name": "Frontend Dependencies (deps/)", "path": "package.json", "keywords": ["bump", "npm", "package", "sharp", "deps"]}
        ],
        "default_component": "ui"
    }
]

CORE_MAINTAINERS = {"swilly22", "roitberg", "GalFalkor", "galshubeli", "Jeff-Falkor", "Anchel123", "DvirDukhan"}


def slugify(text: str) -> str:
    """Create a safe alphanumeric ID."""
    s = re.sub(r"[^\w\s-]", "", str(text).lower()).strip()
    return re.sub(r"[-\s]+", "_", s)


def parse_iso_date(dt_str: str) -> str:
    """Extract YYYY-MM-DD from ISO timestamp."""
    if not dt_str:
        return datetime.now(timezone.utc).date().isoformat()
    try:
        return dt_str.split("T")[0]
    except Exception:
        return "2026-01-01"


def fetch_or_load_repo_prs(cfg: dict) -> list[dict]:
    """Load PRs from cache or fetch from GitHub API."""
    cache_path = CACHE_DIR / cfg["cache_file"]
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                prs = json.load(f)
            print(f"📂 Loaded {len(prs)} cached PRs for {cfg['repo']} from {cache_path}")
            return prs
        except Exception as e:
            print(f"⚠️ Cache read error for {cfg['repo']}: {e}")

    token = os.environ.get("GITHUB_TOKEN")
    headers = {"User-Agent": "Provenance-Company-Brain/1.0"}
    if token:
        headers["Authorization"] = f"token {token}"

    url = f"https://api.github.com/repos/{cfg['repo']}/pulls?state=closed&per_page=100"
    print(f"🌐 Fetching PRs for {cfg['repo']} from {url}...")
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode())
        merged = [p for p in data if p.get("merged_at")]

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)
    print(f"💾 Cached {len(merged)} merged PRs to {cache_path}")
    return merged


def batch_execute(g, query: str, items: list, item_name: str = "items"):
    """Execute a query in chunks of BATCH_SIZE using UNWIND."""
    for i in range(0, len(items), BATCH_SIZE):
        chunk = items[i:i + BATCH_SIZE]
        g.query(query, {"batch": chunk})
        print(f"  ✓ {item_name}: {min(i + BATCH_SIZE, len(items))}/{len(items)}")


def main():
    print(f"🚀 Ingesting FalkorDB Repositories Dataset into FalkorDB [{GRAPH_NAME}]...")

    if not ping():
        print("❌ FalkorDB is not reachable. Ensure it is running on port 6379.")
        sys.exit(1)

    g = get_graph(GRAPH_NAME)
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Initialize Indexes
    print("🔧 Initializing indexes on falkordb_repos...")
    for idx_query in [
        "CREATE INDEX FOR (p:Person) ON (p.id)",
        "CREATE INDEX FOR (p:Person) ON (p.username)",
        "CREATE INDEX FOR (d:Decision) ON (d.id)",
        "CREATE INDEX FOR (d:Decision) ON (d.number)",
        "CREATE INDEX FOR (pr:PR) ON (pr.id)",
        "CREATE INDEX FOR (s:System) ON (s.id)",
        "CREATE INDEX FOR (s:System) ON (s.name)",
        "CREATE INDEX FOR (c:Component) ON (c.id)",
        "CREATE INDEX FOR (i:Issue) ON (i.id)",
    ]:
        try:
            g.query(idx_query)
        except Exception:
            pass

    # Ingest entities
    all_persons = {}
    all_components = {}
    all_prs = []
    authored_edges = []
    made_by_edges = []
    reviewed_edges = []
    touches_edges = []
    affects_edges = []
    worked_on_edges = []
    closes_edges = []
    reverts_edges = []
    all_issues = {}

    # Seed components
    for cfg in REPOS_CONFIG:
        repo_slug = cfg["slug"]
        for c in cfg["components"]:
            comp_id = f"comp_{repo_slug}_{c['slug']}"
            all_components[comp_id] = {
                "id": comp_id,
                "name": c["name"],
                "path": c["path"],
                "repo": cfg["repo"],
                "domain": cfg["domain"],
            }

    # Process PRs for each repo
    for cfg in REPOS_CONFIG:
        repo_slug = cfg["slug"]
        prs = fetch_or_load_repo_prs(cfg)

        # Map to detect dependency supersessions and reverts
        bump_prs = {}  # pkg_name -> list of (pr_number, date)

        for pr in prs:
            pr_num = pr["number"]
            pr_id = f"pr_{repo_slug}_{pr_num}"
            merged_at_raw = pr["merged_at"]
            valid_from = parse_iso_date(merged_at_raw)
            title = pr.get("title") or f"PR #{pr_num}"
            body = pr.get("body") or ""
            html_url = pr.get("html_url") or f"https://github.com/{cfg['repo']}/pull/{pr_num}"

            # Author
            user = pr.get("user") or {}
            login = user.get("login") or "contributor"
            person_id = f"person_{slugify(login)}"
            is_maintainer = login in CORE_MAINTAINERS
            role = "Core Maintainer" if is_maintainer else "Open Source Contributor"

            if person_id not in all_persons:
                all_persons[person_id] = {
                    "id": person_id,
                    "name": login,
                    "username": login,
                    "role": role,
                    "avatar_url": user.get("avatar_url", ""),
                    "active": True
                }

            # Classify Component
            matched_comp_id = None
            searchable_text = f"{title} {body} {pr.get('head', {}).get('ref', '')}".lower()
            for c in cfg["components"]:
                if any(kw in searchable_text for kw in c["keywords"]):
                    matched_comp_id = f"comp_{repo_slug}_{c['slug']}"
                    break
            if not matched_comp_id:
                matched_comp_id = f"comp_{repo_slug}_{cfg['default_component']}"

            # Track bump PRs for supersession
            bump_match = re.search(r'bump\s+([\w\-\./]+)\s+from\s+[\d\.]+\s+to\s+[\d\.]+', title, re.I)
            if bump_match:
                pkg_name = bump_match.group(1).lower()
                bump_prs.setdefault(pkg_name, []).append((pr_id, valid_from, title))

            # Linked Issues
            for m in re.finditer(r'(?:fixes|closes|resolves)\s+#?(\d+)', body, re.I):
                issue_num = int(m.group(1))
                issue_id = f"issue_{repo_slug}_{issue_num}"
                if issue_id not in all_issues:
                    all_issues[issue_id] = {
                        "id": issue_id,
                        "number": issue_num,
                        "title": f"Issue #{issue_num} ({cfg['repo']})",
                        "repo": cfg["repo"],
                        "url": f"https://github.com/{cfg['repo']}/issues/{issue_num}"
                    }
                closes_edges.append({
                    "pr_id": pr_id,
                    "issue_id": issue_id,
                    "valid_from": valid_from,
                    "ingested_at": now_iso,
                    "source_id": pr_id
                })

            # Reviewers & Assignees
            reviewers_set = set()
            for rev in pr.get("requested_reviewers", []):
                rev_login = rev.get("login")
                if rev_login:
                    reviewers_set.add(rev_login)
            for a in pr.get("assignees", []):
                a_login = a.get("login")
                if a_login and a_login != login:
                    reviewers_set.add(a_login)

            for rev_login in reviewers_set:
                rev_id = f"person_{slugify(rev_login)}"
                if rev_id not in all_persons:
                    all_persons[rev_id] = {
                        "id": rev_id,
                        "name": rev_login,
                        "username": rev_login,
                        "role": "Core Maintainer" if rev_login in CORE_MAINTAINERS else "Reviewer",
                        "avatar_url": "",
                        "active": True
                    }
                reviewed_edges.append({
                    "person_id": rev_id,
                    "pr_id": pr_id,
                    "valid_from": valid_from,
                    "ingested_at": now_iso,
                    "source_id": pr_id
                })

            # Check for Revert title
            revert_match = re.search(r'revert\s+"?(?:\[.*?\]\s*)?(.*?)"?(?:\s+\(#(\d+)\))?$', title, re.I)

            # Rationale summary
            clean_body = re.sub(r'<!--.*?-->', '', body, flags=re.DOTALL).strip()
            rationale = clean_body.split("\n\n")[0].strip() if clean_body else title
            if len(rationale) > 300:
                rationale = rationale[:297] + "..."

            all_prs.append({
                "id": pr_id,
                "number": pr_num,
                "title": f"PR #{pr_num}: {title}",
                "raw_title": title,
                "repo": cfg["repo"],
                "status": "Merged",
                "created_at": parse_iso_date(pr.get("created_at")),
                "merged_at": valid_from,
                "valid_from": valid_from,
                "valid_to": None,
                "url": html_url,
                "rationale": rationale,
                "stale": False,
                "stale_reason": None,
                "source_id": pr_id,
                "ingested_at": now_iso
            })

            authored_edges.append({
                "person_id": person_id,
                "pr_id": pr_id,
                "valid_from": valid_from,
                "ingested_at": now_iso,
                "source_id": pr_id
            })
            made_by_edges.append({
                "pr_id": pr_id,
                "person_id": person_id,
                "valid_from": valid_from,
                "ingested_at": now_iso,
                "source_id": pr_id
            })
            touches_edges.append({
                "pr_id": pr_id,
                "comp_id": matched_comp_id,
                "valid_from": valid_from,
                "ingested_at": now_iso,
                "source_id": pr_id
            })
            affects_edges.append({
                "pr_id": pr_id,
                "comp_id": matched_comp_id,
                "valid_from": valid_from,
                "ingested_at": now_iso,
                "source_id": pr_id
            })
            worked_on_edges.append({
                "person_id": person_id,
                "comp_id": matched_comp_id,
                "valid_from": valid_from,
                "to": valid_from,
                "ingested_at": now_iso,
                "source_id": pr_id
            })

        # Process dependency supersessions within this repo
        for pkg, pr_list in bump_prs.items():
            if len(pr_list) > 1:
                # Sort by date ascending
                pr_list.sort(key=lambda x: x[1])
                for idx in range(len(pr_list) - 1):
                    old_id, old_date, old_t = pr_list[idx]
                    new_id, new_date, new_t = pr_list[idx + 1]
                    reverts_edges.append({
                        "newer_id": new_id,
                        "older_id": old_id,
                        "valid_from": new_date,
                        "ingested_at": now_iso,
                        "source_id": new_id,
                        "reason": f"Superseded by newer version bump in {new_id}"
                    })
                    # Mark older PR stale
                    for pr_obj in all_prs:
                        if pr_obj["id"] == old_id:
                            pr_obj["stale"] = True
                            pr_obj["status"] = "Superseded"
                            pr_obj["valid_to"] = new_date
                            pr_obj["stale_reason"] = f"Superseded by {new_t} ({new_id})"

    print(f"📊 Extracted:")
    print(f"   - {len(all_components)} Components")
    print(f"   - {len(all_persons)} Persons")
    print(f"   - {len(all_prs)} Pull Requests")
    print(f"   - {len(all_issues)} Linked Issues")
    print(f"   - {len(reverts_edges)} Supersession/Revert Chains")

    # Ingest Components (:Component:System)
    print("📥 Ingesting Component & System nodes...")
    g.query("""
    UNWIND $batch as row
    MERGE (c:Component:System {id: row.id})
    SET c.name = row.name,
        c.path = row.path,
        c.repo = row.repo,
        c.domain = row.domain
    """, {"batch": list(all_components.values())})

    # Ingest Persons (:Person)
    print("📥 Ingesting Person nodes...")
    batch_execute(g, """
    UNWIND $batch as row
    MERGE (p:Person {id: row.id})
    SET p.name = row.name,
        p.username = row.username,
        p.role = row.role,
        p.avatar_url = row.avatar_url,
        p.active = row.active
    """, list(all_persons.values()), "Persons")

    # Ingest Issues (:Issue)
    if all_issues:
        print("📥 Ingesting Issue nodes...")
        batch_execute(g, """
        UNWIND $batch as row
        MERGE (i:Issue {id: row.id})
        SET i.number = row.number,
            i.title = row.title,
            i.repo = row.repo,
            i.url = row.url
        """, list(all_issues.values()), "Issues")

    # Ingest PRs (:PR:Decision)
    print("📥 Ingesting PR & Decision nodes...")
    batch_execute(g, """
    UNWIND $batch as row
    MERGE (d:PR:Decision {id: row.id})
    SET d.number = row.number,
        d.title = row.title,
        d.raw_title = row.raw_title,
        d.repo = row.repo,
        d.status = row.status,
        d.created_at = row.created_at,
        d.merged_at = row.merged_at,
        d.valid_from = row.valid_from,
        d.valid_to = row.valid_to,
        d.url = row.url,
        d.rationale = row.rationale,
        d.stale = row.stale,
        d.stale_reason = row.stale_reason,
        d.source_id = row.source_id,
        d.ingested_at = row.ingested_at
    """, all_prs, "PRs")

    # Ingest Edges
    print("🔗 Linking AUTHORED edges...")
    batch_execute(g, """
    UNWIND $batch as row
    MATCH (p:Person {id: row.person_id})
    MATCH (d:PR:Decision {id: row.pr_id})
    MERGE (p)-[r:AUTHORED]->(d)
    SET r.valid_from = row.valid_from,
        r.ingested_at = row.ingested_at,
        r.source_id = row.source_id
    """, authored_edges, "AUTHORED")

    print("🔗 Linking MADE_BY edges...")
    batch_execute(g, """
    UNWIND $batch as row
    MATCH (d:PR:Decision {id: row.pr_id})
    MATCH (p:Person {id: row.person_id})
    MERGE (d)-[r:MADE_BY]->(p)
    SET r.valid_from = row.valid_from,
        r.ingested_at = row.ingested_at,
        r.source_id = row.source_id
    """, made_by_edges, "MADE_BY")

    print("🔗 Linking REVIEWED edges...")
    if reviewed_edges:
        batch_execute(g, """
        UNWIND $batch as row
        MATCH (p:Person {id: row.person_id})
        MATCH (d:PR:Decision {id: row.pr_id})
        MERGE (p)-[r:REVIEWED]->(d)
        SET r.valid_from = row.valid_from,
            r.ingested_at = row.ingested_at,
            r.source_id = row.source_id
        """, reviewed_edges, "REVIEWED")

    print("🔗 Linking TOUCHES edges...")
    batch_execute(g, """
    UNWIND $batch as row
    MATCH (d:PR:Decision {id: row.pr_id})
    MATCH (c:Component:System {id: row.comp_id})
    MERGE (d)-[r:TOUCHES]->(c)
    SET r.valid_from = row.valid_from,
        r.ingested_at = row.ingested_at,
        r.source_id = row.source_id
    """, touches_edges, "TOUCHES")

    print("🔗 Linking AFFECTS edges...")
    batch_execute(g, """
    UNWIND $batch as row
    MATCH (d:PR:Decision {id: row.pr_id})
    MATCH (c:Component:System {id: row.comp_id})
    MERGE (d)-[r:AFFECTS]->(c)
    SET r.valid_from = row.valid_from,
        r.ingested_at = row.ingested_at,
        r.source_id = row.source_id
    """, affects_edges, "AFFECTS")

    print("🔗 Linking WORKED_ON edges for expertise centrality...")
    batch_execute(g, """
    UNWIND $batch as row
    MATCH (p:Person {id: row.person_id})
    MATCH (c:Component:System {id: row.comp_id})
    MERGE (p)-[r:WORKED_ON]->(c)
    SET r.valid_from = row.valid_from,
        r.to = row.to,
        r.ingested_at = row.ingested_at,
        r.source_id = row.source_id
    """, worked_on_edges, "WORKED_ON")

    if closes_edges:
        print("🔗 Linking CLOSES edges...")
        batch_execute(g, """
        UNWIND $batch as row
        MATCH (d:PR:Decision {id: row.pr_id})
        MATCH (i:Issue {id: row.issue_id})
        MERGE (d)-[r:CLOSES]->(i)
        SET r.valid_from = row.valid_from,
            r.ingested_at = row.ingested_at,
            r.source_id = row.source_id
        """, closes_edges, "CLOSES")

    if reverts_edges:
        print("🔗 Linking SUPERSEDES and REVERTS chains...")
        batch_execute(g, """
        UNWIND $batch as row
        MATCH (newer:PR:Decision {id: row.newer_id})
        MATCH (older:PR:Decision {id: row.older_id})
        MERGE (newer)-[r1:SUPERSEDES]->(older)
        SET r1.valid_from = row.valid_from,
            r1.ingested_at = row.ingested_at,
            r1.source_id = row.source_id
        MERGE (newer)-[r2:REVERTS]->(older)
        SET r2.valid_from = row.valid_from,
            r2.ingested_at = row.ingested_at,
            r2.source_id = row.source_id,
            r2.reason = row.reason
        """, reverts_edges, "SUPERSEDES/REVERTS")

    stats = get_graph_stats(GRAPH_NAME)
    print("\n✅ FalkorDB Repos Ingestion Complete!")
    print(f"📊 Graph stats for [{GRAPH_NAME}]:")
    for k, v in stats.items():
        print(f"   - {k}: {v}")


if __name__ == "__main__":
    main()
