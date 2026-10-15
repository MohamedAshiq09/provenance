"""
Load synthetic company data into FalkorDB.
Run: uv run --directory backend python ../scripts/load_synthetic_data.py
"""
import sys
import json
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.db import init_db, ping
from app.queries.graph_queries import get_graph_stats
from app.graph.ingest import ingest_company_data


async def main():
    print("🔍 Checking FalkorDB connection...")
    if not ping():
        print("❌ Could not connect to FalkorDB on localhost:6379.")
        print("Run scripts/start_falkordb.sh first.")
        sys.exit(1)
    print("✅ FalkorDB is reachable.")

    print("🔧 Initializing indexes...")
    await init_db()

    data_file = Path(__file__).parent.parent / "data" / "synthetic" / "company.json"
    if not data_file.exists():
        print(f"❌ Data file not found at {data_file}. Run scripts/generate_data.py first.")
        sys.exit(1)

    with open(data_file, "r") as f:
        company_data = json.load(f)

    ingest_company_data(company_data)

    stats = get_graph_stats()
    print("\n📊 Graph Stats after ingestion:")
    for k, v in stats.items():
        print(f"   {k}: {v}")


if __name__ == "__main__":
    asyncio.run(main())
