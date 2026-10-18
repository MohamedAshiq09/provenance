#!/usr/bin/env bash
# ==============================================================================
# smoke_live.sh — Provenance Live Deployment Smoke Test
#
# Verifies 5 key query archetypes against the live deployment URL:
#   1. Bus factor (Priya single-maintainer risk)
#   2. As-of time travel (Historical authentication active standard)
#   3. Changes between (Authentication 3-milestone evolution including reversal)
#   4. False premise refusal (Clean ungrounded entity decline)
#   5. Real PEPs workspace (PEP 248 DB-API with verified peps.python.org sources)
#
# Usage:
#   ./scripts/smoke_live.sh [BASE_URL]
#   Example: ./scripts/smoke_live.sh http://localhost:8000
#            ./scripts/smoke_live.sh https://provenance-api.onrender.com
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-${LIVE_URL:-http://localhost:8000}}"
# Strip trailing slash
BASE_URL="${BASE_URL%/}"

echo "=================================================================="
echo "🎯 Provenance Live Deployment Smoke Test"
echo "Testing target: ${BASE_URL}"
echo "=================================================================="

TOTAL_TESTS=5
PASSED_TESTS=0
FAILED_TESTS=0

run_check() {
    local test_num="$1"
    local name="$2"
    local question="$3"
    local workspace="$4"
    local validate_fn="$5"

    echo ""
    echo "[$test_num/$TOTAL_TESTS] Testing: $name"
    echo "  Question: \"$question\""
    echo "  Workspace: $workspace"

    local start_time=$(date +%s%N)
    
    # POST to /api/agent/ask
    local payload
    payload=$(python3 -c "import json; print(json.dumps({'question': '$question', 'workspace': '$workspace', 'router_mode': True}))")
    
    local response
    local http_code
    response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/agent/ask" \
        -H "Content-Type: application/json" \
        -d "$payload") || {
            echo "  ❌ FAIL: Could not reach endpoint ${BASE_URL}/api/agent/ask"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return
        }

    http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')

    local end_time=$(date +%s%N)
    local elapsed_ms=$(( (end_time - start_time) / 1000000 ))

    if [ "$http_code" -ne 200 ]; then
        echo "  ❌ FAIL: HTTP $http_code returned ($elapsed_ms ms)"
        echo "  Response body: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return
    fi

    # Run Python validation
    local val_res
    val_res=$(echo "$body" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    $validate_fn
    print('OK')
except Exception as e:
    print(f'ERR: {e}')
")

    if [ "$val_res" = "OK" ]; then
        echo "  ✅ PASS ($elapsed_ms ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo "  ❌ FAIL: $val_res ($elapsed_ms ms)"
        echo "  Body snippet: $(echo "$body" | cut -c1-300)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# 1. Bus factor
run_check 1 "Bus Factor Analysis" \
    "What happens if Priya leaves?" \
    "company_brain" \
    "assert data.get('tool_used') == 'bus_factor', f'Tool was {data.get(\"tool_used\")}'; assert len(data.get('sources', [])) >= 1, 'No sources returned'; assert 'Priya' in data.get('answer', '')"

# 2. As-of Time Travel
run_check 2 "Historical As-Of Standard" \
    "What was our active authentication decision as of June 2025?" \
    "company_brain" \
    "assert data.get('tool_used') == 'as_of', f'Tool was {data.get(\"tool_used\")}'; assert len(data.get('sources', [])) >= 1, 'No sources returned'; assert 'JWT' in data.get('answer', '') or 'jwt' in str(data.get('graph_result', ''))"

# 3. Changes Between Evolution (3 Milestones including 2026 Reversal)
run_check 3 "Changes Between (Authentication Reversal)" \
    "What changed about authentication between 2025-01-01 and 2026-10-17?" \
    "company_brain" \
    "changes = data.get('graph_result', {}).get('changes', []); assert len(changes) == 3, f'Expected 3 milestones, got {len(changes)}'; cids = [c['id'] for c in changes]; assert 'decision_opaque_tokens' in cids and 'decision_use_jwt' in cids; assert len(data.get('sources', [])) >= 1"

# 4. False Premise Refusal
run_check 4 "False Premise Decline" \
    "Why did we choose MongoDB for user auth?" \
    "company_brain" \
    "assert data.get('is_declined') is True or 'not found' in data.get('answer', '').lower() or 'declined' in data.get('answer', '').lower() or 'mongodb' in data.get('answer', '').lower(), 'False premise was not declined'; assert len(data.get('graph_path', [])) == 0, 'False premise should have empty graph path'"

# 5. Real PEPs Workspace
run_check 5 "Real PEPs Workspace (PEP 248 DB-API)" \
    "What was the status of PEP 248 as of May 2000?" \
    "peps_brain" \
    "assert data.get('tool_used') == 'as_of', f'Tool was {data.get(\"tool_used\")}'; assert len(data.get('sources', [])) >= 1, 'No sources returned'; assert any('peps.python.org' in s.get('url', '') for s in data.get('sources', [])), 'No peps.python.org source URLs found'"

echo ""
echo "=================================================================="
echo "📊 SMOKE TEST SUMMARY: ${PASSED_TESTS}/${TOTAL_TESTS} PASSED"
if [ "$FAILED_TESTS" -eq 0 ]; then
    echo "🎉 ALL 5 WORKSPACE SMOKE CHECKS PASSED PERFECTLY!"
    echo "=================================================================="
    exit 0
else
    echo "⚠️ $FAILED_TESTS SMOKE CHECKS FAILED."
    echo "=================================================================="
    exit 1
fi
