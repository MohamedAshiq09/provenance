# AI Usage Disclosure

In compliance with the FalkorDB Graph Hacks Hackathon rules (Rules 7, 12, 13), all AI assistance used in the development of **Provenance** is documented below:

## Tools Used
- **Antigravity AI Assistant** (Google DeepMind): Used for architectural brainstorming, scaffolding repetitive schema models, writing Cypher queries, benchmarking harness, and pair programming Next.js components.
- **Claude Sonnet & Gemini**: Used as testing agents against the Model Context Protocol (MCP) server endpoints.

## Engineering Transparency & Query Ownership
- **Deterministic Cypher**: All 8 Cypher queries used by the company brain were designed deterministically by the engineering team (no dynamic hallucinations).
- **Graph Algorithms**: BFS/DFS backward traversal for staleness, degree centrality for expertise, and FalkorDB native `shortestPath` were implemented directly in Cypher.
- **Verification**: 18 unit tests in pytest and a 30-question ground-truth benchmark verify all query outputs against known answer keys.
