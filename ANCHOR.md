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
- 2026-10-16: Ran `improve-product` + codebase-architecture review — report at `/tmp/product-review-20261016-190545.html` (8 dimension verdicts, 8 product cards P1–P8 with badges + prior-art URLs, 4 arch cards A1–A4, Top recommendation). Research: GraphRAG papers (2404.16130, 2501.00309, 2507.03226, 2603.14828), WikiMonitor-Onto staleness, Glean connectors+MCP, MCP auth (MongoDB/AWS/RedHat/spec), KB staleness (Atlan, tianpan, auditors).
- 2026-10-16: T5 done — 97acbb8 `docs: drop Claude references, document Inspector over real MCP` (README mermaid + MCP section → Inspector commands + generic config, router docstring, mcp-agent file, CLAUDE.md:72; 28/28 pytest). Kept: `ANTHROPIC_MODEL` id, `AI_USAGE.md:7` history.
- 2026-10-16: T6 done — rehearsed README Inspector commands verbatim (tools/list → 8 tools; tools/call who_knows → Priya/Platform Engineering). Judge path works copy-paste.
- 2026-10-16: T4 done — aa11da7 `test: cover all 8 MCP tools via in-memory client` (`backend/tests/test_mcp.py`, 10 tests). Suite now 28/28.
- 2026-10-16: T3 done — 68112c1 `ui: rewire McpPanel to real MCP client` (live tools/list drives list, callTool executes, same-origin `/mcp` rewrite, generic config copy, Claude text gone) + ceb8cbb SDK dep. Verified: `bun run build` green; MCP initialize handshake through Next proxy `:3000/mcp` returns real `mcp-session-id`.
- 2026-10-16: T2 done — 0b29d9f `mcp: mount Streamable HTTP at /mcp, move shim to /api/mcp` (`backend/main.py` minimal declared touch on api-agent turf: lifespan `session_manager.run()`, mount LAST, CORS `expose_headers Mcp-Session-Id`), 247b614 test fix. Verified: Inspector `--cli` tools/list + tools/call who_knows over HTTP return real graph JSON; shim alive at `/api/mcp/tools`; 18/18 pytest. Note: UI panel temporarily broken (posts to old `/mcp/call`) — fixed in T3.
- 2026-10-16: T1 done — ca1457a `mcp: add MCPServer with 8 typed graph tools` (`backend/app/tools/mcp_server.py`, `__init__.py`). All 8 tools verified via in-memory `Client(mcp)` against live graph (trace/who-knows/staleness/bus-factor needles found).
- 2026-10-16 11:30 UTC: Full audit + live verification (all observed, Docker `provenance-falkordb` + uvicorn :8000 left RUNNING):
  - `backend/` core complete: 8 queries + remediate + stats in `backend/app/queries/graph_queries.py` (561 lines); agent loop with LLM router + deterministic fallback + param normalization in `backend/app/agent/agent.py` (495 lines); REST `/api/agent|graph|ingest|health` + `/mcp` shim in `backend/main.py`.
  - `MCP GAP: backend/app/api/mcp_router.py` (57 lines) is a custom REST shim (`GET /tools`, `POST /call`, `/manifest`), NOT the MCP Python SDK (`mcp` dep installed but unused); `backend/app/tools/__init__.py` EMPTY.
  - Live proof: 18/18 pytest pass; 30/30 benchmark 100.0% vs 6.7% (avg 3.3ms); `/api/agent/ask` bus-factor, `/api/agent/stale`, `/mcp/call` who_knows all return real graph data; `ui/` (`bun run build`) green — 7 panels incl. McpPanel, StaleDecisionsPanel, TimeTravelSlider.
  - Env notes: `bin/` is Linux ELF (dead on this mac); Docker had to be launched manually; python deps live in volatile `/tmp/prov-venv`; no `uv` on this machine.

## (c) In progress right now

- (none) — S3 closed 2026-10-16. Next: S6 knowledge gaps on owner go.

## (d) Next task (solution v2 — owner approved senior call 2026-10-16: F1,F3,F6,F2-guarded first, F4/F5 after; F7-push + F8 dropped)

