'use client';

import React from 'react';
import { 
  BrainCircuit, 
  Network, 
  AlertTriangle, 
  BarChart3, 
  Terminal, 
  Activity,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  stats, 
  staleCount = 1 
}) {
  const tabs = [
    { id: 'chat', label: 'Company Brain Q&A', icon: BrainCircuit },
    { id: 'graph', label: 'Graph Explorer', icon: Network },
    { id: 'stale', label: 'Staleness Radar', icon: AlertTriangle, badge: staleCount },
    { id: 'benchmark', label: 'Benchmark (30 Q&A)', icon: BarChart3 },
    { id: 'mcp', label: 'MCP & Cypher Tools', icon: Terminal },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 1.5rem',
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand & Track Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <img 
              src="/saturn-logo.png" 
              alt="Saturn Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '800', 
                letterSpacing: '-0.02em',
                background: 'linear-gradient(90deg, #ffffff, #cbd5e1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                SATURN
              </h1>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#22d3ee',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}>
                <Sparkles size={11} /> FalkorDB Track 3
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Self-Auditing Company Brain • Proves Answers • Flags Stale Knowledge
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Icon size={15} color={isActive ? '#818cf8' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 'var(--radius-full)',
                    background: '#f43f5e',
                    color: '#ffffff',
                    marginLeft: '0.2rem',
                  }}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: dbStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${dbStatus === 'connected' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
            fontSize: '0.75rem',
            color: dbStatus === 'connected' ? '#34d399' : '#fb7185',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: dbStatus === 'connected' ? '#10b981' : '#f43f5e',
              display: 'inline-block',
              boxShadow: dbStatus === 'connected' ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
            }} />
            <span>FalkorDB {dbStatus}</span>
          </div>

          {stats && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderLeft: '1px solid var(--border-subtle)',
              paddingLeft: '0.75rem',
            }}>
              <span style={{ color: '#38bdf8', fontWeight: '600' }}>{stats.Person || 40}</span> people • <span style={{ color: '#a78bfa', fontWeight: '600' }}>{stats.Decision || 50}</span> decisions
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
