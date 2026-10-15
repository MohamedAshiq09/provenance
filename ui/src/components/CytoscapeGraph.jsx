'use client';

import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RefreshCw, 
  Filter, 
  Info, 
  X,
  ExternalLink,
  ShieldCheck,
  Calendar
} from 'lucide-react';

const NODE_COLORS = {
  Person: '#38bdf8',    // Sky blue
  System: '#10b981',    // Emerald
  Decision: '#a855f7',  // Purple
  Document: '#f59e0b',  // Amber
  Ticket: '#f43f5e',    // Rose
  Message: '#06b6d4',   // Cyan
  Team: '#ec4899',      // Pink
  default: '#94a3b8',
};

export default function CytoscapeGraph({ 
  graphPath = [], 
  highlightNodeId = null,
  onNodeSelect,
  customHeight = '560px' 
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [nodeCount, setNodeCount] = useState(0);

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current) return;

    // Load initial sample graph from synthetic data or default core nodes
    const elements = generateInitialGraphElements();

    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '10px',
            'font-family': 'Outfit, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'background-color': 'data(color)',
            'border-width': 2,
            'border-color': 'rgba(255, 255, 255, 0.25)',
            'width': 'data(size)',
            'height': 'data(size)',
            'transition-property': 'background-color, border-color, border-width, opacity',
            'transition-duration': '0.3s',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(255, 255, 255, 0.15)',
            'target-arrow-color': 'rgba(255, 255, 255, 0.25)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
            'label': 'data(label)',
            'font-size': '7px',
            'color': 'rgba(255, 255, 255, 0.5)',
            'text-rotation': 'autorotate',
            'text-margin-y': -6,
          },
        },
        // Highlighted Path Styling
        {
          selector: '.highlighted-node',
          style: {
            'border-width': 4,
            'border-color': '#ffffff',
            'shadow-blur': 25,
            'shadow-color': '#06b6d4',
            'shadow-opacity': 0.9,
            'font-weight': 'bold',
            'font-size': '12px',
            'z-index': 999,
          },
        },
        {
          selector: '.highlighted-edge',
          style: {
            'width': 3.5,
            'line-color': '#06b6d4',
            'target-arrow-color': '#06b6d4',
            'shadow-blur': 15,
            'shadow-color': '#06b6d4',
            'shadow-opacity': 0.8,
            'z-index': 998,
          },
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.18,
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: 4500,
        idealEdgeLength: 80,
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
    setNodeCount(elements.filter(e => !e.data.source).length);

    return () => {
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
          cy.animate({ center: { eles: targetNode }, zoom: 1.2, duration: 400 });
        }
      }
      return;
    }

    // Extract node IDs from graphPath
    const nodeIds = new Set();
    graphPath.forEach(item => {
      const n = item.node || item;
      if (n && n.id) nodeIds.add(n.id);
    });

    if (nodeIds.size > 0) {
      cy.elements().addClass('dimmed');

      const pathNodes = cy.nodes().filter(node => nodeIds.has(node.id()));
      pathNodes.removeClass('dimmed').addClass('highlighted-node');

      // Also highlight connecting edges between path nodes
      const pathEdges = cy.edges().filter(edge => {
        return nodeIds.has(edge.source().id()) && nodeIds.has(edge.target().id());
      });
      pathEdges.removeClass('dimmed').addClass('highlighted-edge');

      // Zoom and center on the path
      if (pathNodes.length > 0) {
        cy.animate({
          fit: { eles: pathNodes, padding: 80 },
          duration: 500,
        });
      }
    }
  }, [graphPath, highlightNodeId]);

  // Zoom / Fit handlers
  const handleZoomIn = () => cyRef.current?.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current?.fit(undefined, 40);
  const handleReset = () => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('highlighted-node highlighted-edge dimmed');
    setSelectedNode(null);
    cy.layout({ name: 'cose', animate: true, animationDuration: 400 }).run();
  };

  // Filter nodes by type
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
    <div className="glass-panel" style={{ position: 'relative', height: customHeight, overflow: 'hidden' }}>
      {/* Top Overlay Controls */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {/* Node Filters */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(7, 9, 14, 0.8)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
        }}>
          {['ALL', 'Decision', 'Person', 'System', 'Document', 'Ticket'].map((type) => (
            <button
              key={type}
              id={`filter-${type.toLowerCase()}`}
              onClick={() => handleFilter(type)}
              style={{
                fontSize: '0.68rem',
                fontWeight: activeFilter === type ? '700' : '500',
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                background: activeFilter === type ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: activeFilter === type ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* View Tools */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(7, 9, 14, 0.8)',
          padding: '4px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          pointerEvents: 'auto',
          backdropFilter: 'blur(10px)',
        }}>
          <button id="cy-zoom-in" onClick={handleZoomIn} style={iconBtnStyle} title="Zoom In"><ZoomIn size={14} /></button>
          <button id="cy-zoom-out" onClick={handleZoomOut} style={iconBtnStyle} title="Zoom Out"><ZoomOut size={14} /></button>
          <button id="cy-fit" onClick={handleFit} style={iconBtnStyle} title="Fit Graph"><Maximize2 size={14} /></button>
          <button id="cy-reset" onClick={handleReset} style={iconBtnStyle} title="Reset Layout"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'rgba(7, 9, 14, 0.75)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
      }}>
        {Object.entries(NODE_COLORS).filter(([k]) => k !== 'default').map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '280px',
          height: '100%',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-subtle)',
          padding: '1rem',
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: `${NODE_COLORS[selectedNode.type] || '#fff'}22`,
              color: NODE_COLORS[selectedNode.type] || '#fff',
              border: `1px solid ${NODE_COLORS[selectedNode.type] || '#fff'}44`,
              textTransform: 'uppercase',
            }}>
              {selectedNode.type}
            </span>
            <button 
              id="close-node-drawer"
              onClick={() => setSelectedNode(null)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
            {selectedNode.label || selectedNode.id}
          </h3>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div><span style={{ color: 'var(--text-muted)' }}>ID:</span> <code style={{ color: '#38bdf8' }}>{selectedNode.id}</code></div>
            {selectedNode.role && <div><span style={{ color: 'var(--text-muted)' }}>Role:</span> {selectedNode.role}</div>}
            {selectedNode.stack && <div><span style={{ color: 'var(--text-muted)' }}>Tech Stack:</span> {selectedNode.stack}</div>}
            {selectedNode.status && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                <span style={{ color: selectedNode.status === 'stale' ? '#f43f5e' : '#10b981', fontWeight: '600' }}>
                  {selectedNode.status}
                </span>
              </div>
            )}
            {selectedNode.valid_from && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)' }}>Valid:</span> {selectedNode.valid_from} → {selectedNode.valid_to || 'present'}
              </div>
            )}
            {selectedNode.rationale && (
              <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>RATIONALE</div>
                <p style={{ fontSize: '0.72rem', lineHeight: '1.4' }}>{selectedNode.rationale}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  padding: '4px',
  borderRadius: '4px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// Generates the core company graph nodes and connections for visualization
function generateInitialGraphElements() {
  const nodes = [
    // People
    { id: 'person_priya', label: 'Priya Sharma', type: 'Person', role: 'Principal Eng' },
    { id: 'person_alex', label: 'Alex Chen', type: 'Person', role: 'Staff Eng' },
    { id: 'person_sam', label: 'Sam Rivera', type: 'Person', role: 'ML Lead' },
    { id: 'person_jordan', label: 'Jordan Kim', type: 'Person', role: 'Security Architect' },
    { id: 'person_maya', label: 'Maya Patel', type: 'Person', role: 'Engineering Manager' },
    { id: 'person_leo', label: 'Leo Torres', type: 'Person', role: 'Mobile Lead' },
    
    // Systems
    { id: 'sys_auth', label: 'AuthService', type: 'System', stack: 'Go, Postgres' },
    { id: 'sys_payments', label: 'PaymentProcessor', type: 'System', stack: 'Python, Stripe' },
    { id: 'sys_ml', label: 'RecommendationEngine', type: 'System', stack: 'Python, PyTorch' },
    { id: 'sys_mobile_api', label: 'MobileAPI', type: 'System', stack: 'Node.js, GraphQL' },
    { id: 'sys_data_lake', label: 'DataLake', type: 'System', stack: 'Spark, S3' },
    { id: 'sys_notification', label: 'NotificationService', type: 'System', stack: 'Python, Redis' },
    { id: 'sys_billing', label: 'BillingSystem', type: 'System', stack: 'CockroachDB' },

    // Decisions
    { id: 'decision_use_jwt', label: 'ADR: Use JWT Auth (Deprecated)', type: 'Decision', status: 'superseded', valid_from: '2024-06-01', valid_to: '2025-08-01' },
    { id: 'decision_opaque_tokens', label: 'ADR: Use Opaque Tokens', type: 'Decision', status: 'active', valid_from: '2025-08-01' },
    { id: 'decision_hpa_auth', label: 'HPA Autoscaling for Auth', type: 'Decision', status: 'active', valid_from: '2025-09-10' },
    { id: 'decision_rate_limit_mobile', label: 'Mobile Rate Limit 50 rps (STALE)', type: 'Decision', status: 'stale' },
    { id: 'decision_cockroach_billing', label: 'Billing on CockroachDB', type: 'Decision', status: 'active' },

    // Documents
    { id: 'doc_adr_jwt_original', label: 'ADR-001 (JWT Spec)', type: 'Document' },
    { id: 'doc_adr_jwt_reversal', label: 'ADR-002 (Opaque Token)', type: 'Document' },
    { id: 'doc_rate_limit_50', label: 'Doc: API Spec v1 (50 rps)', type: 'Document' },
    { id: 'doc_rate_limit_200', label: 'Doc: API Spec v2 (200 rps)', type: 'Document' },

    // Tickets & Messages (Deep origin)
    { id: 'ticket_auth_migration', label: 'Ticket #104: Auth HPA Migration', type: 'Ticket' },
    { id: 'msg_buried_origin', label: 'Slack: Jordan on Session Store', type: 'Message' },
  ];

  const edges = [
    // Work / Expertise edges
    { id: 'e1', source: 'person_priya', target: 'sys_auth', label: 'WORKED_ON' },
    { id: 'e2', source: 'person_sam', target: 'sys_ml', label: 'WORKED_ON' },
    { id: 'e3', source: 'person_jordan', target: 'sys_notification', label: 'WORKED_ON' },
    { id: 'e4', source: 'person_alex', target: 'sys_payments', label: 'WORKED_ON' },
    { id: 'e5', source: 'person_alex', target: 'sys_billing', label: 'WORKED_ON' },
    { id: 'e6', source: 'person_leo', target: 'sys_mobile_api', label: 'WORKED_ON' },

    // Decision provenance edges
    { id: 'e7', source: 'decision_use_jwt', target: 'person_priya', label: 'MADE_BY' },
    { id: 'e8', source: 'decision_use_jwt', target: 'doc_adr_jwt_original', label: 'BASED_ON' },
    { id: 'e9', source: 'decision_opaque_tokens', target: 'decision_use_jwt', label: 'SUPERSEDES' },
    { id: 'e10', source: 'decision_opaque_tokens', target: 'doc_adr_jwt_reversal', label: 'BASED_ON' },
    { id: 'e11', source: 'decision_opaque_tokens', target: 'sys_auth', label: 'AFFECTS' },

    // Staleness chain
    { id: 'e12', source: 'doc_rate_limit_200', target: 'doc_rate_limit_50', label: 'SUPERSEDES' },
    { id: 'e13', source: 'decision_rate_limit_mobile', target: 'doc_rate_limit_50', label: 'BASED_ON' },
    { id: 'e14', source: 'decision_rate_limit_mobile', target: 'sys_mobile_api', label: 'AFFECTS' },

    // Buried origin 3-hop chain
    { id: 'e15', source: 'decision_hpa_auth', target: 'doc_adr_jwt_reversal', label: 'BASED_ON' },
    { id: 'e16', source: 'ticket_auth_migration', target: 'doc_adr_jwt_reversal', label: 'RESOLVES' },
    { id: 'e17', source: 'ticket_auth_migration', target: 'msg_buried_origin', label: 'DISCUSSED_IN' },
    { id: 'e18', source: 'person_jordan', target: 'msg_buried_origin', label: 'AUTHORED' },

    // System connections
    { id: 'e19', source: 'sys_mobile_api', target: 'sys_auth', label: 'USES' },
    { id: 'e20', source: 'sys_payments', target: 'sys_billing', label: 'USES' },
  ];

  return [
    ...nodes.map(n => ({
      data: {
        ...n,
        color: NODE_COLORS[n.type] || NODE_COLORS.default,
        size: n.type === 'System' || n.type === 'Decision' ? 32 : 24,
      }
    })),
    ...edges.map(e => ({ data: e })),
  ];
}
