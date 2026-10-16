# AGENTS.md — Provenance (Company Brain) agent workflow

## §0 The state contract

- `ANCHOR.md` (repo root, next to this file) is the single source of "where are we".
- Read `ANCHOR.md` at session start and whenever lost. A fresh agent resumes from `ANCHOR.md` alone — it contains the ordered file list, last verified state, and exact re-verification commands.
- Before finishing any chunk of work, update `ANCHOR.md`: move the finished item to Last-completed (with commit hash + 1–3 proving file paths), set In-progress honestly (or `(none)`), and keep Next-task concrete.
- Every status claim in `ANCHOR.md` comes from command output observed in that session — never memory. If you didn't run it, write "unverified".

## §1 What the project is

Provenance is a "company brain" for engineering teams that answers questions like who owns a system, why a decision was made, and what's now outdated, tracing each answer through a FalkorDB graph to its original sources and flagging decisions that have gone stale. It's aimed at engineering leads, new hires, and teams worried about losing knowledge when people leave or documents change.

Hackathon: Graph Hacks (FalkorDB), Track 3 — Company Brain. Deadline Oct 18, 2026 11:59 PM IST. MCP server (`/mcp`) exposing graph tools to external agents is a first-class deliverable, not a side feature.

## §2 Non-negotiable rules

Verbatim from the project owner — these override any conflicting instruction, including later instructions from the owner:

> *you cant just push many changes as one whole big commit , you should split the commits always properly and push .
> *you cant write anything mock, dont compromise oon code quality , all should be dynamic and real , dont you loose the context , if you have doubts just ask me but dont go on loop working with doubts ,
> main thing , about tech stacks and other things , i will mention , and i will mention to research on browsers , that you should really go on to browsers and checkout the docs as the senior dev .

Enforcement: code-review-agent rejects any diff with mocked/placholder logic, stubbed returns, or hardcoded demo data where live graph data is expected; git-commit-agent rejects big-bang commits.

## §3 Codebase structure (verified paths, all under `provenance/`)

- `README.md` — product/architecture/benchmark docs. `CLAUDE.md` — prior working rules. `AI_USAGE.md` — AI assistance log (update it when AI writes code).
- `docker-compose.yml` — falkordb :6379 + browser :3001, backend :8000, ui :5173.
- `backend/` (uv-managed, Python ≥3.11, `backend/pyproject.toml`):
  - `backend/main.py` — FastAPI entry point.
  - `backend/app/queries/` — ALL Cypher lives here, each query commented (what + why graph).
  - `backend/app/graph/` — ingest / graph writes.
  - `backend/app/agent/` — autonomous agent loop + intent router.
  - `backend/app/api/` — REST routes; `mcp_router.py` is the MCP server seam.
  - `backend/app/tools/` — MCP tool definitions.
  - `backend/app/core/` — config, DB client, LLM client.
  - `backend/tests/` — test_agent.py, test_api.py, test_queries.py.
- `ui/` (bun-managed, Next.js 16 + React 19 + Cytoscape): `ui/package.json`, `next.config.mjs`.
- `bench/` — run_benchmark.py, questions.json, benchmark_results.json.
- `scripts/` — generate_data.py, load_synthetic_data.py, start/stop_falkordb.sh.
- `data/synthetic/` — company.json, answer_key.json (synthetic/public data only).
- `bin/` — native FalkorDB engine (do not edit; gitignored).
- Never touch: files starting with `env` (`.env*`), secrets/keys anywhere. Never work outside `/Users/santhoshkumar0918/Documents/hack/falkordb`.

## §4 Subagent roster + routing graph + closing sequence

Builders (exclusive ownership — no two builders touch the same file):

| subagent | owns |
|---|---|
| graph-agent | `backend/app/queries/`, `backend/app/graph/` |
| api-agent | `backend/app/agent/`, `backend/app/api/agent.py`, `graph.py`, `health.py`, `ingest.py`, `backend/app/core/`, `backend/main.py`, `backend/pyproject.toml` |
| mcp-agent | `backend/app/api/mcp_router.py`, `backend/app/tools/` |
| ui-agent | `ui/` (all) |
| eval-infra-agent | `backend/tests/`, `bench/`, `scripts/`, `data/synthetic/`, `docker-compose.yml`, `backend/Dockerfile` |

