#!/usr/bin/env bash
# ==============================================================================
# seed_cloud.sh — Provenance Cloud Graph Seeder
#
# Ingests all three workspaces into FalkorDB Cloud directly from offline cache
# with ZERO external network/GitHub API calls:
#   1. company_brain  (NovaTech Architecture, 513 nodes, 358 edges)
#   2. peps_brain     (Python Enhancement Proposals, 1,860 nodes, 3,451 edges)
#   3. falkordb_repos (FalkorDB Multi-Repo Git Ledger, 354 nodes, 1,307 edges)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=================================================================="
echo "⚡ Provenance FalkorDB Cloud Seeder (Zero GitHub API calls)"
echo "=================================================================="

# Check if environment variables are set, otherwise load from backend/.env
if [ -z "${FALKORDB_HOST:-}" ] && [ -f "${ROOT_DIR}/backend/.env" ]; then
    echo "📄 Reading credentials from backend/.env..."
    export $(grep -E '^FALKORDB_' "${ROOT_DIR}/backend/.env" | xargs)
fi

echo "Connecting to FalkorDB Cloud Host: ${FALKORDB_HOST}:${FALKORDB_PORT:-6379}"

# 1. Seed Company Brain
echo ""
echo "🚀 [1/3] Ingesting company_brain from data/synthetic/company.json..."
cd "${ROOT_DIR}"
uv run --directory backend python "${SCRIPT_DIR}/load_synthetic_data.py"

# 2. Seed Python PEPs Workspace
echo ""
echo "🚀 [2/3] Ingesting peps_brain from data/peps/peps.json..."
uv run --directory backend python "${SCRIPT_DIR}/load_peps_data.py"

# 3. Seed FalkorDB Repos Workspace (Completely offline from data/github/*.json)
echo ""
echo "🚀 [3/3] Ingesting falkordb_repos from cached data/github/..."
uv run --directory backend python "${SCRIPT_DIR}/load_github.py"

echo ""
echo "=================================================================="
echo "✅ ALL THREE WORKSPACES LOADED INTO CLOUD FALKORDB"
echo "=================================================================="

# Print verification stats
uv run --directory backend python -c "
from app.core.db import get_graph
for gname in ['company_brain', 'peps_brain', 'falkordb_repos']:
    g = get_graph(gname)
    nodes = g.query('MATCH (n) RETURN count(n)').result_set[0][0]
    edges = g.query('MATCH ()-[r]->() RETURN count(r)').result_set[0][0]
    print(f'  • {gname:16}: {nodes:5} nodes | {edges:5} edges')
"
echo "=================================================================="
