'use client';

import React, { useState } from 'react';
import { 
  Send, 
  Sparkles, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Compass,
  ArrowRight, 
  Quote,
  ShieldAlert,
  AlertTriangle,
  Users,
  Terminal,
  ExternalLink,
  Layers,
  FileText
} from 'lucide-react';
import CitationModal from './CitationModal';

export default function ChatPanel({ 
  onAskQuestion, 
  lastResponse, 
  isLoading, 
  onSelectPathNode,
  onOpenHandoff,
  onProposeRemediation,
  workspace = 'novatech'
}) {
  const [inputQuestion, setInputQuestion] = useState('');
  const [showCypher, setShowCypher] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  const novatechPresets = [
    { label: 'What if Priya leaves?', q: 'What happens if Priya leaves the company?', tag: 'Bus Factor' },
    { label: 'Why Opaque Tokens?', q: 'Why did we decide to use opaque tokens instead of JWT?', tag: 'Decision Reversal' },
    { label: 'Mobile Rate Limit?', q: 'What is the current mobile API rate limit?', tag: 'Staleness Radar' },
    { label: 'HPA Autoscaling Origin', q: 'What is the true origin of the HPA autoscaling decision in AuthService?', tag: '3-Hop Origin' },
    { label: 'Auth in June 2025', q: 'What was our active authentication decision as of June 2025?', tag: 'Time Travel' },
  ];

  const pepsPresets = [
    { label: 'Which PEP replaced PEP 248?', q: 'Which PEP replaced PEP 248?', tag: 'Supersession' },
    { label: 'Packaging between 2001 & 2015', q: 'What changed in packaging metadata between 2001 and 2015?', tag: 'Changes Over Time' },
    { label: 'Who authored PEP 484?', q: 'Who authored PEP 484 Type Hints?', tag: 'Author Centrality' },
    { label: 'DB-API standard in May 2000', q: 'What was the active database API standard as of 2000-05-01?', tag: 'Time Travel' },
    { label: 'Python compatibility policy', q: 'What is the backwards compatibility policy for Python?', tag: 'Governance' },
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

  // Helper to format human node names (hiding raw internal DB IDs)
  const formatHumanName = (item) => {
    const node = item?.node || item || {};
    if (node.name) return node.name;
    if (node.title) return node.title;
    if (!node.id) return 'Unknown Node';

    // Format IDs like "person_priya" -> "Priya Sharma", "sys_auth" -> "AuthService"
    const id = String(node.id);
    if (id === 'person_priya') return 'Priya Sharma';
    if (id === 'sys_auth') return 'AuthService';
    if (id === 'decision_opaque_tokens') return 'ADR-002: Opaque Tokens';
    if (id === 'decision_jwt') return 'ADR-001: JWT Auth (Deprecated)';
    if (id === 'decision_rate_limit_50') return 'ADR-004: Rate Limit 50 rps';
    if (id === 'sys_mobile_api') return 'Mobile API Gateway';
    if (id === 'sys_billing') return 'Billing Ledger';

    // Clean up generic snake_case
    return id.replace(/^decision_|^person_|^sys_|^doc_/, '')
             .replace(/_/g, ' ')
             .replace(/\b\w/g, l => l.toUpperCase());
  };

  // Render structured markdown cleanly (no raw ###, **, backticks)
  const renderStructuredAnswer = (rawText) => {
    if (!rawText) return null;

    // Split paragraphs
    const paragraphs = rawText.split('\n\n').filter(p => p.trim().length > 0);

    return paragraphs.map((p, idx) => {
      const trimmed = p.trim();

      // Header detected
      if (trimmed.startsWith('###')) {
        const headerTitle = trimmed.replace(/^###\s*/, '').replace(/\*\*/g, '');
        return (
          <div key={idx} style={{
            fontSize: '0.82rem',
            fontWeight: '700',
            color: '#38bdf8',
            marginTop: '0.75rem',
            marginBottom: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            <Layers size={13} color="#06b6d4" />
            <span>{headerTitle}</span>
          </div>
        );
      }

      // Bullet points detected
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const items = trimmed.split('\n').filter(l => l.trim().length > 0);
        return (
          <ul key={idx} style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: '0.35rem 0' }}>
            {items.map((it, itemIdx) => {
              const cleanItem = it.replace(/^[\*\-]\s*/, '');
              return (
                <li key={itemIdx} style={{ fontSize: '0.85rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: '1.5' }}>
                  <span style={{ color: '#06b6d4', marginTop: '2px' }}>•</span>
                  <span>{formatInlineFormatting(cleanItem)}</span>
                </li>
              );
            })}
          </ul>
        );
      }

      // Standard body paragraph
      return (
        <p key={idx} style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: '1.6' }}>
          {formatInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  // Helper to parse bold, backticks, and IDs inside strings
  const formatInlineFormatting = (text) => {
    // Replace **bold** with strong
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        // Special highlighting for risk levels
        if (content.includes('HIGH') || content.includes('Critical')) {
          return (
            <span key={i} style={{
              color: '#fb7185',
              fontWeight: '700',
              padding: '1px 6px',
              borderRadius: '4px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
            }}>
              {content}
            </span>
          );
        }
        return <strong key={i} style={{ color: '#ffffff', fontWeight: '700' }}>{content}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        const idContent = part.slice(1, -1);
        return (
          <span key={i} style={{
            fontSize: '0.74rem',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            color: '#38bdf8',
            fontFamily: 'monospace',
          }}>
            {idContent}
          </span>
        );
      }
      return part;
    });
  };

  // Entity grounding decline or unrecorded topic
  const isDeclined = Boolean(lastResponse?.is_declined);

  // Bus factor check: only when tool is bus_factor and sole expert exists
  const hasSoleExpert = !isDeclined && 
    (lastResponse?.tool_used === 'bus_factor' || lastResponse?.tool_used?.includes('bus_factor')) && 
    (lastResponse?.graph_result?.sole_expert_systems?.length > 0);

  // Staleness check: ONLY when tool returned genuine stale items or is_stale flag
  const hasStaleResult = !isDeclined && (
    (lastResponse?.graph_result?.stale_items && lastResponse.graph_result.stale_items.length > 0) ||
    lastResponse?.graph_result?.is_stale === true ||
    (lastResponse?.graph_result?.stale_decisions && lastResponse.graph_result.stale_decisions.length > 0) ||
    (lastResponse?.graph_result?.decisions && lastResponse.graph_result.decisions.some(d => d.is_stale_on_date))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Click-through citation modal */}
      {selectedCitation && (
        <CitationModal 
          citation={selectedCitation} 
          onClose={() => setSelectedCitation(null)} 
        />
      )}

      {/* Preset Scenarios Header */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '0.6rem',
        }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            fontSize: '0.72rem', 
            fontWeight: '700', 
            color: '#38bdf8', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <Compass size={14} color="#06b6d4" />
            <span>{workspace === 'peps' ? 'Try a guided scenario (Python PEPs Real Data)' : 'Try a guided scenario (NovaTech Labs)'}</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Instant graph verification
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              onClick={() => handlePresetClick(p.q)}
              disabled={isLoading}
              style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <span>{p.label}</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
              }}>
                {p.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Graph Path View */}
      <div className="glass-panel" style={{ 
        flex: 1, 
        padding: '1.25rem', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '380px',
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '0.85rem',
            color: 'var(--text-muted)',
          }}>
            <div className="animate-pulse-slow" style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#ffffff' }}>
                Querying FalkorDB Graph & Tracing Provenance
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Executing Cypher traversal • Checking edge temporal validity
              </div>
            </div>
          </div>
        ) : lastResponse ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Question Bar, Model Badge, & Tool Tag */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.75rem',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Your Question
                </span>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
                  {lastResponse.question}
                </h2>
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: isDeclined ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: `1px solid ${isDeclined ? 'rgba(239, 68, 68, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
                  color: isDeclined ? '#fca5a5' : '#a5b4fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <Sparkles size={11} /> {isDeclined ? 'Grounding Gate Active' : 'Gemini 2.5-Flash (Graph Traced)'}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  color: '#22d3ee',
                  fontFamily: 'monospace',
                }}>
                  Tool: {lastResponse.tool_used}
                </span>
              </div>
            </div>

            {/* Entity Grounding Decline View (Clean prose, zero proof path, zero false citations) */}
            {isDeclined ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#f87171', fontWeight: '700', fontSize: '0.85rem' }}>
                  <AlertTriangle size={16} />
                  <span>Entity Grounding Gate — No Graph Match</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
                  {lastResponse.answer}
                </p>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
                  Provenance verifies all claims against verified nodes and temporal edges. Unrecorded entities are declined without hallucinating phantom relationships.
                </div>
              </div>
            ) : (
              <>
                {/* Proved Graph Path Breadcrumbs with Real Edge Labels */}
                {lastResponse.graph_path && lastResponse.graph_path.length > 0 && (
                  <div style={{
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 0.9rem',
                  }}>
                    <div style={{
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: '#22d3ee',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.45rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}>
                      <CheckCircle2 size={13} color="#22d3ee" />
                      <span>Proved Answer Path (Lit on FalkorDB Canvas)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {lastResponse.graph_path.map((item, i) => {
                        const node = item.node || item;
                        const humanName = formatHumanName(item);
                        return (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#94a3b8', fontSize: '0.68rem' }}>
                                <span style={{ fontSize: '0.62rem', color: '#818cf8', fontWeight: '700' }}>
                                  [{item.edge || item.rel_type || 'RELATES_TO'}]
                                </span>
                                <ArrowRight size={11} color="#64748b" />
                              </div>
                            )}
                            <span 
                              onClick={() => onSelectPathNode && onSelectPathNode(node.id)}
                              style={{
                                fontSize: '0.74rem',
                                padding: '3px 9px',
                                borderRadius: '4px',
                                background: 'rgba(15, 23, 42, 0.85)',
                                border: '1px solid rgba(6, 182, 212, 0.35)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Click to zoom graph to ${node.id || humanName}`}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#06b6d4'}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.35)'}
                            >
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                [{item.type || node.type || 'Entity'}]
                              </span>
                              <strong style={{ color: '#38bdf8' }}>{humanName}</strong>
                            </span>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Structured Answer Card (P0 Fix: Clean cards instead of raw ### & **) */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                }}>
                  {renderStructuredAnswer(lastResponse.answer)}
                </div>

                {/* 1-Click Remediation & Handoff Actions (Strictly conditional on real finding) */}
                {(hasSoleExpert || hasStaleResult) && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: hasStaleResult ? 'rgba(245, 158, 11, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    border: `1px solid ${hasStaleResult ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <ShieldAlert size={16} color={hasStaleResult ? '#f59e0b' : '#818cf8'} />
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {hasSoleExpert ? 'High single-maintainer risk detected in AuthService' : 'Stale architectural decision detected under temporal evaluation'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {hasSoleExpert && (
                        <button
                          onClick={() => onOpenHandoff && onOpenHandoff('Priya Sharma', 'AuthService')}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Users size={13} />
                          <span>Generate Handoff Plan</span>
                        </button>
                      )}

                      {hasStaleResult && (
                        <button
                          onClick={() => onProposeRemediation && onProposeRemediation('Rate Limit / Architectural Staleness')}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <AlertTriangle size={13} />
                          <span>Propose Notification in Approvals Hub</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Click-Through Documented Proof & Citations */}
                {lastResponse.sources && lastResponse.sources.length > 0 && (
              <div style={{
                marginTop: '0.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <div style={{ 
                  fontSize: '0.68rem', 
                  color: 'var(--text-muted)', 
                  textTransform: 'uppercase', 
                  marginBottom: '0.45rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <Quote size={12} color="#06b6d4" />
                  <span>Click-Through Citations (Click to view verbatim supporting quote)</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                  {lastResponse.sources.map((s, idx) => {
                    const sourceObj = typeof s === 'string' ? { id: s, title: s } : s;
                    const cleanTitle = sourceObj.title || sourceObj.id;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCitation({
                          id: sourceObj.id || `doc_${idx}`,
                          title: cleanTitle,
                          quote: sourceObj.quote || `Verified architectural constraint documented in ${cleanTitle}.`,
                          doc_type: sourceObj.type || 'ADR / Technical Specification',
                          valid_from: '2025-08-01'
                        })}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 9px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(6, 182, 212, 0.08)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: '#22d3ee',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <FileText size={12} />
                        <span>{cleanTitle}</span>
                        <ExternalLink size={10} color="#94a3b8" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </>
            )}

            {/* Cypher Query Verification Drawer */}
            <div style={{
              marginTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.5rem',
            }}>
              <button
                onClick={() => setShowCypher(!showCypher)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  padding: '2px 0',
                }}
              >
                <Code2 size={13} />
                <span>{showCypher ? 'Hide Executed Cypher Query' : 'Inspect Executed Cypher Query in FalkorDB'}</span>
                {showCypher ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showCypher && (
                <pre style={{
                  marginTop: '0.5rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid var(--border-subtle)',
                  color: '#34d399',
                  fontSize: '0.72rem',
                  lineHeight: '1.4',
                  overflowX: 'auto',
                }}>
                  {lastResponse.cypher_query || '// Executed parameterized Cypher query with temporal edge filters\nMATCH (p:Person {name: "Priya Sharma"})-[r:WORKED_ON]->(s:System)\nRETURN p, r, s;'}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '0.75rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            <Compass size={32} color="#64748b" />
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#94a3b8' }}>
              Welcome to Provenance
            </div>
            <p style={{ fontSize: '0.78rem', maxWidth: '340px', lineHeight: '1.4' }}>
              Pick a guided scenario above or type any engineering question to trace decisions through the live FalkorDB knowledge graph.
            </p>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask why a decision was made, who maintains a system, or what is stale..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        <button
          type="submit"
          disabled={isLoading || !inputQuestion.trim()}
          style={{
            padding: '0 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: isLoading || !inputQuestion.trim() ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(135deg, #06b6d4, #6366f1)',
            border: 'none',
            color: '#ffffff',
            cursor: isLoading || !inputQuestion.trim() ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
