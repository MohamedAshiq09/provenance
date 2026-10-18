# Project: Provenance — Company Brain that proves its answers and detects stale knowledge

> Hackathon: Graph Hacks (FalkorDB), **Track 3 — Company Brain**
> Deadline: **Oct 18, 2026 11:59 PM IST**
> Prize: M6 Mac Mini per team member

---

## Non-Negotiable Rules (match hackathon rules)

1. **FalkorDB is the core.** Every demo feature MUST depend on a Cypher traversal or a graph algorithm. If it would work without the graph, redesign it.
2. **Data: synthetic or public only.** No private, personal, or login-protected data.
3. **Every edge has**: `valid_from`, `valid_to` (nullable), `ingested_at`, and `source_id` pointing to the original document.
4. **LLM is used ONLY for** (a) entity/decision extraction with a strict JSON schema and (b) writing the final natural language answer. Traversal, ranking, and staleness detection are **Cypher/algorithms only**, not LLM guesses.
5. **Every answer returns**: text, cited sources (with node IDs and document URLs), and the **exact graph path** used.
6. Keep every Cypher query in `backend/app/queries/` with a comment explaining what it does and why the graph is needed.
7. Small commits, clear messages. Log ALL AI assistance in `AI_USAGE.md`.
8. Write tests for every query and tool. Keep the benchmark runnable with `uv run python bench/run_benchmark.py`.
9. **Stack**: Python 3.11+, FastAPI, `falkordb` client, Google Gemini API (primary), MCP Python SDK, React+Vite UI with Cytoscape.js graph visualization.
10. Never add a feature without stating which FalkorDB graph capability it uses.

---

## Graph Schema v1

### Node Labels & Properties

| Label | Key Properties |
|-------|----------------|
| `Person` | `id`, `name`, `email`, `team`, `role`, `active` |
| `Team` | `id`, `name`, `domain` |
| `Project` | `id`, `name`, `description`, `status`, `started_at` |
| `System` | `id`, `name`, `type`, `stack`, `owner_team` |
| `Document` | `id`, `title`, `content`, `doc_type`, `url`, `ingested_at`, `valid_from`, `valid_to` |
| `Ticket` | `id`, `title`, `status`, `priority`, `created_at`, `resolved_at` |
| `Message` | `id`, `content`, `channel`, `timestamp`, `thread_id` |
| `Decision` | `id`, `title`, `rationale`, `status`, `made_at`, `valid_from`, `valid_to`, `source_id` |

### Edge Types & Properties

| Relationship | From → To | Key Properties |
|---|---|---|
| `MEMBER_OF` | Person → Team | `since`, `role` |
| `OWNS` | Person/Team → System | `since`, `valid_to` |
| `WORKED_ON` | Person → Project/System | `from`, `to`, `contribution` |
| `AUTHORED` | Person → Document/Message | `at` |
| `DISCUSSED_IN` | Document/Ticket → Message | `at` |
| `BASED_ON` | Decision → Document/Message | `weight`, `ingested_at` |
| `MADE_BY` | Decision → Person | `at` |
| `AFFECTS` | Decision → System/Project | `impact` |
| `SUPERSEDES` | Decision → Decision | `reason`, `at` |
| `USES` | System → System/Project | `since`, `type` |
| `RESOLVES` | Ticket → Decision/Document | `at` |

---

## Five Core Demo Features (all graph-powered)

1. **Decision Trace**: `trace_decision(decision_id)` → traverses `BASED_ON`, `SUPERSEDES`, `MADE_BY` to show the full origin chain
2. **Who Knows**: `who_knows(system_name)` → recency-weighted PageRank/centrality over `WORKED_ON`, `OWNS`, `AUTHORED` edges
3. **Staleness Detection**: on new doc ingest → find `BASED_ON` edges to contradicted/superseded docs → traverse `AFFECTS` to flag downstream decisions
4. **Bus Factor Analysis**: `bus_factor(person_id)` → count systems/decisions with only this person in the knowledge chain
5. **Impact Analysis**: `impact_of(change)` → multi-hop traversal over `AFFECTS`, `USES`, and co-affected topologies

---

## Winning Differentiators

- **Staleness alerts with proof paths** — shows exactly WHY a decision is now suspect (edge path)
- **Time-aware graph** — `as_of(date, question)` queries use `valid_from`/`valid_to` edge filters
- **MCP server** — any MCP-compatible host or agent can query the Company Brain
- **Benchmark** — 30 multi-hop Q&A scored against plain vector-RAG baseline
- **No hallucination** — every fact is a node; every claim has a source_id

---

## Development Rules

- Run `docker compose up -d` before any development
- Tests: `uv run pytest backend/tests/ -v`
- Benchmark: `uv run python bench/run_benchmark.py`
- Never hard-code API keys — use `.env` file
- Deploy target: Railway or Render (free tier, deploy Day 2)
