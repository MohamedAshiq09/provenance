'use client';

import React from 'react';
import { 
  HeartPulse, 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  Network, 
  Layers, 
  Terminal, 
  Sparkles,
  Database,
  ChevronRight,
  Building2,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  stats, 
  staleCount = 3,
  pendingApprovalsCount = 3
}) {
  const navItems = [
    { 
      id: 'health', 
      label: 'Brain Health', 
      icon: HeartPulse, 
      badge: staleCount > 0 ? `${staleCount} alerts` : null,
      badgeColor: 'amber',
      subtitle: 'Knowledge pulse & staleness'
    },
    { 
      id: 'chat', 
      label: 'Ask the Brain', 
      icon: BrainCircuit, 
      subtitle: 'Multi-hop graph provenance'
    },
    { 
      id: 'ingest', 
      label: 'Live Ingest', 
      icon: Zap, 
      badge: 'Interactive',
      badgeColor: 'cyan',
      subtitle: 'Drop doc & see ripple'
    },
    { 
      id: 'approvals', 
      label: 'Approvals Hub', 
      icon: ShieldCheck, 
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeColor: 'rose',
      subtitle: 'Remediations & handoffs'
    },
    { 
      id: 'explore', 
      label: 'Graph & Time Travel', 
      icon: Network, 
      subtitle: 'Temporal as-of scrubbing'
    },
    { 
      id: 'under_the_hood', 
      label: 'Under the Hood', 
      icon: Terminal, 
      badge: 'Evidence',
      badgeColor: 'indigo',
      subtitle: 'MCP Server & Benchmarks'
    },
  ];

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      background: 'rgba(10, 15, 29, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.25rem 1.25rem 1rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(6, 182, 212, 0.4)',
          }}>
            <BrainCircuit size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ 
                fontSize: '1.15rem', 
                fontWeight: '800', 
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}>
                PROVENANCE
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: '600' }}>
              Self-Auditing Company Brain
            </p>
          </div>
        </div>

        {/* Workspace selector / badge */}
        <div style={{
          marginTop: '0.9rem',
          padding: '0.45rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Building2 size={13} color="#94a3b8" />
            <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#e2e8f0' }}>NovaTech Labs</span>
          </div>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            fontWeight: '600',
          }}>
            Synthetic
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav style={{
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        flex: 1,
        overflowY: 'auto',
      }}>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          padding: '0 0.5rem 0.4rem 0.5rem',
        }}>
          Workflows
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={17} color={isActive ? '#38bdf8' : '#94a3b8'} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: isActive ? '700' : '500' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '0.62rem',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: item.badgeColor === 'amber' ? 'rgba(245, 158, 11, 0.2)' :
                              item.badgeColor === 'rose' ? 'rgba(244, 63, 94, 0.2)' :
                              item.badgeColor === 'cyan' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: item.badgeColor === 'amber' ? '#f59e0b' :
                         item.badgeColor === 'rose' ? '#fb7185' :
                         item.badgeColor === 'cyan' ? '#22d3ee' : '#a5b4fc',
                  border: `1px solid ${
                    item.badgeColor === 'amber' ? 'rgba(245, 158, 11, 0.3)' :
                    item.badgeColor === 'rose' ? 'rgba(244, 63, 94, 0.3)' :
                    item.badgeColor === 'cyan' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(99, 102, 241, 0.3)'
                  }`,
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Database & LLM Engine Status Footer */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}>
        {/* FalkorDB Cloud */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Database size={13} color="#06b6d4" />
            <span style={{ color: 'var(--text-secondary)' }}>FalkorDB Cloud</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: dbStatus === 'connected' ? '#10b981' : '#f59e0b',
              boxShadow: dbStatus === 'connected' ? '0 0 8px #10b981' : 'none',
            }} />
            <span style={{ 
              fontWeight: '700', 
              color: dbStatus === 'connected' ? '#34d399' : '#fbbf24',
              fontSize: '0.7rem' 
            }}>
              {stats?.Person ? `${stats.Person + stats.Decision + stats.System + stats.Document} nodes` : 'Connected'}
            </span>
          </div>
        </div>

        {/* Model Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={13} color="#818cf8" />
            <span style={{ color: 'var(--text-secondary)' }}>Model</span>
          </div>
          <span style={{
            fontSize: '0.68rem',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            color: '#c7d2fe',
            fontWeight: '600',
          }}>
            Gemini 2.0-Flash
          </span>
        </div>

        {/* Track Info */}
        <div style={{
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '0.3rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <span>FalkorDB Track 3</span>
          <span>v2.1 • Graph Verified</span>
        </div>
      </div>
    </aside>
  );
}
