# verify-run — prove changed code runs

Use when: you changed code and must prove it works. Compiles is NOT verification.

## Checklist

1. Pick the narrowest REAL proof for your layer:
   - Backend: `uv run --directory backend pytest -v` (or the single test file), plus a live `curl` against `:8000` for route changes.
   - Graph: run the query against live FalkorDB (`redis-cli -p 6379` / browser `:3001`) and show real rows.
   - MCP: call each touched tool end-to-end, show real tool output.
   - UI: `bun run dev`, click the real flow against the live backend; `next build` green.
   - Benchmark/infra: `uv run --directory backend python ../bench/run_benchmark.py`.
2. Paste the observed output (or its exact tail) into your report / ANCHOR entry. "Unverified" if you didn't run it.
3. If the harness itself is broken (e.g. `uv` missing), fix the harness first or record it as the blocker — never claim verification by reading code.
4. Services: FalkorDB must be up first (`./scripts/start_falkordb.sh` or `docker compose up -d`); record which you used.
