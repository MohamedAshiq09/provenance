'use client';

import React from 'react';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function HandoffPlanModal({ 
  engineer = 'Priya Sharma', 
  system = 'AuthService', 
  onClose,
  onApprovePlan
}) {
  const steps = [
    {
      phase: 'Phase 1: IAM & Credentials Transfer',
      desc: 'Provision secondary admin keys and production cluster deployment access for Marcus Vance.',
      eta: 'Day 1'
    },
    {
      phase: 'Phase 2: Architectural Deep-Dive',
      desc: '2 pairing sessions on Opaque Token revocation logic and Redis session cluster failover.',
      eta: 'Day 2–3'
    },
    {
      phase: 'Phase 3: Ownership Edge Graph Mutation',
      desc: 'Execute Cypher transaction: MERGE (p:Person {name: "Marcus Vance"})-[r:WORKED_ON]->(s:System {name: "AuthService"}).',
      eta: 'Day 4'
    },
    {
      phase: 'Phase 4: Announcement',
      desc: 'Notify #eng-leads that AuthService bus factor is restored from 1 to 2.',
      eta: 'Day 5'
    }
  ];

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
          maxWidth: '560px',
          width: '100%',
          background: 'var(--surface)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
              <span className="chip-risk" style={{ fontSize: '0.65rem' }}>
                Bus Factor Risk
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Knowledge Handoff
              </span>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text)' }}>
              Handoff Plan: {system}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px', margin: 0 }}>
              Sole maintainer: <strong style={{ color: 'var(--text)' }}>{engineer}</strong> • Target secondary: <strong style={{ color: 'var(--text)' }}>Marcus Vance</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '3px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {steps.map((st, i) => (
            <div
              key={i}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)' }}>
                  {st.phase}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  {st.desc}
                </div>
              </div>
              <span className="chip-off" style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                {st.eta}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              if (onApprovePlan) onApprovePlan();
              onClose();
            }}
            className="btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', gap: '4px' }}
          >
            <CheckCircle2 size={14} />
            <span>Submit Proposal to Approvals</span>
          </button>
        </div>
      </div>
    </div>
  );
}
