# AI Usage Disclosure

In compliance with the FalkorDB Graph Hacks Hackathon rules (Rules 7, 12, 13), all AI assistance used in the development of **Provenance** is documented below:

## Tools Used
- **Antigravity AI Assistant** (Google DeepMind): Used for architectural brainstorming, scaffolding repetitive schema models, writing Cypher queries, benchmarking harness, and pair programming Next.js components.
- **Claude Sonnet & Gemini**: Used as testing agents against the Model Context Protocol (MCP) server endpoints.

## Engineering Transparency & Query Ownership
- **Deterministic Cypher**: All 8 Cypher queries used by the company brain were designed deterministically by the engineering team (no dynamic hallucinations).
- **Graph Algorithms**: BFS/DFS backward traversal for staleness, degree centrality for expertise, and FalkorDB native `shortestPath` were implemented directly in Cypher.
- **Verification**: 18 unit tests in pytest and a 30-question ground-truth benchmark verify all query outputs against known answer keys.
- **Competitive UX & Front Door Overhaul (2026-10-16)**: Re-architected UI layout (Brain Health front door, live ingest visualizer, idempotent approvals, and structured card answer parsing) with Antigravity pair programming.
- **P0/P1 Answer Quality & Multi-Workspace Coherence (2026-10-17)**: Implemented Entity Grounding Gate in agent loop to eliminate false-premise hallucinations on unrecorded technologies (e.g., MongoDB, quantum encryption), deterministic `changes_between` and temporal `as_of` interval filters, complete workspace isolation between NovaTech Synthetic and Python PEPs (745 proposals, 73 supersession chains), live demo data baseline reset endpoint, and fully reconciled Benchmark v2 diagnostics with Gemini 2.5-Flash integration.
- **Stage 1 Correctness & Grounding Pass (2026-10-17)**: Converted `bus_factor`, `who_knows`, and `as_of` backend synthesis to structured JSON and clean prose with zero stray markdown characters or asterisk leaks; added constraint chip `[no other engineer has a WORKED_ON edge]` and `Priya —WORKED_ON→ AuthService` reasoning path; audited all 50 decisions to link semantically valid documentation and quotes (fixing the Redis rate-limit container hardening quote); enforced `valid_to` setting on superseded decisions (eliminating `"→ present"` on superseded items); connected global date state across UI for dynamic node status recoloring; labeled real vs synthetic citations with external links; streamlined decline response to `"No record of X in the graph."`; fixed sidebar tooltip overlay bug.

