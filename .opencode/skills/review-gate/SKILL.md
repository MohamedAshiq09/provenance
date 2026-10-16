# review-gate — review a diff before commit

Use when: a builder's diff is ready and must pass review before git-commit-agent.

## Gate (fail the review on ANY violation, cite file:line)

1. No mocks/stubs/placeholders/hardcoded demo data in shipped paths.
2. LLM only extracts (strict JSON schema) or writes final text — never ranks, traverses, or detects staleness.
3. All Cypher in `backend/app/queries/`, each commented (what + why graph). Edges carry `valid_from`, `valid_to`, `ingested_at`, `source_id`.
4. Every answer path returns text + cited sources (node IDs, URLs) + exact graph path.
5. One logical change; scope stays inside the builder's owned files; no secrets/`env*` touched.
6. Builder showed RUN output (test/curl/benchmark/server), not just "compiles".
7. `AI_USAGE.md` updated if AI wrote code; no forward references ("will do X" must be done or in ANCHOR Next-task).

Report: PASS or FAIL per item with evidence. FAIL returns to builder with specifics.
