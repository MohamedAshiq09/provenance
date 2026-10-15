'use client';

import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  Code2, 
  Check, 
  Copy, 
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export default function McpPanel() {
  const [selectedTool, setSelectedTool] = useState('who_knows');
  const [paramsInput, setParamsInput] = useState('{\n  "system_name": "AuthService"\n}');
  const [mcpOutput, setMcpOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const tools = [
    { name: 'who_knows', desc: 'Find who has real expertise on a system via graph centrality', sample: '{\n  "system_name": "AuthService"\n}' },
    { name: 'trace_decision', desc: 'Trace the full provenance chain of a decision', sample: '{\n  "decision_id": "decision_use_jwt"\n}' },
    { name: 'bus_factor', desc: 'Analyze single point of failure risk if a person leaves', sample: '{\n  "person_id": "person_priya"\n}' },
    { name: 'detect_staleness', desc: 'Traverse backward dependencies to find decisions made stale by new doc', sample: '{\n  "new_doc_id": "doc_rate_limit_200"\n}' },
    { name: 'connection_path', desc: 'Find shortest path connection between any two nodes', sample: '{\n  "node_a_id": "person_priya",\n  "node_b_id": "sys_auth"\n}' },
    { name: 'as_of', desc: 'Temporal time-travel query filtering valid_from/valid_to', sample: '{\n  "date_str": "2025-06-01",\n  "topic": "JWT"\n}' },
    { name: 'get_stale_decisions', desc: 'Get all stale decisions with impact radius', sample: '{}' },
  ];

  const handleSelectTool = (t) => {
    setSelectedTool(t.name);
    setParamsInput(t.sample);
    setMcpOutput(null);
  };

  const handleRunMcp = async () => {
    setIsRunning(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(paramsInput);
      } catch (e) {
        alert("Invalid JSON parameters");
        setIsRunning(false);
        return;
      }

      const res = await fetch('/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: selectedTool,
          params: parsed,
          graph_name: 'company_brain',
        }),
      });
      const data = await res.json();
      setMcpOutput(data);
    } catch (err) {
      setMcpOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const copyConfig = () => {
    const config = JSON.stringify({
      mcpServers: {
        provenance: {
          url: "http://localhost:8000/mcp",
          tools: ["who_knows", "trace_decision", "bus_factor", "detect_staleness", "as_of"]
        }
      }
    }, null, 2);
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner */}
      <div className="glass-panel" style={{
        padding: '1.25rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(99, 102, 241, 0.1))',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(6, 182, 212, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(6, 182, 212, 0.4)',
          }}>
            <Terminal size={22} color="#06b6d4" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>
              Model Context Protocol (MCP) Server
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Any external agent (Claude, Cursor, Gemini) can plug directly into the Provenance Company Brain via MCP.
            </p>
          </div>
        </div>

        <button
          id="copy-mcp-config"
          onClick={copyConfig}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 0.9rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--border-subtle)',
            color: '#ffffff',
            fontSize: '0.78rem',
            cursor: 'pointer',
          }}
        >
          {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
          <span>{copied ? 'Copied Config!' : 'Copy Claude MCP Config'}</span>
        </button>
      </div>

      {/* Two Column Layout: Tool Selection & Tester */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.25rem' }}>
        {/* Tool List */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
            Available FalkorDB MCP Tools
          </h3>
          {tools.map((t) => (
            <div
              key={t.name}
              id={`tool-card-${t.name}`}
              onClick={() => handleSelectTool(t)}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: selectedTool === t.name ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedTool === t.name ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700' }}>{t.name}()</code>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Cypher Tool</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: '1.3' }}>
                {t.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Live MCP Execution Terminal */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff' }}>
              Live Tool Invocation: <code style={{ color: '#06b6d4' }}>{selectedTool}</code>
            </h3>
            <button
              id="run-mcp-btn"
              onClick={handleRunMcp}
              disabled={isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)',
              }}
            >
              <Play size={13} />
              <span>{isRunning ? 'Executing Cypher...' : 'Execute Tool'}</span>
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Tool JSON Parameters
            </label>
            <textarea
              id="mcp-params-input"
              value={paramsInput}
              onChange={(e) => setParamsInput(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                marginTop: '0.3rem',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: '#04060a',
                border: '1px solid var(--border-subtle)',
                color: '#34d399',
                fontSize: '0.78rem',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
              FalkorDB MCP Response (Real-Time JSON)
            </label>
            <pre style={{
              flex: 1,
              minHeight: '200px',
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: '#04060a',
              border: '1px solid var(--border-subtle)',
              color: '#38bdf8',
              fontSize: '0.74rem',
              lineHeight: '1.4',
            }}>
              {mcpOutput ? JSON.stringify(mcpOutput, null, 2) : '// Click "Execute Tool" to invoke this MCP endpoint against FalkorDB...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
