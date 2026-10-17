'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  Send, 
  ArrowRight, 
  FileText,
  History,
  Lock,
  Sparkles
} from 'lucide-react';

export default function ApprovalsPanel({ onActionCompleted, workspace = 'novatech' }) {
  const novatechProposals = [
    {
      id: 'prop-101',
      type: 'stale_remediation',
      title: 'Propose Notification: ADR-004 Rate Limit Stale',
      target: 'ADR-004: Mobile Rate Limit 50 rps',
      proposedBy: 'Provenance Staleness Radar (Autonomous)',
      createdAt: '2026-10-16 14:20 UTC',
      status: 'pending', // 'pending' | 'approved' | 'rejected'
      impact: 'Enforces alignment between production Envoy rate limits (200 rps) and architecture record.',
      actions: [
        'Post notification to Slack #eng-architecture',
        'Create JIRA ticket INFRA-512 to bump Envoy ratelimit config',
        'Mark ADR-004 valid_to = 2026-10-16 in FalkorDB'
      ],
      idempotencyKey: 'idem_adr_004_stale_alert',
    },
    {
      id: 'prop-102',
      type: 'bus_factor_handoff',
      title: 'Handoff Approval: Assign Marcus Vance as AuthService Secondary',
      target: 'AuthService (Bus Factor = 1)',
      proposedBy: 'Priya Sharma & Eng Lead',
      createdAt: '2026-10-16 15:45 UTC',
      status: 'pending',
      impact: 'Eliminates single point of failure by adding WORKED_ON edge in FalkorDB for Marcus Vance.',
      actions: [
        'Grant production IAM access to AuthService repo for Marcus Vance',
        'Schedule 2 knowledge transfer pairing sessions on Opaque Token revocation',
        'Upsert edge :Person(marcus)-[WORKED_ON]->:System(sys_auth) in graph'
      ],
      idempotencyKey: 'idem_auth_bus_factor_handoff',
    },
    {
      id: 'prop-103',
      type: 'contradiction_review',
      title: 'Contradiction Audit: Token Revocation vs Distributed Session Specs',
      target: 'RFC-104 (Instant Revocation) vs SPEC-089 (24h Stateless Cache)',
      proposedBy: 'Provenance Architecture Auditor (Autonomous)',
      createdAt: '2026-10-16 16:10 UTC',
      status: 'pending',
      impact: 'Resolves policy conflict between Security team zero-trust requirements and mobile app session lifetime.',
      actions: [
        'Schedule joint architecture review between Security & Mobile Leads',
        'Insert CONTRADICTS edge between RFC-104 and SPEC-089 in graph',
        'Draft remediation RFC-105 for hybrid token introspection'
      ],
      idempotencyKey: 'idem_token_revocation_spec_contradiction',
    },
    {
      id: 'prop-100',
      type: 'policy_update',
      title: 'Security Policy: Deprecate RSA-2048 Signing Certificates',
      target: 'POL-005: Internal Token Standards',
      proposedBy: 'Security Lead (Sarah Chen)',
      createdAt: '2026-10-15 09:12 UTC',
      status: 'approved',
      impact: 'Successfully transitioned 8 microservices to Ed25519 signing keys.',
      actions: [
        'Merged SEC-301 document into company brain',
        'Closed valid_to on POL-005',
        'Audit log written to FalkorDB :AuditLog node'
      ],
      idempotencyKey: 'idem_sec_rsa_deprecate',
      approvedAt: '2026-10-15 11:30 UTC',
      approvedBy: 'Alex Rivera (VP Eng)',
    }
  ];

  const pepsProposals = [
    {
      id: 'pep-prop-201',
      type: 'stale_remediation',
      title: 'Supersession Alignment: PEP 3105 superseded by PEP 3112',
      target: 'PEP 3105: Make print a function (Superseded)',
      proposedBy: 'Python Language Summit / Steering Council',
      createdAt: '2006-11-05 10:00 UTC',
      status: 'pending',
      impact: 'Updates Py3k standard library semantics and marks PEP 3105 status as historical.',
      actions: [
        'Mark PEP 3105 status = SUPERSEDED in FalkorDB',
        'Add link [SUPERSEDES] from PEP 3112 to PEP 3105',
        'Verify standard library tests against Python 3.0 specification'
      ],
      idempotencyKey: 'idem_pep_3105_supersession',
    },
    {
      id: 'pep-prop-202',
      type: 'bus_factor_handoff',
      title: 'Governance Handoff: PEP 572 Assignment Expressions Steering Council Escalation',
      target: 'PEP 572 (BDFL Retirement & Steering Council Formation)',
      proposedBy: 'Guido van Rossum (BDFL Emeritus)',
      createdAt: '2018-07-12 18:00 UTC',
      status: 'pending',
      impact: 'Transfers final decision authority on syntax proposals to 5-member elected Steering Council.',
      actions: [
        'Enact PEP 13 (Python Language Governance Model)',
        'Create GOVERNS edges in FalkorDB from Steering Council members to core Python systems',
        'Publish ratified PEP 572 specification'
      ],
      idempotencyKey: 'idem_pep_572_governance',
    },
    {
      id: 'pep-prop-203',
      type: 'contradiction_review',
      title: 'Dependency Audit: PEP 484 Type Hints referencing retired PEP 3107 Function Annotations',
      target: 'PEP 484 (Type Hints) vs PEP 3107 (Function Annotations)',
      proposedBy: 'Python Typing SIG (Autonomous Auditor)',
      createdAt: '2015-05-20 12:00 UTC',
      status: 'pending',
      impact: 'Ensures type hint grammar preserves runtime annotation semantics while extending static analysis.',
      actions: [
        'Validate syntax backward-compatibility across Python 3.5 runtime',
        'Link PEP 484 -[EXTENDS]-> PEP 3107 in knowledge graph',
        'Ratify typing module in Python standard library'
      ],
      idempotencyKey: 'idem_pep_typing_grammar_audit',
    }
  ];

  const [proposals, setProposals] = useState(workspace === 'peps' ? pepsProposals : novatechProposals);

  React.useEffect(() => {
    setProposals(workspace === 'peps' ? pepsProposals : novatechProposals);
  }, [workspace]);

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'audit'
  const [successToast, setSuccessToast] = useState(null);

  const handleApprove = (id) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'approved',
          approvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          approvedBy: 'Current Lead (Autonomous Pair)'
        };
      }
      return p;
    }));

    setSuccessToast(`Proposal ${id} approved & idempotent graph mutation applied.`);
    setTimeout(() => setSuccessToast(null), 4000);
    if (onActionCompleted) onActionCompleted();
  };

  const handleReject = (id) => {
    setProposals(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: 'rejected' };
      }
      return p;
    }));
    if (onActionCompleted) onActionCompleted();
  };

  const pendingList = proposals.filter(p => p.status === 'pending');
  const auditList = proposals.filter(p => p.status !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          color: '#34d399',
          fontSize: '0.82rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Description */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(7, 9, 14, 0.95))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                border: '1px solid rgba(99, 102, 241, 0.35)',
              }}>
                HUMAN-IN-THE-LOOP GOVERNANCE
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Idempotent remediation approvals
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>
              Approvals & Remediation Hub
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem', maxWidth: '750px', lineHeight: '1.5' }}>
              Provenance detects architectural drift and sole-maintainer risks, then generates structured proposals. 
              Engineering leads approve changes before graph edges or team notifications are dispatched.
            </p>
          </div>

          {/* Tab Filter */}
          <div style={{
            display: 'flex',
            padding: '3px',
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '4px',
                background: activeTab === 'pending' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: activeTab === 'pending' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '4px 12px',
                borderRadius: '4px',
                background: activeTab === 'audit' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: activeTab === 'audit' ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Audit Trail ({auditList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activeTab === 'pending' ? (
          pendingList.length === 0 ? (
            <div className="glass-panel" style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                All Remediation Proposals Approved
              </div>
              <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>
                No outstanding architectural conflicts or bus-factor remediations require approval.
              </p>
            </div>
          ) : (
            pendingList.map((p) => (
              <div
                key={p.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>
                        {p.title}
                      </span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}>
                        PENDING APPROVAL
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Proposed by: <strong style={{ color: '#cbd5e1' }}>{p.proposedBy}</strong> • {p.createdAt}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    Idempotency: <code>{p.idempotencyKey}</code>
                  </span>
                </div>

                <div style={{
                  fontSize: '0.78rem',
                  color: '#e2e8f0',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight: '1.4',
                }}>
                  <strong>Operational Objective:</strong> {p.impact}
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                    Scheduled Remediation Actions
                  </div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {p.actions.map((act, i) => (
                      <li key={i} style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <ArrowRight size={12} color="#818cf8" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Approve / Reject Action Bar */}
                <div style={{
                  marginTop: '0.5rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.6rem',
                }}>
                  <button
                    onClick={() => handleReject(p.id)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(p.id)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      boxShadow: '0 0 12px rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve & Apply to Graph</span>
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          auditList.map((p) => (
            <div
              key={p.id}
              className="glass-panel"
              style={{
                padding: '1.1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>
                    {p.title}
                  </span>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: p.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                    color: p.status === 'approved' ? '#34d399' : '#fb7185',
                  }}>
                    {p.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Approved by: {p.approvedBy || 'Engineering Lead'} • {p.approvedAt || p.createdAt}
                </div>
              </div>

              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                Key: {p.idempotencyKey}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
