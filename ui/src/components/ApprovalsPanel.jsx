'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Check
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
      status: 'pending',
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
      title: 'Governance Handoff: PEP 572 Steering Council Escalation',
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
      title: 'Dependency Audit: PEP 484 Type Hints referencing retired PEP 3107',
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

    setSuccessToast(`Proposal ${id} approved & graph updated.`);
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
    <div style={{
      maxWidth: '920px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      paddingBottom: '3rem',
    }}>
      {/* Toast Notification */}
      {successToast && (
        <div className="chip-ok" style={{
          padding: '0.65rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.82rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <CheckCircle2 size={16} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          marginBottom: '0.35rem',
        }}>
          Human-in-the-loop governance
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}>
              Approvals & Remediation Hub
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--muted)',
              marginTop: '0.35rem',
              lineHeight: '1.5',
            }}>
              Review and authorize graph changes and notifications before they are applied.
            </p>
          </div>

          {/* Tab Filter */}
          <div style={{
            display: 'flex',
            padding: '3px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setActiveTab('pending')}
              className={activeTab === 'pending' ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              Pending ({pendingList.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={activeTab === 'audit' ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
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
            <div className="clean-card" style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--muted)',
            }}>
              <CheckCircle2 size={32} color="var(--ok)" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
                All Remediation Proposals Approved
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', margin: 0 }}>
                No outstanding architectural conflicts or bus-factor remediations require approval.
              </p>
            </div>
          ) : (
            pendingList.map((p) => (
              <div
                key={p.id}
                className="clean-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
                        {p.title}
                      </span>
                      <span className="chip-warn" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                        Pending
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Proposed by: <strong style={{ color: 'var(--text)' }}>{p.proposedBy}</strong> • {p.createdAt}
                    </div>
                  </div>

                  <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {p.idempotencyKey}
                  </span>
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--text)',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  lineHeight: '1.5',
                }}>
                  <strong style={{ color: 'var(--text)' }}>Operational Objective:</strong> {p.impact}
                </div>

                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                    Scheduled Remediation Actions
                  </div>
                  <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {p.actions.map((act, i) => (
                      <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <ArrowRight size={11} color="var(--accent)" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Approve / Reject Action Bar */}
                <div style={{
                  marginTop: '0.4rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                }}>
                  <button
                    onClick={() => handleReject(p.id)}
                    className="btn-ghost"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', gap: '4px' }}
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="btn-primary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 1rem', gap: '4px' }}
                  >
                    <Check size={13} />
                    <span>Approve Proposal</span>
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          auditList.length === 0 ? (
            <div className="clean-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              No audit trail records yet.
            </div>
          ) : (
            auditList.map((p) => (
              <div
                key={p.id}
                className="clean-card"
                style={{
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  opacity: p.status === 'rejected' ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)' }}>
                      {p.title}
                    </span>
                    <span className={p.status === 'approved' ? 'chip-ok' : 'chip-risk'} style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                      {p.status}
                    </span>
                  </div>
                  <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                    {p.approvedAt || p.createdAt}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>
                  {p.impact}
                </p>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
