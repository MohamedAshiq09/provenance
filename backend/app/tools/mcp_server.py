"""
Provenance MCP server — the Company Brain as real Model Context Protocol tools.

Every tool delegates to the deterministic graph layer (`app.agent.agent.run_tool`
→ Cypher in `app.queries.graph_queries`). The LLM never traverses, ranks, or
detects staleness — it only picks the tool; FalkorDB does the work.

Type hints ARE the tool schemas. Docstrings ARE the tool descriptions.
Graph capability per tool is noted in each docstring.
"""
from mcp.server import MCPServer

from app.agent.agent import run_tool

GRAPH_NAME = "company_brain"

mcp = MCPServer("provenance-company-brain")


@mcp.tool()
def trace_decision(decision_id: str) -> dict:
    """Trace the full provenance chain of a decision — who made it, based on what docs/messages, what it superseded. USE FOR: 'why did we...', 'how did we decide...', 'what led to...'. Graph capability: multi-hop BASED_ON/SUPERSEDES/MADE_BY traversal."""
    return run_tool("trace_decision", {"decision_id": decision_id}, GRAPH_NAME)


@mcp.tool()
def who_knows(system_name: str) -> dict:
    """Find who has real expertise on a system via graph centrality over WORKED_ON, AUTHORED, OWNS edges. USE FOR: 'who knows...', 'expert on...', 'who owns...'. Graph capability: recency-weighted centrality ranking."""
    return run_tool("who_knows", {"system_name": system_name}, GRAPH_NAME)


@mcp.tool()
def detect_staleness(new_doc_id: str) -> dict:
    """Find decisions made stale by a new document. USE FOR: 'what is now outdated...', 'what changed...', 'stale decisions after...'. Graph capability: backward BFS over SUPERSEDES|CONTRADICTS → BASED_ON → DEPENDS_ON."""
    return run_tool("detect_staleness", {"new_doc_id": new_doc_id}, GRAPH_NAME)


@mcp.tool()
def bus_factor(person_id: str) -> dict:
    """Analyze risk if a person leaves — find sole-expert systems and unique decisions. USE FOR: 'what if X leaves', 'bus factor', 'knowledge risk'. Graph capability: sole-path counting over WORKED_ON/MADE_BY edges."""
    return run_tool("bus_factor", {"person_id": person_id}, GRAPH_NAME)


@mcp.tool()
def connection_path(node_a_id: str, node_b_id: str) -> dict:
    """Find how two nodes are connected via graph shortest path. USE FOR: 'how is X related to Y', 'connect...', 'relationship between...'. Graph capability: shortestPath() up to 10 hops."""
    return run_tool(
        "connection_path",
        {"node_a_id": node_a_id, "node_b_id": node_b_id},
        GRAPH_NAME,
    )


@mcp.tool()
def as_of(date_str: str, topic: str = "") -> dict:
    """Time-travel query: what did the company know/decide as of a specific date (YYYY-MM-DD). USE FOR: 'what did we think in...', 'as of date...', 'historically...'. Graph capability: temporal valid_from/valid_to edge filtering."""
    return run_tool("as_of", {"date_str": date_str, "topic": topic or None}, GRAPH_NAME)


@mcp.tool()
def search_and_expand(keyword: str) -> list:
    """Search for a keyword then expand context via graph traversal. USE FOR: general questions, 'find anything about...', 'what do we know about...'. Graph capability: keyword match + BASED_ON/DISCUSSES/AFFECTS expansion."""
    return run_tool("search_and_expand", {"keyword": keyword}, GRAPH_NAME)


@mcp.tool()
def get_stale_decisions() -> list:
    """Get all currently stale decisions with their impact radius. USE FOR: 'what is stale', 'stale decisions dashboard', 'what needs review'. Graph capability: stale-flag aggregation + AFFECTS impact traversal."""
    return run_tool("get_stale_decisions", {}, GRAPH_NAME)


@mcp.tool()
def impact_of(node_id: str) -> dict:
    """Simulate the blast radius of changing a node — downstream impacts plus what would need re-review. USE FOR: 'what breaks if', 'what if we change', 'impact of', 'blast radius'. Graph capability: direction-aware AFFECTS/USES/DEPENDS_ON traversal with depth and via-path."""
    return run_tool("impact_of", {"node_id": node_id}, GRAPH_NAME)


@mcp.tool()
def decision_timeline(decision_id: str) -> dict:
    """Show how a decision evolved over time — the ordered SUPERSEDES lineage with maker and evidence at each step. USE FOR: 'timeline', 'evolved', 'history of', 'how did X change over time'. Graph capability: bidirectional SUPERSEDES traversal, time-ordered."""
    return run_tool("decision_timeline", {"decision_id": decision_id}, GRAPH_NAME)


# Starlette sub-app serving Streamable HTTP. Mounted by the host FastAPI app
# (see main.py). Built at module level so `mcp.session_manager` exists before
# the host lifespan enters `session_manager.run()`.
mcp_http_app = mcp.streamable_http_app()
