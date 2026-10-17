'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw, 
  X,
  Calendar
} from 'lucide-react';

const NODE_COLORS = {
  Person: '#0f766e',
  System: '#15803d',
  Decision: '#b45309',
  Document: '#6b7280',
  Ticket: '#b91c1c',
  Message: '#64748b',
  default: '#6b7280',
};

export default function CytoscapeGraph({ 
  graphPath = [], 
  highlightNodeId = null,
  onNodeSelect,
  customHeight = '420px' 
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Build theme-aware stylesheet
  const getCytoscapeStyle = (isDark = true) => [
    {
      selector: 'node',
      style: {
        'label': '',
        'color': isDark ? '#e8eaed' : '#16181c',
        'font-size': '10px',
        'font-family': 'Inter, sans-serif',
        'font-weight': '500',
        'text-valign': 'bottom',
        'text-margin-y': 5,
        'background-color': 'data(color)',
        'border-width': 1,
        'border-color': isDark ? '#232830' : '#e5e5e1',
        'width': 'data(size)',
        'height': 'data(size)',
        'transition-property': 'background-color, border-color, opacity',
        'transition-duration': '0.15s',
      },
    },
    {
      selector: 'node:hover',
      style: {
        'label': 'data(label)',
        'z-index': 995,
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        'target-arrow-color': isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.7,
        'label': '', // Edge labels hidden until hover
        'font-size': '8px',
        'font-family': 'Inter, sans-serif',
        'color': isDark ? '#8b929c' : '#6b7280',
        'text-rotation': 'autorotate',
        'text-margin-y': -6,
      },
    },
    {
      selector: 'edge:hover',
      style: {
        'label': 'data(label)',
        'width': 2,
        'line-color': isDark ? '#2dd4bf' : '#0f766e',
        'target-arrow-color': isDark ? '#2dd4bf' : '#0f766e',
        'color': isDark ? '#2dd4bf' : '#0f766e',
        'z-index': 990,
      },
    },
    {
      selector: '.highlighted-node',
      style: {
        'border-width': 2.5,
        'border-color': isDark ? '#2dd4bf' : '#0f766e',
        'label': 'data(label)', // Label visible on path nodes
        'font-weight': '600',
        'font-size': '11px',
        'opacity': 1,
        'z-index': 999,
      },
    },
    {
      selector: '.highlighted-edge',
      style: {
        'width': 2,
        'line-color': isDark ? '#2dd4bf' : '#0f766e',
        'target-arrow-color': isDark ? '#2dd4bf' : '#0f766e',
        'label': 'data(label)',
        'font-size': '8px',
        'color': isDark ? '#2dd4bf' : '#0f766e',
        'opacity': 1,
        'z-index': 998,
      },
    },
    {
      selector: '.dimmed',
      style: {
        'opacity': 0.15,
        'label': '', // Hide labels on dimmed background nodes
      },
    },
  ];

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current) return;

    const elements = generateInitialGraphElements();
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: getCytoscapeStyle(isDark),
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: 4500,
        idealEdgeLength: 70,
      },
      minZoom: 0.3,
      maxZoom: 3,
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();
      setSelectedNode(data);
      if (onNodeSelect) onNodeSelect(data);
    });

    cyRef.current = cy;

    // Listen to theme changes
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          const dark = document.documentElement.getAttribute('data-theme') !== 'light';
          cy.style(getCytoscapeStyle(dark));
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      observer.disconnect();
      cy.destroy();
    };
  }, []);

  // Update highlighted path when graphPath changes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.elements().removeClass('highlighted-node highlighted-edge dimmed');

    if (!graphPath || graphPath.length === 0) {
      if (highlightNodeId) {
        const targetNode = cy.$(`node[id = "${highlightNodeId}"]`);
        if (targetNode.length > 0) {
          cy.elements().addClass('dimmed');
          targetNode.removeClass('dimmed').addClass('highlighted-node');
          cy.animate({ center: { eles: targetNode }, zoom: 1.2, duration: 300 });
        }
      }
      return;
    }

    const nodeIds = new Set();
    graphPath.forEach(item => {
      const n = item.node || item;
      if (n && n.id) nodeIds.add(n.id);
    });

    if (nodeIds.size > 0) {
      cy.elements().addClass('dimmed');

      const pathNodes = cy.nodes().filter(node => nodeIds.has(node.id()));
      pathNodes.removeClass('dimmed').addClass('highlighted-node');

      const pathEdges = cy.edges().filter(edge => {
        return nodeIds.has(edge.source().id()) && nodeIds.has(edge.target().id());
      });
      pathEdges.removeClass('dimmed').addClass('highlighted-edge');

      if (pathNodes.length > 0) {
        cy.animate({
          fit: { eles: pathNodes, padding: 60 },
          duration: 400,
        });
      }
    }
  }, [graphPath, highlightNodeId]);

  // Controls
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 30);
  const handleReset = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('highlighted-node highlighted-edge dimmed');
    setSelectedNode(null);
    cy.layout({ name: 'cose', animate: true, animationDuration: 300 }).run();
  };

  const handleFilter = (type) => {
    setActiveFilter(type);
    const cy = cyRef.current;
    if (!cy) return;

    if (type === 'ALL') {
      cy.elements().style('display', 'element');
    } else {
      cy.nodes().forEach(node => {
        if (node.data('type') === type) {
          node.style('display', 'element');
        } else {
          node.style('display', 'none');
        }
      });
      cy.edges().forEach(edge => {
        if (edge.source().visible() && edge.target().visible()) {
          edge.style('display', 'element');
        } else {
          edge.style('display', 'none');
        }
      });
    }
  };

  return (
    <div className="clean-card" style={{
      position: 'relative',
      height: customHeight,
      overflow: 'hidden',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    }}>
      {/* Top Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        right: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {/* Type Filter */}
        <div style={{
          display: 'flex',
          gap: '2px',
          background: 'var(--surface)',
          padding: '2px 4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          pointerEvents: 'auto',
        }}>
          {['ALL', 'Decision', 'Person', 'System', 'Document'].map((type) => (
            <button
              key={type}
              onClick={() => handleFilter(type)}
              style={{
                fontSize: '0.68rem',
                fontWeight: activeFilter === type ? '600' : '400',
                padding: '2px 6px',
                borderRadius: '3px',
                border: 'none',
                background: activeFilter === type ? 'var(--surface-2)' : 'transparent',
                color: activeFilter === type ? 'var(--text)' : 'var(--muted)',
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Zoom & Fit buttons */}
        <div style={{
          display: 'flex',
          gap: '2px',
          background: 'var(--surface)',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border)',
          pointerEvents: 'auto',
        }}>
          <button onClick={handleZoomIn} className="btn-ghost" style={{ padding: '3px' }} title="Zoom In"><ZoomIn size={13} /></button>
          <button onClick={handleZoomOut} className="btn-ghost" style={{ padding: '3px' }} title="Zoom Out"><ZoomOut size={13} /></button>
          <button onClick={handleFit} className="btn-ghost" style={{ padding: '3px' }} title="Fit"><Maximize2 size={13} /></button>
          <button onClick={handleReset} className="btn-ghost" style={{ padding: '3px' }} title="Reset"><RefreshCw size={13} /></button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Small Bottom-Left Legend */}
      <div style={{
        position: 'absolute',
        bottom: '8px',
        left: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--surface)',
        padding: '3px 8px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        fontSize: '0.68rem',
        color: 'var(--muted)',
        pointerEvents: 'none',
      }}>
        {['Person', 'System', 'Decision', 'Document'].map((type) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: NODE_COLORS[type] }} />
            <span>{type}</span>
          </span>
        ))}
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '260px',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          padding: '1rem',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span className="chip-accent" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
              {selectedNode.type}
            </span>
            <button 
              onClick={() => setSelectedNode(null)} 
              className="btn-ghost"
              style={{ padding: '2px' }}
            >
              <X size={14} />
            </button>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', marginBottom: '0.4rem' }}>
            {selectedNode.label || selectedNode.id}
          </h3>

          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div>ID: <code className="font-mono" style={{ color: 'var(--text)' }}>{selectedNode.id}</code></div>
            {selectedNode.role && <div>Role: <strong style={{ color: 'var(--text)' }}>{selectedNode.role}</strong></div>}
            {selectedNode.stack && <div>Stack: <strong style={{ color: 'var(--text)' }}>{selectedNode.stack}</strong></div>}
            {selectedNode.status && (
              <div>
                Status: <span className={selectedNode.status === 'stale' ? 'chip-warn' : 'chip-ok'} style={{ fontSize: '0.65rem' }}>
                  {selectedNode.status}
                </span>
              </div>
            )}
            {selectedNode.valid_from && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} />
                <span>{selectedNode.valid_from} → {selectedNode.valid_to || 'present'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function generateInitialGraphElements() {
  const nodes = [
    { id: 'person_priya', label: 'Priya Sharma', type: 'Person', role: 'Principal Eng' },
    { id: 'person_alex', label: 'Alex Chen', type: 'Person', role: 'Staff Eng' },
    { id: 'person_sam', label: 'Sam Rivera', type: 'Person', role: 'ML Lead' },
    { id: 'person_jordan', label: 'Jordan Kim', type: 'Person', role: 'Security Architect' },
    { id: 'person_leo', label: 'Leo Torres', type: 'Person', role: 'Mobile Lead' },
    
    { id: 'sys_auth', label: 'AuthService', type: 'System', stack: 'Go, Postgres' },
    { id: 'sys_payments', label: 'PaymentProcessor', type: 'System', stack: 'Python, Stripe' },
    { id: 'sys_mobile_api', label: 'MobileAPI', type: 'System', stack: 'Node.js, GraphQL' },
    { id: 'sys_billing', label: 'BillingSystem', type: 'System', stack: 'CockroachDB' },

    { id: 'decision_use_jwt', label: 'ADR-001: JWT Auth', type: 'Decision', status: 'superseded', valid_from: '2024-06-01', valid_to: '2025-08-01' },
    { id: 'decision_opaque_tokens', label: 'ADR-002: Opaque Tokens', type: 'Decision', status: 'active', valid_from: '2025-08-01' },
    { id: 'decision_hpa_auth', label: 'ADR-003: HPA Autoscaling', type: 'Decision', status: 'active', valid_from: '2025-09-10' },
    { id: 'decision_rate_limit_mobile', label: 'ADR-004: Rate Limit 50 rps', type: 'Decision', status: 'stale' },

    { id: 'doc_adr_jwt_original', label: 'ADR-001 (JWT Spec)', type: 'Document' },
    { id: 'doc_adr_jwt_reversal', label: 'ADR-002 (Opaque Token)', type: 'Document' },
    { id: 'doc_rate_limit_50', label: 'API Gateway Spec v1', type: 'Document' },
    { id: 'doc_rate_limit_200', label: 'API Gateway Spec v2', type: 'Document' },
  ];

  const edges = [
    { id: 'e1', source: 'person_priya', target: 'sys_auth', label: 'WORKED_ON' },
    { id: 'e4', source: 'person_alex', target: 'sys_payments', label: 'WORKED_ON' },
    { id: 'e5', source: 'person_alex', target: 'sys_billing', label: 'WORKED_ON' },
    { id: 'e6', source: 'person_leo', target: 'sys_mobile_api', label: 'WORKED_ON' },

    { id: 'e7', source: 'decision_use_jwt', target: 'person_priya', label: 'MADE_BY' },
    { id: 'e8', source: 'decision_use_jwt', target: 'doc_adr_jwt_original', label: 'BASED_ON' },
    { id: 'e9', source: 'decision_opaque_tokens', target: 'decision_use_jwt', label: 'SUPERSEDES' },
    { id: 'e10', source: 'decision_opaque_tokens', target: 'doc_adr_jwt_reversal', label: 'BASED_ON' },
    { id: 'e11', source: 'decision_opaque_tokens', target: 'sys_auth', label: 'AFFECTS' },

    { id: 'e12', source: 'doc_rate_limit_200', target: 'doc_rate_limit_50', label: 'SUPERSEDES' },
    { id: 'e13', source: 'decision_rate_limit_mobile', target: 'doc_rate_limit_50', label: 'BASED_ON' },
    { id: 'e14', source: 'decision_rate_limit_mobile', target: 'sys_mobile_api', label: 'AFFECTS' },

    { id: 'e19', source: 'sys_mobile_api', target: 'sys_auth', label: 'USES' },
    { id: 'e20', source: 'sys_payments', target: 'sys_billing', label: 'USES' },
  ];

  return [
    ...nodes.map(n => ({
      data: {
        ...n,
        color: NODE_COLORS[n.type] || NODE_COLORS.default,
        size: n.type === 'System' || n.type === 'Decision' ? 26 : 20,
      }
    })),
    ...edges.map(e => ({ data: e })),
  ];
}
