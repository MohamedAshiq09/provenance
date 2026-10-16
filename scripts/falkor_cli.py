#!/usr/bin/env python3
"""
FalkorDB CLI — Interactive command line interface for querying FalkorDB (local or cloud).
Usage:
  uv run --directory backend python ../scripts/falkor_cli.py
  uv run --directory backend python ../scripts/falkor_cli.py "MATCH (n) RETURN labels(n)[0], count(n)"
"""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.db import get_client, get_graph, ping
from app.core.config import settings


def run_query(query: str, graph_name: str = None):
    try:
        g = get_graph(graph_name)
        res = g.query(query)
        if res.header:
            print(" | ".join(str(h[1]) for h in res.header))
            print("-" * 50)
        for row in res.result_set:
            print(" | ".join(str(val) for val in row))
        print(f"\n({len(res.result_set)} records)")
    except Exception as e:
        print(f"Error: {e}")


def interactive():
    print("=" * 60)
    print("🧠 Provenance FalkorDB CLI")
    print(f"Connected to: {settings.FALKORDB_HOST}:{settings.FALKORDB_PORT}")
    print(f"Active Graph: {settings.FALKORDB_GRAPH_NAME}")
    print(f"SSL: {settings.FALKORDB_SSL} | Password: {'set' if settings.FALKORDB_PASSWORD else 'none'}")
    print("Type your Cypher query, or 'exit' / 'quit' to leave.")
    print("=" * 60)

    if not ping():
        print("⚠️ Warning: Could not connect to FalkorDB. Check your .env configuration.")

    while True:
        try:
            line = input("\nfalkordb> ").strip()
            if not line:
                continue
            if line.lower() in ("exit", "quit", "q"):
                break
            if line.lower() == "ping":
                print("PONG" if ping() else "FAIL")
                continue
            if line.lower() == "stats":
                from app.queries.graph_queries import get_graph_stats
                print(get_graph_stats())
                continue
            run_query(line)
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            break


if __name__ == "__main__":
    if len(sys.argv) > 1:
        run_query(" ".join(sys.argv[1:]))
    else:
        interactive()
