import React, { useState } from 'react';
import { useNodeGraph } from '@/context/NodeGraphContext';
import { NodeType, NODE_TEMPLATES } from '@/types/nodes';
import { Upload, Sparkles, Package, Flame, Droplets, Wind, Zap, Star } from 'lucide-react';

const PRESETS = [
  { name: 'Explosion', icon: Flame, description: 'Burst of particles', nodes: [
    { type: 'particle-emitter' as NodeType, params: { spawnRate: 20, lifetime: 30, gravity: 0.05, velocityX: 0, velocityY: -1, spread: 2, color: '#ff6600', size: 2, fadeOut: true } },
  ]},
  { name: 'Blood Splash', icon: Droplets, description: 'Fluid drip effect', nodes: [
    { type: 'fluid-sim' as NodeType, params: { viscosity: 0.3, diffusion: 0.0005, pressure: 0.5, gravityX: 0, gravityY: 1, color: '#cc0000', resolution: 32 } },
  ]},
  { name: 'Magic Burst', icon: Sparkles, description: 'Sparkle particles', nodes: [
    { type: 'particle-emitter' as NodeType, params: { spawnRate: 15, lifetime: 45, gravity: -0.02, velocityX: 0, velocityY: -0.5, spread: 2, color: '#aa66ff', size: 1, fadeOut: true } },
  ]},
  { name: 'Dust Cloud', icon: Wind, description: 'Floating dust motes', nodes: [
    { type: 'particle-emitter' as NodeType, params: { spawnRate: 5, lifetime: 80, gravity: -0.01, velocityX: 0.5, velocityY: -0.2, spread: 1.5, color: '#aa9977', size: 1, fadeOut: true } },
  ]},
  { name: 'Fire', icon: Flame, description: 'Rising flame effect', nodes: [
    { type: 'particle-emitter' as NodeType, params: { spawnRate: 12, lifetime: 40, gravity: -0.08, velocityX: 0, velocityY: -1.5, spread: 0.5, color: '#ff4400', size: 2, fadeOut: true } },
  ]},
  { name: 'Sparks', icon: Zap, description: 'Electric sparks', nodes: [
    { type: 'particle-emitter' as NodeType, params: { spawnRate: 8, lifetime: 20, gravity: 0.15, velocityX: 0, velocityY: -3, spread: 1.5, color: '#ffff66', size: 1, fadeOut: true } },
  ]},
];

export default function AssetPanel() {
  const { addNode } = useNodeGraph();
  const [tab, setTab] = useState<'presets' | 'nodes'>('presets');

  const handlePreset = (preset: typeof PRESETS[0]) => {
    // Add preset nodes only — Final Render node is persistent and already present
    preset.nodes.forEach((n, i) => {
      addNode(n.type, { x: 100, y: 80 + i * 100 });
    });
  };

  const handleDragStart = (e: React.DragEvent, type: NodeType) => {
    e.dataTransfer.setData('nodeType', type);
  };

  const nodeList: { category: string; items: { type: NodeType; label: string; icon: React.ReactNode }[] }[] = [
    {
      category: 'Input',
      items: [
        { type: 'input-image', label: 'Image Upload', icon: <Upload size={12} /> },
        { type: 'input-canvas', label: 'Pixel Canvas', icon: <Star size={12} /> },
        { type: 'input-color', label: 'Color Fill', icon: <Package size={12} /> },
      ],
    },
    {
      category: 'Simulation',
      items: [
        { type: 'particle-emitter', label: 'Particles', icon: <Sparkles size={12} /> },
        { type: 'fluid-sim', label: 'Fluid', icon: <Droplets size={12} /> },
      ],
    },
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('presets')}
          className={`flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
            tab === 'presets' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setTab('nodes')}
          className={`flex-1 px-2 py-1.5 text-[11px] font-medium transition-colors ${
            tab === 'nodes' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Nodes
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'presets' ? (
          <div className="space-y-1">
            {PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => handlePreset(preset)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded hover:bg-accent transition-colors text-left group"
              >
                <div className="w-7 h-7 rounded flex items-center justify-center bg-secondary text-muted-foreground group-hover:text-foreground">
                  <preset.icon size={14} />
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{preset.name}</div>
                  <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {nodeList.map(group => (
              <div key={group.category}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {group.category}
                </div>
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.type)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="text-xs text-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
