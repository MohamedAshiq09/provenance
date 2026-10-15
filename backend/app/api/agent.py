"""Agent Q&A endpoint"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.agent.agent import answer
from app.queries.graph_queries import get_stale_decisions

router = APIRouter()


class AskRequest(BaseModel):
    question: str
    graph_name: str = "company_brain"


class AskResponse(BaseModel):
    question: str
    answer: str
    tool_used: str
    tool_params: dict
    tool_reasoning: str
    graph_path: list
    sources: list
    cypher_query: str


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    """Ask the Company Brain a question. Returns answer + graph path + sources."""
    try:
        result = answer(req.question, req.graph_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stale")
def stale_dashboard(graph_name: str = "company_brain"):
    """Get all stale decisions ordered by impact radius."""
    return {"stale_decisions": get_stale_decisions(graph_name)}
