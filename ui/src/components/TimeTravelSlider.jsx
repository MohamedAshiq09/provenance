'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, History, Sparkles, Check, ChevronRight, Layers, FileCheck } from 'lucide-react';

export default function TimeTravelSlider({ onDateChange, workspace = 'novatech' }) {
  const novatechDates = [
    { 
      label: 'Jun 2024 (JWT Era)', 
      date: '2024-06-01', 
      desc: 'ADR-001 adopted: Stateless JWT tokens across all microservices' 
    },
    { 
      label: 'Jan 2025 (Security Drift)', 
      date: '2025-01-01', 
      desc: 'Incident SEC-202: Immediate token revocation flaw discovered' 
    },
    { 
      label: 'Aug 2025 (Token Reversal)', 
      date: '2025-08-01', 
      desc: 'ADR-002 adopted: JWT superseded by Opaque Tokens in AuthService' 
    },
    { 
      label: 'Present (Oct 2026)', 
      date: '2026-10-15', 
      desc: 'Rate limit 200 rps active, HPA autoscaling enabled' 
    },
  ];

  const pepsDates = [
    {
      label: 'May 2000 (DB-API 1.0)',
      date: '2000-05-01',
      desc: 'PEP 248 adopted: Python Database API Specification 1.0'
    },
    {
      label: 'Apr 2001 (DB-API 2.0 Supersedes)',
      date: '2001-04-12',
      desc: 'PEP 249 adopted: Database API 2.0 supersedes PEP 248'
    },
    {
      label: 'Apr 2005 (Metadata Standard)',
      date: '2005-04-28',
      desc: 'PEP 345 adopted: Core packaging metadata specification'
    },
    {
      label: 'Sep 2015 (Type Hints Era)',
      date: '2015-09-13',
      desc: 'PEP 484 adopted: Type hints and static analysis specification'
    },
  ];

  const dates = workspace === 'peps' ? pepsDates : novatechDates;

  const [selectedIndex, setSelectedIndex] = useState(dates.length - 1);
  const [activeDecisions, setActiveDecisions] = useState([]);
  const [isRevalidating, setIsRevalidating] = useState(false);

  useEffect(() => {
    // Reset to last milestone on workspace switch
    const defaultIdx = dates.length - 1;
    setSelectedIndex(defaultIdx);
    fetchDecisionsForDate(dates[defaultIdx].date);
  }, [workspace]);

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
    if (d.id === 'decision_use_jwt') return 'ADR-001: JWT Authentication';
    if (d.id === 'decision_rate_limit_mobile' || d.id === 'decision_rate_limit_50') return 'ADR-004: Rate Limit 50 rps';
    if (d.id === 'decision_rate_limit_200') return 'ADR-021: Rate Limit 200 rps';
    if (d.id === 'decision_hpa_auth' || d.id === 'decision_hpa') return 'ADR-003: HPA Autoscaler';
    if (d.id === 'decision_cockroach_billing') return 'ADR-005: CockroachDB Billing';
    if (d.id === 'decision_postgres_billing') return 'ADR-002: Postgres Billing';
    return d.id.replace(/^decision_/, '').replace(/_/g, ' ');
  };

  return (
    <div className="glass-panel" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <History size={16} color="#818cf8" />
          <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: '#ffffff' }}>
            Temporal Time-Travel "As-Of" Scrubbing
          </h3>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '600' }}>
          Graph State as of {dates[selectedIndex].date}
        </span>
      </div>

      {/* Preset Milestone Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
        {dates.map((d, i) => (
          <button
            key={i}
            id={`timetravel-btn-${i}`}
            onClick={() => setSelectedIndex(i)}
            style={{
              padding: '0.55rem',
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
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '3px', lineHeight: '1.3' }}>
              {d.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Active Decisions for Selected Date — Count is ALWAYS rendered, never stuck or flashing 0 */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        padding: '0.75rem 0.9rem',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileCheck size={14} color="#34d399" />
            <span>Active decisions under temporal edge filters (valid_from ≤ date &lt; valid_to):</span>
          </span>
          <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {isRevalidating && activeDecisions.length === 0 ? (
              <span style={{
                display: 'inline-block',
                width: '110px',
                height: '14px',
                borderRadius: '4px',
                background: 'rgba(52, 211, 153, 0.25)',
                animation: 'pulse 1.5s infinite',
              }} />
            ) : (
              <span>{activeDecisions.length} Active Decisions</span>
            )}
            {isRevalidating && (
              <span style={{ 
                fontSize: '0.62rem', 
                color: '#38bdf8', 
                fontWeight: '400',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '1px 5px',
                borderRadius: '3px'
              }}>
                syncing
              </span>
            )}
          </strong>
        </div>

        {/* Live decision tags active on this date */}
        {activeDecisions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.2rem' }}>
            {activeDecisions.slice(0, 5).map((d, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.66rem',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  color: '#6ee7b7',
                }}
              >
                {formatDecisionTitle(d)}
              </span>
            ))}
            {activeDecisions.length > 5 && (
              <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                +{activeDecisions.length - 5} more
              </span>
            )}
          </div>
        ) : isRevalidating ? (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ width: '90px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ width: '110px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ width: '80px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