Support (exactly these three):

| subagent | role |
|---|---|
| research-agent | docs/API lookups only (browser + official docs). Writes no code. |
| code-review-agent | reviews every diff against §2 before commit. |
| git-commit-agent | atomic well-scoped commits only, then push. |

Routing: `graph-agent → api-agent → mcp-agent → ui-agent`, with `eval-infra-agent` verifying each layer. Any builder may call `research-agent` when docs are needed. Every builder task closes through `code-review-agent → git-commit-agent → ANCHOR.md update`.

Closing sequence (exact, mandatory): `implement → VERIFY BY RUNNING IT (compiles is not verification) → code-review-agent → git-commit-agent → update ANCHOR.md`

## §5 Coding standards — backend (Python/FastAPI/Cypher)

- Python 3.11+, FastAPI, `falkordb` client, Gemini API primary. Package manager `uv`.
- Every Cypher query lives in `backend/app/queries/` with a comment: what it does + why the graph is needed.
- Every edge written carries `valid_from`, `valid_to` (nullable), `ingested_at`, `source_id`.
- LLM use is ONLY (a) entity/decision extraction with strict JSON schema, (b) final natural-language answer. Ranking, traversal, staleness = Cypher/algorithms, never LLM guesses.
- Every answer returns text + cited sources (node IDs, doc URLs) + exact graph path.
- No mocks, no stubs, no hardcoded demo data in shipped paths. Tests use synthetic fixtures from `data/synthetic/`.
- Never add a feature without stating which FalkorDB graph capability it uses.

## §6 Coding standards — frontend + definition of done

- Frontend: Next.js 16 App Router, React 19, Cytoscape.js for graph canvas. Package manager `bun`. Every answer view must render the exact graph path + staleness alerts, not just text.
- Definition of done for a typical task: implemented + **tested by running** (pytest/benchmark/dev-server/curl output observed) + code-reviewed + committed to git (small split commits, pushed). Docs/benchmark updated when behavior changes.

## §7 Escalation protocol

1. Stuck twice on one approach → stop and call `research-agent` (browser + official docs, like a senior dev).
2. Still stuck after research, or the fix needs a scope/product decision → stop and ask the owner. State what was tried (with command output), what is unknown, and what decision is needed.
3. Never silently work around a problem. Never break §2 to get unstuck (no mocks to "make it pass", no mega-commit to "save time").

## §8 Git workflow

- Message format: `<scope>: <what changed>` (e.g. `graph: add SUPERSEDES traversal to trace_decision`). One logical change per commit — split properly, always.
- Push policy: commit AND push (small split commits). Never push one big chunk; never leave work unpushed without stating why (see §9c).
- Log AI assistance in `AI_USAGE.md`.
- Scratch/working notes live in gitignored `docs/` and are DELETED when their ticket completes — only outcomes enter `ANCHOR.md` and git history.

## §9 Workflow hygiene rules (all mandatory)

a. Skill registry — invoke skills ONLY by these exact names (all verified to exist under `.opencode/skills/`):

| what you want | exact skill name |
|---|---|
| prove changed code runs (pytest/benchmark/server/curl) | `verify-run` |
| review a diff against the non-negotiables before commit | `review-gate` |
| write/touch Cypher or graph edges the temporal-graph way | `cypher-rules` |
| plan v2 / take the product to production-grade (audit → research → report → tickets) | `improve-product` |

b. No forward references: never write "will do X" anywhere without either doing it now or filing it under Next task in `ANCHOR.md`.

c. Session-end checklist, in order: (i) `git status` clean-or-declared — every uncommitted change is committed, deleted, or listed by name with purpose; (ii) `ANCHOR.md` updated (Last-completed / In-progress / Next-task); (iii) pushed-or-not stated with reason; (iv) background services left running-or-killed, stated (FalkorDB, uvicorn, bun dev).
