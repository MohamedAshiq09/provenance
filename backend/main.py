"""
Provenance Backend — FastAPI application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, graph, agent, ingest, mcp_router
from app.core.config import settings
from app.core.db import init_db
from app.core.auth import auth_middleware
from app.tools.mcp_server import mcp, mcp_http_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # MCP session manager MUST run inside the host lifespan — a mounted
    # sub-app's own lifespan never executes (official SDK mounting contract).
    async with mcp.session_manager.run():
        print(f"🧠 Provenance backend started — FalkorDB @ {settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}")
        print("🔌 Real MCP (Streamable HTTP) mounted at /mcp; legacy shim at /api/mcp")
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
    # Streamable HTTP returns the session id in this header; browsers hide
    # response headers from JS unless CORS exposes them (needed by T3 panel).
    expose_headers=["Mcp-Session-Id"],
)
# Basic API-key gate (owner-requested proxy safety): /mcp + /api/* require
# X-API-Key when backend/.api_key exists; same-origin browser traffic (UI
# panel) and health/docs stay open. See app/core/auth.py for the contract.
app.middleware("http")(auth_middleware)

# Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(agent.router, prefix="/api/agent", tags=["agent"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
# Legacy REST shim (kept for transition; real MCP lives at /mcp below)
app.include_router(mcp_router.router, prefix="/api/mcp", tags=["mcp-shim"])

# Real MCP over Streamable HTTP. Mounted LAST so /api/* and docs routes win.
app.mount("/", mcp_http_app)
