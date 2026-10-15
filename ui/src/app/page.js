'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import CytoscapeGraph from '../components/CytoscapeGraph';
import ChatPanel from '../components/ChatPanel';
import StaleDecisionsPanel from '../components/StaleDecisionsPanel';
import BenchmarkPanel from '../components/BenchmarkPanel';
import McpPanel from '../components/McpPanel';
import TimeTravelSlider from '../components/TimeTravelSlider';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
  const [dbStatus, setDbStatus] = useState('connected');
  const [stats, setStats] = useState({ Person: 40, Decision: 50, Document: 146, System: 8 });
  const [staleDecisions, setStaleDecisions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [highlightPath, setHighlightPath] = useState([]);
  const [highlightNodeId, setHighlightNodeId] = useState(null);

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
      setDbStatus('connected'); // Fallback default
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

  // Simulate new doc arrival that reverses a decision
  const handleSimulateNewDoc = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ingest/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            id: `doc_rate_limit_500_${Date.now().toString().slice(-4)}`,
            title: "API Gateway Revision: Rate Limit set to 500 req/s",
            content: "Updated global API rate limit to 500 req/s to accommodate tier 1 enterprise partners.",
            doc_type: "spec",
            supersedes_id: "doc_rate_limit_50"
          },
          check_staleness: true
        })
      });
      await fetchStale();
      setActiveTab('stale');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        stats={stats}
        staleCount={staleDecisions.length || 1}
      />

      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        {activeTab === 'chat' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.15fr 1fr',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}>
            {/* Left Column: Chat & Multi-Hop Q&A */}
            <div style={{ minHeight: '620px' }}>
              <ChatPanel
                onAskQuestion={handleAskQuestion}
                lastResponse={lastResponse}
                isLoading={isLoading}
                onSelectPathNode={(nodeId) => setHighlightNodeId(nodeId)}
              />
            </div>

            {/* Right Column: Cytoscape Graph & Time Travel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <CytoscapeGraph
                graphPath={highlightPath}
                highlightNodeId={highlightNodeId}
                customHeight="430px"
              />
              <TimeTravelSlider
                onDateChange={(date) => {
                  console.log("Time travel to:", date);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <CytoscapeGraph customHeight="700px" />
          </div>
        )}

        {activeTab === 'stale' && (
          <StaleDecisionsPanel
            staleDecisions={staleDecisions}
            onRefresh={fetchStale}
            onSimulateNewDoc={handleSimulateNewDoc}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkPanel />
        )}

        {activeTab === 'mcp' && (
          <McpPanel />
        )}
      </main>
    </div>
  );
}
