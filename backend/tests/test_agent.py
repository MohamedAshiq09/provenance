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


def test_agent_impact_simulation():
    """Verify agent simulates blast radius for change questions."""
    res = answer("What breaks if we change AuthService?")
    assert res["tool_used"] == "impact_of"
    assert "decision_hpa_auth" in res["answer"]
    assert len(res["graph_path"]) >= 1


def test_agent_decision_timeline():
    """Verify agent shows evolution timeline for history questions."""
    res = answer("Show me the timeline of how our token decision evolved")
    assert res["tool_used"] == "decision_timeline"
    assert "decision_use_jwt" in res["answer"]
    assert "decision_opaque_tokens" in res["answer"]


def test_agent_knowledge_gaps():
    """Verify agent audits gaps for what-we-don't-know questions."""
    res = answer("What documentation is missing? What do we not know?")
    assert res["tool_used"] == "knowledge_gaps"
    assert "authorless" in res["answer"].lower() or "gaps" in res["answer"].lower()


def test_agent_contradiction_review_queue():
    """Verify agent routes conflict questions to the GUARDED review queue."""
    res = answer("Are there any conflicts pending review?")
    assert res["tool_used"] == "contradiction_candidates"
    # the queue may be empty on a clean graph — only shape assertions
    assert "review queue" in res["answer"].lower()
