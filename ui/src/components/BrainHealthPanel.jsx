'use client';

import React, { useState } from 'react';
import { 
  HeartPulse, 
  AlertTriangle, 
  UserX, 
  FileWarning, 
  Users, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  Flame,
  FileText
} from 'lucide-react';

export default function BrainHealthPanel({ 
  onNavigateToTab, 
  onAskQuestion,
  onOpenHandoff,
  onProposeRemediation,
  staleDecisions = []
}) {
  const [selectedProof, setSelectedProof] = useState(null);

  // Health metric counters
  const metrics = [
    {
      id: 'stale',
      label: 'Stale Decisions',
      count: 3,
      unit: 'active decisions superseded',
      status: 'warning',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
      icon: AlertTriangle,
      description: 'Production decisions contradicted by newer RFCs or specs',
      proof: {
        title: 'ADR-004: Mobile Rate Limit 50 rps Stale',
        path: 'Doc: API Gateway Spec v2.1 —[SUPERSEDES]→ ADR-004 (Active)',
        impact: 'Gateway code enforcing 50 req/s while mobile clients need 200 req/s',
        actionQuestion: 'What is the current mobile API rate limit?'
      }
    },
    {
      id: 'bus_factor',
      label: 'Sole-Expert Systems',
      count: 2,
      unit: 'systems with bus factor = 1',
      status: 'critical',
      color: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.1)',
      border: 'rgba(244, 63, 94, 0.25)',
      icon: Users,
      description: 'Critical services maintained by exactly one engineer',
      proof: {
        title: 'AuthService & PaymentGateway Single Points of Failure',
        path: 'Priya Sharma —[MAINTAINS]→ AuthService (no secondary maintainer)',
        impact: 'If Priya departs, token revocation & OAuth incident response halts',
        actionQuestion: 'What happens if Priya leaves the company?'
      }
    },
    {
      id: 'conflicts',
      label: 'Contradicting Documents',
      count: 2,
      unit: 'conflicting specifications',
      status: 'warning',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)',
      border: 'rgba(168, 85, 247, 0.25)',
      icon: FileWarning,
      description: 'Active design docs with contradictory architectural requirements',
      proof: {
        title: 'Token Revocation vs Distributed Session Specs',
        path: 'RFC-104 (Instant Revocation) ↮ SPEC-089 (Stateless 24h JWT Cache)',
        impact: 'Security team expects instant revocation, mobile app caches for 24h',
        actionQuestion: 'Why did we decide to use opaque tokens instead of JWT?'
      }
    },
    {
      id: 'departed',
      label: 'Departed Staff Decisions',
      count: 4,
      unit: 'decisions with departed owners',
      status: 'neutral',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.25)',
      icon: UserX,
      description: 'Architecture decisions authored by engineers who left the firm',
      proof: {
        title: 'Billing Ledger Architecture (Marcus Vance)',
        path: 'Marcus Vance (Inactive) —[AUTHORED]→ ADR-001 PostgreSQL Ledger',
        impact: 'No active staff member has full context on shard allocation logic',
        actionQuestion: 'Who owns the billing ledger system architecture?'
      }
    },
  ];

  // Needs Attention items
  const attentionItems = [
    {
      id: 'item-1',
      title: 'Mobile Rate Limit Decision Stale',
      badge: 'Stale Since Doc Spec v2.1',
      badgeColor: '#f59e0b',
      summary: 'ADR-004 specifies 50 req/s, but API Gateway Spec v2.1 raised threshold to 200 req/s without updating the architectural record.',
      proofPath: 'Doc: API Gateway Spec v2.1 —[SUPERSEDES]→ ADR-004',
      impact: 'Gateway rejects valid mobile client traffic during peak hours.',
      actionLabel: 'See Why',
      actionType: 'query',
      query: 'What is the current mobile API rate limit?'
    },
    {
      id: 'item-2',
      title: 'AuthService Maintained Only by Priya Sharma',
      badge: 'Bus Factor: 1 (Critical)',
      badgeColor: '#f43f5e',
      summary: 'Central identity service handling token revocation and OAuth exchanges has zero secondary engineers with active WORKED_ON edges.',
      proofPath: 'Priya Sharma —[WORKED_ON (32 commits)]→ AuthService',
      impact: 'High outage vulnerability if Priya transitions to another team or departs.',
      actionLabel: 'Handoff Plan',
      actionType: 'handoff',
      engineer: 'Priya Sharma',
      system: 'AuthService'
    },
    {
      id: 'item-3',
      title: 'JWT Token Security Vulnerability vs Opaque Tokens',
      badge: 'Historical Reversal',
      badgeColor: '#a855f7',
      summary: 'Original ADR-001 (JWT) had token revocation flaw discovered during incident SEC-202. ADR-002 reversed to opaque tokens.',
      proofPath: 'Incident SEC-202 —[TRIGGERED]→ ADR-002 —[SUPERSEDES]→ ADR-001',
      impact: 'Audit compliance requires verified revocation proof trail.',
      actionLabel: 'Trace Origin',
      actionType: 'query',
      query: 'Why did we decide to use opaque tokens instead of JWT?'
    },
    {
      id: 'item-4',
      title: 'HPA Autoscaling Buried 3-Hop Origin in AuthService',
      badge: 'Origin Hidden in Slack Incident',
      badgeColor: '#38bdf8',
      summary: 'HPA autoscaling rule was added during Black Friday outage discussion in #eng-incidents, not formal ADR.',
      proofPath: 'Slack #eng-incidents —[PROPOSED_IN]→ INC-402 —[RESULTED_IN]→ HPA Autoscaling',
      impact: 'New engineers unaware why minimum replica threshold is set to 8.',
      actionLabel: 'Trace 3-Hop Origin',
      actionType: 'query',
      query: 'What is the true origin of the HPA autoscaling decision in AuthService?'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Context & Guided Start */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(7, 9, 14, 0.95))',
        border: '1px solid rgba(6, 182, 212, 0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}>
                COMPANY BRAIN STATUS
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Audited continuously via FalkorDB graph algorithms
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Brain Health & Governance Radar
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem', maxWidth: '750px', lineHeight: '1.5' }}>
              Provenance maps every architecture decision to its author, code commit, and supporting documentation. 
              Below are graph-detected risks that require engineering leadership attention today.
            </p>
          </div>

          {/* Quick Action Button to Live Ingest */}
          <button
            onClick={() => onNavigateToTab('ingest')}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={16} />
            <span>Simulate Live Ingest Demo</span>
          </button>
        </div>

        {/* Guided Scenarios Chips */}
        <div style={{
          marginTop: '1.1rem',
          paddingTop: '0.9rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Flame size={13} color="#f43f5e" /> Try a scenario (synthetic company):
          </span>
          <button
            onClick={() => onNavigateToTab('ingest')}
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            ⚡ A doc just changed (Live Ingest)
          </button>
          <button
            onClick={() => onAskQuestion('What happens if Priya leaves the company?')}
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            👤 Someone leaves (Bus Factor & Handoff)
          </button>
          <button
            onClick={() => onAskQuestion('Why did we decide to use opaque tokens instead of JWT?')}
            style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#e2e8f0',
              cursor: 'pointer',
            }}
          >
            🔍 Why did we decide this? (3-Hop Origin)
          </button>
        </div>
      </div>

      {/* 4 Health Counter Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
      }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedProof?.id === m.id;
          return (
            <div
              key={m.id}
              className="glass-panel"
              onClick={() => setSelectedProof(isSelected ? null : m)}
              style={{
                padding: '1.1rem 1.25rem',
                cursor: 'pointer',
                background: isSelected ? m.bg : 'var(--bg-card)',
                border: isSelected ? `1px solid ${m.color}` : `1px solid ${m.border}`,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: m.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {m.label}
                </span>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: m.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={17} color={m.color} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.75rem' }}>
                <span style={{ fontSize: '2.1rem', fontWeight: '800', color: '#ffffff', lineHeight: 1 }}>
                  {m.count}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {m.unit}
                </span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.6rem', lineHeight: '1.4' }}>
                {m.description}
              </p>

              <div style={{
                marginTop: '0.8rem',
                paddingTop: '0.6rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: isSelected ? m.color : 'var(--text-muted)',
                fontWeight: '600',
              }}>
                <span>{isSelected ? 'Viewing proof path' : 'Click to see proof path'}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Proof Path Drawer (If Clicked) */}
      {selectedProof && (
        <div className="glass-panel" style={{
          padding: '1rem 1.25rem',
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${selectedProof.color}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color={selectedProof.color} />
              <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                {selectedProof.proof.title}
              </strong>
            </div>
            <button
              onClick={() => onAskQuestion(selectedProof.proof.actionQuestion)}
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Query Graph in Ask Tab</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{
            fontSize: '0.76rem',
            padding: '0.5rem 0.75rem',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-sm)',
            color: '#38bdf8',
            fontFamily: 'monospace',
          }}>
            <strong>Proof Path:</strong> {selectedProof.proof.path}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            <strong>Operational Risk:</strong> {selectedProof.proof.impact}
          </div>
        </div>
      )}

      {/* Needs Attention Section */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#ffffff' }}>
              Active Governance Queue
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Actionable findings requiring review or handoff approvals
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: '600',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#fb7185',
            border: '1px solid rgba(244, 63, 94, 0.3)',
          }}>
            4 Items Require Action
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {attentionItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '0.9rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>
                    {item.title}
                  </span>
                  <span style={{
                    fontSize: '0.64rem',
                    fontWeight: '700',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: `${item.badgeColor}20`,
                    color: item.badgeColor,
                    border: `1px solid ${item.badgeColor}40`,
                  }}>
                    {item.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4' }}>
                  {item.summary}
                </p>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#38bdf8',
                  marginTop: '0.4rem',
                  fontFamily: 'monospace',
                }}>
                  ↳ {item.proofPath}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.actionType === 'handoff' ? (
                  <button
                    onClick={() => onOpenHandoff(item.engineer, item.system)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(244, 63, 94, 0.2)',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      color: '#fb7185',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Generate Handoff Plan</span>
                    <ArrowRight size={13} />
                  </button>
                ) : (
                  <button
                    onClick={() => onAskQuestion(item.query)}
                    style={{
                      padding: '0.5rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      color: '#22d3ee',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
