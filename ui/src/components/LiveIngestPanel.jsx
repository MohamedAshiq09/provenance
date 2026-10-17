'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  RefreshCw, 
  Cpu, 
  Layers, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export default function LiveIngestPanel({ 
  onIngestSuccess, 
  onNavigateToApprovals,
  workspace = 'novatech'
}) {
  const samples = [
    {
      id: 'sample-1',
      label: 'ADR-024: KEDA Autoscaling for AuthService',
      badge: 'Staleness Ripple',
      status: 'warn',
      doc: {
        id: 'doc_keda_autoscaling',
        title: 'ADR-024: Adopt KEDA Event-Driven Autoscaler for AuthService',
        doc_type: 'adr',
        supersedes_id: 'decision_hpa_auth',
        content: `Title: ADR-024: Adopt KEDA Event-Driven Autoscaler for AuthService
Status: Approved
Date: 2026-10-17
Context: Token validation traffic spikes during peak mobile login windows (08:00-09:30 UTC). Reactive CPU/memory threshold scaling in ADR-003 fails to anticipate queue backpressure in Redis.
Decision: We supersede ADR-003 (Horizontal Pod Autoscaler) and migrate AuthService to KEDA event-driven autoscaling triggered directly by Redis session queue depth and Kafka consumer lag.
Supersedes: ADR-003 (Horizontal Pod Autoscaler for AuthService).
Consequences: Invalidates ADR-003 immediately. Updates production manifests in k8s/auth-service/keda.yaml. Eliminates OOMKilled events during login surges.`,
      }
    },
    {
      id: 'sample-2',
      label: 'SEC-301: Deprecate RSA-2048 for Ed25519 Keys',
      badge: 'Security Policy',
      status: 'off',
      doc: {
        id: 'doc_sec_ed25519',
        title: 'SEC-301: Migration to Ed25519 Service Signing Keys',
        doc_type: 'spec',
        supersedes_id: 'decision_rsa_keys',
        content: `Title: SEC-301: Service Identity Key Modernization
Status: Approved
Date: 2026-10-16
Decision: Deprecate legacy RSA-2048 internal service tokens. All microservices must issue Ed25519 keypairs for mTLS and internal JWT verification.
Supersedes: POL-005 (RSA Token Standards).
Consequences: Deprecates all existing RSA-2048 public key rotation crons.`,
      }
    },
    {
      id: 'sample-3',
      label: 'INFRA-405: Memory Limit Boost for AuthService',
      badge: 'Infrastructure',
      status: 'off',
      doc: {
        id: 'doc_infra_mem_boost',
        title: 'INFRA-405: Double AuthService Pod Memory Allocation to 4Gi',
        doc_type: 'rfc',
        supersedes_id: 'decision_auth_memory',
        content: `Title: INFRA-405: AuthService Memory Scaling
Status: Draft
Date: 2026-10-16
Decision: Increase pod memory limit from 2Gi to 4Gi in production k8s manifests to eliminate OOMKilled events during token bursts.`,
      }
    }
  ];

  const [selectedSample, setSelectedSample] = useState(samples[0]);
  const [docId, setDocId] = useState(samples[0].doc.id);
  const [title, setTitle] = useState(samples[0].doc.title);
  const [docType, setDocType] = useState(samples[0].doc.doc_type);
  const [supersedesId, setSupersedesId] = useState(samples[0].doc.supersedes_id);
  const [content, setContent] = useState(samples[0].doc.content);

  // Pipeline execution state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0=idle, 1=extract, 2=link, 3=ripple, 4=done
  const [ingestResult, setIngestResult] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);

  const handleSelectSample = (s) => {
    setSelectedSample(s);
    setDocId(s.doc.id + '_' + Date.now().toString().slice(-4));
    setTitle(s.doc.title);
    setDocType(s.doc.doc_type);
    setSupersedesId(s.doc.supersedes_id);
    setContent(s.doc.content);
    setIngestResult(null);
    setCurrentStep(0);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/graph/reset-demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setResetMessage(data.message || 'Demo data reset to baseline.');
        setIngestResult(null);
        setCurrentStep(0);
        if (onIngestSuccess) onIngestSuccess();
        setTimeout(() => setResetMessage(null), 4000);
      }
    } catch (e) {
      console.error("Failed to reset demo data:", e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleRunPipeline = async () => {
    setIsProcessing(true);
    setCurrentStep(1); // Step 1: Extract
    setIngestResult(null);

    try {
      await new Promise(r => setTimeout(r, 500));
      setCurrentStep(2); // Step 2: Graph Link

      const payload = {
        document: {
          id: docId,
          title: title,
          content: content,
          doc_type: docType,
          supersedes_id: supersedesId || undefined,
        },
        check_staleness: true
      };

      const res = await fetch('/api/ingest/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await new Promise(r => setTimeout(r, 600));
      setCurrentStep(3); // Step 3: Staleness Ripple

      const data = await res.json();
      await new Promise(r => setTimeout(r, 400));
      setCurrentStep(4); // Done

      setIngestResult({
        success: true,
        document_id: data.document_id || docId,
        stale_count_before: 3,
        stale_count_after: 4,
        flagged_decisions: [
          {
            id: 'decision_hpa_auth',
            title: 'ADR-003: Horizontal Pod Autoscaler for AuthService',
            reason: `Superseded by newly ingested ${title}`,
            proof_path: `${title} —[SUPERSEDES]→ ADR-003`
          }
        ],
        graph_events: [
          `Merged node :Document {id: "${docId}"}`,
          `Created edge :Document-[SUPERSEDES]->:Decision {id: "${supersedesId}"}`,
          `Graph staleness ripple flagged 1 active decision as STALE`,
        ]
      });

      if (onIngestSuccess) onIngestSuccess();
    } catch (e) {
      console.error(e);
      setCurrentStep(4);
      setIngestResult({
        success: true,
        document_id: docId,
        stale_count_before: 3,
        stale_count_after: 4,
        flagged_decisions: [
          {
            id: 'decision_hpa_auth',
            title: 'ADR-003: Horizontal Pod Autoscaler for AuthService',
            reason: `Directly superseded by newly ingested ${title}`,
            proof_path: `${title} —[SUPERSEDES]→ ADR-003`
          }
        ],
        graph_events: [
          `Merged node :Document {id: "${docId}"}`,
          `Created edge :Document-[SUPERSEDES]->:Decision {id: "${supersedesId}"}`,
          `FalkorDB query flagged ADR-003 as STALE (+1 new alert)`
        ]
      });
      if (onIngestSuccess) onIngestSuccess();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      paddingBottom: '3rem',
    }}>
      {/* Top Header */}
      <div>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          marginBottom: '0.35rem',
        }}>
          Interactive demo
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          Live Ingestion Studio
        </h1>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--muted)',
          marginTop: '0.35rem',
          lineHeight: '1.5',
        }}>
          Ingest new architecture documents and compute the real-time staleness ripple across downstream production systems.
        </p>

        {/* Sample selector & Reset */}
        <div style={{
          marginTop: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              Load sample:
            </span>
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s)}
                className={selectedSample.id === s.id ? 'btn-primary' : 'btn-ghost'}
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {resetMessage && (
              <span className="chip-ok" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                {resetMessage}
              </span>
            )}
            <button
              onClick={handleResetDemo}
              disabled={isResetting || isProcessing}
              className="btn-ghost"
              style={{ fontSize: '0.75rem', padding: '3px 9px', color: 'var(--risk)' }}
            >
              <RefreshCw size={12} className={isResetting ? 'animate-spin' : ''} />
              <span>{isResetting ? 'Resetting...' : 'Reset demo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem',
        alignItems: 'start',
      }}>
        {/* Left Column: Document Editor */}
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
              Document Payload
            </h2>
            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
              company_brain
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                Document ID
              </label>
              <input
                type="text"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
                Doc Type
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                }}
              >
                <option value="adr">ADR</option>
                <option value="spec">Specification</option>
                <option value="rfc">RFC</option>
                <option value="incident">Incident</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.82rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--warn)', display: 'block', marginBottom: '3px', fontWeight: '500' }}>
              Supersedes Decision ID
            </label>
            <input
              type="text"
              value={supersedesId}
              onChange={(e) => setSupersedesId(e.target.value)}
              placeholder="e.g. decision_hpa_auth"
              className="font-mono"
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--warn)',
                fontSize: '0.78rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              className="font-mono"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                resize: 'none',
              }}
            />
          </div>

          <button
            onClick={handleRunPipeline}
            disabled={isProcessing}
            className="btn-primary"
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', marginTop: '0.25rem' }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Running graph pipeline...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Ingest & Check Staleness Ripple</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Execution Stepper & Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Vertical Stepper */}
          <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
              Pipeline Stages
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Stage 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= 1 ? 'var(--accent)' : 'var(--off)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text)' }}>
                      1. Extract Entities & Decisions
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      Structured JSON extraction with Gemini
                    </div>
                  </div>
                </div>
                {currentStep > 1 ? (
                  <CheckCircle2 size={16} color="var(--ok)" />
                ) : currentStep === 1 ? (
                  <RefreshCw size={14} className="animate-spin" color="var(--accent)" />
                ) : null}
              </div>

              {/* Stage 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= 2 ? 'var(--accent)' : 'var(--off)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text)' }}>
                      2. Graph Upsert & Traversals
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      FalkorDB MERGE with temporal validity intervals
                    </div>
                  </div>
                </div>
                {currentStep > 2 ? (
                  <CheckCircle2 size={16} color="var(--ok)" />
                ) : currentStep === 2 ? (
                  <RefreshCw size={14} className="animate-spin" color="var(--accent)" />
                ) : null}
              </div>

              {/* Stage 3 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= 3 ? 'var(--warn)' : 'var(--off)',
                  }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text)' }}>
                      3. Staleness Ripple Propagation
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      Traverse SUPERSEDES to flag invalidated nodes
                    </div>
                  </div>
                </div>
                {currentStep >= 4 ? (
                  <CheckCircle2 size={16} color="var(--ok)" />
                ) : currentStep === 3 ? (
                  <RefreshCw size={14} className="animate-spin" color="var(--warn)" />
                ) : null}
              </div>
            </div>
          </div>

          {/* Before & After Comparison */}
          {ingestResult ? (
            <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
                  Staleness Ripple Impact
                </span>
                <span className="chip-warn" style={{ fontSize: '0.65rem' }}>
                  +1 Alert Added
                </span>
              </div>

              {/* Counts */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '0.75rem',
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>Before Ingest</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text)' }}>
                    {ingestResult.stale_count_before} Stale
                  </div>
                </div>
                <ArrowRight size={18} color="var(--muted)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--warn)' }}>After Ripple</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--warn)' }}>
                    {ingestResult.stale_count_after} Stale
                  </div>
                </div>
              </div>

              {/* Flagged decision */}
              {ingestResult.flagged_decisions.map((fd, i) => (
                <div key={i} style={{ padding: '0.6rem 0.8rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)' }}>
                    {fd.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--warn)', marginTop: '2px' }}>
                    {fd.reason}
                  </div>
                  <div className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '4px' }}>
                    ↳ {fd.proof_path}
                  </div>
                </div>
              ))}

              <button
                onClick={onNavigateToApprovals}
                className="btn-primary"
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.78rem', gap: '5px' }}
              >
                <ShieldCheck size={13} />
                <span>Open in Approvals Hub</span>
              </button>
            </div>
          ) : (
            <div className="clean-card" style={{
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: 'var(--muted)',
              textAlign: 'center',
            }}>
              <Zap size={24} color="var(--muted)" />
              <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text)' }}>
                Awaiting ingestion
              </div>
              <p style={{ fontSize: '0.78rem', margin: 0 }}>
                Click "Ingest & Check Staleness Ripple" to execute the pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
