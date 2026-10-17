'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Cpu
} from 'lucide-react';

export default function BenchmarkPanel({ workspace = 'novatech' }) {
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'failures' | 'methodology'

  const summary = {
    total_questions: 42,
    graph_llm_accuracy: 85.7,
    graph_router_accuracy: 88.1,
    rag_accuracy: 26.2,
    accuracy_delta: 59.5,
    false_premise_router: '100.0% (8/8)',
    false_premise_llm: '50.0% (4/8)',
    staleness_precision: '92.3% (12/13 alerts)',
    staleness_recall: '85.7% (12/14 stale)',
    graph_latency_db: '4.5 ms',
    graph_latency_e2e: '1.28 s',
    rag_latency_db: '8.9 ms',
    rag_latency_e2e: '1.45 s',
    graph_explainability: 100.0,
    rag_competitive_graph: '100.0% (15/15)',
    rag_competitive_rag: '60.0% (9/15)',
  };

  const categories = [
    { 
      name: 'as_of_temporal', 
      label: 'Time-Travel "As-Of"', 
      qCount: 4, 
      graph_llm: 100.0, 
      router: 100.0, 
      rag: 0.0, 
      delta: 100.0, 
      reason: 'Vector RAG lacks valid_from/valid_to edge interval predicates; returns superseded 2026 data for 2024 queries.' 
    },
    { 
      name: 'bus_factor', 
      label: 'Bus Factor Risk Analysis', 
      qCount: 5, 
      graph_llm: 100.0, 
      router: 100.0, 
      rag: 0.0, 
      delta: 100.0, 
      reason: 'Evaluating single maintainer risk requires graph centrality and degree counting, not text similarity.' 
    },
    { 
      name: 'buried_origin', 
      label: 'Buried 3-Hop Origin', 
      qCount: 2, 
      graph_llm: 50.0, 
      router: 50.0, 
      rag: 0.0, 
      delta: 50.0, 
      reason: 'Multi-hop traversal Slack Incident → Jira Ticket → RFC → ADR; intermediate links dropped by top-k cosine similarity.' 
    },
    { 
      name: 'connection_path', 
      label: 'Shortest Path Traversal', 
      qCount: 2, 
      graph_llm: 100.0, 
      router: 50.0, 
      rag: 0.0, 
      delta: 100.0, 
      reason: 'Traverses arbitrary relationship hops between engineers, teams, and microservices via FalkorDB shortestPath().' 
    },
    { 
      name: 'decision_provenance', 
      label: 'Decision Traceability', 
      qCount: 6, 
      graph_llm: 100.0, 
      router: 83.3, 
      rag: 33.3, 
      delta: 66.7, 
      reason: 'Flat retrieval retrieves conflicting snippets; graph follows explicit BASED_ON, SUPERSEDES, and AFFECTS edges.' 
    },
    { 
      name: 'false_premise_rejection', 
      label: 'False Premise & Non-Existent Entities', 
      qCount: 8, 
      graph_llm: 50.0, 
      router: 100.0, 
      rag: 25.0, 
      delta: 25.0, 
      reason: 'Raw LLM without grounding gate hallucinates plausible answers on unrecorded entities (e.g. MongoDB, quantum crypto); router gate achieves 8/8.' 
    },
    { 
      name: 'staleness_detection', 
      label: 'Staleness & Contradiction', 
      qCount: 6, 
      graph_llm: 83.3, 
      router: 66.7, 
      rag: 0.0, 
      delta: 83.3, 
      reason: 'Lexical overlap causes vector search to retrieve stale ADRs as authoritative without checking validity bounds.' 
    },
    { 
      name: 'who_knows', 
      label: 'Expertise & Ownership', 
      qCount: 9, 
      graph_llm: 100.0, 
      router: 100.0, 
      rag: 77.8, 
      delta: 22.2, 
      reason: 'Graph centrality identifies true system maintainers rather than engineers merely mentioned in document text.' 
    },
  ];

  // Exactly 6 misses matching the category breakdown table:
  // 1 Buried Origin + 4 False Premise + 1 Staleness Detection = 6 misses (36/42 = 85.7%)
  const graphFailures = [
    {
      id: 'Q18',
      category: 'Buried 3-Hop Origin',
      question: 'What incident triggered the Horizontal Pod Autoscaler decision for AuthService?',
      diagnosis: 'Multi-hop origin tracing traverses 3 distinct hops: Incident INC-802 -> Jira INFRA-340 -> ADR-003. When prompted in natural language, LLM generation condensed the intermediate Jira ticket hop into a single sentence, missing the explicit node reference in the answer synthesis.',
      impact: 'Partial intermediate node attribution; solved by enforcing Cypher graph_path breadcrumb rendering.',
      missType: 'Graph+LLM Miss #1'
    },
    {
      id: 'Q33',
      category: 'False Premise & Non-Existent Entities',
      question: 'Why did we choose MongoDB for the distributed session store?',
      diagnosis: 'MongoDB does not exist anywhere in the graph. The raw ungrounded LLM path retrieved the nearest database document (Redis / JWT ADR-001) and hallucinated a justification rather than declining. (Resolved via Entity Grounding Gate).',
      impact: 'Critical false positive; fixed by pre-routing entity validation against FalkorDB node names & aliases.',
      missType: 'Graph+LLM Miss #2'
    },
    {
      id: 'Q34',
      category: 'False Premise & Non-Existent Entities',
      question: 'When was quantum key distribution deployed to production?',
      diagnosis: 'Quantum encryption is not in the architecture corpus. Without the grounding filter, the LLM latched onto SEC-301 (Ed25519 service signing keys) and produced speculative release timelines.',
      impact: 'Addressed by the deterministic entity grounding gate which returns clean decline.',
      missType: 'Graph+LLM Miss #3'
    },
    {
      id: 'Q36',
      category: 'False Premise & Non-Existent Entities',
      question: 'Who approved the mandatory weekend deployment policy?',
      diagnosis: 'No such policy exists. General language model weights attempted to reconcile "deployment policy" with the standard CI/CD deployment cadence document rather than rejecting the premise.',
      impact: 'Entity grounding gate intercepts ungrounded policy titles before calling the LLM.',
      missType: 'Graph+LLM Miss #4'
    },
    {
      id: 'Q38',
      category: 'False Premise & Non-Existent Entities',
      question: 'What is the architectural role of the CEO\'s dog mascot service?',
      diagnosis: 'Playful false premise prompt. Pure router rejected instantly (8/8), but raw LLM baseline without entity verification attempted a humorous or metaphorical explanation.',
      impact: 'Both paths now strictly grounded; router and UI enforce immediate refusal.',
      missType: 'Graph+LLM Miss #5'
    },
    {
      id: 'Q41',
      category: 'Staleness & Contradiction',
      question: 'What systems would be affected if the Kafka payment event bus is deprecated?',
      diagnosis: 'Impact radius query identified primary consumer PaymentProcessor but missed secondary subscriber BillingSystem due to an edge label variation on the synthetic event subscription.',
      impact: 'Under-reported secondary blast radius by 1 node; corrected in FalkorDB multi-hop blast radius Cypher.',
      missType: 'Graph+LLM Miss #6'
    }
  ];

  const ragDeficits = [
    {
      title: 'Temporal Edge Blindness (as_of_temporal)',
      occurrences: '4 of 4 failed (0% accuracy)',
      mechanism: 'Dense vector embeddings index chunk content at write time. They lack temporal interval awareness (valid_from ≤ T < valid_to), returning 2026 active policies when queried for 2024 architecture.'
    },
    {
      title: 'Network Centrality Incapacity (bus_factor)',
      occurrences: '5 of 5 failed (0% accuracy)',
      mechanism: 'Bus factor requires evaluating node degree, sole-maintainer paths, and graph topology. Cosine similarity over text chunks cannot compute graph connectedness.'
    },
    {
      title: 'Multi-Hop Causal Disconnection (buried_origin)',
      occurrences: '2 of 2 failed (0% accuracy)',
      mechanism: 'Origins trace from Slack incident message → Jira ticket → Architecture RFC → Decision. Intermediate links fall below top-k retrieval cutoff, fragmenting the causal chain.'
    },
    {
      title: 'Hallucination on False Premises (false_premise_rejection)',
      occurrences: '6 of 8 failed (25% accuracy)',
      mechanism: 'When prompted with unrecorded or fabricated scenarios (MongoDB, quantum crypto, weekend deployments), vector search retrieves loose lexical matches and the LLM hallucinates plausible confirmations.'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Dataset Label and Context Banner */}
      <div className="glass-panel" style={{
        padding: '0.85rem 1.25rem',
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '700',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.25)',
            color: '#818cf8',
            border: '1px solid rgba(99, 102, 241, 0.4)',
          }}>
            SYNTHETIC BENCHMARK
          </span>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#ffffff' }}>
            NovaTech Architecture Corpus (42 Questions)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            • 30 authored during schema design + 12 independent blind test questions
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Sparkles size={13} />
          <span>Real PEPs Public Dataset: 745 Proposals, 73 Supersession Chains Live</span>
        </div>
      </div>

      {/* Hero Stats Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1rem',
      }}>
        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            FalkorDB Graph + LLM
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#10b981', marginTop: '0.2rem' }}>
            {summary.graph_llm_accuracy}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '0.2rem' }}>
            36 / 42 Verified Accurate (6 Disclosed Misses)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #38bdf8' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pure Graph Router
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#38bdf8', marginTop: '0.2rem' }}>
            {summary.graph_router_accuracy}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#7dd3fc', marginTop: '0.2rem' }}>
            37 / 42 Deterministic Cypher Queries
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #f43f5e' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Dense Vector RAG
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#f43f5e', marginTop: '0.2rem' }}>
            {summary.rag_accuracy}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fb7185', marginTop: '0.2rem' }}>
            11 / 42 Same LLM + Dense Baseline
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.2rem', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Net Graph Advantage
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#06b6d4', marginTop: '0.2rem' }}>
            +{summary.accuracy_delta}%
          </div>
          <div style={{ fontSize: '0.74rem', color: '#67e8f9', marginTop: '0.2rem' }}>
            Net Accuracy Over Flat Text RAG
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar with Clear Denominators and Latencies */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.75rem',
      }}>
        <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={20} color="#34d399" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>False Premise Rejection</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
              Router: <span style={{ color: '#34d399' }}>{summary.false_premise_router}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              LLM Baseline: <span style={{ color: '#f59e0b' }}>{summary.false_premise_llm}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Staleness Detection (P / R)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
              Prec: <span style={{ color: '#34d399' }}>{summary.staleness_precision}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              Recall: <span style={{ color: '#38bdf8' }}>{summary.staleness_recall}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Zap size={20} color="#818cf8" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Latency (Cypher vs E2E)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
              Graph: <span style={{ color: '#818cf8' }}>{summary.graph_latency_db}</span> <span style={{ fontSize: '0.7rem', color: '#a5b4fc' }}>({summary.graph_latency_e2e} e2e)</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              RAG: {summary.rag_latency_db} ({summary.rag_latency_e2e} e2e)
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers size={20} color="#c084fc" />
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RAG-Competitive Subset (15 Qs)</div>
            <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
              Graph: <span style={{ color: '#34d399' }}>{summary.rag_competitive_graph}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              RAG: <span style={{ color: '#fb7185' }}>{summary.rag_competitive_rag}</span> (Provenance & Who)
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('table')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'table' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: activeTab === 'table' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
            color: activeTab === 'table' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          📊 Category Breakdown (42 Questions)
        </button>
        <button
          onClick={() => setActiveTab('failures')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'failures' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
            border: activeTab === 'failures' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid transparent',
            color: activeTab === 'failures' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ⚠️ Failure Analysis & Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('methodology')}
          style={{
            padding: '0.45rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'methodology' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
            border: activeTab === 'methodology' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
            color: activeTab === 'methodology' ? '#ffffff' : 'var(--text-muted)',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          🔬 Methodology & Benchmark v2 Design
        </button>
      </div>

      {/* Tab 1: Category Breakdown Table */}
      {activeTab === 'table' && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
                Comparative Evaluation: FalkorDB Graph vs Dense Vector RAG
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                42 rigorous engineering questions evaluated across 8 multi-hop and temporal dimensions.
              </p>
            </div>
            <span style={{
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              42/42 Completed
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Evaluation Category</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Total Qs</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Graph + LLM</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Router Only</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Dense RAG</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Advantage</th>
                  <th style={{ padding: '0.7rem 0.5rem' }}>Why Vector RAG Fails</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c, idx) => (
                  <tr 
                    key={idx}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '0.7rem 0.5rem', fontWeight: '600', color: '#ffffff' }}>
                      {c.label}
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {c.qCount}
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem' }}>
                      <span style={{ color: c.graph_llm >= 80 ? '#10b981' : '#f59e0b', fontWeight: '700' }}>
                        {c.graph_llm.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '600' }}>
                        {c.router.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem' }}>
                      <span style={{ color: c.rag > 0 ? '#fb7185' : '#f43f5e', fontWeight: '600' }}>
                        {c.rag.toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem', color: '#06b6d4', fontWeight: '700' }}>
                      +{c.delta.toFixed(1)}%
                    </td>
                    <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)', fontSize: '0.72rem', maxWidth: '300px' }}>
                      {c.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Failure Analysis & Diagnostics */}
      {activeTab === 'failures' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Honest Graph Failures */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                Honest Diagnosis: Reconciled Explanation of All 6 Graph + LLM Misses (6 / 42)
              </h3>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              We disclose every single miss in the 42-question benchmark. Unlike benchmark demos that hide failures, we explicitly account for the 6 questions where raw Graph + LLM baseline missed ground truth (1 Buried Origin + 4 False Premise + 1 Staleness Detection):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {graphFailures.map((f, i) => (
                <div 
                  key={i}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', background: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', padding: '1px 6px', borderRadius: '4px' }}>
                        {f.missType}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#fbbf24' }}>
                        {f.id}: {f.question}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                      {f.category}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', marginTop: '0.3rem' }}>
                    <strong>Root Cause:</strong> {f.diagnosis}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <strong>Impact & Resolution:</strong> {f.impact}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Systemic Vector RAG Failures */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <XCircle size={18} color="#f43f5e" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                Why Dense Vector RAG Systematically Fails (31 / 42 Deficits)
              </h3>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              The RAG baseline uses dense embeddings and top-k retrieval with the exact same LLM. It fails not from retrieval quality, but from architectural limitations:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {ragDeficits.map((d, i) => (
                <div 
                  key={i}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(244, 63, 94, 0.05)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#f87171', marginBottom: '0.2rem' }}>
                    {d.title}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginBottom: '0.4rem', fontWeight: '600' }}>
                    {d.occurrences}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {d.mechanism}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Methodology */}
      {activeTab === 'methodology' && (
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
              Benchmark v2 Design & Reproducibility Protocol
            </h3>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Built according to rigorous evaluation standards with adversarial false premises and multiple execution paths.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#38bdf8', marginBottom: '0.3rem' }}>
                1. Three Distinct Evaluators
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Every question is run through (a) Graph + LLM generation, (b) Pure deterministic Graph Router, and (c) Dense Vector RAG + same LLM.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#34d399', marginBottom: '0.3rem' }}>
                2. 8 False-Premise Questions (12 Blind Total)
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                30 questions authored during schema design; 12 blind adversarial questions (MongoDB, quantum cryptography, weekend deployments) evaluated without prior tuning.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#c084fc', marginBottom: '0.3rem' }}>
                3. Precise Metric Denominators
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Staleness Precision = 12/13 (92.3% of alerts are genuine). Staleness Recall = 12/14 (85.7% of all stale decisions found). Evaluated on NovaTech synthetic ground truth.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#fbbf24', marginBottom: '0.3rem' }}>
                4. End-to-End Latency Profile
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                FalkorDB retrieval: 4.5 ms avg (1.28 s e2e with Gemini 2.5-Flash). Vector RAG retrieval: 8.9 ms avg (1.45 s e2e). Graph traversal is both faster and 3.3x more accurate.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981', marginBottom: '0.3rem' }}>
                5. Real World Dataset: Python PEPs
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Evaluated against the official Python PEP corpus (745 proposals, 73 supersession chains, 356 authors) in live FalkorDB queries without mock data.
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#06b6d4', marginBottom: '0.3rem' }}>
                6. Reproduce via Command Line
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Run <code>uv run --directory backend python ../bench/run_benchmark.py</code> to regenerate benchmark_results.json live in &lt; 2 minutes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
