"""Ingest endpoint — accepts documents/decisions and ingests into FalkorDB"""
import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.graph.ingest import ingest_company_data, upsert_document
from app.queries.graph_queries import detect_staleness, find_contradiction_candidates, find_lineage_conflicts

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

        # Guarded overlap: candidates for HUMAN review, never auto-edges
        contradiction_result = {}
        try:
            contradiction_result = find_contradiction_candidates(
                req.id, req.content, graph_name=req.graph_name
            )
        except Exception as e:
            contradiction_result = {"error": str(e)}
        # T7: sweep for declared-superession defects the overlap pass can't see
        try:
            contradiction_result["lineage_scan"] = find_lineage_conflicts(graph_name=req.graph_name)
        except Exception as e:
            contradiction_result["lineage_scan"] = {"error": str(e)}

        return {
            "status": "ingested",
            "document_id": req.id,
            "staleness_check": stale_result,
            "contradiction_scan": contradiction_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class IngestRawTextRequest(BaseModel):
    text: str
    doc_id: Optional[str] = None
    author: Optional[str] = None
    graph_name: str = "company_brain"


@router.post("/raw-text")
async def ingest_raw_text(req: IngestRawTextRequest):
    """
    Ingest unstructured raw text (ADR, ticket, PR description, meeting notes).
    Uses Gemini (or structured extraction) to parse decisions, systems, authors,
    and creates nodes + edges with automatic staleness check.
    """
    import uuid
    from datetime import datetime, timezone
    from app.core.config import settings
    from app.graph.ingest import upsert_document, upsert_decision, upsert_edge
    
    doc_id = req.doc_id or f"doc_raw_{uuid.uuid4().hex[:6]}"
    now = datetime.now(timezone.utc).isoformat()
    
    extraction = {
        "title": "Unstructured Document",
        "doc_type": "document",
        "decisions": [],
        "systems": [],
        "supersedes": []
    }
    
    # Try Gemini extraction if API key configured
    if settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
        try:
            from app.core.llm import extract_json
            schema = {
                "title": "string",
                "doc_type": "adr | spec | ticket | meeting_notes",
                "decisions": [
                    {"id": "string", "title": "string", "rationale": "string", "affects": ["system_name"]}
                ],
                "supersedes_docs": ["doc_id"],
                "affected_systems": ["system_name"]
            }
            extraction = extract_json(req.text, schema)
        except Exception as e:
            print(f"  [ingest] LLM extraction fallback: {e}")

    # Fallback heuristic extraction
    lines = req.text.strip().split("\n")
    title = extraction.get("title") or (lines[0].lstrip("#").strip() if lines else "Document")
    
    doc_data = {
        "id": doc_id,
        "title": title,
        "content": req.text,
        "doc_type": extraction.get("doc_type", "document"),
        "valid_from": now[:10],
        "source_id": doc_id,
    }
    upsert_document(doc_data, req.graph_name)
    
    # Upsert extracted decisions
    decisions_created = []
    for d in extraction.get("decisions", []):
        dec_id = d.get("id") or f"decision_extracted_{uuid.uuid4().hex[:6]}"
        upsert_decision({
            "id": dec_id,
            "title": d.get("title", "Extracted Decision"),
            "rationale": d.get("rationale", req.text[:200]),
            "status": "active",
            "made_at": now[:10],
            "valid_from": now[:10],
            "source_id": doc_id
        }, req.graph_name)
        
        # Connect Decision -> BASED_ON -> Document
        upsert_edge(
            from_id=dec_id, from_label="Decision",
            to_id=doc_id, to_label="Document",
            rel_type="BASED_ON",
            source_id=doc_id,
            graph_name=req.graph_name
        )
        decisions_created.append(dec_id)
        
    # Check staleness if document supersedes older docs
    stale_res = {}
    for sup_id in extraction.get("supersedes_docs", []):
        upsert_edge(
            from_id=doc_id, from_label="Document",
            to_id=sup_id, to_label="Document",
            rel_type="SUPERSEDES",
            source_id=doc_id,
            graph_name=req.graph_name
        )
        stale_res = detect_staleness(doc_id, req.graph_name)
        
    # Guarded overlap: candidates for HUMAN review, never auto-edges
    contradiction_result = {}
    try:
        contradiction_result = find_contradiction_candidates(
            doc_id, req.text, graph_name=req.graph_name
        )
    except Exception as e:
        contradiction_result = {"error": str(e)}
    try:
        contradiction_result["lineage_scan"] = find_lineage_conflicts(graph_name=req.graph_name)
    except Exception as e:
        contradiction_result["lineage_scan"] = {"error": str(e)}

    return {
        "status": "extracted_and_ingested",
        "doc_id": doc_id,
        "title": title,
        "decisions_created": decisions_created,
        "staleness_radar": stale_res,
        "contradiction_scan": contradiction_result,
    }

