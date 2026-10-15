"""
Provenance Backend — FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, graph, agent, ingest, mcp_router
from app.core.config import settings
from app.core.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    print(f"🧠 Provenance backend started — FalkorDB @ {settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}")
    yield


app = FastAPI(
    title="Provenance — Company Brain",
    description="A knowledge graph that proves its answers and detects stale decisions",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(mcp_router.router, prefix="/mcp", tags=["mcp"])