1. S1 DONE 2026-10-16 — 2757c22 graph + e6c6e25 agent + a8975bb mcp + a2001d2 api + 08ee4aa test. Gate (BEFORE commit, local FalkorDB): 33/33 pytest; benchmark 30/30 100%-vs-6.7% no regression; impact_of 2–11 ms; REST + Inspector + /ask routing live-verified. impact_of(sys_auth) review=11 (matches 11 AFFECTS edges), downstream=0 honest (no USES/DEPENDS_ON edges in synthetic data).
2. S3 DONE 2026-10-16 — c96cd50 graph + 0fe463d agent + 70d2066 mcp + c659f13 api + b748ce5 test. Gate (BEFORE commit, local): 38/38 pytest; benchmark 30/30 no regression; timeline 10.2 ms, exact order [use_jwt → opaque_tokens] both directions; REST + Inspector (cockroach chain live) + /ask routing verified.
3. S6 graph-agent: `knowledge_gaps()` — orphan queries: systems with zero incoming AFFECTS, decisions with no BASED_ON, docs with no AUTHORED, unreviewed-stale count. Wire: tool + MCP + REST `GET /api/graph/gaps`. Verify: pytest structure (keys present) + Inspector.
4. S2 graph-agent+api-agent (GUARDED): contradiction candidates on ingest — in `POST /api/ingest/document|raw-text`, find overlap candidates via search_and_expand on title keywords; LLM verdict (keys present) or `unverified` (no keys); NO auto-edge. New `GET /api/graph/contradictions` review list + `POST /api/graph/contradictions/confirm` creating CONTRADICTS edge with claim props → existing staleness flow fires. Demo arc: ingest → candidates → confirm → radar. Verify: pytest with temp docs (DETACH DELETE cleanup) + live demo arc.
5. S4 api-agent: `ramp_plan(system_name)` composer in graph_queries (multi-query, still deterministic): who_knows + key decisions via AFFECTS + related docs. Wire: tool + MCP + REST. Verify: pytest non-empty experts+decisions + Inspector.
6. S5 graph-agent: `team_risk()` — per team: members, sole-expert systems, active/stale decisions. Wire: tool + MCP + REST `GET /api/graph/team-risk`. Verify: pytest team_platform fields + Inspector.
- NON-GOALS (explicit): F7 push digest, F8 reviewer routing, A4 envelopes, Ollama agent, MCP OAuth, P7 connectors. Future runs must not re-suggest silently.
- PARKED earlier still parked: deploy/Render + TransportSecurity, v2 resources/prompts.

## (e) Durable facts (each with owning file)

- Graph DB: FalkorDB via Redis protocol :6379, browser :3001 — `docker-compose.yml`.
- Backend: FastAPI on :8000, entry `backend/main.py`; all Cypher in `backend/app/queries/` — `README.md`, `CLAUDE.md`.
- MCP server at `/mcp`, tools: who_knows, trace_decision, bus_factor, detect_staleness, connection_path, as_of — `README.md`, `backend/app/api/mcp_router.py`, `backend/app/tools/`.
- Temporal edges carry `valid_from`, `valid_to`, `ingested_at`, `source_id` — `CLAUDE.md`, `AGENTS.md` §5.
- Synthetic/public data only; fixtures in `data/synthetic/` — `CLAUDE.md`.
- Git: repo root IS `provenance/` (parent `falkordb/` is not a repo); remote `origin https://github.com/MohamedAshiq09/provenance`; commits use `<scope>: <what changed>`, small + pushed — `AGENTS.md` §8.
- Env rule (2026-10-16): owner keeps cloud creds in `backend/.env` (never touched by agents). Cloud ping True; graph `FalkorDB Instance` holds 72P/94Dec/286Doc (looks double-loaded vs local — flagged, untouched). While `.env` points at cloud, local runs MUST override in-shell: `FALKORDB_HOST=127.0.0.1 FALKORDB_PORT=6379 FALKORDB_USERNAME= FALKORDB_PASSWORD= FALKORDB_SSL=false FALKORDB_GRAPH_NAME=company_brain` (shell env beats `.env`). Cloud creds currently FAIL auth (observed `AuthenticationError`) — owner to check password/SSL/rotation; agents never debug secret values.
- Never touch `env*` files; never leave `provenance/` — `AGENTS.md` §3.
- Pre-existing uncommitted change (not mine, 2026-10-15): `bin/` line appended to `.gitignore` — see `git diff .gitignore`. Decide: commit separately or revert.

## (f) Resume checklist (run these, paste output before claiming state)

- `git log --oneline -5` (commits + hashes)
- `git status --short` (must be clean-or-declared per `AGENTS.md` §9c)
- Health: `redis-cli -p 6379 PING` (want `PONG`); `curl -s localhost:8000/health` (check route in `backend/app/api/health.py` first — unverified)
- Build/test: `uv run --directory backend pytest -v` (uv missing on 2026-10-15 — reinstall/re-verify); `bun run dev -- -p 3000` from `ui/`
- Benchmark: `uv run --directory backend python ../bench/run_benchmark.py`
