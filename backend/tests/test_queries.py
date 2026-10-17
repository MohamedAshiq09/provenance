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
    is_filler_title,
    find_contradiction_candidates,
    find_lineage_conflicts,
    get_contradiction_candidates,
    confirm_contradiction,
    ramp_plan,
    team_risk,
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


def test_staleness_effect_date_matches_superseding_source():
    """T6 regression: stale_effect_at must be the superseding doc's effective
    date (doc_rate_limit_200 valid_from = 2026-09-15), not the query date —
    and the notice lag must be derivable ('stale for N days unnoticed')."""
    res = detect_staleness("doc_rate_limit_200")
    assert res["stale_decisions_found"] >= 1
    for item in res["stale_items"]:
        d = item["stale_decision"]
        assert d.get("stale_effect_at") in ["2026-09-15", "2026-09-16"], (
            f"effect date wrong: {d.get('stale_effect_at')}")
        assert isinstance(d.get("notice_lag_days"), int) and d["notice_lag_days"] > 0


def test_as_of_temporal():
    """Verify as_of query reconstructs historical decisions."""
    # In 2025, JWT was the active decision
    res = as_of("2025-06-01", topic="JWT")
    assert res["count"] >= 1


def test_as_of_excludes_future_decisions():
    """T1 regression: as_of must not return decisions made AFTER the queried date.

    Reproduces the live-test failure: as_of('2025-05-01', 'auth') returned the
    2026 opaque-token migration and omitted the JWT decision then in force.
    Root cause: bare `d.valid_from <= literal` on the indexed valid_from
    property mis-evaluates under FalkorDB's index filter; wrapping the
    property (coalesce) forces correct string comparison.
    """
    res = as_of("2025-05-01", topic="auth")
    ids = [d.get("id") for d in res["decisions"]]
    assert all(d.get("made_at", "") <= "2025-05-01" or not d.get("made_at") for d in res["decisions"]), (
        f"future decisions leaked: {ids[:5]}")
    assert "decision_use_jwt" in ids, "JWT decision in force on 2025-05-01 must be present"
    assert "decision_opaque_tokens" not in ids
    assert "decision_hpa_auth" not in ids


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


def test_impact_system_co_affected():
    """T3 regression: co-affected systems via shared decisions must show.

    Live-test evidence: impact_of(sys_auth) said '0 downstream' while the
    active opaque-tokens decision names PaymentProcessor and MobileAPI.
    The co-affected pattern (system)<-AFFECTS-(decision)-AFFECTS->(system)
    must surface them at depth 2.
    """
    res = impact_of("sys_auth")
    ids = [i["node"].get("id") for i in res["downstream"]]
    assert "sys_payments" in ids
    assert "sys_mobile_api" in ids
    entry = next(i for i in res["downstream"] if i["node"].get("id") == "sys_payments")
    assert entry["via"] == ["AFFECTS", "AFFECTS"]


def test_who_knows_scores_differentiate():
    """T4 regression: expertise scores must not saturate into one flat value."""
    res = who_knows("AuthService")
    scores = [e.get("expertise_score", 0) for e in res["experts"]]
    assert res["experts"], "must return experts"
    assert len(set(scores)) >= 3, f"scores still tie: {scores}"
    top = res["experts"][0]
    assert top.get("work_score", 0) > 0, "top expert must have hands-on work on the system"


def test_ramp_plan_includes_decision_maker():
    """T2 regression: person whose decisions AFFECT a system must be listed.

    Live-test evidence: Alex Chen made the CockroachDB migration that AFFECTS
    PaymentProcessor, yet the old WORKED_ON/AUTHORED-only scoring omitted him.
    """
    res = ramp_plan("PaymentProcessor")
    names = [p.get("name", "") for p in res["people_to_ask"]]
    assert "Alex Chen" in names, f"maker missing: {names}"
    scores = [p.get("expertise_score", 0) for p in res["people_to_ask"]]
    assert len(set(scores)) >= 2, f"contact list still fully tied: {scores}"


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
        + res["authorless_docs_total"] + res.get("authorless_docs_filler_total", 0)
        + res["unremediated_stale_total"]
    )


def test_knowledge_gaps_authorless_docs():
    """Seed data leaves most synthetic docs authorless (31 AUTHORED edges / 146 docs)."""
    res = knowledge_gaps()
    # T5: real unowned + bucketed filler must still account for every authorless doc
    assert res["authorless_docs_total"] + res["authorless_docs_filler_total"] >= 100
    assert len(res["authorless_docs"]) <= 20  # capped REAL sample


