"""
Tests for the real MCP server (backend/app/tools/mcp_server.py).

Uses the SDK's in-memory Client — no port, no transport — against live
FalkorDB (same requirement as test_queries.py).
"""
import asyncio

from mcp import Client

from app.tools import mcp

EXPECTED_TOOLS = sorted([
    "trace_decision",
    "who_knows",
    "detect_staleness",
    "bus_factor",
    "connection_path",
    "as_of",
    "search_and_expand",
    "get_stale_decisions",
    "impact_of",
    "decision_timeline",
    "knowledge_gaps",
])


def _run(coro):
    return asyncio.run(coro)


async def _call(name: str, args: dict) -> str:
    async with Client(mcp) as client:
        res = await client.call_tool(name, args)
        assert not res.is_error, f"tool {name} errored: {res.content}"
        texts = [b.text for b in (res.content or []) if hasattr(b, "text")]
        blob = str(res.structured_content) + "".join(texts)
        assert len(blob) > 50, f"tool {name} returned nearly empty payload"
        return blob


def test_mcp_lists_all_eight_tools():
    async def go():
        async with Client(mcp) as client:
            result = await client.list_tools()
            return sorted(t.name for t in result.tools)

    assert _run(go()) == EXPECTED_TOOLS


def test_mcp_trace_decision():
    blob = _run(_call("trace_decision", {"decision_id": "decision_use_jwt"}))
    assert "Priya" in blob


def test_mcp_who_knows():
    blob = _run(_call("who_knows", {"system_name": "AuthService"}))
    assert "Priya" in blob


def test_mcp_detect_staleness():
    blob = _run(_call("detect_staleness", {"new_doc_id": "doc_rate_limit_200"}))
    assert "decision_rate_limit_mobile" in blob


def test_mcp_bus_factor():
    blob = _run(_call("bus_factor", {"person_id": "person_priya"}))
    assert "AuthService" in blob


def test_mcp_connection_path():
    blob = _run(_call(
        "connection_path",
        {"node_a_id": "person_priya", "node_b_id": "sys_auth"},
    ))
    assert "person_priya" in blob or "Priya" in blob


def test_mcp_as_of():
    blob = _run(_call("as_of", {"date_str": "2025-06-01", "topic": "JWT"}))
    assert "2025" in blob


def test_mcp_search_and_expand():
    blob = _run(_call("search_and_expand", {"keyword": "auth"}))
    assert "auth" in blob.lower()


def test_mcp_get_stale_decisions():
    blob = _run(_call("get_stale_decisions", {}))
    assert "stale" in blob.lower() or "decision" in blob.lower()


def test_mcp_impact_of():
    blob = _run(_call("impact_of", {"node_id": "sys_auth"}))
    assert "decision_hpa_auth" in blob


def test_mcp_decision_timeline():
    blob = _run(_call("decision_timeline", {"decision_id": "decision_opaque_tokens"}))
    assert "decision_use_jwt" in blob and "decision_opaque_tokens" in blob


def test_mcp_knowledge_gaps():
    blob = _run(_call("knowledge_gaps", {}))
    assert "authorless_docs_total" in blob


def test_mcp_unknown_tool_errors():
    async def go():
        async with Client(mcp) as client:
            return await client.call_tool("not_a_tool", {})

    res = _run(go())
    assert res.is_error
