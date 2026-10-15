"""
Tests for Agent Q&A logic and tool dispatching.
"""
from app.agent.agent import answer, select_tool, run_tool


def test_agent_bus_factor():
    """Verify agent answers bus-factor risk question."""
    res = answer("What happens if Priya leaves the company?")
    assert res["tool_used"] == "bus_factor"
    assert "Priya" in res["answer"] or "person_priya" in res["answer"]
    assert "AuthService" in res["answer"]
    assert len(res["graph_path"]) >= 1


def test_agent_who_knows():
    """Verify agent answers expertise query."""
    res = answer("Who knows the AuthService codebase best?")
    assert res["tool_used"] == "who_knows"
    assert "AuthService" in res["answer"]
    assert "Priya" in res["answer"]


def test_agent_trace_decision():
    """Verify agent traces decision provenance."""
    res = answer("Why did we decide to use JWT authentication?")
    assert res["tool_used"] == "trace_decision"
    assert len(res["sources"]) >= 1
    assert "JWT" in res["answer"]


def test_agent_stale_dashboard():
    """Verify agent queries stale decisions."""
    res = answer("What decisions are currently stale or outdated?")
    assert res["tool_used"] == "get_stale_decisions"
    assert "Stale" in res["answer"]
