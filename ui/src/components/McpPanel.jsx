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
} from 'lucide-react';

// Sample params per known tool (used to prefill the textarea; the tool list
// itself always comes live from the MCP server via tools/list).
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

  // Connect once: real MCP client over Streamable HTTP (same-origin /mcp,
  // proxied to the backend by next.config.mjs). No REST shim involved.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Genuine MCP tools/call over Streamable HTTP (JSON-RPC under the hood).
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
    // Generic Streamable-HTTP MCP client config (works with any MCP host).
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
              This panel is a real MCP client: tools/list + tools/call over Streamable HTTP against the Provenance Company Brain.
              {connError ? '' : ` ${tools.length} live tools connected.`}
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
          <span>{copied ? 'Copied Config!' : 'Copy MCP Config'}</span>
        </button>
      </div>

      {isConnecting && (
        <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Connecting to MCP server at /mcp (Streamable HTTP)…
        </div>
      )}
      {connError && (
        <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.8rem', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
          <Shield size={14} style={{ verticalAlign: '-2px', marginRight: '0.4rem' }} />
          MCP connection failed: {connError}. Is the backend running on :8000?
        </div>
      )}

      {/* Two Column Layout: Tool Selection & Tester */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1.25rem' }}>
        {/* Tool List (live from server) */}
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffffff', marginBottom: '0.5rem' }}>
            Live FalkorDB MCP Tools (via tools/list)
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
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>MCP Tool</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: '1.3' }}>
                {(t.description || '').split('. USE FOR:')[0]}
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
              disabled={isRunning || !clientRef.current}
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
              <span>{isRunning ? 'Executing via MCP…' : 'Execute Tool'}</span>
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
              MCP tools/call Response (Real-Time JSON)
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
              {mcpOutput ? JSON.stringify(mcpOutput, null, 2) : '// Click "Execute Tool" to invoke tools/call against FalkorDB via real MCP...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
