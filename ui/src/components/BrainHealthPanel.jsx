'use client';

import React, { useState } from 'react';
import { 
  HeartPulse, 
  AlertTriangle, 
  UserX, 
  FileWarning, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function BrainHealthPanel({ 
  onNavigateToTab, 
  onAskQuestion,
  onOpenHandoff,
  onProposeRemediation,
  staleDecisions = [],
  workspace = 'novatech'
}) {
  const [selectedProof, setSelectedProof] = useState(null);

  // Health metric counters for NovaTech (Synthetic)
  const novatechMetrics = [
    {
      id: 'stale',
      label: 'Stale Decisions',
      count: staleDecisions.length || 3,
      unit: (staleDecisions.length || 3) === 1 ? 'decision stale' : 'decisions stale',
      status: 'warn', // 'ok' | 'warn' | 'risk' | 'off'
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
      status: 'risk',
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
      status: 'warn',
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
      status: 'off',
      description: 'Architecture decisions authored by engineers who left the firm',
      proof: {
        title: 'Billing Ledger Architecture (Marcus Vance)',
        path: 'Marcus Vance (Inactive) —[AUTHORED]→ ADR-001 PostgreSQL Ledger',
        impact: 'No active staff member has full context on shard allocation logic',
        actionQuestion: 'Who owns the billing ledger system architecture?'
      }
    },
  ];

  // Real Architectural Alerts for Python PEPs (Public Data)
  const pepsMetrics = [
    {
      id: 'pep_alerts',
      label: 'Active Proposals on Retired PEPs',
      count: 27,
      unit: 'architectural alerts',
      status: 'warn',
      description: 'Accepted proposals depending on or superseding retired proposals',
      proof: {
        title: 'PEP 387: Backwards Compatibility Policy',
        path: 'PEP 387 (Active) —[SUPERSEDES]→ PEP 5 (Superseded)',
        impact: 'Tooling still citing legacy PEP 5 guidelines must be updated to PEP 387',
        actionQuestion: 'What is the backwards compatibility policy for Python?'
      }
    },
    {
      id: 'pep_total',
      label: 'Architectural Proposals',
      count: 745,
      unit: 'proposals evaluated',
      status: 'ok',
      description: 'Complete Python Enhancement Proposal archive from peps.python.org',
      proof: {
        title: 'Python Enhancement Proposal Corpus',
        path: 'PEP 1 (Active) —[GOVERNS]→ 745 Architectural Standards',
        impact: 'Covers core language syntax, library APIs, and packaging infrastructure',
        actionQuestion: 'What is the backwards compatibility policy for Python?'
      }
    },
    {
      id: 'pep_chains',
      label: 'Supersession Chains',
      count: 73,
      unit: 'standard lineages',
      status: 'ok',
      description: 'Multi-generational standards lineages across 25 years of Python evolution',
      proof: {
        title: 'Database API Standards Lineage',
        path: 'PEP 248 (DB-API 1.0) ←[SUPERSEDES]— PEP 249 (DB-API 2.0)',
        impact: 'PEP 249 remains the authoritative database connector contract',
        actionQuestion: 'Which PEP replaced PEP 248?'
      }
    },
    {
      id: 'pep_authors',
      label: 'Core Authors & Champions',
      count: 356,
      unit: 'unique authors in graph',
      status: 'off',
      description: 'Python core authors connected via AUTHORED and AFFECTS edges',
      proof: {
        title: 'Guido van Rossum (BDFL / Core Author)',
        path: 'Guido van Rossum —[AUTHORED]→ PEP 484 Type Hints',
        impact: 'Highest centrality across core language typing proposals',
        actionQuestion: 'Who authored PEP 484 Type Hints?'
      }
    },
  ];

  // Real Repository Governance & Risk for FalkorDB Repos
  const falkordbMetrics = [
    {
      id: 'repo_stale',
      label: 'Superseded PRs & Bumps',
      count: 31,
      unit: 'superseded pull requests',
      status: 'warn',
      description: 'Dependency bumps and commits superseded by newer releases',
      proof: {
        title: 'PR #225: Bump ruff from 0.15.12 to 0.15.13',
        path: 'PR #228 —[SUPERSEDES]→ PR #225 (Superseded)',
        impact: 'Outdated linter and dependency pins superseded in subsequent pull request',
        actionQuestion: 'What decisions are stale or superseded in the repository?'
      }
    },
    {
      id: 'repo_prs',
      label: 'Merged Pull Requests',
      count: 226,
      unit: 'merged changes across 3 repos',
      status: 'ok',
      description: 'Pull requests spanning FalkorDB, falkordb-py, and falkordb-browser',
      proof: {
        title: 'FalkorDB Multi-Repository Corpus',
        path: 'FalkorDB Core (84 PRs) + Python Client (72 PRs) + Browser UI (70 PRs)',
        impact: 'Structural traceability across engine, client driver, and canvas UI',
        actionQuestion: 'What changed in area engine between 2026-01-01 and 2026-10-31?'
      }
    },
    {
      id: 'repo_components',
      label: 'Monitored Components',
      count: 13,
      unit: 'top-level subsystem domains',
      status: 'ok',
      description: 'Subsystems tracked with WORKED_ON and TOUCHES graph centrality',
      proof: {
        title: 'FalkorDB Core Engine (src/) Subsystem',
        path: 'AviAvni / DvirDukhan / swilly22 —[WORKED_ON]→ FalkorDB Core Engine',
        impact: 'Graph centrality identifies true subject-matter experts across core repos',
        actionQuestion: 'Who owns the FalkorDB Core Engine?'
      }
    },
    {
      id: 'repo_issues',
      label: 'Linked Closed Issues',
      count: 91,
      unit: 'closed issues resolved by PRs',
      status: 'off',
      description: 'GitHub issues closed and linked via CLOSES graph edges',
      proof: {
        title: 'Issue Traceability Lineage',
        path: 'PR #3346 —[CLOSES]→ Issue #3338',
        impact: 'Every PR resolves specific issue tickets with full provenance',
        actionQuestion: 'Who is the expert on the Python Client SDK?'
      }
    },
  ];

  const metrics = workspace === 'peps' ? pepsMetrics : (workspace === 'falkordb' ? falkordbMetrics : novatechMetrics);

  // Needs Attention items for NovaTech
  const novatechAttention = [
    {
      id: 'item-1',
      title: 'Mobile Rate Limit Decision Stale',
      badge: 'Stale Decision',
      status: 'warn',
      summary: 'ADR-004 specifies 50 req/s, but API Gateway Spec v2.1 raised threshold to 200 req/s without updating the architectural record.',
      proofPath: 'Doc: API Gateway Spec v2.1 —[SUPERSEDES]→ ADR-004',
      actionLabel: 'Inspect query',
      actionType: 'query',
      query: 'What is the current mobile API rate limit?'
    },
    {
      id: 'item-2',
      title: 'AuthService Maintained Only by Priya Sharma',
      badge: 'Bus Factor = 1',
      status: 'risk',
      summary: 'Central identity service handling token revocation and OAuth exchanges has zero secondary engineers with active WORKED_ON edges.',
      proofPath: 'Priya Sharma —[WORKED_ON (32 commits)]→ AuthService',
      actionLabel: 'Generate Handoff',
      actionType: 'handoff',
      engineer: 'Priya Sharma',
      system: 'AuthService'
    },
    {
      id: 'item-3',
      title: 'JWT Token Security Vulnerability vs Opaque Tokens',
      badge: 'Historical Reversal',
      status: 'off',
      summary: 'Original ADR-001 (JWT) had token revocation flaw discovered during incident SEC-202. ADR-002 reversed to opaque tokens.',
      proofPath: 'Incident SEC-202 —[TRIGGERED]→ ADR-002 —[SUPERSEDES]→ ADR-001',
      actionLabel: 'Trace Origin',
      actionType: 'query',
      query: 'Why did we decide to use opaque tokens instead of JWT?'
    },
    {
      id: 'item-4',
      title: 'HPA Autoscaling Buried 3-Hop Origin in AuthService',
      badge: 'Incident Origin',
      status: 'off',
      summary: 'HPA autoscaling rule was added during Black Friday outage discussion in #eng-incidents, not formal ADR.',
      proofPath: 'Slack #eng-incidents —[PROPOSED_IN]→ INC-402 —[RESULTED_IN]→ HPA Autoscaling',
      actionLabel: 'Trace Origin',
      actionType: 'query',
      query: 'What is the true origin of the HPA autoscaling decision in AuthService?'
    }
  ];

  // Needs Attention items for Python PEPs
  const pepsAttention = [
    {
      id: 'pep-item-1',
      title: 'PEP 248 Database API 1.0 Superseded by PEP 249',
      badge: 'Superseded',
      status: 'warn',
      summary: 'PEP 249 replaced PEP 248 to standardize 2.0 connection pool behavior, cursor execution methods, and standard type codes.',
      proofPath: 'PEP 249 (Accepted) —[SUPERSEDES]→ PEP 248 (Superseded)',
      actionLabel: 'Trace Supersession',
      actionType: 'query',
      query: 'Which PEP replaced PEP 248?'
    },
    {
      id: 'pep-item-2',
      title: 'PEP 387 Backwards Compatibility Policy Replaced PEP 5',
      badge: 'Active Policy',
      status: 'risk',
      summary: 'PEP 387 provides the active rules for changing APIs, deprecation warning cycles, and breaking change governance, replacing PEP 5.',
      proofPath: 'PEP 387 (Active) —[SUPERSEDES]→ PEP 5 (Superseded)',
      actionLabel: 'Inspect Policy',
      actionType: 'query',
      query: 'What is the backwards compatibility policy for Python?'
    },
    {
      id: 'pep-item-3',
      title: 'Packaging Metadata Evolution: PEP 241 → 314 → 345 → 566',
      badge: 'Evolution Lineage',
      status: 'off',
      summary: 'Core Python packaging metadata transitioned from basic title/version in 2001 to rich dependencies and environment markers.',
      proofPath: 'PEP 241 (Metadata 1.0) → PEP 314 (1.1) → PEP 345 (1.2) → PEP 566 (2.1)',
      actionLabel: 'Trace Lineage',
      actionType: 'query',
      query: 'What changed in packaging metadata between 2001 and 2015?'
    },
    {
      id: 'pep-item-4',
      title: 'PEP 484 Type Hints Author Centrality',
      badge: 'Author Centrality',
      status: 'off',
      summary: 'Authored by Guido van Rossum, Jukka Lehtosalo, and Lukasz Langa to define static type annotations for Python 3.5.',
      proofPath: 'Guido van Rossum —[AUTHORED]→ PEP 484 (Accepted)',
      actionLabel: 'View Author',
      actionType: 'query',
      query: 'Who authored PEP 484 Type Hints?'
    }
  ];

  const attentionItems = workspace === 'peps' ? pepsAttention : novatechAttention;

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'ok': return 'var(--ok)';
      case 'warn': return 'var(--warn)';
      case 'risk': return 'var(--risk)';
      default: return 'var(--off)';
    }
  };

  const getChipClass = (status) => {
    switch (status) {
      case 'ok': return 'chip-ok';
      case 'warn': return 'chip-warn';
      case 'risk': return 'chip-risk';
      default: return 'chip-off';
    }
  };

  return (
    <div style={{
      maxWidth: '920px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.75rem',
      paddingBottom: '3rem',
    }}>
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
          Governance radar
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          Brain Health
        </h1>
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--muted)',
          marginTop: '0.35rem',
          lineHeight: '1.5',
        }}>
          Continuous graph auditing of architectural decisions, maintainer continuity, and deprecations.
        </p>

        {/* Guided Scenarios Chips */}
        <div style={{
          marginTop: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.45rem',
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            Quick scenarios:
          </span>
          {workspace === 'peps' ? (
            <>
              <button
                onClick={() => onAskQuestion('Which PEP replaced PEP 248?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                PEP 248 → 249 Supersession
              </button>
              <button
                onClick={() => onAskQuestion('Who authored PEP 484 Type Hints?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                Guido van Rossum (Author)
              </button>
              <button
                onClick={() => onAskQuestion('What changed in packaging metadata between 2001 and 2015?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                Packaging Lineage
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onAskQuestion('What happens if Priya leaves the company?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                Priya leaves (Bus Factor)
              </button>
              <button
                onClick={() => onAskQuestion('Why did we decide to use opaque tokens instead of JWT?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                Why Opaque Tokens?
              </button>
              <button
                onClick={() => onAskQuestion('What is the current mobile API rate limit?')}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}
              >
                Mobile Rate Limit (Stale)
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Health Counter Cards (Neutral cards, big number, label, 1-line description, colored dot) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0.85rem',
      }}>
        {metrics.map((m) => {
          const isSelected = selectedProof?.id === m.id;
          return (
            <div
              key={m.id}
              className="clean-card"
              onClick={() => setSelectedProof(isSelected ? null : m)}
              style={{
                padding: '1.1rem',
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: getStatusDotColor(m.status),
                    display: 'inline-block',
                  }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: '500', color: 'var(--text)' }}>
                    {m.label}
                  </span>
                </div>
                {isSelected ? <ChevronUp size={14} color="var(--muted)" /> : <ChevronDown size={14} color="var(--muted)" />}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.9rem', fontWeight: '600', color: 'var(--text)', lineHeight: 1 }}>
                  {m.count}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {m.unit}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: '1.4', margin: 0 }}>
                {m.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Selected Proof Path Drawer */}
      {selectedProof && (
        <div className="clean-card" style={{
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: getStatusDotColor(selectedProof.status),
              }} />
              <strong style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
                {selectedProof.proof.title}
              </strong>
            </div>

            <button
              onClick={() => onAskQuestion(selectedProof.proof.actionQuestion)}
              className="btn-primary"
              style={{ fontSize: '0.75rem', padding: '4px 10px', gap: '4px' }}
            >
              <span>Ask the Brain</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="font-mono" style={{
            fontSize: '0.76rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}>
            <span style={{ color: 'var(--muted)', marginRight: '6px' }}>Path:</span>
            {selectedProof.proof.path}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: '1.4' }}>
            <strong style={{ color: 'var(--text)' }}>Operational impact:</strong> {selectedProof.proof.impact}
          </div>
        </div>
      )}

      {/* Active Governance Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Governance Queue
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
              Findings requiring architectural review or handoff actions
            </p>
          </div>
          <span className="chip-warn" style={{
            fontSize: '0.68rem',
            fontWeight: '600',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            {attentionItems.length} {attentionItems.length === 1 ? 'alert' : 'alerts'}
          </span>
        </div>

        {/* Clean list rows with 1 action button each */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {attentionItems.map((item) => (
            <div
              key={item.id}
              className="clean-card"
              style={{
                padding: '0.9rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: getStatusDotColor(item.status),
                  }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
                    {item.title}
                  </span>
                  <span className={getChipClass(item.status)} style={{
                    fontSize: '0.62rem',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}>
                    {item.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: '1.45', margin: 0 }}>
                  {item.summary}
                </p>

                <div className="font-mono" style={{
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  marginTop: '0.35rem',
                }}>
                  ↳ {item.proofPath}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {item.actionType === 'handoff' ? (
                  <button
                    onClick={() => onOpenHandoff(item.engineer, item.system)}
                    className="btn-primary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', gap: '4px' }}
                  >
                    <span>Handoff Plan</span>
                    <ArrowRight size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => onAskQuestion(item.query)}
                    className="btn-ghost"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', gap: '4px' }}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight size={12} />
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
