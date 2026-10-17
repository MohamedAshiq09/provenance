'use client';

import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  BrainCircuit, 
  Zap, 
  ShieldCheck, 
  Network, 
  Terminal, 
  Building2, 
  ChevronDown, 
  Sun, 
  Moon,
  Sparkles,
  BarChart3,
  Check
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  dbStatus, 
  stats, 
  staleCount = 3,
  pendingApprovalsCount = 3,
  workspace = 'novatech',
  setWorkspace
}) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const [hoveredNavItem, setHoveredNavItem] = useState(null);

  useEffect(() => {
    try {
      const current = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'light';
      setTheme(current);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {}
    setTheme(next);
  };

  const navItems = [
    { 
      id: 'chat', 
      label: 'Ask', 
      icon: BrainCircuit, 
      tooltip: 'Multi-hop graph provenance & time-travel Q&A'
    },
    { 
      id: 'health', 
      label: 'Brain Health', 
      icon: HeartPulse, 
      badge: staleCount > 0 ? `${staleCount}` : null,
      badgeType: 'warn',
      tooltip: 'Knowledge pulse, bus factors, and staleness'
    },
    { 
      id: 'ingest', 
      label: 'Live Ingest', 
      icon: Zap, 
      tooltip: 'Drop document & compute staleness ripple'
    },
    { 
      id: 'approvals', 
      label: 'Approvals', 
      icon: ShieldCheck, 
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : null,
      badgeType: 'risk',
      tooltip: 'Remediation queue & governance handoffs'
    },
    { 
      id: 'explore', 
      label: 'Graph & Timeline', 
      icon: Network, 
      tooltip: 'Full interactive Cytoscape canvas & date scrubber'
    },
    { 
      id: 'under_the_hood', 
      label: 'Benchmark & MCP', 
      icon: BarChart3, 
      tooltip: '42-Question comparative evaluation & MCP server'
    },
  ];

  const totalNodes = (stats?.Person || 0) + (stats?.Decision || 0) + (stats?.System || 0) + (stats?.Document || 0);

  return (
    <aside className="app-sidebar" style={{
      width: '240px',
      minWidth: '240px',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      fontSize: '0.85rem',
      userSelect: 'none',
      transition: 'width 0.2s ease, min-width 0.2s ease',
    }}>
      {/* Brand Header & Workspace Selector at Top */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {/* App Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: 'var(--accent-contrast)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <BrainCircuit size={16} />
          </div>
          <span className="sidebar-brand-text" style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            letterSpacing: '-0.01em',
            color: 'var(--text)',
          }}>
            Provenance
          </span>
        </div>

        {/* Workspace Switcher */}
        <div className="sidebar-workspace-wrapper" style={{ position: 'relative' }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--muted)',
            marginBottom: '0.3rem',
          }}>
            Workspace
          </div>

          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <Building2 size={13} color="var(--accent)" />
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {workspace === 'peps' ? 'Python PEPs' : 'NovaTech Labs'}
              </span>
            </div>
            <ChevronDown size={12} color="var(--muted)" />
          </button>

          {workspaceMenuOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '105%',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-subtle)',
                padding: '4px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <button
                onClick={() => {
                  if (setWorkspace) setWorkspace('novatech');
                  setWorkspaceMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: workspace === 'novatech' ? 'var(--surface-2)' : 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                  fontWeight: workspace === 'novatech' ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>NovaTech Labs</span>
                {workspace === 'novatech' && <Check size={12} color="var(--accent)" />}
              </button>

              <button
                onClick={() => {
                  if (setWorkspace) setWorkspace('peps');
                  setWorkspaceMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  background: workspace === 'peps' ? 'var(--surface-2)' : 'transparent',
                  border: 'none',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                  fontWeight: workspace === 'peps' ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>Python PEPs</span>
                {workspace === 'peps' && <Check size={12} color="var(--accent)" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Single-Line Navigation */}
      <nav style={{
        padding: '0.75rem 0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        flex: 1,
        overflowY: 'auto',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHovered = hoveredNavItem === item.id;
          return (
            <div key={item.id} style={{ position: 'relative', width: '100%' }}>
              <button
                id={`nav-item-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--surface-2)' : 'transparent',
                  border: '1px solid transparent',
                  borderColor: isActive ? 'var(--border)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '0.82rem',
                }}
                onMouseEnter={(e) => {
                  setHoveredNavItem(item.id);
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.background = 'var(--surface-2)';
                  }
                }}
                onMouseLeave={(e) => {
                  setHoveredNavItem(null);
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon size={15} color={isActive ? 'var(--accent)' : 'currentColor'} style={{ flexShrink: 0 }} />
                  <span className="sidebar-nav-label">{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`chip-${item.badgeType || 'off'} sidebar-nav-label`} style={{
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    lineHeight: '1.2',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip positioned beside item on hover only — NEVER obscures badges below */}
              {isHovered && (
                <div 
                  className="sidebar-tooltip-popover"
                  style={{
                    position: 'absolute',
                    left: '100%',
                    marginLeft: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-subtle)',
                    zIndex: 100,
                    pointerEvents: 'none',
                  }}
                >
                  {item.tooltip}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Clean Footer: Connection Dot, Model, and Theme Toggle */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--muted)',
      }}>
        {/* Connection status and model */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: dbStatus === 'connected' ? 'var(--ok)' : 'var(--warn)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span className="sidebar-footer-text" style={{ color: 'var(--text)', fontWeight: '500' }}>
            Gemini 2.5-Flash
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle color theme"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </aside>
  );
}
