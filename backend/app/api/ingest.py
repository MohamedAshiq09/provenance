"""Ingest endpoint — accepts documents/decisions and ingests into FalkorDB"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.graph.ingest import ingest_company_data, upsert_document
from app.queries.graph_queries import detect_staleness

router = APIRouter()


class IngestDocumentRequest(BaseModel):
    id: str
    title: str
    content: str
    doc_type: str = "document"
    url: str = ""
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    supersedes_doc_id: Optional[str] = None
    graph_name: str = "company_brain"


@router.post("/document")
async def ingest_document(req: IngestDocumentRequest, background_tasks: BackgroundTasks):
    """
    Ingest a single document. Automatically detects staleness.
    If supersedes_doc_id is provided, marks that doc as superseded and
    runs staleness detection to find affected decisions.
    """
    try:
        doc_data = req.dict(exclude={"graph_name", "supersedes_doc_id"})
        upsert_document(doc_data, req.graph_name)

        stale_result = {}
        if req.supersedes_doc_id:
            # Create SUPERSEDES edge then run staleness detection
            from app.graph.ingest import upsert_edge
            upsert_edge(
                from_id=req.id, from_label="Document",
                to_id=req.supersedes_doc_id, to_label="Document",
                rel_type="SUPERSEDES",
                source_id=req.id,
                graph_name=req.graph_name,
            )
            stale_result = detect_staleness(req.id, req.graph_name)

        return {
            "status": "ingested",
            "document_id": req.id,
            "staleness_check": stale_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/load-synthetic")
async def load_synthetic(graph_name: str = "company_brain"):
    """Load the full synthetic company dataset into FalkorDB."""
    data_path = Path(__file__).parent.parent.parent.parent / "data" / "synthetic" / "company.json"
    if not data_path.exists():
        raise HTTPException(status_code=404, detail="Synthetic data not found. Run: uv run python scripts/generate_data.py")
    
    with open(data_path) as f:
        company = json.load(f)
    
    ingest_company_data(company, graph_name)
    return {
        "status": "loaded",
        "graph": graph_name,
        "counts": {
            "people": len(company.get("people", [])),
            "decisions": len(company.get("decisions", [])),
            "documents": len(company.get("documents", [])),
            "edges": len(company.get("edges", [])),
        }
    }
