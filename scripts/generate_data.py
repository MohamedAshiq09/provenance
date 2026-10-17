"""
Synthetic Company Data Generator — "NovaTech Labs" (a 40-person startup)

Plants specific scenarios for the benchmark:
  (a) 6 decisions later reversed, downstream decisions still depend on old ones → staleness triggers
  (b) 3 systems where only 1 person has expertise → bus factor risk
  (c) 2 pairs of contradicting documents → contradiction detection
  (d) 1 decision whose origin is buried 3 hops deep in a chat → deep trace test

Run: uv run python scripts/generate_data.py
Output: data/synthetic/company.json + data/synthetic/answer_key.json
"""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from faker import Faker

fake = Faker()
random.seed(42)

OUTPUT_DIR = Path(__file__).parent.parent / "data" / "synthetic"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def uid(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def date_str(d: datetime) -> str:
    return d.strftime("%Y-%m-%d")


def ago(days: int) -> datetime:
    return datetime.now() - timedelta(days=days)


# ─────────────────────────────────────────────────────────────────────────────
# Company Structure
# ─────────────────────────────────────────────────────────────────────────────

TEAMS = [
    {"id": "team_platform", "name": "Platform Engineering", "domain": "infrastructure"},
    {"id": "team_product", "name": "Product", "domain": "product"},
    {"id": "team_data", "name": "Data & ML", "domain": "ml"},
    {"id": "team_security", "name": "Security", "domain": "security"},
    {"id": "team_mobile", "name": "Mobile", "domain": "mobile"},
    {"id": "team_backend", "name": "Backend Services", "domain": "backend"},
]

SYSTEMS = [
    {"id": "sys_auth", "name": "AuthService", "type": "service", "stack": "Go, PostgreSQL", "owner_team": "team_platform"},
    {"id": "sys_payments", "name": "PaymentProcessor", "type": "service", "stack": "Python, Stripe", "owner_team": "team_backend"},
    {"id": "sys_ml", "name": "RecommendationEngine", "type": "ml", "stack": "Python, PyTorch", "owner_team": "team_data"},
    {"id": "sys_mobile_api", "name": "MobileAPI", "type": "service", "stack": "Node.js, GraphQL", "owner_team": "team_mobile"},
    {"id": "sys_data_lake", "name": "DataLake", "type": "data", "stack": "Spark, S3, dbt", "owner_team": "team_data"},
    {"id": "sys_notification", "name": "NotificationService", "type": "service", "stack": "Python, Redis", "owner_team": "team_backend"},
    {"id": "sys_search", "name": "SearchEngine", "type": "service", "stack": "Elasticsearch, Python", "owner_team": "team_platform"},
    {"id": "sys_billing", "name": "BillingSystem", "type": "service", "stack": "Python, PostgreSQL", "owner_team": "team_backend"},
]

# Named people (for demo story)
NAMED_PEOPLE = [
    {"id": "person_priya", "name": "Priya Sharma", "email": "priya@novatech.io", "role": "Principal Engineer", "team": "team_platform"},
    {"id": "person_alex", "name": "Alex Chen", "email": "alex@novatech.io", "role": "Staff Engineer", "team": "team_backend"},
    {"id": "person_sam", "name": "Sam Rivera", "email": "sam@novatech.io", "role": "ML Lead", "team": "team_data"},
    {"id": "person_jordan", "name": "Jordan Kim", "email": "jordan@novatech.io", "role": "Security Architect", "team": "team_security"},
    {"id": "person_maya", "name": "Maya Patel", "email": "maya@novatech.io", "role": "Engineering Manager", "team": "team_backend"},
    {"id": "person_leo", "name": "Leo Torres", "email": "leo@novatech.io", "role": "Mobile Lead", "team": "team_mobile"},
    {"id": "person_nina", "name": "Nina Okonkwo", "email": "nina@novatech.io", "role": "Data Engineer", "team": "team_data"},
    {"id": "person_raj", "name": "Raj Patel", "email": "raj@novatech.io", "role": "Backend Engineer", "team": "team_backend"},
]


def generate_people(count: int = 32) -> list:
    people = list(NAMED_PEOPLE)
    team_ids = [t["id"] for t in TEAMS]
    for i in range(count):
        people.append({
            "id": uid("person"),
            "name": fake.name(),
            "email": fake.company_email(),
            "role": random.choice(["Engineer", "Senior Engineer", "Lead", "Analyst", "Architect"]),
            "team": random.choice(team_ids),
            "active": True,
        })
    return people


def generate_documents() -> list:
    docs = []

    # ── Scenario (a): 6 decisions that get reversed ──
    # Doc A1: Original ADR saying "Use JWT for auth"
    docs.append({
        "id": "doc_adr_jwt_original",
        "title": "ADR-001: Use JWT for stateless authentication",
        "content": "After evaluating session-based auth and JWT, we decided to use JWT tokens for stateless authentication. JWTs allow horizontal scaling without shared session store. Decision made by Priya after benchmarking at 10k RPS.",
        "doc_type": "adr",
        "url": "https://docs.novatech.io/adr/001",
        "valid_from": date_str(ago(540)),
        "valid_to": date_str(ago(60)),  # expired when reversed
        "source_id": "doc_adr_jwt_original",
    })

    # Doc A2: Reversal — "Migrate from JWT to opaque tokens"
    docs.append({
        "id": "doc_adr_jwt_reversal",
        "title": "ADR-002: Migrate from JWT to opaque session tokens (reversal of ADR-001)",
        "content": "Following the JWT secret key exposure incident in Q3 2025, we are migrating AuthService from JWT to opaque session tokens with Redis backing. This supersedes ADR-001. All downstream services using JWT validation must update.",
        "doc_type": "adr",
        "url": "https://docs.novatech.io/adr/002",
        "valid_from": date_str(ago(60)),
        "valid_to": None,
        "source_id": "doc_adr_jwt_reversal",
    })

    # Doc B1: Original "Use PostgreSQL for billing"
    docs.append({
        "id": "doc_adr_postgres_billing",
        "title": "ADR-003: PostgreSQL as primary store for BillingSystem",
        "content": "BillingSystem will use PostgreSQL as its primary datastore. ACID compliance is critical for financial transactions. Schema attached.",
        "doc_type": "adr",
        "url": "https://docs.novatech.io/adr/003",
        "valid_from": date_str(ago(480)),
        "valid_to": date_str(ago(90)),
        "source_id": "doc_adr_postgres_billing",
    })

    # Doc B2: Reversal — "Migrate billing to CockroachDB"
    docs.append({
        "id": "doc_adr_cockroach_billing",
        "title": "ADR-004: Migrate BillingSystem to CockroachDB for global scale (supersedes ADR-003)",
        "content": "As NovaTech expands to EU and APAC, BillingSystem requires multi-region ACID compliance. We are migrating from single-region PostgreSQL to CockroachDB. This supersedes ADR-003.",
        "doc_type": "adr",
        "url": "https://docs.novatech.io/adr/004",
        "valid_from": date_str(ago(90)),
        "valid_to": None,
        "source_id": "doc_adr_cockroach_billing",
    })

    # Scenario (c): 2 pairs of contradicting documents
    docs.append({
        "id": "doc_rate_limit_50",
        "title": "POL-005: Mobile API rate limiting policy — 50 req/s per user",
        "content": "Per the security review, API rate limiting is set to 50 requests per second per authenticated user. This applies to all endpoints.",
        "doc_type": "policy",
        "url": "https://docs.novatech.io/policy/rate-limit-v1",
        "valid_from": date_str(ago(300)),
        "valid_to": date_str(ago(30)),
        "source_id": "doc_rate_limit_50",
    })
    docs.append({
        "id": "doc_rate_limit_200",
        "title": "POL-006: Mobile API rate limiting policy v2 — 200 req/s per user (supersedes POL-005)",
        "content": "Updated rate limit policy: API rate limiting is now 200 requests per second per authenticated user, as the 50 req/s limit was causing issues for enterprise customers. MobileAPI team requested this change.",
        "doc_type": "policy",
        "url": "https://docs.novatech.io/policy/rate-limit-v2",
        "valid_from": date_str(ago(30)),
        "valid_to": None,
        "source_id": "doc_rate_limit_200",
    })

    # Realistic engineering documents pool
    real_doc_titles = [
        ("ADR-007: Adopt gRPC Protocol Buffers for Low-Latency Inter-Service RPCs", "adr", "Evaluation of REST JSON vs gRPC Protobuf for inter-service communication. Benchmarking demonstrates 40% latency reduction."),
        ("RFC-018: TensorRT GPU Accelerated Inference Architecture for RecommendationEngine", "rfc", "Proposing migration of model serving to Triton Inference Server with TensorRT-LLM runtimes for sub-20ms inference."),
        ("SPEC-025: Redis Cluster Topology, Sharding, and Automated Failover Policy", "spec", "Architecture specification detailing 6-node Redis cluster deployment with automated replica promotion."),
        ("POL-012: Idempotency Key Specification for Financial API Mutations", "policy", "All mutating payment and billing API requests must submit an Idempotency-Key HTTP header conforming to UUIDv4."),
        ("RUN-033: Kafka Consumer Group Rebalance and Lag Recovery Playbook", "runbook", "Operational runbook for diagnosing consumer partition stalls and scaling out consumer worker replicas."),
        ("SEC-015: TLS 1.3 Minimum and Mutual TLS (mTLS) Implementation Guide", "policy", "Zero-trust service mesh policy requiring mTLS between all Kubernetes pods via Linkerd sidecars."),
        ("ADR-019: Apache Iceberg Catalog Integration for Analytics DataLake", "adr", "Migrating raw S3 Parquet tables to Apache Iceberg metadata catalog for ACID transactions and partition evolution."),
        ("POSTMORTEM-042: SearchEngine Elasticsearch Outage Postmortem Analysis", "postmortem", "Root-cause analysis of the 2-hour search indexing outage caused by shard unbalance during unannounced node drain."),
        ("SPEC-031: Kubernetes Horizontal Pod Autoscaler (HPA) Tuning Guidelines", "spec", "Standardizing target CPU and custom request latency metrics for auto-scaling platform microservices."),
        ("ADR-023: Standardize on Golang for High-Throughput Auth Services", "adr", "Decision to rewrite legacy Python authentication endpoints in Go 1.22 to eliminate runtime GIL contention."),
        ("POL-029: Cross-Region Database Backup and Point-in-Time Recovery SLO", "policy", "Defining maximum allowable Recovery Point Objective (RPO) of 5 minutes and Recovery Time Objective (RTO) of 1 hour."),
        ("RUN-047: Circuit Breaker Reset and Fallback Procedure for Payment Gateways", "runbook", "Runbook for manually overriding Hystrix circuit breaker states during third-party banking downtime."),
        ("SPEC-054: OAuth2 Authorization Code Flow with PKCE for MobileAPI", "spec", "Security spec mandating SHA-256 code challenge verification for iOS and Android OAuth handshakes."),
        ("RFC-062: Transition NotificationService from RabbitMQ to AWS SQS Dead Letter Queues", "rfc", "Deprecating self-hosted RabbitMQ cluster in favor of fully managed AWS SQS FIFO queues with exponential backoff."),
        ("POL-038: SOC2 Type II Audit Logging Standards for Sensitive Data Mutations", "policy", "Mandatory policy requiring non-repudiable audit logs for all access permission modifications and billing adjustments."),
        ("ADR-028: Standardize API Versioning using Accept Headers over URI Path Prefixes", "adr", "Adopting content negotiation headers for API evolution to prevent URL route fragmentation."),
        ("SPEC-067: OpenTelemetry Tracing Instrumentation Standard for Distributed Services", "spec", "Specification for W3C Trace Context propagation headers and baggage attributes across Go and Python services."),
        ("RUN-059: Database Connection Pool Scaling with PgBouncer under 20k Concurrent Connections", "runbook", "Configuration guide for tuning transaction-level PgBouncer pooling parameters on RDS PostgreSQL."),
        ("ADR-032: Enforce Distroless Minimal Container Base Images across Production", "adr", "Security architectural decision eliminating package managers, shells, and curl from production container images."),
        ("RFC-075: Vector Search Indexing with FAISS for Semantic Product Recommendations", "rfc", "Augmenting collaborative filtering with deep semantic embedding indexes running on Elasticsearch 8.x."),
    ]

    for i in range(140):
        t_info = real_doc_titles[i % len(real_doc_titles)]
        created = ago(random.randint(30, 540))
        suffix = f" (Part {i//len(real_doc_titles) + 1})" if i >= len(real_doc_titles) else ""
        docs.append({
            "id": uid("doc"),
            "title": f"{t_info[0]}{suffix}",
            "content": f"{t_info[2]} Documented and reviewed by the architecture working group. Approved for production implementation.",
            "doc_type": t_info[1],
            "url": f"https://docs.novatech.io/docs/{uid('ref')}",
            "valid_from": date_str(created),
            "valid_to": None,
            "source_id": uid("doc"),
        })

    return docs


def generate_messages() -> list:
    """Generate Slack-like messages. Scenario (d): decision origin buried in chat."""
    messages = []
    channels = ["#engineering", "#platform", "#security-incidents", "#ml-team", "#general", "#decisions"]

    # Scenario (d): The 3-hop buried decision
    # Chain: Message → referenced in Ticket → Ticket led to Document → Document is BASED_ON for Decision
    messages.append({
        "id": "msg_buried_origin",
        "content": "Hey @priya, I noticed during the k8s upgrade that our current stateful session approach won't scale with the new horizontal pod autoscaler. We should probably revisit auth architecture. I'm thinking opaque tokens backed by Redis would be more HPA-friendly.",
        "channel": "#platform",
        "timestamp": date_str(ago(150)),
        "thread_id": "thread_hpa_auth",
        "author_id": "person_jordan",
    })
    messages.append({
        "id": "msg_buried_reply",
        "content": "Agreed @jordan. This was actually flagged in the security audit too. Let me create a ticket and we can formalize this as an ADR.",
        "channel": "#platform",
        "timestamp": date_str(ago(149)),
        "thread_id": "thread_hpa_auth",
        "author_id": "person_priya",
    })

    for i in range(200):
        created = ago(random.randint(1, 540))
        messages.append({
            "id": uid("msg"),
            "content": fake.paragraph(nb_sentences=2),
            "channel": random.choice(channels),
            "timestamp": date_str(created),
            "thread_id": uid("thread"),
            "author_id": random.choice([p["id"] for p in NAMED_PEOPLE]),
        })

    return messages


def generate_tickets() -> list:
    tickets = []
    # Scenario (d): Ticket that bridges message → document
    tickets.append({
        "id": "ticket_auth_migration",
        "title": "Investigate stateful auth for HPA compatibility",
        "status": "resolved",
        "priority": "high",
        "created_at": date_str(ago(148)),
        "resolved_at": date_str(ago(75)),
    })

    real_ticket_titles = [
        "INFRA-104: Upgrade Linkerd service mesh to v2.14 in staging",
        "SEC-202: Remediate JWT secret key exposure reported in audit",
        "PERF-305: Profile p99 query latency on PostgreSQL billing schema",
        "DATA-142: Backfill missing Parquet partitions in analytics DataLake",
        "AUTH-409: Implement Redis cluster failover automated retry logic",
        "MOBILE-512: Fix rate limit 429 backoff handling in iOS GraphQL client",
        "SEARCH-218: Rebalance Elasticsearch primary shards across hot data nodes",
        "PAY-331: Investigate sporadic 3% transaction failure on legacy Stripe webhook",
        "ML-404: Benchmark TensorRT GPU container startup latency on AWS EKS",
        "INFRA-209: Configure Kubernetes HPA custom metric adapters for Datadog",
        "SEC-310: Audit role-based access control (RBAC) grants on production RDS",
        "BILL-118: Validate multi-region ACID isolation levels on CockroachDB cluster",
        "NOTIF-202: Drain and migrate RabbitMQ unacknowledged queue dead letters",
        "API-503: Implement HTTP ETag caching for static product catalog endpoints",
        "INFRA-315: Automate zero-downtime blue/green rollouts via Argo CD",
    ]

    for i in range(60):
        created = ago(random.randint(30, 400))
        resolved = created + timedelta(days=random.randint(1, 14)) if random.random() > 0.3 else None
        title_base = real_ticket_titles[i % len(real_ticket_titles)]
        tickets.append({
            "id": uid("ticket"),
            "title": f"{title_base} (Batch {i//len(real_ticket_titles) + 1})" if i >= len(real_ticket_titles) else title_base,
            "status": random.choice(["open", "in_progress", "resolved", "closed"]),
            "priority": random.choice(["low", "medium", "high", "critical"]),
            "created_at": date_str(created),
            "resolved_at": date_str(resolved) if resolved else None,
        })
    return tickets


def generate_decisions(people: list, documents: list) -> list:
    decisions = []

    # ── 6 Key Decisions (scenarios a & d) ──

    # Decision 1: Use JWT (based on doc_adr_jwt_original)
    decisions.append({
        "id": "decision_use_jwt",
        "title": "Use JWT for AuthService authentication",
        "rationale": "Stateless, scalable, well-understood. JWT allows horizontal scaling without shared session store. Benchmarked at 10k RPS.",
        "status": "superseded",
        "made_at": date_str(ago(540)),
        "valid_from": date_str(ago(540)),
        "valid_to": date_str(ago(60)),
        "source_id": "doc_adr_jwt_original",
        "made_by": "person_priya",
        "based_on": ["doc_adr_jwt_original"],
        "affects": ["sys_auth"],
    })

    # Decision 2: Migrate to opaque tokens (supersedes Decision 1)
    decisions.append({
        "id": "decision_opaque_tokens",
        "title": "Migrate AuthService from JWT to opaque session tokens",
        "rationale": "JWT secret key exposure in security incident. All downstream services must update their auth validation.",
        "status": "active",
        "made_at": date_str(ago(60)),
        "valid_from": date_str(ago(60)),
        "valid_to": None,
        "source_id": "doc_adr_jwt_reversal",
        "made_by": "person_jordan",
        "based_on": ["doc_adr_jwt_reversal", "msg_buried_origin"],
        "affects": ["sys_auth", "sys_mobile_api", "sys_payments"],
        "supersedes": "decision_use_jwt",
    })

    # Decision 3: Use PostgreSQL for billing (based on doc_adr_postgres_billing)
    decisions.append({
        "id": "decision_postgres_billing",
        "title": "Use PostgreSQL as primary store for BillingSystem",
        "rationale": "ACID compliance required for financial transactions. PostgreSQL is battle-tested.",
        "status": "superseded",
        "made_at": date_str(ago(480)),
        "valid_from": date_str(ago(480)),
        "valid_to": date_str(ago(90)),
        "source_id": "doc_adr_postgres_billing",
        "made_by": "person_alex",
        "based_on": ["doc_adr_postgres_billing"],
        "affects": ["sys_billing"],
    })

    # Decision 4: Migrate billing to CockroachDB (supersedes Decision 3)
    decisions.append({
        "id": "decision_cockroach_billing",
        "title": "Migrate BillingSystem to CockroachDB",
        "rationale": "Global expansion to EU/APAC requires multi-region ACID. CockroachDB provides this natively.",
        "status": "active",
        "made_at": date_str(ago(90)),
        "valid_from": date_str(ago(90)),
        "valid_to": None,
        "source_id": "doc_adr_cockroach_billing",
        "made_by": "person_alex",
        "based_on": ["doc_adr_cockroach_billing"],
        "affects": ["sys_billing", "sys_payments"],
        "supersedes": "decision_postgres_billing",
    })

    # Decision 5: Rate limit at 50/s (still depends on old policy — will be stale)
    decisions.append({
        "id": "decision_rate_limit_mobile",
        "title": "Enforce 50 req/s rate limit in MobileAPI",
        "rationale": "Per security policy doc, all APIs must enforce 50 req/s limit. MobileAPI implementation to use token bucket.",
        "status": "active",
        "made_at": date_str(ago(290)),
        "valid_from": date_str(ago(290)),
        "valid_to": date_str(ago(30)),
        "source_id": "doc_rate_limit_50",
        "made_by": "person_leo",
        "based_on": ["doc_rate_limit_50"],  # ← this is now stale!
        "affects": ["sys_mobile_api"],
        "stale": True,  # pre-planted staleness
    })

    # Decision 6: Buried origin (3 hops: msg → ticket → doc → decision)
    decisions.append({
        "id": "decision_hpa_auth",
        "title": "Redesign AuthService for Kubernetes HPA compatibility",
        "rationale": "Current stateful sessions incompatible with horizontal pod autoscaling. Migrate to token-based auth.",
        "status": "active",
        "made_at": date_str(ago(130)),
        "valid_from": date_str(ago(130)),
        "valid_to": None,
        "source_id": "doc_adr_jwt_reversal",
        "made_by": "person_priya",
        "based_on": ["doc_adr_jwt_reversal", "ticket_auth_migration"],
        "affects": ["sys_auth"],
    })

    # Add more decisions
    person_ids = [p["id"] for p in people[:8]]
    system_ids = [s["id"] for s in SYSTEMS]
    doc_ids = [d["id"] for d in documents if not d["id"].startswith("doc_adr")]

    # Realistic engineering decisions pool
    REAL_DECISIONS_POOL = [
        ("Adopt gRPC for internal service communications", "Low latency binary protocol with HTTP/2 multiplexing reduces p99 RPC overhead by 40% compared to REST JSON.", ["sys_auth", "sys_payments"]),
        ("Migrate RecommendationEngine from PyTorch CPU to TensorRT GPU serving", "Reduces inference latency from 180ms to 18ms under 5k RPS peak load. Requires NVIDIA T4 inference instances.", ["sys_ml"]),
        ("Deploy Redis Cluster for shared session caching in MobileAPI", "Distributed in-memory store with automatic sharding and replication to eliminate single-point-of-failure in session lookup.", ["sys_mobile_api"]),
        ("Adopt OpenTelemetry distributed tracing across all microservices", "Standardizes trace context propagation across Go, Python, and Node.js services with export to Jaeger/Datadog.", ["sys_auth", "sys_payments", "sys_billing"]),
        ("Enforce TLS 1.3 and mutual TLS (mTLS) in service mesh", "Zero-trust network architecture requirement. Eliminates unencrypted intra-cluster VPC traffic.", ["sys_auth", "sys_payments"]),
        ("Transition PaymentProcessor pipeline to Kafka event-driven architecture", "Decouples synchronous checkout flow from downstream invoice and accounting ledger generation.", ["sys_payments", "sys_billing"]),
        ("Migrate DataLake storage format from raw S3 Parquet to Apache Iceberg", "Provides ACID transactions, hidden partitioning, and time-travel table snapshotting for analytics queries.", ["sys_data_lake"]),
        ("Standardize on PostgreSQL 16 read-replicas for SearchEngine index feeder", "Reduces replication lag to under 50ms and prevents analytical ETL queries from impacting transactional database.", ["sys_search", "sys_billing"]),
        ("Implement OAuth2 PKCE authorization flow for Mobile clients", "Mitigates authorization code interception attacks on public mobile clients without embedding client secrets.", ["sys_mobile_api", "sys_auth"]),
        ("Deprecate legacy REST v1 endpoints in favor of unified GraphQL schema", "Eliminates over-fetching on mobile networks and provides typed contract schema for frontend clients.", ["sys_mobile_api"]),
        ("Standardize Prometheus alerting on p99 service latency exceeding 250ms", "Establishes unified SLO thresholds across all customer-facing microservices.", ["sys_auth", "sys_mobile_api", "sys_payments"]),
        ("Enforce SOC2 compliance audit logging across all auth credential mutations", "Mandatory regulatory compliance requirement. All password resets, token grants, and role changes must emit immutable audit events.", ["sys_auth"]),
        ("Deploy Cloudflare Argo Smart Routing for edge API caching", "Optimizes routing over tier-1 internet backbone, reducing transatlantic latency by 32%.", ["sys_mobile_api"]),
        ("Transition database backups to continuous WAL archiving with point-in-time recovery", "Reduces RPO to under 5 minutes and enables exact timestamp database restoration during data corruption incidents.", ["sys_billing", "sys_auth"]),
        ("Implement circuit breaker pattern on downstream payment gateway integrations", "Prevents cascading thread pool exhaustion when third-party card processors experience degraded response times.", ["sys_payments"]),
        ("Standardize on Golang for high-throughput authentication microservices", "Eliminates Python GIL bottlenecks and provides predictable memory footprint under 20k concurrent WebSocket connections.", ["sys_auth"]),
        ("Adopt Apache Spark on Kubernetes for distributed ML feature engineering", "Replaces single-node Pandas batch jobs with horizontally scalable distributed dataframe compute.", ["sys_data_lake", "sys_ml"]),
        ("Enforce Strict Content Security Policy (CSP) and HSTS headers on all web origins", "Protects against cross-site scripting (XSS) and SSL stripping attacks.", ["sys_auth", "sys_mobile_api"]),
        ("Implement zero-downtime blue/green deployments via Kubernetes Argo Rollouts", "Automates canary analysis with automated rollback on error rate spikes exceeding 0.5%.", ["sys_auth", "sys_payments", "sys_billing"]),
        ("Migrate background worker queue from RabbitMQ to AWS SQS with Dead Letter Queues", "Managed queue service reduces operational maintenance overhead and provides automatic exponential retry backoff.", ["sys_notification"]),
        ("Standardize API versioning using Accept headers instead of URI path prefixes", "Follows RESTful resource identification best practices and avoids URL route fragmentation.", ["sys_mobile_api"]),
        ("Adopt Terraform and GitOps pipeline for cloud infrastructure management", "Eliminates manual AWS console changes and ensures all VPC, RDS, and EKS resources are declared in version control.", ["sys_auth", "sys_data_lake"]),
        ("Implement distributed rate limiting with Redis sliding-window algorithm", "Prevents boundary burst exploitation common in fixed-window rate limiters.", ["sys_mobile_api", "sys_auth"]),
        ("Transition notification dispatch to async batching with priority queues", "Ensures transactional 2FA SMS and password reset emails are not delayed by bulk marketing email broadcasts.", ["sys_notification"]),
        ("Adopt Elasticsearch synonym filters and BM25 scoring for search relevance", "Improves product catalog search recall by 28% for multi-word queries.", ["sys_search"]),
        ("Implement database connection pooling with PgBouncer for high-concurrency microservices", "Maintains stable database server CPU utilization by capping active PostgreSQL backend server connections at 100.", ["sys_auth", "sys_billing"]),
        ("Enforce immutable Docker container images with distroless base layers", "Minimizes container attack surface and eliminates OS package manager vulnerabilities.", ["sys_auth", "sys_payments", "sys_mobile_api"]),
        ("Adopt Vector embeddings with FAISS for semantic recommendation candidate filtering", "Augments collaborative filtering with deep semantic embedding similarity search.", ["sys_ml", "sys_search"]),
        ("Standardize on UUIDv7 for database primary keys to preserve B-tree insertion locality", "Time-ordered UUIDs prevent B-tree fragmentation while maintaining distributed unique key generation.", ["sys_billing", "sys_payments"]),
        ("Implement automated chaos engineering drills with Chaos Mesh in staging", "Validates pod anti-affinity and zone redundancy against spontaneous node termination.", ["sys_auth", "sys_payments"]),
        ("Transition cron job scheduler to Kubernetes CronJobs with concurrency policy Forbid", "Prevents overlapping batch job executions during long-running billing reconciliation runs.", ["sys_billing"]),
        ("Enforce encrypted Amazon EBS volumes with customer-managed KMS keys", "Ensures cryptographic data-at-rest protection conforming to ISO 27001 standards.", ["sys_data_lake", "sys_billing"]),
        ("Adopt WebAuthn and FIDO2 passkeys for enterprise single sign-on", "Eliminates credential phishing risks through public-key cryptography hardware tokens.", ["sys_auth"]),
        ("Implement client-side response caching with ETag HTTP validation headers", "Reduces ingress bandwidth usage and database read queries for unchanged catalog resources.", ["sys_search", "sys_mobile_api"]),
        ("Migrate metric collection from StatsD to Prometheus pull-based scraping", "Provides multi-dimensional metric labels and dynamic Kubernetes service discovery.", ["sys_auth", "sys_payments", "sys_ml"]),
        ("Standardize error response schema adhering to RFC 7807 Problem Details", "Unifies machine-readable error codes and human-readable error descriptions across all services.", ["sys_auth", "sys_mobile_api", "sys_payments"]),
        ("Adopt AWS KMS envelope encryption for sensitive payment card tokenization", "Ensures plaintext decryption keys never persist in application runtime memory or persistent storage.", ["sys_payments"]),
        ("Implement automated dead-letter queue replay tool with replay verification checks", "Enables safe re-processing of failed payment webhook deliveries following downstream outages.", ["sys_payments"]),
        ("Transition SearchEngine from self-hosted cluster to managed AWS OpenSearch Service", "Offloads cluster maintenance, storage auto-expansion, and version upgrades to AWS managed infrastructure.", ["sys_search"]),
        ("Deploy automated vulnerability scanning with Trivy in CI/CD container build pipeline", "Blocks pull request merging on any high or critical CVE detections in application dependencies.", ["sys_auth", "sys_payments", "sys_mobile_api"]),
        ("Standardize structured JSON logging with correlation IDs across all microservices", "Enables seamless end-to-end request tracing across distributed service boundaries in Datadog.", ["sys_auth", "sys_payments", "sys_billing", "sys_notification"]),
        ("Implement automated database schema migrations with Flyway in deployment pipelines", "Guarantees deterministic, version-controlled database DDL schema evolutions.", ["sys_billing", "sys_auth"]),
        ("Enforce API contract testing with Pact between MobileAPI and backend microservices", "Catches breaking API schema changes before staging environment deployments.", ["sys_mobile_api", "sys_payments"]),
        ("Adopt Apache Kafka compacted topics for service configuration broadcast", "Enables real-time dynamic configuration updates without requiring application pod restarts.", ["sys_auth", "sys_payments"]),
    ]

    for i in range(44):
        # Find semantically matching doc for this decision
        matched_doc_id = None
        for doc in documents:
            title_clean = doc.get("title", "").lower()
            # Match by common distinctive keywords
            for kw in ["grpc", "tensorrt", "redis", "opentelemetry", "tls 1.3", "kafka", "iceberg",
                       "postgres", "pkce", "accept headers", "prometheus", "soc2", "argo", "backup",
                       "circuit breaker", "golang", "spark", "csp", "rollouts", "sqs", "api versioning",
                       "terraform", "sliding-window", "priority queue", "synonym", "pgbouncer",
                       "distroless", "faiss", "uuidv7", "chaos", "cronjob", "ebs", "passkey", "etag",
                       "statsd", "rfc 7807", "envelope encryption", "replay", "opensearch", "trivy"]:
                if kw in item[0].lower() and kw in title_clean:
                    matched_doc_id = doc["id"]
                    break
            if matched_doc_id:
                break

        chosen_doc = matched_doc_id or (doc_ids[i % len(doc_ids)] if doc_ids else uid("doc"))
        decisions.append({
            "id": uid("decision"),
            "title": item[0],
            "rationale": item[1],
            "status": "active" if i < 35 else random.choice(["superseded", "draft"]),
            "made_at": date_str(made),
            "valid_from": date_str(made),
            "valid_to": None,
            "source_id": chosen_doc,
            "made_by": random.choice(person_ids),
            "based_on": [chosen_doc],
            "affects": item[2],
        })

    return decisions


def build_edges(people: list, decisions: list, documents: list, tickets: list, messages: list) -> list:
    """Build all graph edges."""
    edges = []
    person_map = {p["id"]: p for p in people}
    doc_map = {d["id"]: d for d in documents}

    # Person → Team (MEMBER_OF)
    for p in people:
        team = p.get("team")
        if team:
            edges.append({
                "from_id": p["id"], "from_label": "Person",
                "to_id": team, "to_label": "Team",
                "rel_type": "MEMBER_OF",
                "props": {"role": p.get("role", "")},
                "valid_from": date_str(ago(500)),
                "source_id": "synthetic",
            })

    # Team → System (OWNS) — using system's owner_team
    for s in SYSTEMS:
        edges.append({
            "from_id": s["owner_team"], "from_label": "Team",
            "to_id": s["id"], "to_label": "System",
            "rel_type": "OWNS",
            "props": {},
            "valid_from": date_str(ago(400)),
            "source_id": "synthetic",
        })

    # Scenario (b): 3 systems where only Priya, Sam, Jordan work respectively (sole experts)
    bus_factor_edges = [
        ("person_priya", "sys_auth", date_str(ago(540)), None),
        ("person_priya", "sys_auth", date_str(ago(200)), None),
        ("person_priya", "sys_auth", date_str(ago(60)), None),
        ("person_sam", "sys_ml", date_str(ago(400)), None),
        ("person_sam", "sys_ml", date_str(ago(120)), None),
        ("person_jordan", "sys_notification", date_str(ago(300)), None),
        ("person_jordan", "sys_notification", date_str(ago(90)), None),
    ]
    for person_id, sys_id, vf, vt in bus_factor_edges:
        edges.append({
            "from_id": person_id, "from_label": "Person",
            "to_id": sys_id, "to_label": "System",
            "rel_type": "WORKED_ON",
            "props": {"contribution": "primary"},
            "valid_from": vf,
            "valid_to": vt,
            "source_id": "synthetic",
        })

    # Random WORKED_ON for other people (excluding sole-expert systems so bus factor is preserved)
    sole_expert_systems = {"sys_auth", "sys_ml", "sys_notification"}
    other_systems = [s for s in SYSTEMS if s["id"] not in sole_expert_systems]
    for p in people[:20]:
        if p["id"] in {"person_priya", "person_sam", "person_jordan"}:
            continue
        for s in random.sample(other_systems, min(len(other_systems), random.randint(1, 3))):
            edges.append({
                "from_id": p["id"], "from_label": "Person",
                "to_id": s["id"], "to_label": "System",
                "rel_type": "WORKED_ON",
                "props": {"contribution": random.choice(["primary", "secondary", "review"])},
                "valid_from": date_str(ago(random.randint(30, 400))),
                "source_id": "synthetic",
            })

    # Decision edges
    for d in decisions:
        # MADE_BY
        if d.get("made_by"):
            edges.append({
                "from_id": d["id"], "from_label": "Decision",
                "to_id": d["made_by"], "to_label": "Person",
                "rel_type": "MADE_BY",
                "props": {"at": d.get("made_at", "")},
                "valid_from": d.get("valid_from", ""),
                "source_id": d.get("source_id", d["id"]),
            })

        # BASED_ON
        for src_id in d.get("based_on", []):
            src_label = "Document"
            if src_id.startswith("ticket_"):
                src_label = "Ticket"
            elif src_id.startswith("msg_"):
                src_label = "Message"
            edges.append({
                "from_id": d["id"], "from_label": "Decision",
                "to_id": src_id, "to_label": src_label,
                "rel_type": "BASED_ON",
                "props": {"weight": 1.0},
                "valid_from": d.get("valid_from", ""),
                "source_id": d.get("source_id", d["id"]),
            })

        # AFFECTS
        for sys_id in d.get("affects", []):
            edges.append({
                "from_id": d["id"], "from_label": "Decision",
                "to_id": sys_id, "to_label": "System",
                "rel_type": "AFFECTS",
                "props": {"impact": "primary"},
                "valid_from": d.get("valid_from", ""),
                "source_id": d.get("source_id", d["id"]),
            })

        # SUPERSEDES
        if d.get("supersedes"):
            edges.append({
                "from_id": d["id"], "from_label": "Decision",
                "to_id": d["supersedes"], "to_label": "Decision",
                "rel_type": "SUPERSEDES",
                "props": {"reason": "explicit_reversal"},
                "valid_from": d.get("valid_from", ""),
                "source_id": d.get("source_id", d["id"]),
            })

    # Scenario (d): 3-hop chain
    # msg_buried_origin → (discussed_in) → ticket_auth_migration → (leads_to) → doc_adr_jwt_reversal
    edges.append({
        "from_id": "ticket_auth_migration", "from_label": "Ticket",
        "to_id": "msg_buried_origin", "to_label": "Message",
        "rel_type": "DISCUSSED_IN",
        "props": {},
        "valid_from": date_str(ago(148)),
        "source_id": "msg_buried_origin",
    })
    edges.append({
        "from_id": "ticket_auth_migration", "from_label": "Ticket",
        "to_id": "doc_adr_jwt_reversal", "to_label": "Document",
        "rel_type": "RESOLVES",
        "props": {},
        "valid_from": date_str(ago(75)),
        "source_id": "ticket_auth_migration",
    })

    # Document supersedes / contradicts
    edges.append({
        "from_id": "doc_adr_jwt_reversal", "from_label": "Document",
        "to_id": "doc_adr_jwt_original", "to_label": "Document",
        "rel_type": "SUPERSEDES",
        "props": {},
        "valid_from": date_str(ago(60)),
        "source_id": "doc_adr_jwt_reversal",
    })
    edges.append({
        "from_id": "doc_adr_cockroach_billing", "from_label": "Document",
        "to_id": "doc_adr_postgres_billing", "to_label": "Document",
        "rel_type": "SUPERSEDES",
        "props": {},
        "valid_from": date_str(ago(90)),
        "source_id": "doc_adr_cockroach_billing",
    })
    edges.append({
        "from_id": "doc_rate_limit_200", "from_label": "Document",
        "to_id": "doc_rate_limit_50", "to_label": "Document",
        "rel_type": "SUPERSEDES",
        "props": {},
        "valid_from": date_str(ago(30)),
        "source_id": "doc_rate_limit_200",
    })

    # Message authored by person
    edges.append({
        "from_id": "person_jordan", "from_label": "Person",
        "to_id": "msg_buried_origin", "to_label": "Message",
        "rel_type": "AUTHORED",
        "props": {"at": date_str(ago(150))},
        "valid_from": date_str(ago(150)),
        "source_id": "msg_buried_origin",
    })

    # Person AUTHORED documents
    person_ids_cycle = [p["id"] for p in people[:8]]
    for i, doc in enumerate(documents[:30]):
        edges.append({
            "from_id": person_ids_cycle[i % len(person_ids_cycle)], "from_label": "Person",
            "to_id": doc["id"], "to_label": "Document",
            "rel_type": "AUTHORED",
            "props": {"at": doc.get("valid_from", "")},
            "valid_from": doc.get("valid_from", ""),
            "source_id": doc["id"],
        })

    return edges


def generate_answer_key(decisions: list) -> dict:
    """Ground truth for the benchmark."""
    return {
        "scenarios": {
            "stale_decisions": {
                "description": "Decisions that should be flagged as stale",
                "expected": ["decision_rate_limit_mobile"],
                "trigger_doc": "doc_rate_limit_200",
                "explanation": "decision_rate_limit_mobile is based on doc_rate_limit_50 which was superseded by doc_rate_limit_200",
            },
            "bus_factor_risks": {
                "description": "Systems with only one expert",
                "expected": [
                    {"system": "sys_auth", "sole_expert": "person_priya"},
                    {"system": "sys_ml", "sole_expert": "person_sam"},
                    {"system": "sys_notification", "sole_expert": "person_jordan"},
                ],
                "explanation": "Only Priya/Sam/Jordan worked on these systems respectively",
            },
            "buried_decision_origin": {
                "description": "Decision whose origin is 3 hops deep",
                "decision_id": "decision_hpa_auth",
                "expected_chain": [
                    "decision_hpa_auth → BASED_ON → doc_adr_jwt_reversal",
                    "doc_adr_jwt_reversal ← RESOLVES ← ticket_auth_migration",
                    "ticket_auth_migration ← DISCUSSED_IN ← msg_buried_origin (Jordan's slack message)",
                ],
                "explanation": "The real origin of the HPA auth decision is Jordan's Slack message, buried 3 hops away",
            },
            "contradicting_docs": {
                "description": "Document pairs with contradicting information",
                "expected": [
                    ("doc_rate_limit_50", "doc_rate_limit_200"),
                    ("doc_adr_jwt_original", "doc_adr_jwt_reversal"),
                ],
            },
            "reversed_decisions": {
                "description": "Decisions that were explicitly reversed",
                "expected": ["decision_use_jwt", "decision_postgres_billing"],
                "reversals": {
                    "decision_use_jwt": "decision_opaque_tokens",
                    "decision_postgres_billing": "decision_cockroach_billing",
                },
            },
        },
        "benchmark_questions": [
            {
                "id": "q1",
                "question": "Why did we switch from JWT to opaque tokens in AuthService?",
                "expected_decision": "decision_opaque_tokens",
                "expected_supersedes": "decision_use_jwt",
                "requires_hops": 2,
            },
            {
                "id": "q2",
                "question": "Who is the sole expert on the AuthService system?",
                "expected_person": "person_priya",
                "query_type": "bus_factor",
            },
            {
                "id": "q3",
                "question": "What decisions are now stale because of the new rate limit policy?",
                "expected_stale": ["decision_rate_limit_mobile"],
                "trigger_doc": "doc_rate_limit_200",
            },
            {
                "id": "q4",
                "question": "What is the original origin of the decision to redesign AuthService for HPA?",
                "expected_origin": "msg_buried_origin",
                "expected_chain_length": 3,
                "query_type": "decision_trace",
            },
            {
                "id": "q5",
                "question": "What happens if Priya Sharma leaves the company?",
                "expected_systems": ["sys_auth"],
                "query_type": "bus_factor",
            },
            {
                "id": "q6",
                "question": "What decisions affected the PaymentProcessor system?",
                "expected_decisions": ["decision_opaque_tokens", "decision_cockroach_billing"],
                "query_type": "impact_analysis",
            },
            {
                "id": "q7",
                "question": "How is the security incident related to the billing migration?",
                "query_type": "connection_path",
                "node_a": "doc_adr_jwt_reversal",
                "node_b": "decision_cockroach_billing",
            },
            {
                "id": "q8",
                "question": "What was the company's auth strategy 200 days ago?",
                "expected_decisions": ["decision_use_jwt"],
                "query_type": "as_of",
                "as_of_date": date_str(ago(200)),
            },
            {
                "id": "q9",
                "question": "Who knows the most about the RecommendationEngine?",
                "expected_person": "person_sam",
                "query_type": "who_knows",
            },
            {
                "id": "q10",
                "question": "What documents contradict each other about rate limiting?",
                "expected_docs": ["doc_rate_limit_50", "doc_rate_limit_200"],
                "query_type": "contradiction_detection",
            },
        ],
    }


def main():
    print("🏭 Generating NovaTech Labs synthetic company data...")

    people = generate_people(32)
    documents = generate_documents()
    messages = generate_messages()
    tickets = generate_tickets()
    decisions = generate_decisions(people, documents)
    edges = build_edges(people, decisions, documents, tickets, messages)

    company = {
        "name": "NovaTech Labs",
        "description": "A 40-person SaaS startup with 8 systems, 18 months of history",
        "people": people,
        "teams": TEAMS,
        "systems": SYSTEMS,
        "documents": documents,
        "decisions": decisions,
        "tickets": tickets,
        "messages": messages,
        "edges": edges,
    }

    answer_key = generate_answer_key(decisions)

    # Write output
    company_path = OUTPUT_DIR / "company.json"
    answer_key_path = OUTPUT_DIR / "answer_key.json"

    with open(company_path, "w") as f:
        json.dump(company, f, indent=2, default=str)
    with open(answer_key_path, "w") as f:
        json.dump(answer_key, f, indent=2, default=str)

    print(f"✅ Company data → {company_path}")
    print(f"   People: {len(people)}")
    print(f"   Teams: {len(TEAMS)}")
    print(f"   Systems: {len(SYSTEMS)}")
    print(f"   Documents: {len(documents)}")
    print(f"   Decisions: {len(decisions)}")
    print(f"   Tickets: {len(tickets)}")
    print(f"   Messages: {len(messages)}")
    print(f"   Edges: {len(edges)}")
    print(f"✅ Answer key → {answer_key_path}")


if __name__ == "__main__":
    main()
