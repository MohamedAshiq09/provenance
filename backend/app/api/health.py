"""Health check endpoints"""
from fastapi import APIRouter
from app.core.db import ping
from app.queries.graph_queries import get_graph_stats

router = APIRouter()


@router.get("/health")
def health():
    db_ok = ping()
    return {
        "status": "ok" if db_ok else "degraded",
        "falkordb": "connected" if db_ok else "unreachable",
        "version": "1.0.0",
    }


@router.get("/stats")
def stats():
    return get_graph_stats()
