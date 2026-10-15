# ANCHOR.md — where are we (single source of truth)

## (a) Read this first (cold start order)

1. `AGENTS.md` — workflow, roster, rules (§2 overrides everything).
2. `README.md` — product, architecture, benchmark, quickstart.
3. `CLAUDE.md` — graph schema v1, five demo features, dev rules.
4. `docker-compose.yml` — ports/services. `backend/pyproject.toml` — deps. `ui/package.json` — frontend deps.
5. `AI_USAGE.md` — AI assistance log (keep updated).

## (b) Last completed

- 2026-10-15: Agent workflow scaffold closed the full sequence (implement → check-ignore RUN proof → review-gate → split commits):
  - 3519596 `chore: ignore bin/ outputs and docs/ scratch notes` — `.gitignore` (implements `AGENTS.md` §8; `git check-ignore` proved `docs/` ignored).
  - fe0a3fb `docs: add AGENTS.md agent workflow contract` — `AGENTS.md`.
  - 756ae71 `agents: add 5 builder and 3 support subagent definitions` — `.opencode/agents/` (8 files).
  - 00a7314 `agents: add verify-run, review-gate, cypher-rules skills` — `.opencode/skills/` (3 skills).
- 6899060 `feat: add UI components including Header, McpPanel, StaleDecisionsPanel, and TimeTravelSlider` — `ui/` panels (proves ui-agent seam exists).
- d4065f8 and earlier: UI component + Next.js init commits — `ui/` (see `git log --oneline -10`).
- (unverified beyond log): backend agent/api/graph/tools, bench, scripts per `README.md` claims; not re-read this session.

## (c) In progress right now

- (none) — scaffolding session ends after Phase 4 e2e commit.

## (d) Next task

1. Decide first real build ticket (suggested: get `uv run --directory backend pytest -v` green — `uv` was missing on 2026-10-15, needs install) and assign to eval-infra-agent → graph-agent per routing in `AGENTS.md` §4.
2. Verify FalkorDB boots (`./scripts/start_falkordb.sh` or `docker compose up -d`) and synthetic ingest runs; record observed output here.
3. Run 30-question benchmark; record score vs README's 100%-vs-6.7% claim.

## (e) Durable facts (each with owning file)

- Graph DB: FalkorDB via Redis protocol :6379, browser :3001 — `docker-compose.yml`.
- Backend: FastAPI on :8000, entry `backend/main.py`; all Cypher in `backend/app/queries/` — `README.md`, `CLAUDE.md`.
- MCP server at `/mcp`, tools: who_knows, trace_decision, bus_factor, detect_staleness, connection_path, as_of — `README.md`, `backend/app/api/mcp_router.py`, `backend/app/tools/`.
- Temporal edges carry `valid_from`, `valid_to`, `ingested_at`, `source_id` — `CLAUDE.md`, `AGENTS.md` §5.
- Synthetic/public data only; fixtures in `data/synthetic/` — `CLAUDE.md`.
- Git: repo root IS `provenance/` (parent `falkordb/` is not a repo); remote `origin https://github.com/MohamedAshiq09/provenance`; commits use `<scope>: <what changed>`, small + pushed — `AGENTS.md` §8.
- Never touch `env*` files; never leave `provenance/` — `AGENTS.md` §3.
- Pre-existing uncommitted change (not mine, 2026-10-15): `bin/` line appended to `.gitignore` — see `git diff .gitignore`. Decide: commit separately or revert.

## (f) Resume checklist (run these, paste output before claiming state)

- `git log --oneline -5` (commits + hashes)
- `git status --short` (must be clean-or-declared per `AGENTS.md` §9c)
- Health: `redis-cli -p 6379 PING` (want `PONG`); `curl -s localhost:8000/health` (check route in `backend/app/api/health.py` first — unverified)
- Build/test: `uv run --directory backend pytest -v` (uv missing on 2026-10-15 — reinstall/re-verify); `bun run dev -- -p 3000` from `ui/`
- Benchmark: `uv run --directory backend python ../bench/run_benchmark.py`