def test_is_filler_title():
    """T5 heuristic: word-soup filler detected; structured/domain titles kept."""
    assert is_filler_title("Court let analysis hair tough")
    assert is_filler_title("Step today community name meet know")
    assert not is_filler_title("ADR-001: Use JWT for stateless authentication")
    assert not is_filler_title("Module: Garbage collection internals.")  # colon
    assert not is_filler_title("PEP 1 – PEP Purpose and Guidelines")    # digits
    assert not is_filler_title("Migrate AuthService to session tokens")  # domain vocab
    assert not is_filler_title("")


def test_ramp_plan_auth_service():
    """Onboarding pack: real experts + shaped decisions + evidence trail."""
    res = ramp_plan("AuthService")
    assert res["counts"]["people"] >= 1
    assert res["counts"]["decisions"] >= 5
    assert res["counts"]["docs"] >= 1
    assert res["people_to_ask"][0].get("name") == "Priya Sharma"
    assert any(d.get("id") == "decision_use_jwt" for d in res["decisions"])
    assert any(doc.get("id") == "doc_adr_jwt_reversal" for doc in res["key_docs"])
    assert len(res["ramp_sequence"]) == (
        min(3, res["counts"]["people"]) + min(5, res["counts"]["decisions"]) + min(3, res["counts"]["docs"])
    )


def test_ramp_plan_unknown_system():
    res = ramp_plan("system_that_does_not_exist")
    assert "error" in res


def test_team_risk_platform_fields():
    """Per-team risk: real members, sole-expert systems, honest risk levels."""
    res = team_risk()
    assert res["team_count"] >= 5
    plat = next(t for t in res["teams"] if t["team_name"] == "Platform Engineering")
    assert plat["member_count"] >= 5
    assert any(e["name"] == "Priya Sharma" for e in plat["members"])
    assert any(s["system"] == "AuthService" for s in plat["sole_expert_systems"])
    assert plat["risk_level"] in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
    ordered = [t["risk_level"] for t in res["teams"]]
    rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    assert ordered == sorted(ordered, key=lambda r: rank[r])


# ─────────────────────────────────────────────────────────────────────────────
# S2 — Guarded contradiction candidates (full arc, self-cleaning)
# ─────────────────────────────────────────────────────────────────────────────
_S2_IDS = {"doc_tc_old": "Document", "doc_tc_new": "Document", "decision_tc": "Decision",
           "decision_tc_seed": "Decision"}


@pytest.fixture
def contradiction_arc():
    """Seed a temp old doc + decision based on it, then a contradicting new doc."""
    from app.graph.ingest import upsert_document, upsert_decision, upsert_edge
    from app.core.db import get_graph
    g = get_graph()
    _cleanup_candidates(g)
    upsert_document({"id": "doc_tc_old", "title": "JWT Tokens For Auth Catastrophe Retro",
                     "content": "Team reviews JWT rollout", "doc_type": "retro",
                     "valid_from": "2025-01-01"}, None)
    upsert_decision({"id": "decision_tc", "title": "Keep JWT For Auth Catastrophe Retro systems",
                     "rationale": "we liked jwt", "status": "active",
                     "made_at": "2025-01-02", "valid_from": "2025-01-02"}, None)
    upsert_edge("decision_tc", "Decision", "doc_tc_old", "Document", "BASED_ON", {},
                source_id="doc_tc_old", graph_name=None)
    upsert_document({"id": "doc_tc_new", "title": "Catastrophe Retro JWT reversed",
                     "content": "We reverse JWT for session cookies", "doc_type": "adr",
                     "valid_from": "2025-06-01"}, None)
    yield g
    _cleanup_candidates(g)


def _cleanup_candidates(g):
    """Remove all temp S2 nodes (docs, decision, candidates) between tests."""
    g.query("""MATCH (n) WHERE (n:ContradictionCandidate)
        OR (exists(n.id) AND (n.id STARTS WITH 'doc_tc' OR n.id STARTS WITH 'decision_tc'))
        DETACH DELETE n""")


