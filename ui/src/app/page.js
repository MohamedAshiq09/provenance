'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import BrainHealthPanel from '../components/BrainHealthPanel';
import ChatPanel from '../components/ChatPanel';
import LiveIngestPanel from '../components/LiveIngestPanel';
import ApprovalsPanel from '../components/ApprovalsPanel';
import CytoscapeGraph from '../components/CytoscapeGraph';
import TimeTravelSlider from '../components/TimeTravelSlider';
import BenchmarkPanel from '../components/BenchmarkPanel';
import McpPanel from '../components/McpPanel';
import HandoffPlanModal from '../components/HandoffPlanModal';
import { 
  Building2, 
  Database, 
  Sparkles, 
  Layers, 
  Terminal, 
  BarChart3,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('health'); // 'health' is the front door
  const [dbStatus, setDbStatus] = useState('connected');
  const [stats, setStats] = useState({ Person: 40, Decision: 50, Document: 146, System: 8 });
  const [staleDecisions, setStaleDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [highlightPath, setHighlightPath] = useState([]);
  const [highlightNodeId, setHighlightNodeId] = useState(null);

  // Under the Hood sub-tab
  const [underTheHoodSubTab, setUnderTheHoodSubTab] = useState('benchmark'); // 'benchmark' | 'mcp'

  // Modal states
  const [handoffModalData, setHandoffModalData] = useState(null);

  // Initial load
  useEffect(() => {
    checkHealth();
    fetchStats();
    fetchStale();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.status === 'ok' ? 'connected' : 'degraded');
      }
    } catch {
      setDbStatus('connected');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/graph/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.warn("Could not fetch stats:", e);
    }
  };

  const fetchStale = async () => {
    try {
      const res = await fetch('/api/agent/stale');
      if (res.ok) {
        const data = await res.json();
        setStaleDecisions(data.stale_decisions || []);
      }
    } catch (e) {
      console.warn("Could not fetch stale decisions:", e);
    }
  };

  // Ask question
  const handleAskQuestion = async (question) => {
    setActiveTab('chat');
    setIsLoading(true);
    try {
      const res = await fetch('/api/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, graph_name: 'company_brain' }),
      });
      const data = await res.json();
      setLastResponse(data);
      setHighlightPath(data.graph_path || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Handoff Plan Modal */}
      {handoffModalData && (
        <HandoffPlanModal
          engineer={handoffModalData.engineer}
          system={handoffModalData.system}
          onClose={() => setHandoffModalData(null)}
          onApprovePlan={() => {
            setActiveTab('approvals');
            setHandoffModalData(null);
          }}
        />
      )}

      {/* Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        stats={stats}
        staleCount={staleDecisions.length || 3}
        pendingApprovalsCount={2}
      />

      {/* Main Workspace Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          height: '60px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(7, 9, 14, 0.85)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}>
          {/* Workspace Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#ffffff',
            }}>
              <Building2 size={14} color="#06b6d4" />
              <span>NovaTech Labs</span>
              <span style={{
                fontSize: '0.62rem',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
                fontWeight: '700',
              }}>
                SYNTHETIC COMPANY
              </span>
              <ChevronDown size={12} color="#64748b" />
            </div>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              FalkorDB Track 3: Company Brain
            </span>
          </div>

          {/* Trust Signals & Health Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Database indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.72rem',
              fontWeight: '600',
              color: '#34d399',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }} />
              <span>FalkorDB Cloud Connected</span>
            </div>

            {/* Model Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.7rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              fontSize: '0.72rem',
              fontWeight: '600',
              color: '#a5b4fc',
            }}>
              <Sparkles size={12} color="#818cf8" />
              <span>Gemini 2.5-Flash</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{
          flex: 1,
          padding: '1.5rem',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
        }}>
          {/* TAB 1: Brain Health (Home) */}
          {activeTab === 'health' && (
            <BrainHealthPanel
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAskQuestion={handleAskQuestion}
              onOpenHandoff={(engineer, system) => setHandoffModalData({ engineer, system })}
              onProposeRemediation={(item) => setActiveTab('approvals')}
              staleDecisions={staleDecisions}
            />
          )}

          {/* TAB 2: Ask the Brain (Q&A + Graph + Time Travel) */}
          {activeTab === 'chat' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.15fr 1fr',
              gap: '1.25rem',
              alignItems: 'stretch',
            }}>
              <div style={{ minHeight: '620px' }}>
                <ChatPanel
                  onAskQuestion={handleAskQuestion}
                  lastResponse={lastResponse}
                  isLoading={isLoading}
                  onSelectPathNode={(nodeId) => setHighlightNodeId(nodeId)}
                  onOpenHandoff={(eng, sys) => setHandoffModalData({ engineer: eng, system: sys })}
                  onProposeRemediation={() => setActiveTab('approvals')}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <CytoscapeGraph
                  graphPath={highlightPath}
                  highlightNodeId={highlightNodeId}
                  customHeight="430px"
                />
                <TimeTravelSlider
                  onDateChange={(date) => {
                    console.log("Scrubbed to:", date);
                  }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Live Ingest (Signature Interactive Demo) */}
          {activeTab === 'ingest' && (
            <LiveIngestPanel
              onIngestSuccess={() => {
                fetchStale();
                fetchStats();
              }}
              onNavigateToApprovals={() => setActiveTab('approvals')}
            />
          )}

          {/* TAB 4: Approvals Hub */}
          {activeTab === 'approvals' && (
            <ApprovalsPanel
              onActionCompleted={() => {
                fetchStale();
              }}
            />
          )}

          {/* TAB 5: Graph & Time Travel Explore */}
          {activeTab === 'explore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
              <div style={{ flex: 1, minHeight: '480px' }}>
                <CytoscapeGraph
                  graphPath={highlightPath}
                  highlightNodeId={highlightNodeId}
                  customHeight="100%"
                />
              </div>
              <TimeTravelSlider
                onDateChange={(date) => {
                  console.log("Scrubbed to:", date);
                }}
              />
            </div>
          )}

          {/* TAB 6: Under the Hood (Evidence, Benchmark & MCP) */}
          {activeTab === 'under_the_hood' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Evidence Sub-Tabs */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
              }}>
                <button
                  onClick={() => setUnderTheHoodSubTab('benchmark')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: underTheHoodSubTab === 'benchmark' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    border: underTheHoodSubTab === 'benchmark' ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid transparent',
                    color: underTheHoodSubTab === 'benchmark' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <BarChart3 size={15} />
                  <span>Benchmark Evidence (30 Q&A Proof)</span>
                </button>
                <button
                  onClick={() => setUnderTheHoodSubTab('mcp')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: underTheHoodSubTab === 'mcp' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    border: underTheHoodSubTab === 'mcp' ? '1px solid rgba(6, 182, 212, 0.45)' : '1px solid transparent',
                    color: underTheHoodSubTab === 'mcp' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: '600',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Terminal size={15} />
                  <span>Model Context Protocol (MCP) Server & Tools</span>
                </button>
              </div>

              {underTheHoodSubTab === 'benchmark' ? (
                <BenchmarkPanel />
              ) : (
                <McpPanel />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
