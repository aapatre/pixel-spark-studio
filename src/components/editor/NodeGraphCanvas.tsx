import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useNodeGraph } from '@/context/NodeGraphContext';
import { NodeData, Connection, NODE_CATEGORY_COLORS, NodeCategory } from '@/types/nodes';

interface DragState {
  type: 'node' | 'wire' | 'pan';
  nodeId?: string;
  offsetX?: number;
  offsetY?: number;
  fromNodeId?: string;
  fromPortId?: string;
  mouseX?: number;
  mouseY?: number;
  startPanX?: number;
  startPanY?: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const PORT_RADIUS = 6;

function getPortPosition(node: NodeData, portId: string, pan: { x: number; y: number }) {
  const port = node.ports.find(p => p.id === portId);
  if (!port) return { x: 0, y: 0 };
  const isOutput = port.type === 'output';
  const portIndex = node.ports.filter(p => p.type === port.type).indexOf(port);
  const totalPorts = node.ports.filter(p => p.type === port.type).length;
  const spacing = NODE_HEIGHT / (totalPorts + 1);

  return {
    x: node.position.x + pan.x + (isOutput ? NODE_WIDTH : 0),
    y: node.position.y + pan.y + 20 + spacing * (portIndex + 1),
  };
}

export default function NodeGraphCanvas() {
  const { state, addNode, moveNode, selectNode, addConnection, removeNode, removeConnection } = useNodeGraph();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [wireEnd, setWireEnd] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId?: string } | null>(null);

