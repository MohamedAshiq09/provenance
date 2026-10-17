'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  Terminal,
  Play,
  Check,
  Copy,
  Shield,
  RefreshCw,
} from 'lucide-react';

const SAMPLE_PARAMS = {
  who_knows: '{\n  "system_name": "AuthService"\n}',
  trace_decision: '{\n  "decision_id": "decision_use_jwt"\n}',
  bus_factor: '{\n  "person_id": "person_priya"\n}',
  detect_staleness: '{\n  "new_doc_id": "doc_rate_limit_200"\n}',
  connection_path: '{\n  "node_a_id": "person_priya",\n  "node_b_id": "sys_auth"\n}',
  as_of: '{\n  "date_str": "2025-06-01",\n  "topic": "JWT"\n}',
  search_and_expand: '{\n  "keyword": "auth"\n}',
  get_stale_decisions: '{}',
};

export default function McpPanel() {
  const [tools, setTools] = useState([]);
  const [selectedTool, setSelectedTool] = useState('who_knows');
  const [paramsInput, setParamsInput] = useState(SAMPLE_PARAMS.who_knows);
  const [mcpOutput, setMcpOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connError, setConnError] = useState(null);
  const [copied, setCopied] = useState(false);
  const clientRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = new Client({ name: 'provenance-ui', version: '1.0.0' });
        const transport = new StreamableHTTPClientTransport(
          new URL('/mcp', window.location.origin)
        );
        await client.connect(transport);
        if (cancelled) {
          await transport.terminateSession();
          return;
        }
        clientRef.current = { client, transport };
        const { tools: liveTools } = await client.listTools();
        if (cancelled) return;
        setTools(liveTools);
        if (liveTools.length > 0 && !liveTools.some((t) => t.name === selectedTool)) {
          setSelectedTool(liveTools[0].name);
          setParamsInput(SAMPLE_PARAMS[liveTools[0].name] || '{}');
        }
      } catch (err) {
        if (!cancelled) setConnError(err.message);
      } finally {
        if (!cancelled) setIsConnecting(false);
      }
    })();
    return () => {
      cancelled = true;
      if (clientRef.current) {
        clientRef.current.transport.terminateSession().catch(() => {});
        clientRef.current = null;
      }
    };
  }, []);

  const handleSelectTool = (t) => {
    setSelectedTool(t.name);
    setParamsInput(SAMPLE_PARAMS[t.name] || '{}');
    setMcpOutput(null);
  };

  const handleRunMcp = async () => {
    if (!clientRef.current) return;
    setIsRunning(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(paramsInput);
      } catch (e) {
        alert('Invalid JSON parameters');
        setIsRunning(false);
        return;
      }
      const data = await clientRef.current.client.callTool({
        name: selectedTool,
        arguments: parsed,
      });
      setMcpOutput(data);
    } catch (err) {
      setMcpOutput({ error: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const copyConfig = () => {
    const mcpUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/mcp`
      : 'https://provenance-api-klos.onrender.com/mcp';
    const config = JSON.stringify({
      mcpServers: {
        provenance: {
          url: mcpUrl,
        },
      },
    }, null, 2);
    navigator.clipboard.writeText(config);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      paddingBottom: '3rem',
    }}>
      {/* Header */}
      <div>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          marginBottom: '0.35rem',
        }}>
          External agent tools
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--text)',
              letterSpacing: '-0.02em',
            }}>
              Model Context Protocol (MCP) Server
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--muted)',
              marginTop: '0.35rem',
              lineHeight: '1.5',
            }}>
              Direct streamable HTTP MCP server exposing FalkorDB graph tools to external agents (Claude Desktop, Cursor, AGY).
            </p>
          </div>

          <button
            onClick={copyConfig}
            className="btn-ghost"
            style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem', gap: '5px' }}
          >
            {copied ? <Check size={14} color="var(--ok)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied Config' : 'Copy MCP Config'}</span>
          </button>
        </div>
      </div>

      {isConnecting && (
        <div className="clean-card" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
          Connecting to MCP server at /mcp (Streamable HTTP)…
        </div>
      )}
      {connError && (
        <div className="chip-risk" style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
          <Shield size={14} style={{ verticalAlign: '-2px', marginRight: '0.4rem' }} />
          MCP connection failed: {connError}. Verify backend is running on :8000.
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {/* Tool List */}
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
              Live Tools
            </h2>
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
              {tools.length} available
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {tools.map((t) => (
              <div
                key={t.name}
                onClick={() => handleSelectTool(t)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTool === t.name ? 'var(--surface-2)' : 'transparent',
                  border: selectedTool === t.name ? '1px solid var(--accent)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code className="font-mono" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text)' }}>
                    {t.name}()
                  </code>
                  <span className="chip-accent" style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    Tool
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', margin: 0, lineHeight: '1.4' }}>
                  {(t.description || '').split('. USE FOR:')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Terminal */}
        <div className="clean-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>
              Invoke: <code className="font-mono" style={{ color: 'var(--accent)' }}>{selectedTool}</code>
            </h2>
            <button
              onClick={handleRunMcp}
              disabled={isRunning || !clientRef.current}
              className="btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem', gap: '4px' }}
            >
              {isRunning ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
              <span>{isRunning ? 'Executing…' : 'Execute'}</span>
            </button>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              JSON Parameters
            </label>
            <textarea
              value={paramsInput}
              onChange={(e) => setParamsInput(e.target.value)}
              rows={4}
              className="font-mono"
              style={{
                width: '100%',
                padding: '0.65rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontSize: '0.78rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
              tools/call Response (JSON-RPC)
            </label>
            <pre className="font-mono" style={{
              flex: 1,
              minHeight: '200px',
              maxHeight: '320px',
              overflowY: 'auto',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              fontSize: '0.74rem',
              lineHeight: '1.45',
              margin: 0,
            }}>
              {mcpOutput ? JSON.stringify(mcpOutput, null, 2) : '// Click "Execute" to invoke tools/call against FalkorDB via MCP...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
