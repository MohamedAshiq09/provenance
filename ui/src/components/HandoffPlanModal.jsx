'use client';

import React from 'react';
import { X, Users, CheckCircle2, ArrowRight, ShieldAlert, Sparkles, Send } from 'lucide-react';

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
      eta: 'Day 1 (Immediate)'
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
      phase: 'Phase 4: Slack & Incident Escalation Announcement',
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
      background: 'rgba(0, 0, 0, 0.78)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }} onClick={onClose}>
      <div 
        className="glass-panel" 
        style={{
          maxWidth: '680px',
          width: '100%',
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <ShieldAlert size={12} /> BUS FACTOR REMEDIATION
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Automated Plan Generation
              </span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
              Knowledge Handoff Plan: {system}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
              Primary Sole Maintainer: <strong style={{ color: '#ffffff' }}>{engineer}</strong> • Target Secondary: <strong style={{ color: '#38bdf8' }}>Marcus Vance</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {steps.map((st, i) => (
            <div
              key={i}
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>
                  {st.phase}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                  {st.desc}
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                whiteSpace: 'nowrap',
              }}>
                {st.eta}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.6rem',
          marginTop: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              if (onApprovePlan) onApprovePlan();
              onClose();
            }}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #f43f5e, #a855f7)',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 0 15px rgba(244, 63, 94, 0.35)',
            }}
          >
            <CheckCircle2 size={15} />
            <span>Submit Proposal to Approvals Hub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
