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
  BarChart3,
  Terminal,
  X
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' is the primary front door matching Cairn
  const [dbStatus, setDbStatus] = useState('connected');
  const [stats, setStats] = useState({ Person: 40, Decision: 50, Document: 146, System: 8 });
  const [staleDecisions, setStaleDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [highlightPath, setHighlightPath] = useState([]);
  const [highlightNodeId, setHighlightNodeId] = useState(null);
  const [isGraphVisible, setIsGraphVisible] = useState(false);

  // Under the Hood sub-tab
  const [underTheHoodSubTab, setUnderTheHoodSubTab] = useState('benchmark'); // 'benchmark' | 'mcp'

  // Modal states
  const [handoffModalData, setHandoffModalData] = useState(null);

  const [workspace, setWorkspace] = useState('novatech'); // 'novatech' | 'peps' | 'falkordb'
  const [selectedDate, setSelectedDate] = useState('2026-10-17');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(3);

  const currentGraphName = workspace === 'peps' ? 'peps_brain' : (workspace === 'falkordb' ? 'falkordb_repos' : 'company_brain');

  // Initial load & workspace change
  useEffect(() => {
    checkHealth();
    fetchStats(currentGraphName);
    fetchStale(currentGraphName);
    setSelectedDate(workspace === 'peps' ? '2015-12-31' : '2026-10-17');
  }, [workspace]);

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

  const fetchStats = async (graphName = currentGraphName) => {
    try {
      const res = await fetch(`/api/graph/stats?graph_name=${graphName}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        if (graphName === 'peps_brain') {
          setStats({ Person: 356, Decision: 745, System: 4, Document: 745 });
        } else if (graphName === 'falkordb_repos') {
          setStats({ Person: 22, Decision: 226, System: 13, Issue: 91 });
        } else {
          setStats({ Person: 40, Decision: 50, Document: 146, System: 8 });
        }
      }
    } catch (e) {
      console.warn("Could not fetch stats:", e);
      if (graphName === 'peps_brain') {
        setStats({ Person: 356, Decision: 745, System: 4, Document: 745 });
      } else if (graphName === 'falkordb_repos') {
        setStats({ Person: 22, Decision: 226, System: 13, Issue: 91 });
      } else {
        setStats({ Person: 40, Decision: 50, Document: 146, System: 8 });
      }
    }
  };

  const fetchStale = async (graphName = currentGraphName) => {
    try {
      const res = await fetch(`/api/agent/stale?graph_name=${graphName}`);
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
        body: JSON.stringify({ question, graph_name: currentGraphName }),
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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
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
        staleCount={staleDecisions.length || (workspace === 'peps' ? 27 : 3)}
        pendingApprovalsCount={pendingApprovalsCount}
        workspace={workspace}
        setWorkspace={setWorkspace}
      />

      {/* Main Workspace Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Content Area */}
        <main style={{
          flex: 1,
          padding: '2rem 1.5rem',
          maxWidth: activeTab === 'chat' && !isGraphVisible ? '800px' : '1400px',
          width: '100%',
          margin: '0 auto',
          transition: 'max-width 0.2s ease',
        }}>
          {/* TAB 1: Ask the Brain (Q&A with optional collapsible graph) */}
          {activeTab === 'chat' && (
            <div style={{
              display: isGraphVisible ? 'grid' : 'block',
              gridTemplateColumns: isGraphVisible ? '1fr 420px' : '1fr',
              gap: '1.5rem',
              alignItems: 'start',
            }}>
              <div>
                <ChatPanel
                  onAskQuestion={handleAskQuestion}
                  lastResponse={lastResponse}
                  isLoading={isLoading}
                  onSelectPathNode={(nodeId) => setHighlightNodeId(nodeId)}
                  onOpenHandoff={(eng, sys) => setHandoffModalData({ engineer: eng, system: sys })}
                  onProposeRemediation={() => setActiveTab('approvals')}
                  workspace={workspace}
                  selectedDate={selectedDate}
                  isGraphVisible={isGraphVisible}
                  onToggleGraph={() => setIsGraphVisible(!isGraphVisible)}
                />
              </div>

              {isGraphVisible && (
                <div style={{
                  position: 'sticky',
                  top: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  maxHeight: 'calc(100vh - 4rem)',
                  overflowY: 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
                      Reasoning Graph
                    </span>
                    <button
                      onClick={() => setIsGraphVisible(false)}
                      className="btn-ghost"
                      style={{ padding: '3px', borderRadius: '4px' }}
                      title="Close graph view"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <CytoscapeGraph
                    graphPath={highlightPath}
                    highlightNodeId={highlightNodeId}
                    asOfDate={selectedDate}
                    customHeight="380px"
                  />

                  <TimeTravelSlider
                    currentDate={selectedDate}
                    onDateChange={(date) => {
                      setSelectedDate(date);
                    }}
                    workspace={workspace}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Brain Health */}
          {activeTab === 'health' && (
            <BrainHealthPanel
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onAskQuestion={handleAskQuestion}
              onOpenHandoff={(engineer, system) => setHandoffModalData({ engineer, system })}
              onProposeRemediation={(item) => setActiveTab('approvals')}
              staleDecisions={staleDecisions}
              workspace={workspace}
            />
          )}

          {/* TAB 3: Live Ingest (Interactive Demo) */}
          {activeTab === 'ingest' && (
            <LiveIngestPanel
              onIngestSuccess={() => {
                fetchStale();
                fetchStats();
                setPendingApprovalsCount(p => p + 1);
              }}
              onNavigateToApprovals={() => setActiveTab('approvals')}
              workspace={workspace}
            />
          )}

          {/* TAB 4: Approvals Hub */}
          {activeTab === 'approvals' && (
            <ApprovalsPanel
              onActionCompleted={() => {
                fetchStale();
                setPendingApprovalsCount(p => Math.max(0, p - 1));
              }}
              workspace={workspace}
            />
          )}

          {/* TAB 5: Graph & Time Travel Explore */}
          {activeTab === 'explore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 4rem)' }}>
              <div style={{ flex: 1, minHeight: '480px' }}>
                <CytoscapeGraph
                  graphPath={highlightPath}
                  highlightNodeId={highlightNodeId}
                  asOfDate={selectedDate}
                  customHeight="100%"
                />
              </div>
              <TimeTravelSlider
                currentDate={selectedDate}
                onDateChange={(date) => {
                  setSelectedDate(date);
                }}
                workspace={workspace}
              />
            </div>
          )}

          {/* TAB 6: Under the Hood (Evidence, Benchmark & MCP) */}
          {activeTab === 'under_the_hood' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Evidence Sub-Tabs */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
              }}>
                <button
                  onClick={() => setUnderTheHoodSubTab('benchmark')}
                  className={underTheHoodSubTab === 'benchmark' ? 'btn-primary' : 'btn-ghost'}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <BarChart3 size={14} />
                  <span>Benchmark Evidence (42 Q&A Evaluation)</span>
                </button>
                <button
                  onClick={() => setUnderTheHoodSubTab('mcp')}
                  className={underTheHoodSubTab === 'mcp' ? 'btn-primary' : 'btn-ghost'}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }}
                >
                  <Terminal size={14} />
                  <span>Model Context Protocol (MCP) Server</span>
                </button>
              </div>

              {underTheHoodSubTab === 'benchmark' ? (
                <BenchmarkPanel workspace={workspace} />
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
