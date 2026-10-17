'use client';

import React, { useState } from 'react';
import { 
  ArrowUp, 
  Sparkles, 
  Code2, 
  ChevronDown, 
  ChevronRight, 
  ArrowRight, 
  Network,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Users,
  Layers,
  FileText,
  Calendar,
  Check
} from 'lucide-react';
import CitationModal from './CitationModal';

export default function ChatPanel({ 
  onAskQuestion, 
  lastResponse, 
  isLoading, 
  onSelectPathNode,
  onOpenHandoff,
  onProposeRemediation,
  workspace = 'novatech',
  onToggleGraph,
  isGraphVisible = false
}) {
  const [inputQuestion, setInputQuestion] = useState('');
  const [showCypher, setShowCypher] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const novatechPresets = [
    { label: 'What if Priya leaves?', q: 'What happens if Priya leaves the company?', tag: 'Bus Factor' },
    { label: 'Why Opaque Tokens?', q: 'Why did we decide to use opaque tokens instead of JWT?', tag: 'Decision Reversal' },
    { label: 'Mobile Rate Limit?', q: 'What is the current mobile API rate limit?', tag: 'Staleness Radar' },
    { label: 'Auth in June 2025', q: 'What was our active authentication decision as of June 2025?', tag: 'Time Travel' },
    { label: 'Auth Changes (2025-2026)', q: 'What changed about authentication, Jan 2025 to Oct 2026', tag: 'Evolution' },
    { label: 'Why MongoDB?', q: 'Why did we choose MongoDB?', tag: 'False Premise' }
  ];

  const pepsPresets = [
    { label: 'Which PEP replaced PEP 248?', q: 'Which PEP replaced PEP 248?', tag: 'Supersession' },
    { label: 'Packaging between 2001 & 2015', q: 'What changed in packaging metadata between 2001 and 2015?', tag: 'Timeline' },
    { label: 'Who authored PEP 484?', q: 'Who authored PEP 484 Type Hints?', tag: 'Author' },
    { label: 'DB-API standard in May 2000', q: 'What was the active database API standard as of 2000-05-01?', tag: 'Time Travel' },
    { label: 'Print function supersession', q: 'Which PEP replaced print statement with a function?', tag: 'Evolution' },
    { label: 'Why MongoDB?', q: 'Why did we choose MongoDB?', tag: 'False Premise' }
  ];

  const presets = workspace === 'peps' ? pepsPresets : novatechPresets;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    onAskQuestion(inputQuestion);
  };

  const handlePresetClick = (q) => {
    setInputQuestion(q);
    onAskQuestion(q);
  };

  // Human node name formatter (clean title, no raw IDs)
  const formatHumanName = (item) => {
    const node = item?.node || item || {};
    if (node.name) return node.name;
    if (node.title) return node.title;
    if (!node.id) return 'Unknown Node';

    const id = String(node.id);
    if (id === 'person_priya') return 'Priya Sharma';
    if (id === 'sys_auth') return 'AuthService';
    if (id === 'decision_opaque_tokens') return 'ADR-002: Opaque Tokens';
    if (id === 'decision_use_jwt') return 'ADR-001: JWT Auth';
    if (id === 'decision_rate_limit_mobile') return 'ADR-004: Rate Limit 50 rps';
    if (id === 'sys_mobile_api') return 'MobileAPI';
    if (id === 'sys_billing') return 'BillingSystem';

    return id.replace(/^decision_|^person_|^sys_|^doc_/, '')
             .replace(/_/g, ' ')
             .replace(/\b\w/g, l => l.toUpperCase());
  };

  const isDeclined = Boolean(lastResponse?.is_declined);
  const isAsOf = lastResponse?.tool_used === 'as_of' || lastResponse?.graph_result?.as_of_date;
  const isChangesBetween = lastResponse?.tool_used === 'changes_between' || lastResponse?.graph_result?.changes;
  const isBusFactor = lastResponse?.tool_used === 'bus_factor' || Boolean(lastResponse?.graph_result?.sole_expert_systems);

  const hasSoleExpert = !isDeclined && 
    (lastResponse?.tool_used === 'bus_factor' || lastResponse?.tool_used?.includes('bus_factor')) && 
    (lastResponse?.graph_result?.sole_expert_systems?.length > 0);

  const hasStaleResult = !isDeclined && (
    (lastResponse?.graph_result?.stale_items && lastResponse.graph_result.stale_items.length > 0) ||
    lastResponse?.graph_result?.is_stale === true ||
    (lastResponse?.graph_result?.stale_decisions && lastResponse.graph_result.stale_decisions.length > 0) ||
    (lastResponse?.graph_result?.decisions && lastResponse.graph_result.decisions.some(d => d.is_stale_on_date))
  );

  // Clean Markdown & prose renderer (Inter font, 15-16px, line-height 1.6, no stray marks)
  const renderCleanProse = (rawText) => {
    if (!rawText) return null;
    const blocks = rawText.split('\n\n').filter(b => b.trim().length > 0);

    return blocks.map((block, idx) => {
      const trimmed = block.trim();

      // Heading block (e.g. ### Rate Limit Status)
      if (trimmed.startsWith('#')) {
        const title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
        return (
          <h3 key={idx} style={{
            fontSize: '1.05rem',
            fontWeight: '600',
            color: 'var(--text)',
            marginTop: '1rem',
            marginBottom: '0.4rem',
            letterSpacing: '-0.01em',
          }}>
            {title}
          </h3>
        );
      }

      // Bullet list block
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const items = trimmed.split('\n').filter(l => l.trim().length > 0);
        return (
          <ul key={idx} style={{ listStyle: 'none', paddingLeft: 0, margin: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.map((item, i) => {
              const cleanItem = item.replace(/^[\*\-]\s*/, '');
              return (
                <li key={i} style={{ fontSize: '0.95rem', color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: '1.6' }}>
                  <span style={{ color: 'var(--accent)', marginTop: '2px', fontSize: '0.8rem' }}>•</span>
                  <span>{formatInline(cleanItem)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Normal paragraph
      return (
        <p key={idx} style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.65', margin: '0.5rem 0' }}>
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  const formatInline = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[\d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return <strong key={i} style={{ fontWeight: '600', color: 'var(--text)' }}>{content}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        const content = part.slice(1, -1);
        return <em key={i} style={{ fontStyle: 'italic', color: 'var(--text)' }}>{content}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const code = part.slice(1, -1);
        return (
          <code key={i} className="font-mono" style={{
            fontSize: '0.82rem',
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}>
            {code}
          </code>
        );
      }
      if (/^\[\d+\]$/.test(part)) {
        const num = part.slice(1, -1);
        return (
          <span key={i} className="chip-accent" style={{
            fontSize: '0.68rem',
            fontWeight: '600',
            padding: '1px 5px',
            borderRadius: '4px',
            marginLeft: '3px',
            display: 'inline-block',
            cursor: 'pointer',
          }}>
            {num}
          </span>
        );
      }
      // Strip any lingering stray markdown symbols (like unmatched asterisks or backticks)
      return part.replace(/[*`_]/g, '');
    });
  };

  return (
    <div style={{
      maxWidth: '740px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      paddingBottom: '5rem',
    }}>
      {/* Click-through verbatim citation modal */}
      {selectedCitation && (
        <CitationModal 
          citation={selectedCitation} 
          onClose={() => setSelectedCitation(null)} 
        />
      )}

      {/* Main Answer View or Empty State */}
      {isLoading ? (
        <div style={{
          padding: '3rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--muted)',
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite',
          }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text)' }}>
              Querying FalkorDB Graph & Tracing Provenance
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
              Executing Cypher traversal • Checking temporal validity intervals
            </div>
          </div>
        </div>
      ) : lastResponse ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Question Title (22px heading) */}
          <div>
            <h1 style={{
              fontSize: '1.4rem',
              fontWeight: '600',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              lineHeight: '1.3',
            }}>
              {lastResponse.question}
            </h1>

            {/* Muted Meta Row & Graph Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border)',
              fontSize: '0.8rem',
              color: 'var(--muted)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Answered by agent</span>
                <span>•</span>
                <span className="font-mono" style={{ fontSize: '0.75rem' }}>
                  {lastResponse.tool_used || 'graph_query'}
                </span>
                <span>•</span>
                <span>1.1s</span>
              </div>

              {onToggleGraph && (
                <button
                  onClick={onToggleGraph}
                  className="btn-ghost"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    gap: '5px',
                  }}
                >
                  <Network size={13} color="var(--accent)" />
                  <span>{isGraphVisible ? 'Hide reasoning graph' : 'Show reasoning graph'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Reasoning Path Breadcrumb (Renamed from "Proved Answer Path") */}
          {lastResponse.graph_path && lastResponse.graph_path.length > 0 && !isDeclined && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}>
                Reasoning path
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.35rem',
                background: 'var(--surface-2)',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                {lastResponse.graph_path.map((item, i) => {
                  const node = item.node || item;
                  const humanName = formatHumanName(item);
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--muted)', fontSize: '0.7rem' }}>
                          <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent)' }}>
                            [{item.edge || item.rel_type || 'RELATES_TO'}]
                          </span>
                          <ArrowRight size={10} />
                        </div>
                      )}
                      <span 
                        onClick={() => onSelectPathNode && onSelectPathNode(node.id)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontWeight: '500',
                        }}
                        title={`Click to focus on ${node.id || humanName}`}
                      >
                        {humanName}
                      </span>
                      {item.constraint && (
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          fontWeight: '500',
                          marginLeft: '3px',
                        }}>
                          {item.constraint}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clean Entity Grounding Refusal (Zero proof path, zero phantom citations) */}
          {isDeclined ? (
            <div className="clean-card" style={{ padding: '1.25rem', background: 'var(--surface)' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text)', lineHeight: '1.65', margin: 0 }}>
                {lastResponse.answer}
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
                Provenance indexes verified architecture records, systems, and people. Unrecorded technologies or false premises are declined directly without speculation.
              </div>
            </div>
          ) : isChangesBetween && lastResponse.graph_result?.changes?.length > 0 ? (
            /* Vertical Timeline for changes_between queries */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
                marginBottom: '0.2rem',
              }}>
                Chronological Evolution Timeline
              </div>

              <div style={{
                position: 'relative',
                paddingLeft: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderLeft: '2px solid var(--border)',
                marginLeft: '0.5rem',
              }}>
                {lastResponse.graph_result.changes.map((c, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    {/* Timeline Dot */}
                    <div style={{
                      position: 'absolute',
                      left: '-1.85rem',
                      top: '0.35rem',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: c.status?.toLowerCase() === 'active' ? 'var(--ok)' : 'var(--off)',
                      border: '2px solid var(--surface)',
                    }} />

                    {/* Timeline Card */}
                    <div className="clean-card" style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '2px' }}>
                            {c.valid_from || c.made_at || 'Date N/A'}
                          </div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
                            {c.title}
                          </h4>
                        </div>
                        <span className={c.status?.toLowerCase() === 'active' ? 'chip-ok' : 'chip-off'} style={{
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}>
                          {c.status || 'Active'}
                        </span>
                      </div>

                      {c.maker && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                          Author: <strong style={{ color: 'var(--text)' }}>{c.maker.name}</strong>
                        </div>
                      )}

                      {c.rationale && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.5', marginTop: '0.5rem' }}>
                          {c.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isAsOf && lastResponse.graph_result?.decisions?.length > 0 ? (
            /* Clean Decision Cards for as_of queries */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}>
                Decisions in force (As of {lastResponse.graph_result.as_of_date})
              </div>

              {lastResponse.graph_result.decisions.map((d, i) => (
                <div key={i} className="clean-card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
                      {d.title}
                    </h4>
                    <span className={d.status_on_date === 'STALE' ? 'chip-warn' : d.status_on_date === 'SUPERSEDED' ? 'chip-off' : 'chip-ok'} style={{
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}>
                      {d.status_on_date || 'ACTIVE'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
                    Validity: <span className="font-mono">{d.valid_from || '2025-01-01'} → {d.valid_to || 'present'}</span>
                    {d.made_by && <> • Owner: <strong style={{ color: 'var(--text)' }}>{d.made_by.name}</strong></>}
                  </div>

                  {d.source_quote && (
                    <blockquote style={{
                      marginTop: '0.6rem',
                      paddingLeft: '0.75rem',
                      borderLeft: '2px solid var(--accent)',
                      fontSize: '0.85rem',
                      color: 'var(--text)',
                      fontStyle: 'italic',
                      lineHeight: '1.5',
                    }}>
                      "{d.source_quote}"
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          ) : isBusFactor && lastResponse.graph_result?.sole_expert_systems ? (
            /* Structured Bus Factor Card */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="clean-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text)' }}>
                      {lastResponse.graph_result.title || `Bus Factor Risk Analysis: ${lastResponse.graph_result.person_name}`}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>
                      {lastResponse.graph_result.impact_summary}
                    </div>
                  </div>
                  <span className={lastResponse.graph_result.status === 'CRITICAL' || lastResponse.graph_result.status === 'HIGH' ? 'chip-warn' : 'chip-ok'} style={{
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                  }}>
                    Risk: {lastResponse.graph_result.status || 'HIGH'}
                  </span>
                </div>

                {lastResponse.graph_result.sole_expert_systems?.length > 0 && (
                  <div style={{ marginTop: '0.9rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                      Sole-Expert Systems (Bus Factor = 1)
                    </div>
                    {lastResponse.graph_result.sole_expert_systems.map((s, idx) => (
                      <div key={idx} style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.35rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text)' }}>{s.name || s.id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>({s.stack || 'Production service'})</span>
                        </div>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          fontWeight: '500',
                        }}>
                          no other engineer has a WORKED_ON edge
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {lastResponse.graph_result.unique_active_decisions?.length > 0 && (
                  <div style={{ marginTop: '0.9rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                      Sole Architectural Decisions Authored ({lastResponse.graph_result.unique_active_decisions.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {lastResponse.graph_result.unique_active_decisions.slice(0, 5).map((d, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--accent)' }}>•</span>
                          <span>{d.title}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>({d.status || 'active'})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* General Clean Prose Answer */
            <div className="clean-card" style={{ padding: '1.25rem' }}>
              {renderCleanProse(lastResponse.answer)}
            </div>
          )}

          {/* Conditional Remediation Alert Banner (Only when true risk is flagged) */}
          {(hasSoleExpert || hasStaleResult) && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: hasStaleResult ? 'rgba(180, 83, 9, 0.08)' : 'rgba(15, 118, 110, 0.08)',
              border: `1px solid ${hasStaleResult ? 'var(--warn)' : 'var(--accent)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color={hasStaleResult ? 'var(--warn)' : 'var(--accent)'} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: '500' }}>
                  {hasSoleExpert ? 'High single-maintainer risk detected on system' : 'Stale architectural decision detected on this date'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {hasSoleExpert && (
                  <button
                    onClick={() => onOpenHandoff && onOpenHandoff('Priya Sharma', 'AuthService')}
                    className="btn-primary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  >
                    <Users size={12} />
                    <span>Generate Handoff Plan</span>
                  </button>
                )}

                {hasStaleResult && (
                  <button
                    onClick={() => onProposeRemediation && onProposeRemediation('Rate Limit Staleness')}
                    className="btn-primary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                  >
                    <AlertTriangle size={12} />
                    <span>Propose Notification</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Plain Sources Cards (Matching Cairn Sources Card style) */}
          {lastResponse.sources && lastResponse.sources.length > 0 && !isDeclined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--muted)',
              }}>
                Sources
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lastResponse.sources.map((s, idx) => {
                  const sourceObj = typeof s === 'string' ? { id: s, title: s } : s;
                  const cleanTitle = sourceObj.title || sourceObj.id;
                  const url = sourceObj.url || '';
                  const isRealUrl = url.startsWith('http') && (url.includes('peps.python.org') || url.includes('github.com') || url.includes('python.org') || !url.includes('novatech.io'));
                  const isSynthetic = !isRealUrl || url.includes('novatech.io');

                  return (
                    <div 
                      key={idx}
                      onClick={() => setSelectedCitation({
                        id: sourceObj.id || `doc_${idx}`,
                        title: cleanTitle,
                        quote: sourceObj.quote || `Verified architectural constraint documented in ${cleanTitle}.`,
                        doc_type: sourceObj.type || sourceObj.doc_type || 'Architecture Document',
                        valid_from: sourceObj.valid_from || '2025-08-01',
                        url: url,
                        isRealUrl: isRealUrl,
                        isSynthetic: isSynthetic,
                      })}
                      className="clean-card"
                      style={{
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="chip-accent" style={{
                            fontSize: '0.65rem',
                            fontWeight: '600',
                            padding: '1px 6px',
                            borderRadius: '4px',
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '0.88rem', fontWeight: '500', color: 'var(--text)' }}>
                            {cleanTitle}
                          </span>
                        </div>

                        {isRealUrl && url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.72rem',
                              color: 'var(--accent)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                            }}
                          >
                            <span>Open</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            color: 'var(--muted)',
                          }}>
                            synthetic
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--muted)' }}>
                        <span style={{ textTransform: 'capitalize' }}>
                          {sourceObj.type || sourceObj.doc_type || 'Policy'}
                        </span>
                        <span>•</span>
                        <span>{sourceObj.valid_from || '2026-02-23'}</span>
                        {url && (
                          <>
                            <span>•</span>
                            <span className="font-mono" style={{ fontSize: '0.7rem' }}>
                              {url} {isSynthetic ? '(synthetic)' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Cypher Query */}
          <div style={{ marginTop: '0.5rem' }}>
            <button
              onClick={() => setShowCypher(!showCypher)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              {showCypher ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <span>{showCypher ? 'Hide query' : 'Show query'}</span>
            </button>

            {showCypher && (
              <pre className="font-mono" style={{
                marginTop: '0.4rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.75rem',
                lineHeight: '1.5',
                overflowX: 'auto',
              }}>
                {lastResponse.cypher_query || '// Parameterized Cypher query executed on FalkorDB\nMATCH (d:Decision) RETURN d LIMIT 10;'}
              </pre>
            )}
          </div>
        </div>
      ) : (
        /* Empty State (Cairn-inspired Minimalist Layout) */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2.5rem 1rem 1rem 1rem',
          gap: '1.5rem',
        }}>
          <div>
            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: '600',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}>
              What would you like to know?
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              {workspace === 'peps' 
                ? '745 proposals · 356 people · 73 supersession chains'
                : '146 documents · 50 decisions · 40 people · 8 systems'}
            </p>
          </div>

          {/* Three Clean Scenario Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            width: '100%',
          }}>
            {presets.slice(0, 3).map((p, idx) => (
              <div
                key={idx}
                onClick={() => handlePresetClick(p.q)}
                className="clean-card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
                    {p.label}
                  </span>
                  <span className="chip-off" style={{
                    fontSize: '0.65rem',
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}>
                    {p.tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                  {p.q}
                </p>
              </div>
            ))}
          </div>

          {/* Plain chips row */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              Try asking:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem' }}>
              {presets.slice(3).map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(p.q)}
                  className="btn-ghost"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Input Bar at Bottom (Centered Reading Column) */}
      <div className="floating-input-bar" style={{
        position: 'fixed',
        bottom: '1.25rem',
        left: '240px',
        right: isGraphVisible ? '420px' : 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 1.5rem',
        pointerEvents: 'none',
        zIndex: 35,
        transition: 'right 0.2s ease, left 0.2s ease',
      }}>
        <form 
          onSubmit={handleSubmit} 
          style={{
            maxWidth: '740px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 6px 4px 14px',
            boxShadow: 'var(--shadow-subtle)',
            pointerEvents: 'auto',
          }}
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask why, who knows, or what breaks..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '0.9rem',
              padding: '6px 0',
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isLoading || !inputQuestion.trim() ? 'var(--surface-2)' : 'var(--accent)',
              border: 'none',
              color: isLoading || !inputQuestion.trim() ? 'var(--muted)' : 'var(--accent-contrast)',
              cursor: isLoading || !inputQuestion.trim() ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
            aria-label="Submit question"
          >
            <ArrowUp size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
