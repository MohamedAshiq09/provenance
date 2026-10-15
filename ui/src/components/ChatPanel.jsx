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
  Flame,
  ArrowRight,
  Bookmark,
  Share2,
  BrainCircuit
} from 'lucide-react';

export default function ChatPanel({ 
  onAskQuestion, 
  lastResponse, 
  isLoading, 
  onSelectPathNode 
}) {
  const [inputQuestion, setInputQuestion] = useState('');
  const [showCypher, setShowCypher] = useState(false);

  const presets = [
    { label: 'What if Priya leaves?', q: 'What happens if Priya leaves the company?', tag: 'Bus Factor' },
    { label: 'Why Opaque Tokens?', q: 'Why did we decide to use opaque tokens instead of JWT?', tag: 'Decision Trace' },
    { label: 'Mobile Rate Limit?', q: 'What is the current mobile API rate limit?', tag: 'Staleness Radar' },
    { label: 'HPA Buried Origin', q: 'What is the true origin of the HPA autoscaling decision in AuthService?', tag: '3-Hop Origin' },
    { label: 'Auth in June 2025', q: 'What was our active authentication decision as of June 2025?', tag: 'Time Travel' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isLoading) return;
    onAskQuestion(inputQuestion);
  };

  const handlePresetClick = (q) => {
    setInputQuestion(q);
    onAskQuestion(q);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      {/* Preset Scenarios Header */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          color: '#38bdf8', 
          marginBottom: '0.6rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          <Flame size={14} color="#f43f5e" />
          <span>Planted Hackathon Scenarios (One-Click Proving)</span>
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
                fontWeight: '500',
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
            gap: '0.75rem',
            color: 'var(--text-muted)',
          }}>
            <div className="animate-pulse-slow" style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={24} color="#ffffff" />
            </div>
            <p style={{ fontSize: '0.85rem' }}>Traversing FalkorDB Graph & Computing Centrality...</p>
          </div>
        ) : lastResponse ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Question Bar & Tool Tag */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.75rem',
              gap: '1rem',
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Question
                </span>
                <h2 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                  {lastResponse.question}
                </h2>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                fontSize: '0.72rem',
                fontWeight: '600',
                color: '#22d3ee',
                whiteSpace: 'nowrap',
              }}>
                <span>Tool: <code>{lastResponse.tool_used}</code></span>
              </div>
            </div>

            {/* Provenance Path Breadcrumbs (The Core Winner Feature) */}
            {lastResponse.graph_path && lastResponse.graph_path.length > 0 && (
              <div style={{
                background: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
              }}>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: '#22d3ee',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <CheckCircle2 size={13} color="#22d3ee" />
                  <span>Proved Answer Path (Lit on Graph)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {lastResponse.graph_path.map((item, i) => {
                    const node = item.node || item;
                    return (
                      <React.Fragment key={i}>
                        {i > 0 && <ArrowRight size={12} color="var(--text-muted)" />}
                        <span 
                          onClick={() => onSelectPathNode && onSelectPathNode(node.id)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Click to locate on graph"
                        >
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>[{item.type || node.type || 'Node'}]</span>
                          <strong style={{ color: '#38bdf8' }}>{node.name || node.title || node.id}</strong>
                        </span>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Natural Language Answer */}
            <div style={{
              fontSize: '0.88rem',
              lineHeight: '1.6',
              color: '#e2e8f0',
              whiteSpace: 'pre-line',
            }}>
              {lastResponse.answer}
            </div>

            {/* Cited Sources */}
            {lastResponse.sources && lastResponse.sources.length > 0 && (
              <div style={{
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Documented Proof & Citations
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {lastResponse.sources.map((s, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Bookmark size={11} color="#f59e0b" />
                      <code style={{ color: '#f59e0b' }}>[{s.id}]</code>
                      <span>{s.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Cypher Query Inspector */}
            {lastResponse.cypher_query && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  id="toggle-cypher-btn"
                  onClick={() => setShowCypher(!showCypher)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '2px 0',
                  }}
                >
                  <Code2 size={13} />
                  <span>Inspect Cypher Traversal Query</span>
                  {showCypher ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {showCypher && (
                  <pre style={{
                    marginTop: '0.4rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#04060a',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.72rem',
                    color: '#34d399',
                    overflowX: 'auto',
                    lineHeight: '1.4',
                  }}>
                    {lastResponse.cypher_query}
                  </pre>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '0.5rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}>
            <BrainCircuit size={40} color="rgba(255, 255, 255, 0.15)" />
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Provenance Company Brain</h3>
            <p style={{ fontSize: '0.78rem', maxWidth: '360px' }}>
              Ask any multi-hop architectural question or pick a planted scenario above. Every answer will be accompanied by its verified graph path.
            </p>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          id="brain-question-input"
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder="Ask a question (e.g., 'What if Priya leaves?', 'Why use opaque tokens?')..."
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.85rem 3.5rem 0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            fontSize: '0.88rem',
            outline: 'none',
            boxShadow: 'var(--shadow-card)',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.6)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
        <button
          id="brain-submit-btn"
          type="submit"
          disabled={!inputQuestion.trim() || isLoading}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: inputQuestion.trim() ? 'linear-gradient(135deg, #06b6d4, #6366f1)' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: inputQuestion.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
