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

- (none) — MCP v1 T1–T6 all closed 2026-10-16. Next: owner picks follow-up (Ollama agent / deploy / v2 resources-prompts are parked).

## (d) Next task (MCP v1 — owner decisions 2026-10-16: production rewire, Inspector-only demo, no Claude mentions, local-first, 8 tools)

1. T1 mcp-agent: real `MCPServer("provenance-company-brain")` in `backend/app/tools/` — 8 typed `@mcp.tool()` funcs delegating to existing `run_tool`/query layer; typed hints are the schema; sync OK. Verify: in-memory `Client(mcp)` calls each tool.
2. T2 mcp-agent: mount Streamable HTTP at `/mcp` in `backend/main.py` (`streamable_http_app()` + `Mount`, lifespan enters `mcp.session_manager.run()`); move REST shim to `/api/mcp/*`. Verify: Inspector `--cli` tools/list + tools/call; full pytest green.
3. T3 ui-agent: rewire `ui/src/components/McpPanel.jsx` to real MCP via `@modelcontextprotocol/sdk` TS client; fix `ui/next.config.mjs` rewrites (bare `/mcp` included); backend CORS allow/expose `Mcp-*` headers; valid generic client config in copy button. Verify: `bun run build` + live Execute click.
4. T4 eval-infra-agent: `backend/tests/test_mcp.py` — in-memory `Client` tests for all 8 tools + unknown-tool error path; document Inspector CLI check. Verify: pytest green.
5. T5 mcp-agent + ui-agent: Claude-mention sweep — `README.md` (5 spots incl. Desktop config → Inspector commands), `backend/app/api/mcp_router.py` docstring, `.opencode/agents/mcp-agent.md`, `CLAUDE.md:72`, panel text (in T3). Keep: `ANTHROPIC_MODEL` value in `backend/app/core/config.py` (model id, not integration), `AI_USAGE.md:7` (history). Verify: `grep -ri claude` clean except those two.
6. T6 eval-infra-agent: Inspector demo runbook (web + `--cli` commands) + full rehearsal against live backend. Verify: every command run, output observed.
- PARKED (explicitly out of v1): Ollama local agent, deploy/Render + `TransportSecurity`, MCP resources/prompts v2.

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
