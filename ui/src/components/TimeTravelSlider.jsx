'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, History, Sparkles, Check, ChevronRight } from 'lucide-react';

export default function TimeTravelSlider({ onDateChange }) {
  const dates = [
    { label: 'Jun 2024 (JWT Era)', date: '2024-06-01', desc: 'JWT authentication adopted, Postgres for billing' },
    { label: 'Jan 2025 (Scaling Issues)', date: '2025-01-01', desc: 'Token revocation issues emerge in AuthService' },
    { label: 'Aug 2025 (Token Reversal)', date: '2025-08-01', desc: 'ADR-002: JWT superseded by Opaque Tokens' },
    { label: 'Present (Oct 2026)', date: '2026-10-15', desc: 'Rate limit 200 rps active, HPA autoscaling enabled' },
  ];

  const [selectedIndex, setSelectedIndex] = useState(3);
  const [activeDecisions, setActiveDecisions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDecisionsForDate(dates[selectedIndex].date);
  }, [selectedIndex]);

  const fetchDecisionsForDate = async (dateStr) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/graph/as-of?date=${dateStr}`);
      const data = await res.json();
      setActiveDecisions(data.decisions || []);
      if (onDateChange) onDateChange(dateStr, data.decisions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <History size={16} color="#818cf8" />
          <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ffffff' }}>
            Temporal Time-Travel "As-Of" Scrubbing
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '600' }}>
          Active State as of {dates[selectedIndex].date}
        </span>
      </div>

      {/* Preset Milestone Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
        {dates.map((d, i) => (
          <button
            key={i}
            id={`timetravel-btn-${i}`}
            onClick={() => setSelectedIndex(i)}
            style={{
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              background: selectedIndex === i ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              border: selectedIndex === i ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-subtle)',
              color: selectedIndex === i ? '#ffffff' : 'var(--text-muted)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.7rem',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ fontWeight: '700', color: selectedIndex === i ? '#818cf8' : 'var(--text-secondary)' }}>
              {d.label}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Active Decisions for Selected Date */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '0.6rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
      }}>
        <span style={{ color: 'var(--text-muted)' }}>
          Active decisions under temporal edge filters:
        </span>
        <strong style={{ color: '#34d399' }}>
          {loading ? 'Evaluating edges...' : `${activeDecisions.length} Active Decisions`}
        </strong>
      </div>
    </div>
  );
}
