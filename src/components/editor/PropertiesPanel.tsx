import React from 'react';
import { useNodeGraph } from '@/context/NodeGraphContext';
import { NODE_CATEGORY_COLORS } from '@/types/nodes';
import { Trash2 } from 'lucide-react';

export default function PropertiesPanel() {
  const { state, updateNodeParams, removeNode } = useNodeGraph();
  const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">Select a node to edit its properties</p>
      </div>
    );
  }

  const color = NODE_CATEGORY_COLORS[selectedNode.category];

  const handleParamChange = (key: string, value: any) => {
    updateNodeParams(selectedNode.id, { [key]: value });
  };

  const renderParam = (key: string, value: any) => {
    if (key === 'imageData' || key === 'canvasData' || key === 'palette') return null;

    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center justify-between py-1">
          <span className="text-[11px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          <input
            type="checkbox"
            checked={value}
            onChange={e => handleParamChange(key, e.target.checked)}
            className="accent-primary"
          />
        </label>
      );
    }

    if (typeof value === 'number') {
      const isInteger = key === 'width' || key === 'height' || key === 'fps' || key === 'duration' || key === 'spawnRate' || key === 'lifetime' || key === 'resolution' || key === 'pixelSize' || key === 'size' || key === 'length';
      const min = key === 'size' || key === 'pixelSize' ? 1 : key === 'resolution' ? 8 : key === 'fps' ? 1 : 0;
      const max = key === 'resolution' ? 128 : key === 'width' || key === 'height' ? 256 : key === 'fps' ? 60 : key === 'duration' ? 300 : key === 'lifetime' ? 200 : key === 'spawnRate' ? 50 : key === 'pixelSize' ? 16 : 10;
      const step = isInteger ? 1 : 0.01;
      return (
        <div key={key} className="py-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            <input
              type="number"
              value={value}
              onChange={e => handleParamChange(key, isInteger ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
              className="w-14 text-[11px] bg-input border border-border rounded px-1 py-0.5 text-foreground text-right"
              step={step}
              min={min}
              max={max}
            />
          </div>
          <input
            type="range"
            value={value}
            onChange={e => handleParamChange(key, isInteger ? parseInt(e.target.value) : parseFloat(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full h-1 appearance-none bg-secondary rounded-full accent-primary"
          />
        </div>
      );
    }

    if (typeof value === 'string' && value.startsWith('#')) {
      return (
        <div key={key} className="flex items-center justify-between py-1">
          <span className="text-[11px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={value}
              onChange={e => handleParamChange(key, e.target.value)}
              className="w-6 h-6 border border-border rounded cursor-pointer"
            />
            <span className="text-[10px] font-mono text-muted-foreground">{value}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between"
        style={{ borderTopColor: color, borderTopWidth: 2 }}>
        <div>
          <h3 className="text-xs font-bold text-foreground">{selectedNode.label}</h3>
          <span className="text-[10px] text-muted-foreground capitalize">{selectedNode.category}</span>
        </div>
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-colors text-muted-foreground"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Params */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {Object.entries(selectedNode.params).map(([key, value]) => renderParam(key, value))}
      </div>
    </div>
  );
}
