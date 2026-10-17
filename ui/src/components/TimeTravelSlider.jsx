'use client';

import React, { useState, useEffect } from 'react';
import { History, Calendar } from 'lucide-react';

export default function TimeTravelSlider({ onDateChange, workspace = 'novatech', currentDate = null }) {
  const novatechDates = [
    { 
      label: 'Jun 2024', 
      date: '2024-06-01', 
      desc: 'ADR-001: JWT era' 
    },
    { 
      label: 'Jan 2025', 
      date: '2025-01-01', 
      desc: 'SEC-202: Incident drift' 
    },
    { 
      label: 'Aug 2025', 
      date: '2025-08-01', 
      desc: 'ADR-002: Opaque tokens' 
    },
    { 
      label: 'Oct 01, 2026', 
      date: '2026-10-01', 
      desc: 'Rate limit 50 active' 
    },
    { 
      label: 'Oct 17, 2026', 
      date: '2026-10-17', 
      desc: 'Rate limit 50 stale' 
    },
  ];

  const pepsDates = [
    {
      label: 'May 2000',
      date: '2000-05-01',
      desc: 'PEP 248 DB-API 1.0'
    },
    {
      label: 'Apr 2001',
      date: '2001-04-12',
      desc: 'PEP 249 DB-API 2.0'
    },
    {
      label: 'Apr 2005',
      date: '2005-04-28',
      desc: 'PEP 345 Metadata'
    },
    {
      label: 'Sep 2015',
      date: '2015-09-13',
      desc: 'PEP 484 Type Hints'
    },
  ];

  const dates = workspace === 'peps' ? pepsDates : novatechDates;

  const [selectedIndex, setSelectedIndex] = useState(dates.length - 1);
  const [activeDecisions, setActiveDecisions] = useState([]);
  const [isRevalidating, setIsRevalidating] = useState(false);

  useEffect(() => {
    if (currentDate) {
      const idx = dates.findIndex(d => d.date === currentDate);
      if (idx !== -1) {
        setSelectedIndex(idx);
        return;
      }
    }
    const defaultIdx = dates.length - 1;
    setSelectedIndex(defaultIdx);
    fetchDecisionsForDate(dates[defaultIdx].date);
  }, [workspace, currentDate]);

  useEffect(() => {
    if (dates[selectedIndex]) {
      fetchDecisionsForDate(dates[selectedIndex].date);
    }
  }, [selectedIndex]);

  const fetchDecisionsForDate = async (dateStr) => {
    setIsRevalidating(true);
    try {
      const res = await fetch(`/api/graph/as-of?date=${dateStr}&workspace=${workspace}`);
      if (res.ok) {
        const data = await res.json();
        const list = data.decisions || [];
        setActiveDecisions(list);
        if (onDateChange) onDateChange(dateStr, list);
      }
    } catch (e) {
      console.warn("Time-travel as-of fetch background warning:", e);
    } finally {
      setIsRevalidating(false);
    }
  };

  const formatDecisionTitle = (d) => {
    if (d.title) return d.title;
    if (d.id === 'decision_opaque_tokens') return 'ADR-002: Opaque Tokens';
    if (d.id === 'decision_use_jwt') return 'ADR-001: JWT Auth';
    if (d.id === 'decision_rate_limit_mobile' || d.id === 'decision_rate_limit_50') return 'ADR-004: Rate Limit 50 rps';
    if (d.id === 'decision_rate_limit_200') return 'ADR-021: Rate Limit 200 rps';
    if (d.id === 'decision_hpa_auth' || d.id === 'decision_hpa') return 'ADR-003: HPA Autoscaler';
    return d.id.replace(/^decision_/, '').replace(/_/g, ' ');
  };

  return (
    <div className="clean-card" style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <History size={13} color="var(--accent)" />
          <span style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--text)' }}>
            Temporal As-Of Scrubbing
          </span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
          {dates[selectedIndex].date}
        </span>
      </div>

      {/* Preset Milestone Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
        {dates.map((d, i) => (
          <button
            key={i}
            id={`timetravel-btn-${i}`}
            onClick={() => setSelectedIndex(i)}
            style={{
              padding: '5px 4px',
              borderRadius: 'var(--radius-sm)',
              background: selectedIndex === i ? 'var(--surface-2)' : 'transparent',
              border: selectedIndex === i ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: selectedIndex === i ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '0.7rem',
              fontWeight: selectedIndex === i ? '600' : '400',
              transition: 'all 0.15s ease',
            }}
          >
            <div>{d.label}</div>
          </button>
        ))}
      </div>

      {/* Active Decisions for Selected Date */}
      <div style={{
        padding: '0.5rem 0.65rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--muted)' }}>
          <span>Active in graph:</span>
          <strong style={{ color: 'var(--ok)', fontWeight: '600' }}>
            {activeDecisions.length} Decisions
          </strong>
        </div>

        {activeDecisions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
            {activeDecisions.slice(0, 4).map((d, i) => (
              <span
                key={i}
                className="chip-ok"
                style={{
                  fontSize: '0.62rem',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {formatDecisionTitle(d)}
              </span>
            ))}
            {activeDecisions.length > 4 && (
              <span style={{ fontSize: '0.62rem', color: 'var(--muted)', alignSelf: 'center' }}>
                +{activeDecisions.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
