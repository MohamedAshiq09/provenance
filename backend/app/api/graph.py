"""Graph exploration endpoints"""
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter
from app.queries.graph_queries import (
    trace_decision, who_knows, bus_factor,
    connection_path, as_of, get_stale_decisions, get_graph_stats,
    impact_of, decision_timeline, knowledge_gaps,
    get_contradiction_candidates, confirm_contradiction,
)

router = APIRouter()


class ConfirmContradictionRequest(BaseModel):
    candidate_id: str
    claim: Optional[str] = None


@router.get("/trace/{decision_id}")
def trace(decision_id: str, graph_name: str = "company_brain"):
    """Trace full decision provenance chain."""
    return trace_decision(decision_id, graph_name)


@router.get("/who-knows/{system_name}")
def who_knows_system(system_name: str, graph_name: str = "company_brain"):
    """Find experts on a system via graph centrality."""
    return who_knows(system_name, graph_name)


@router.get("/bus-factor/{person_id}")
def bus_factor_person(person_id: str, graph_name: str = "company_brain"):
    """Analyze knowledge risk if a person leaves."""
    return bus_factor(person_id, graph_name)


@router.get("/path")
def path(node_a: str, node_b: str, graph_name: str = "company_brain"):
    """Find shortest connection path between two nodes."""
    return connection_path(node_a, node_b, graph_name)


@router.get("/as-of")
def as_of_query(date: str, topic: str = None, graph_name: str = "company_brain"):
    """Time-travel query: what did the company know as of a date."""
    return as_of(date, topic, graph_name)


@router.get("/stale")
def stale(graph_name: str = "company_brain"):
    """Get all stale decisions with impact radius."""
    return {"stale_decisions": get_stale_decisions(graph_name)}


@router.get("/stats")
def stats(graph_name: str = "company_brain"):
    """Get node/edge counts."""
    return get_graph_stats(graph_name)


@router.get("/impact/{node_id}")
def impact(node_id: str, graph_name: str = "company_brain"):
    """Simulate the blast radius of changing a node."""
    return impact_of(node_id, graph_name)


@router.get("/timeline/{decision_id}")
def timeline(decision_id: str, graph_name: str = "company_brain"):
    """Show how a decision evolved over time."""
    return decision_timeline(decision_id, graph_name)


@router.get("/gaps")
def gaps(graph_name: str = "company_brain"):
    """Find what the company does NOT know (orphans)."""
    return knowledge_gaps(graph_name)


@router.get("/contradictions")
def contradictions(graph_name: str = "company_brain"):
    """Contradiction candidates awaiting human review (no auto-edges)."""
    return {"candidates": get_contradiction_candidates(graph_name)}


@router.post("/contradictions/confirm")
def confirm(req: ConfirmContradictionRequest, graph_name: str = "company_brain"):
    """HUMAN confirms a candidate — the ONLY path to a CONTRADICTS edge."""
    return confirm_contradiction(req.candidate_id, req.claim, graph_name)
