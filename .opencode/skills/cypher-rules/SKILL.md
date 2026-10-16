# cypher-rules — temporal-graph conventions

Use when: writing or touching Cypher, edges, or anything in `backend/app/queries/` / `backend/app/graph/`.

## Rules

1. New files go in `backend/app/queries/` with a header comment: what the traversal does + why the graph (not vector search) is needed.
2. Every edge written carries `valid_from`, `valid_to` (nullable), `ingested_at`, `source_id` → original document.
3. Time-travel: filter `valid_from <= $as_of AND (valid_to IS NULL OR valid_to >= $as_of)`; never rely on LLM date guessing.
4. Prefer deterministic traversals (`shortestPath`, degree/centrality counts, bounded `*1..3` hops) over open-ended patterns; `LIMIT` everything user-facing.
5. Staleness = backward traversal from new doc over `SUPERSEDES|CONTRADICTS` → `BASED_ON` → `DEPENDS_ON*1..3`; flag, don't silently rewrite.
6. Every query has a test in `backend/tests/test_queries.py` using synthetic fixtures — ask eval-infra-agent if fixtures are missing.
