"""Graph exploration endpoints"""
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter
from app.queries.graph_queries import (
    trace_decision, who_knows, bus_factor,
    connection_path, as_of, changes_between, get_stale_decisions, get_graph_stats,
    impact_of, decision_timeline, knowledge_gaps,
    get_contradiction_candidates, confirm_contradiction,
    ramp_plan,
    team_risk,
    get_pep_alerts,
)
from app.core.db import get_graph

router = APIRouter()


def _resolve_graph(graph_name: Optional[str] = None, workspace: Optional[str] = None) -> str:
    """Resolve workspace alias ('peps' -> 'peps_brain', 'novatech' -> 'company_brain')."""
    val = (workspace or graph_name or "company_brain").lower().strip()
    if val in ["peps", "peps_brain", "python"]:
        return "peps_brain"
    return "company_brain"


class ConfirmContradictionRequest(BaseModel):
    candidate_id: str
    claim: Optional[str] = None


@router.get("/trace/{decision_id}")
def trace(decision_id: str, graph_name: str = "company_brain", workspace: str = None):
    """Trace full decision provenance chain."""
    return trace_decision(decision_id, _resolve_graph(graph_name, workspace))


@router.get("/who-knows/{system_name}")
def who_knows_system(system_name: str, graph_name: str = "company_brain", workspace: str = None):
    """Find experts on a system via graph centrality."""
    return who_knows(system_name, _resolve_graph(graph_name, workspace))


@router.get("/bus-factor/{person_id}")
def bus_factor_person(person_id: str, graph_name: str = "company_brain", workspace: str = None):
    """Analyze knowledge risk if a person leaves."""
    return bus_factor(person_id, _resolve_graph(graph_name, workspace))


@router.get("/path")
def path(node_a: str, node_b: str, graph_name: str = "company_brain", workspace: str = None):
    """Find shortest connection path between two nodes."""
    return connection_path(node_a, node_b, _resolve_graph(graph_name, workspace))


@router.get("/as-of")
def as_of_query(date: str, topic: str = None, graph_name: str = "company_brain", workspace: str = None):
    """Time-travel query: what did the company know as of a date."""
    return as_of(date, topic, _resolve_graph(graph_name, workspace))


@router.get("/changes-between")
def changes_between_query(start_date: str, end_date: str, topic: str = None, graph_name: str = "company_brain", workspace: str = None):
    """Temporal change query: what architectural decisions evolved between two dates."""
    return changes_between(start_date, end_date, topic, _resolve_graph(graph_name, workspace))


@router.get("/alerts")
def alerts_endpoint(graph_name: str = "company_brain", workspace: str = None):
    """Return genuine architectural alerts specific to the active workspace."""
    resolved = _resolve_graph(graph_name, workspace)
    if resolved == "peps_brain":
        return get_pep_alerts(resolved)
    else:
        stale = get_stale_decisions(resolved)
        return {
            "workspace": "novatech",
            "total_alerts": len(stale),
            "definition": "Active decisions superseded or contradicted by newer documentation",
            "alerts": stale
        }


@router.get("/stale")
def stale(graph_name: str = "company_brain", workspace: str = None):
    """Get all stale decisions with impact radius."""
    return {"stale_decisions": get_stale_decisions(_resolve_graph(graph_name, workspace))}


@router.get("/stats")
def stats(graph_name: str = "company_brain", workspace: str = None):
    """Get node/edge counts."""
    return get_graph_stats(_resolve_graph(graph_name, workspace))


@router.get("/impact/{node_id}")
def impact(node_id: str, graph_name: str = "company_brain", workspace: str = None):
    """Simulate the blast radius of changing a node."""
    return impact_of(node_id, _resolve_graph(graph_name, workspace))


@router.get("/timeline/{decision_id}")
def timeline(decision_id: str, graph_name: str = "company_brain", workspace: str = None):
    """Show how a decision evolved over time."""
    return decision_timeline(decision_id, _resolve_graph(graph_name, workspace))


@router.get("/gaps")
def gaps(graph_name: str = "company_brain", workspace: str = None):
    """Find what the company does NOT know (orphans)."""
    return knowledge_gaps(_resolve_graph(graph_name, workspace))


@router.get("/contradictions")
def contradictions(graph_name: str = "company_brain", workspace: str = None):
    """Contradiction candidates awaiting human review (no auto-edges)."""
    return {"candidates": get_contradiction_candidates(_resolve_graph(graph_name, workspace))}


@router.post("/contradictions/confirm")
def confirm(req: ConfirmContradictionRequest, graph_name: str = "company_brain", workspace: str = None):
    """HUMAN confirms a candidate — the ONLY path to a CONTRADICTS edge."""
    return confirm_contradiction(req.candidate_id, req.claim, _resolve_graph(graph_name, workspace))


@router.get("/ramp/{system_name}")
def ramp(system_name: str, graph_name: str = "company_brain", workspace: str = None):
    """Onboarding pack for one system: people, decisions, evidence, risks."""
    return ramp_plan(system_name, _resolve_graph(graph_name, workspace))


@router.get("/team-risk")
def team_risk_endpoint(graph_name: str = "company_brain", workspace: str = None):
    """Per-team knowledge risk posture across the whole company."""
    return team_risk(_resolve_graph(graph_name, workspace))


@router.post("/reset-demo")
def reset_demo_endpoint(graph_name: str = "company_brain"):
    """Reset live demo state: purge demo documents and restore healthy decision statuses."""
    g = get_graph("company_brain")
    # Delete temporary live ingest demo documents
    g.query("""
    MATCH (d:Document)
    WHERE d.id STARTS WITH 'doc_keda'
       OR d.id STARTS WITH 'doc_sec_ed25519'
       OR d.id STARTS WITH 'doc_infra_mem'
    DETACH DELETE d
    """)
    # Restore ADR-003 (decision_hpa_auth) to active status
    g.query("""
    MATCH (d:Decision {id: 'decision_hpa_auth'})
    SET d.status = 'active', d.stale = false, d.stale_reason = null
    """)
    # Remove any CONTRADICTS edges created during live demo
    g.query("""
    MATCH ()-[r:CONTRADICTS]->()
    DELETE r
    """)
    return {
        "status": "ok",
        "message": "Demo data successfully reset to pristine baseline. ADR-003 restored to active."
    }

