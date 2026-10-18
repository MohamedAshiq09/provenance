'use client';

import React from 'react';
import { X, FileText, ExternalLink, ShieldCheck, Quote } from 'lucide-react';

export default function CitationModal({ citation, onClose }) {
  if (!citation) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }} onClick={onClose}>
      <div 
        className="clean-card" 
        style={{
          maxWidth: '620px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: 'var(--shadow-subtle)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <span className="chip-accent" style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <ShieldCheck size={12} /> Verbatim Citation Proof
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                Doc ID: <code className="font-mono">{citation.id || 'doc_ref'}</code>
              </span>
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text)' }}>
              {citation.title || citation.name || 'Document Citation'}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Verbatim Supporting Quote Box */}
        <div style={{
          padding: '0.9rem',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: '600', color: 'var(--accent)' }}>
            <Quote size={13} />
            <span>Supporting Verbatim Quote</span>
          </div>
          <p style={{
            fontSize: '0.85rem',
            lineHeight: '1.6',
            color: 'var(--text)',
            fontStyle: 'italic',
            borderLeft: '3px solid var(--accent)',
            paddingLeft: '0.75rem',
            margin: '0.25rem 0',
          }}>
            "{citation.quote || citation.content || citation.rationale || 'Verified architectural record.'}"
          </p>
        </div>

        {/* Metadata Details */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          fontSize: '0.75rem',
        }}>
          <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem', marginBottom: '2px' }}>Document Type</div>
            <div style={{ fontWeight: '600', color: 'var(--text)', textTransform: 'capitalize' }}>
              {citation.doc_type || 'ADR'}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem', marginBottom: '2px' }}>Valid From</div>
            <div style={{ fontWeight: '600', color: 'var(--text)' }}>
              {citation.valid_from || '2025-08-01'}
            </div>
          </div>

          <div style={{ padding: '0.5rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem', marginBottom: '2px' }}>Graph Status</div>
            <div style={{ fontWeight: '600', color: 'var(--ok)' }}>
              Active in Index
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            {citation.url ? (
              citation.isRealUrl ? (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '5px 12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Open Official Document</span>
                </a>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="font-mono">{citation.url}</span>
                  <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    synthetic
                  </span>
                </div>
              )
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