def test_contradiction_candidates_detected_from_title_keywords(contradiction_arc):
    """Title-keyword overlap finds the old doc + its decision; lineage exclusion holds."""
    res = find_contradiction_candidates("doc_tc_new", "Catastrophe Retro JWT reversed")
    ids = [c["target_id"] for c in res["candidates"]]
    assert "doc_tc_old" in ids and "decision_tc" in ids
    for c in res["candidates"]:
        assert c["verdict"] == "unverified"  # no LLM keys → guarded fallback
    assert res["candidate_count"] >= 2


def test_contradiction_confirm_creates_edge_and_fires_staleness(contradiction_arc):
    """HUMAN confirm is the ONLY path to a CONTRADICTS edge; radar then fires."""
    find_contradiction_candidates("doc_tc_new", "Catastrophe Retro JWT reversed")
    lst = {c["target_id"]: c["id"] for c in get_contradiction_candidates()
           if c.get("new_doc_id") == "doc_tc_new"}
    conf = confirm_contradiction(lst["doc_tc_old"], claim="ADR reverses JWT")
    assert conf["status"] == "contradiction_confirmed"
    assert conf["edge_relationship"] == "CONTRADICTS"
    sc = conf["staleness_check"]
    assert sc["stale_decisions_found"] >= 1
    assert sc["stale_items"][0]["stale_decision"]["id"] == "decision_tc"
    # candidate is consumed — re-confirm must fail
    err = confirm_contradiction(lst["doc_tc_old"])
    assert "error" in err


def test_contradiction_no_auto_edges_without_confirm(contradiction_arc):
    """Candidates exist but NO CONTRADICTS edge until a human confirms."""
    find_contradiction_candidates("doc_tc_new", "Catastrophe Retro JWT reversed")
    pend = [c for c in get_contradiction_candidates() if c.get("new_doc_id") == "doc_tc_new"]
    assert len(pend) >= 2
    r = contradiction_arc.query("MATCH ()-[r:CONTRADICTS]->(doc_tc_new) RETURN count(r)")
    assert r.result_set[0][0] == 0


def test_lineage_conflict_sweep_detects_declared_supersedes(contradiction_arc, tmp_path):
    """T7 regression: a doc whose content DECLARES supersession of a doc
    carrying a formal id (ADR-404) must produce a lineage-conflict candidate
    while no SUPERSEDES edge exists; adding the edge clears it on re-sweep."""
    from app.graph.ingest import upsert_document, upsert_edge
    g = contradiction_arc
    upsert_document({"id": "doc_tc_404_old", "title": "ADR-404: Old auth ruling",
                     "content": "legacy ruling", "doc_type": "adr",
                     "valid_from": "2025-01-01"}, None)
    upsert_document({"id": "doc_tc_404_new", "title": "ADR-405: New ruling",
                     "content": "This rescinds ADR-404 and replaces its guidance.",
                     "doc_type": "adr", "valid_from": "2026-01-01"}, None)
    try:
        res = find_lineage_conflicts()
        ids = [c["candidate_id"] for c in res["candidates"]]
        assert "cc_lg_doc_tc_404_old_doc_tc_404_new" in ids
        # edge exists now → sweep must report nothing for the pair
        upsert_edge("doc_tc_404_new", "Document", "doc_tc_404_old", "Document",
                    "SUPERSEDES", {}, source_id="doc_tc_404_new", graph_name=None)
        res2 = find_lineage_conflicts()
        assert "cc_lg_doc_tc_404_old_doc_tc_404_new" not in [c["candidate_id"] for c in res2["candidates"]]
    finally:
        g.query("""MATCH (n) WHERE (n:ContradictionCandidate)
            OR (exists(n.id) AND (n.id STARTS WITH 'doc_tc_404'))
            DETACH DELETE n""")


def test_falkordb_repos_isolation():
    """Verify falkordb_repos graph contains zero synthetic or PEP node IDs (strict workspace isolation)."""
    from app.core.db import get_graph
    g = get_graph("falkordb_repos")
    nodes = g.query("MATCH (n) RETURN labels(n), n.id").result_set
    assert len(nodes) >= 100, f"Expected populated falkordb_repos, found {len(nodes)} nodes"

    contaminated = []
    for lbl, nid in nodes:
        nid_str = str(nid)
        if (
            nid_str.startswith("doc_")
            or nid_str.startswith("pep_")
            or nid_str.startswith("sys_")
            or "jwt" in nid_str
            or "priya" in nid_str
            or "jordan" in nid_str
        ):
            contaminated.append(nid_str)

    assert len(contaminated) == 0, f"Found contaminated synthetic or PEP nodes in falkordb_repos: {contaminated}"

