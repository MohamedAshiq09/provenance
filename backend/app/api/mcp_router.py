"""
MCP (Model Context Protocol) server for Provenance Company Brain.
Exposes all graph tools as MCP tools so any MCP client (Claude, etc.) can query.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Optional
from app.agent.agent import run_tool, AVAILABLE_TOOLS

router = APIRouter()


@router.get("/tools")
def list_tools():
    """List all available MCP tools."""
    return {
        "tools": [
            {
                "name": name,
                "description": info["description"],
                "inputSchema": {
                    "type": "object",
                    "properties": {p: {"type": "string"} for p in info["params"]},
                },
            }
            for name, info in AVAILABLE_TOOLS.items()
        ]
    }


class MCPCallRequest(BaseModel):
    tool: str
    params: dict = {}
    graph_name: str = "company_brain"


@router.post("/call")
def call_tool(req: MCPCallRequest):
    """Call a specific MCP tool by name."""
    result = run_tool(req.tool, req.params, req.graph_name)
    return {"tool": req.tool, "result": result}


@router.get("/manifest")
def manifest():
    """MCP server manifest."""
    return {
        "schema_version": "v1",
        "name": "provenance-company-brain",
        "description": "A knowledge graph that proves its answers and detects stale decisions",
        "version": "1.0.0",
        "capabilities": {
            "tools": True,
            "resources": False,
            "prompts": False,
        },
    }
