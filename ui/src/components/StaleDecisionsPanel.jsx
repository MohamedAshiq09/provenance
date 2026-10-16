'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  GitBranch, 
  CheckCircle, 
  ArrowRight, 
  RefreshCw,
  PlusCircle,
  FileText
} from 'lucide-react';

export default function StaleDecisionsPanel({ 
  staleDecisions = [], 
  onRefresh, 
  onSimulateNewDoc,
  isLoading 
}) {
  const [selectedStale, setSelectedStale] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(244, 63, 94, 0.4)',
          }}>
            <ShieldAlert size={22} color="#f43f5e" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              Staleness & Contradiction Detection Engine
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              FalkorDB automatically traverses backward dependencies whenever documents or decisions change.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            id="refresh-stale-btn"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              color: '#ffffff',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Scan Graph</span>
          </button>

          <button
            id="simulate-reversal-btn"
            onClick={onSimulateNewDoc}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)',
            }}
          >
            <PlusCircle size={14} />
            <span>Simulate Reversal Ingest</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Stale Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
        {staleDecisions && staleDecisions.length > 0 ? (
          staleDecisions.map((item, idx) => (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem',
                borderLeft: '4px solid #f43f5e',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(244, 63, 94, 0.2)',
                    color: '#f43f5e',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                  }}>
                    STALE DECISION FLAGGED
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff', marginTop: '0.3rem' }}>
                    {item.title || item.id}
                  </h3>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                }}>
                  Impact Radius: <strong style={{ color: '#f43f5e', fontSize: '0.85rem' }}>{item.impact_radius || 1}</strong>
                </div>
              </div>

              {/* Reason Path Box */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: '#cbd5e1',
                lineHeight: '1.4',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '0.68rem', color: '#f43f5e', fontWeight: '700', marginBottom: '0.2rem' }}>
                  GRAPH AUDIT TRAIL
                </div>
                <p>{item.stale_reason || 'Source documentation updated; downstream assumption invalidated.'}</p>
              </div>

              {/* Affected Systems */}
              {item.affected_systems && item.affected_systems.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Systems at Risk:</span>
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                    {item.affected_systems.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        }}
                      >
                        {s.name || s.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Workflow Button (Track 3: Get Work Done) */}
              <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  id={`remediate-btn-${idx}`}
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/agent/remediate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ decision_id: item.id })
                      });
                      const data = await res.json();
                      alert(data.message || `Remediation action ticket created in graph and assigned!`);
                      if (onRefresh) onRefresh();
                    } catch (e) {
                      alert(`Action failed: ${e.message}`);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    color: '#818cf8',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.color = '#818cf8';
                  }}
                >
                  <FileText size={13} />
                  <span>Act: Generate Remediation Ticket & Assign Owner</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{
            gridColumn: '1 / -1',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '0.5rem' }}>All Decisions are Currently Synchronized</h3>
            <p style={{ fontSize: '0.82rem', maxWidth: '400px', margin: '0 auto' }}>
              Click "Simulate Reversal Ingest" above to drop in a document that reverses an architectural decision and watch FalkorDB flag downstream dependents in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
