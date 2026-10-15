#!/usr/bin/env bash
# Stop FalkorDB native server on port 6379
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$DIR/bin"

if "$BIN_DIR/redis-cli" -p 6379 ping 2>/dev/null | grep -q PONG; then
    echo "🛑 Stopping FalkorDB on port 6379..."
    "$BIN_DIR/redis-cli" -p 6379 shutdown nosave 2>/dev/null || pkill -f "redis-server.*6379" || true
    echo "✅ FalkorDB stopped."
else
    echo "FalkorDB is not running on port 6379."
fi
