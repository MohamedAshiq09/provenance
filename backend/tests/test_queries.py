"""
Tests for FalkorDB queries against the synthetic dataset.
"""
import pytest
from app.core.db import ping
from app.queries.graph_queries import (
    trace_decision,
    who_knows,
    detect_staleness,
    bus_factor,
    connection_path,
    as_of,
    search_and_expand,
    get_stale_decisions,
    get_graph_stats,
    impact_of,
    decision_timeline,
    knowledge_gaps,
)


def test_falkordb_connection():
    """Verify FalkorDB is reachable."""
    assert ping() is True


def test_graph_stats():
    """Verify graph has been populated with nodes."""
    stats = get_graph_stats()
    assert stats.get("Person", 0) >= 40
    assert stats.get("System", 0) >= 8
    assert stats.get("Document", 0) >= 100
    assert stats.get("Decision", 0) >= 40


def test_who_knows_auth():
    """Verify who_knows finds Priya as expert on AuthService."""
    res = who_knows("AuthService")
    assert res["system"] == "AuthService"
    assert len(res["experts"]) > 0
    top_expert = res["experts"][0]
    assert "Priya" in top_expert.get("name", "")


def test_bus_factor_priya():
    """Verify bus factor analysis identifies Priya as critical sole expert."""
    res = bus_factor("person_priya")
    assert res["person_id"] == "person_priya"
    assert len(res["sole_expert_systems"]) >= 1
    system_names = [s.get("name") for s in res["sole_expert_systems"]]
    assert "AuthService" in system_names


def test_trace_decision():
    """Verify decision provenance chain can be traversed."""
    res = trace_decision("decision_use_jwt")
    assert "decision" in res
    assert res["decision"].get("id") == "decision_use_jwt"
    assert res["made_by"] is not None
    assert "Priya" in res["made_by"].get("name", "")


def test_staleness_detection():
    """Verify staleness detector flags downstream decisions when doc is updated."""
    # doc_rate_limit_200 supersedes doc_rate_limit_50 which decision_rate_limit_mobile was based on
    res = detect_staleness("doc_rate_limit_200")
    assert res["new_document"] == "doc_rate_limit_200"
    assert res["stale_decisions_found"] >= 1
    stale_ids = [item["stale_decision"].get("id") for item in res["stale_items"]]
    assert "decision_rate_limit_mobile" in stale_ids


def test_as_of_temporal():
    """Verify as_of query reconstructs historical decisions."""
    # In 2025, JWT was the active decision
    res = as_of("2025-06-01", topic="JWT")
    assert res["count"] >= 1


def test_connection_path():
    """Verify shortest path between two nodes in the company brain."""
    res = connection_path("person_priya", "sys_auth")
    assert res["found"] is True
    assert len(res["paths"]) > 0


def test_impact_system_review_set():
    """Changing AuthService must flag the 11 decisions affecting it for re-review."""
    res = impact_of("sys_auth")
    assert res["needs_review_count"] >= 10
    ids = [r.get("id") for r in res["needs_review"]]
    assert "decision_hpa_auth" in ids
    assert "decision_use_jwt" in ids


def test_impact_decision_downstream():
    """Changing the HPA decision must list AuthService as downstream impact."""
    res = impact_of("decision_hpa_auth")
    ids = [i["node"].get("id") for i in res["downstream"]]
    assert "sys_auth" in ids
    assert res["downstream_count"] >= 1


def test_impact_unknown_node():
    """Unknown node ids return an error, not an empty blast radius."""
    res = impact_of("node_that_does_not_exist")
    assert "error" in res


def test_timeline_opaque_tokens_chain():
    """Opaque-tokens timeline must show JWT era first, opaque era current."""
    res = decision_timeline("decision_opaque_tokens")
    ids = [e.get("id") for e in res["timeline"]]
    assert ids == ["decision_use_jwt", "decision_opaque_tokens"]
    assert res["current"].get("id") == "decision_opaque_tokens"


def test_timeline_from_old_end():
    """Same lineage reachable from the superseded end (bidirectional)."""
    res = decision_timeline("decision_use_jwt")
    ids = [e.get("id") for e in res["timeline"]]
    assert ids == ["decision_use_jwt", "decision_opaque_tokens"]


def test_timeline_unknown_decision():
    res = decision_timeline("decision_that_does_not_exist")
    assert "error" in res


def test_knowledge_gaps_structure():
    """Gap report must carry all four categories with consistent totals."""
    res = knowledge_gaps()
    for key in ["docless_systems", "evidenceless_decisions", "authorless_docs", "unremediated_stale"]:
        assert key in res and f"{key}_total" in res
    assert res["total_gaps"] == (
        res["docless_systems_total"] + res["evidenceless_decisions_total"]
        + res["authorless_docs_total"] + res["unremediated_stale_total"]
    )


def test_knowledge_gaps_authorless_docs():
    """Seed data leaves most synthetic docs authorless (31 AUTHORED edges / 146 docs)."""
    res = knowledge_gaps()
    assert res["authorless_docs_total"] >= 100
    assert len(res["authorless_docs"]) <= 20  # capped sample
