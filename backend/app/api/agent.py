from typing import Optional, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agent.agent import answer
from app.queries.graph_queries import get_stale_decisions, remediate_stale_decision

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    graph_name: Optional[str] = "company_brain"
    workspace: Optional[str] = None
    router_mode: Optional[bool] = True


class AskResponse(BaseModel):
    question: str
    answer: str
    tool_used: str
    tool_params: dict
    tool_reasoning: str
    graph_result: Optional[Any] = None
    graph_path: list
    sources: list
    cypher_query: str


class RemediateRequest(BaseModel):
    decision_id: str
    action_note: str = None
    graph_name: str = "company_brain"
    workspace: Optional[str] = None


def _resolve_graph(graph_name: Optional[str] = None, workspace: Optional[str] = None) -> str:
    val = (workspace or graph_name or "company_brain").lower().strip()
    if val in ["peps", "peps_brain", "python"]:
        return "peps_brain"
    elif val in ["falkordb", "falkordb_repos", "repos", "github"]:
        return "falkordb_repos"
    return "company_brain"


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest, workspace: Optional[str] = None):
    """Ask the Company Brain a question. Returns answer + graph path + sources."""
    try:
        resolved_graph = _resolve_graph(req.graph_name, req.workspace or workspace)
        result = answer(req.question, resolved_graph, router_mode=bool(req.router_mode))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stale")
def stale_dashboard(graph_name: str = "company_brain", workspace: str = None):
    """Get all stale decisions ordered by impact radius."""
    return {"stale_decisions": get_stale_decisions(_resolve_graph(graph_name, workspace))}



@router.post("/remediate")
def remediate_decision(req: RemediateRequest):
    """Action workflow: Creates a remediation ticket assigned to original decision maker."""
    res = remediate_stale_decision(req.decision_id, req.action_note, req.graph_name)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
