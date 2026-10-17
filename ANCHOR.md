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

- 2026-10-17: Completed Benchmark v2 overhaul, UI bug fixes, and Python PEPs real-world workspace:
  - 96d0146 `bench: implement Benchmark v2 with 42 questions, false-premise rejection, and dense RAG baseline` (`bench/questions.json`, `bench/run_benchmark.py`, `bench/benchmark_results.json`, `backend/app/agent/agent.py`, `backend/app/core/llm.py`). Verified: 42-question benchmark evaluated live: Graph+LLM 85.7% vs Router 88.1% vs Vector RAG 26.2% (+59.5% advantage), 100% false-premise decline rate, 92.3% staleness precision.
  - 8cadba9 `ui: update BenchmarkPanel with 3-column evaluation, precision metrics, and honest failure diagnostics` (`ui/src/components/BenchmarkPanel.jsx`). Verified: renders 3 evaluators, category breakdown, false-premise stats, and failure analysis tabs.
  - fa9304a `ui: eliminate stuck loading state in TimeTravelSlider with optimistic decision baselines` (`ui/src/components/TimeTravelSlider.jsx`). Verified: count is always rendered instantly (`{displayCount} Active Decisions`), background revalidation non-blocking.
  - df9aa56 `ui: update Live Ingest demo to supersede healthy ADR-003 and synchronize governance counts` (`ui/src/components/LiveIngestPanel.jsx`, `ui/src/components/BrainHealthPanel.jsx`, `ui/src/components/ApprovalsPanel.jsx`, `ui/src/components/Sidebar.jsx`). Verified: demo supersedes healthy `decision_hpa_auth` with real before/after ripple; attention items, governance queue, and sidebar badges synchronized to 3.
  - 609373b `feat: add Python PEPs real-world dataset ingestion and interactive workspace switcher` (`scripts/load_peps_data.py`, `data/peps/peps.json`, `ui/src/app/page.js`). Verified: 745 PEPs, 356 authors, and 73 supersession trees ingested into `peps_brain` in 15 seconds; header workspace switcher toggles between NovaTech and Python PEPs.
  - Test & Build Gate: 42/42 pytest green (`uv run --directory backend pytest -v` in 53.3s), `bun run build` in `ui/` green in 2.7s with 0 errors.

## (c) In progress right now

- API-key gate DONE 2026-10-17 (see (d) item 7). 2026-10-17. All six filed solution tickets (S1,S3,S6,S2,S4,S5) DONE — feature-complete set, ready for demo polish / deploy call.

## (d) Next task

7. AUTH gate DONE 2026-10-17 — e59e284 core+main+gitignore + fef8f73 test. Owner-minted key `openssl rand -hex 24` stored gitignored chmod600 backend/.api_key (NEVER committed/echoed). Gate: /mcp + /api/* require X-API-Key or Bearer; exemptions /docs /api/health OPTIONS + same-origin browser Origin header (DEMO-level convenience — forgeable, documented; treat as basic proxy safety, not security). AUTH_DISABLED=1 (or missing key file) turns the gate off — local dev & pytest run key-off via tests/conftest.py autouse. Gate verified live BEFORE commit: no/wrong key → 401 (/mcp and /api), real key → 200, health 200, Origin-exempt 200, Inspector CLI with --header "X-API-Key" → tool call 200. 58/58 pytest. known: path bug parents[2] found+fixed during live check (first boot silently gate-off; lesson: verify the 401 path itself).

1. S1 DONE 2026-10-16 — 2757c22 graph + e6c6e25 agent + a8975bb mcp + a2001d2 api + 08ee4aa test. Gate (BEFORE commit, local FalkorDB): 33/33 pytest; benchmark 30/30 100%-vs-6.7% no regression; impact_of 2–11 ms; REST + Inspector + /ask routing live-verified. impact_of(sys_auth) review=11 (matches 11 AFFECTS edges), downstream=0 honest (no USES/DEPENDS_ON edges in synthetic data).
2. S3 DONE 2026-10-16 — c96cd50 graph + 0fe463d agent + 70d2066 mcp + c659f13 api + b748ce5 test. Gate (BEFORE commit, local): 38/38 pytest; benchmark 30/30 no regression; timeline 10.2 ms, exact order [use_jwt → opaque_tokens] both directions; REST + Inspector (cockroach chain live) + /ask routing verified.
3. S6 DONE 2026-10-16 — dcfa2e8 graph + 1d0d755 agent + 6b835a6 mcp + 5cc1253 api + 6e0c4f4 test. Gate (BEFORE commit, local): 42/42 pytest; benchmark 30/30 no regression; gaps 13.1 ms, totals 118 = 0+0+116+2 matching hand counts; REST + Inspector + /ask verified. Incident: S3-era line-158 indent corruption found at gate, fixed, suite green.
4. S2 DONE 2026-10-17 — ce40073 graph + 60e9617 agent + 7ee4390 mcp + c8a6768 api (ingest hook + confirm endpoint) + 5c38b54 test. GUARDED by design: candidates are :ContradictionCandidate nodes with CANDIDATE_SOURCE/CANDIDATE_TARGET edges; the ONLY path to a CONTRADICTS edge is confirm_contradiction() (human REST call); title-keyword overlap with SUPERSEDES-lineage exclusion (title-only matching — content match = noise). Gate (BEFORE commit, local): 47/47 pytest (arc: temp seed → detect → confirm → decision_tc goes stale → double-confirm rejected → DETACH DELETE cleanup); teammate's Benchmark v2 no-regression (router 88.1 ≥ 88.1, LLM 88.1 ≥ 85.7, false-premise 100%); full demo arc LIVE via REST (ingest/raw-text → scan → list → confirm → radar). MCP tool #12 wraps pending queue as read-only dir; confirm intentionally REST-only (human gate). Note: plain 'contradict' keyword stays on the rate-limit branch (benchmark phrasing) — review-queue route matches conflict/disagree/dispute phrasing.
5. S4 DONE 2026-10-17 — 0c84bb6 graph + 5769da9 agent + 36ea1b6 mcp + 8001b0f api + 1b5887a test. Composer over real paths: people (WORKED_ON centrality), decisions AFFECTS system (with maker + evidence), docs via AFFECTS→BASED_ON→AUTHORED chain (docs have NO direct System edge — provenance path is the way into evidence), risks = stale decisions, ordered ramp_sequence. Gate (BEFORE commit, local): 51/51 pytest; Benchmark v2 88.1% no regression; ramp 13.1 ms; MCP Inspector tools/list = 13; REST + /ask live ("I just joined, where do I start on AuthService?" → full Ramp Plan).
6. S5 DONE 2026-10-17 — 91a61cc graph + 1385332 agent + 0bdae31 mcp/api + 7697925 test (4 commits per owner cap: MCP+API merged scope, ANCHOR folded here). team_risk(): per-team member decision load (MADE_BY), sole-expert systems (WORKED_ON edge with zero DISTINCT other persons, Cypher comprehension [x IN list | x.prop] — FalkorDB syntax), ranked CRITICAL→LOW. Gate (BEFORE commit, local): 54/54 pytest; Benchmark v2 88.1% no regression; team_risk 16.9 ms (6 teams, 3 sole systems: RecommendationEngine/Data&ML, AuthService/Platform, NotificationService/Security); MCP Inspector tools/list = 14; REST + /ask live. Router fix mid-gate: team-risk branch moved ABOVE who_knows ('which team' keyword had higher precedence there).
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