  // Delete selected node with Delete/Backspace key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedNodeId) {
        const node = state.nodes.find(n => n.id === state.selectedNodeId);
        if (node && node.type !== 'output-render') {
          removeNode(state.selectedNodeId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedNodeId, state.nodes, removeNode]);

  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId?: string, portId?: string) => {
    e.stopPropagation();
    if (portId && nodeId) {
      const node = state.nodes.find(n => n.id === nodeId);
      const port = node?.ports.find(p => p.id === portId);
      if (port?.type === 'output') {
        setDrag({ type: 'wire', fromNodeId: nodeId, fromPortId: portId });
        return;
      }
    }
    if (nodeId) {
      const node = state.nodes.find(n => n.id === nodeId);
      if (node) {
        selectNode(nodeId);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setDrag({
            type: 'node',
            nodeId,
            offsetX: e.clientX - rect.left - node.position.x - pan.x,
            offsetY: e.clientY - rect.top - node.position.y - pan.y,
          });
        }
      }
    }
  }, [state.nodes, selectNode, pan]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setDrag({ type: 'pan', startPanX: pan.x - e.clientX, startPanY: pan.y - e.clientY });
    } else if (e.button === 0) {
      selectNode(null);
      setContextMenu(null);
    }
  }, [selectNode, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (drag.type === 'node' && drag.nodeId) {
      moveNode(drag.nodeId, {
        x: e.clientX - rect.left - (drag.offsetX || 0) - pan.x,
        y: e.clientY - rect.top - (drag.offsetY || 0) - pan.y,
      });
    } else if (drag.type === 'wire') {
      setWireEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else if (drag.type === 'pan') {
      setPan({
        x: e.clientX + (drag.startPanX || 0),
        y: e.clientY + (drag.startPanY || 0),
      });
    }
  }, [drag, moveNode, pan]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag?.type === 'wire' && drag.fromNodeId && drag.fromPortId) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // Find target port
        for (const node of state.nodes) {
          for (const port of node.ports) {
            if (port.type === 'input') {
              const pos = getPortPosition(node, port.id, pan);
              const dist = Math.hypot(mx - pos.x, my - pos.y);
              if (dist < 15 && node.id !== drag.fromNodeId) {
                addConnection({
                  fromNodeId: drag.fromNodeId,
                  fromPortId: drag.fromPortId,
                  toNodeId: node.id,
                  toPortId: port.id,
                });
                break;
              }
            }
          }
        }
      }
    }
    setDrag(null);
    setWireEnd(null);
  }, [drag, state.nodes, addConnection, pan]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  const handleAddNode = useCallback((type: string) => {
    if (contextMenu) {
      addNode(type as any, { x: contextMenu.x - pan.x, y: contextMenu.y - pan.y });
      setContextMenu(null);
    }
  }, [contextMenu, addNode, pan]);

  const getCategoryColor = (category: NodeCategory) => NODE_CATEGORY_COLORS[category];

  const nodeTypes = [
    { label: 'Input', items: [
      { type: 'input-image', label: 'Image Upload' },
      { type: 'input-canvas', label: 'Pixel Canvas' },
      { type: 'input-color', label: 'Color Fill' },
    ]},
    { label: 'Simulation', items: [
      { type: 'particle-emitter', label: 'Particle Emitter' },
      { type: 'fluid-sim', label: 'Fluid Simulation' },
    ]},
    { label: 'Modifier', items: [
      { type: 'modifier-pixelate', label: 'Pixelate' },
      { type: 'modifier-glow', label: 'Glow' },
      { type: 'modifier-trail', label: 'Trail' },
      { type: 'modifier-blur', label: 'Blur' },
      { type: 'modifier-dissolve', label: 'Dissolve' },
      { type: 'modifier-color-remap', label: 'Color Remap' },
    ]},
    { label: 'Output', items: [
      { type: 'output-render', label: 'Final Render' },
    ]},
  ];

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden node-graph-bg cursor-crosshair select-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* SVG layer for wires */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {state.connections.map(conn => {
          const fromNode = state.nodes.find(n => n.id === conn.fromNodeId);
          const toNode = state.nodes.find(n => n.id === conn.toNodeId);
          if (!fromNode || !toNode) return null;
          const from = getPortPosition(fromNode, conn.fromPortId, pan);
          const to = getPortPosition(toNode, conn.toPortId, pan);
          const cx = (from.x + to.x) / 2;
          return (
            <g key={conn.id} className="wire-glow">
              <path
                d={`M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke="hsl(200, 80%, 55%)"
                strokeWidth={2}
                opacity={0.8}
              />
              {/* Click target for deletion */}
              <path
                d={`M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke="transparent"
                strokeWidth={12}
                className="pointer-events-auto cursor-pointer"
                onDoubleClick={() => removeConnection(conn.id)}
              />
            </g>
          );
        })}
        {/* Dragging wire */}
        {drag?.type === 'wire' && wireEnd && drag.fromNodeId && drag.fromPortId && (() => {
          const fromNode = state.nodes.find(n => n.id === drag.fromNodeId);
          if (!fromNode) return null;
          const from = getPortPosition(fromNode, drag.fromPortId!, pan);
          const cx = (from.x + wireEnd.x) / 2;
          return (
            <path
              d={`M ${from.x} ${from.y} C ${cx} ${from.y}, ${cx} ${wireEnd.y}, ${wireEnd.x} ${wireEnd.y}`}
              fill="none"
              stroke="hsl(200, 100%, 70%)"
              strokeWidth={2}
              strokeDasharray="6 3"
              className="wire-glow"
            />
          );
        })()}
      </svg>

      {/* Nodes */}
      {state.nodes.map(node => {
        const color = getCategoryColor(node.category);
        const isSelected = state.selectedNodeId === node.id;
        return (
          <div
            key={node.id}
            className={`absolute rounded-md border overflow-hidden ${isSelected ? 'node-selected' : ''}`}
            style={{
              left: node.position.x + pan.x,
              top: node.position.y + pan.y,
              width: NODE_WIDTH,
              minHeight: NODE_HEIGHT,
              zIndex: isSelected ? 10 : 2,
              borderColor: color,
              background: 'hsl(220, 15%, 12%)',
            }}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
          >
            {/* Header */}
            <div
              className="px-2 py-1 text-xs font-bold truncate"
              style={{ background: color, color: 'hsl(220, 15%, 5%)' }}
            >
              {node.label}
            </div>
            {/* Ports */}
            <div className="relative px-1 py-1">
              {node.ports.filter(p => p.type === 'input').map((port, i) => (
                <div key={port.id} className="flex items-center gap-1 text-[10px] text-muted-foreground py-0.5">
                  <div
                    className="w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform"
                    style={{ borderColor: color, background: 'hsl(220, 15%, 8%)' }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      if (drag?.type === 'wire' && drag.fromNodeId && drag.fromPortId && drag.fromNodeId !== node.id) {
                        addConnection({
                          fromNodeId: drag.fromNodeId,
                          fromPortId: drag.fromPortId,
                          toNodeId: node.id,
                          toPortId: port.id,
                        });
                        setDrag(null);
                        setWireEnd(null);
                      }
                    }}
                  />
                  <span>{port.name}</span>
                </div>
              ))}
              {node.ports.filter(p => p.type === 'output').map((port, i) => (
                <div key={port.id} className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground py-0.5">
                  <span>{port.name}</span>
                  <div
                    className="w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform"
                    style={{ borderColor: color, background: color }}
                    onMouseDown={(e) => handleMouseDown(e, node.id, port.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute rounded-md border border-border bg-card shadow-xl z-50 py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Add Node
          </div>
          {nodeTypes.map(group => (
            <div key={group.label}>
              <div className="px-3 py-0.5 text-[10px] text-muted-foreground mt-1">{group.label}</div>
              {group.items.map(item => (
                <button
                  key={item.type}
                  className="w-full text-left px-3 py-1 text-xs hover:bg-accent transition-colors text-foreground"
                  onClick={() => handleAddNode(item.type)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Instructions overlay */}
      {state.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-sm font-medium">Right-click to add nodes</p>
            <p className="text-xs mt-1">Drag from output ports to input ports to connect</p>
          </div>
        </div>
      )}
    </div>
  );
}
