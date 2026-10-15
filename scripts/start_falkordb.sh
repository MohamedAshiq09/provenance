#!/usr/bin/env bash
# Start FalkorDB native server on port 6379
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="$DIR/bin"
DATA_DIR="$DIR/data/falkor_data"
LIBS_DIR="$BIN_DIR/libs"

mkdir -p "$DATA_DIR"

if "$BIN_DIR/redis-cli" -p 6379 ping 2>/dev/null | grep -q PONG; then
    echo "⚡ FalkorDB is already running on port 6379"
    exit 0
fi

echo "🚀 Starting FalkorDB native engine on port 6379..."
LD_LIBRARY_PATH="$LIBS_DIR" "$BIN_DIR/redis-server" \
    --dir "$DATA_DIR" \
    --loadmodule "$BIN_DIR/falkordb.so" \
    --port 6379 \
    --daemonize yes

sleep 1
if "$BIN_DIR/redis-cli" -p 6379 ping | grep -q PONG; then
    echo "✅ FalkorDB successfully started on port 6379 (PID: $(pgrep -f "redis-server.*6379"))"
else
    echo "❌ FalkorDB failed to start"
    exit 1
fi
