"""
API integration tests using FastAPI TestClient.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["falkordb"] == "connected"


def test_stats_endpoint():
    res = client.get("/api/graph/stats")
    assert res.status_code == 200
    data = res.json()
    assert data.get("Person", 0) >= 40
    assert data.get("System", 0) >= 8


def test_who_knows_endpoint():
    res = client.get("/api/graph/who-knows/AuthService")
    assert res.status_code == 200
    data = res.json()
    assert data["system"] == "AuthService"
    assert len(data["experts"]) > 0


def test_bus_factor_endpoint():
    res = client.get("/api/graph/bus-factor/person_priya")
    assert res.status_code == 200
    data = res.json()
    assert data["person_id"] == "person_priya"
    assert len(data["sole_expert_systems"]) >= 1


def test_agent_ask_endpoint():
    res = client.post("/api/agent/ask", json={"question": "What if Priya leaves?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_used"] == "bus_factor"
    assert len(data["answer"]) > 0


def test_mcp_tools_endpoint():
    res = client.get("/mcp/tools")
    assert res.status_code == 200
    data = res.json()
    assert "tools" in data
    tool_names = [t["name"] for t in data["tools"]]
    assert "trace_decision" in tool_names
    assert "who_knows" in tool_names
    assert "bus_factor" in tool_names
