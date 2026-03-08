import React, { useState } from 'react'; // force rebuild
import { NodeGraphProvider, useNodeGraph } from '@/context/NodeGraphContext';
import NodeGraphCanvas from '@/components/editor/NodeGraphCanvas';
import PreviewCanvas from '@/components/editor/PreviewCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import AssetPanel from '@/components/editor/AssetPanel';
import { Undo2, Redo2, Download, Maximize2, Minimize2 } from 'lucide-react';

function EditorLayout() {
  const { undo, redo, canUndo, canRedo } = useNodeGraph();
  const [showExport, setShowExport] = useState(false);
  const [bottomHeight, setBottomHeight] = useState(280);
  const [leftWidth, setLeftWidth] = useState(200);
  const [rightWidth, setRightWidth] = useState(240);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-tight" style={{ color: 'hsl(200, 80%, 55%)' }}>
            PixelVFX
          </span>
          <span className="text-[10px] text-muted-foreground">Studio</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Undo"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Redo"
          >
            <Redo2 size={14} />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden" style={{ height: `calc(100vh - 36px - ${bottomHeight}px)` }}>
        {/* Left panel - Assets */}
        <div className="border-r border-border bg-card shrink-0" style={{ width: leftWidth }}>
          <div className="h-full">
            <AssetPanel />
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 min-w-0">
          <PreviewCanvas />
        </div>

        {/* Right panel - Properties */}
        <div className="border-l border-border bg-card shrink-0" style={{ width: rightWidth }}>
          <PropertiesPanel />
        </div>
      </div>

      {/* Resize handle */}
      <div
        className="h-1 bg-border hover:bg-primary/50 cursor-row-resize shrink-0 transition-colors"
        onMouseDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startHeight = bottomHeight;
          const onMove = (me: MouseEvent) => {
            setBottomHeight(Math.max(100, Math.min(600, startHeight - (me.clientY - startY))));
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        }}
      />

      {/* Bottom panel - Node Graph */}
      <div className="shrink-0 border-t border-border" style={{ height: bottomHeight }}>
        <NodeGraphCanvas />
      </div>

      {/* Export dialog placeholder */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-6 w-[400px] shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-foreground">Export</h2>
              <button onClick={() => setShowExport(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Add simulation nodes and play the preview first, then export your animation.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Video (WebM)', 'Spritesheet PNG', 'GIF', 'Frame Sequence'].map(fmt => (
                <button key={fmt} className="px-3 py-2 text-[11px] border border-border rounded hover:border-primary hover:bg-accent transition-colors text-foreground">
                  {fmt}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowExport(false)}
              className="w-full mt-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Coming soon — Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  return (
    <NodeGraphProvider>
      <EditorLayout />
    </NodeGraphProvider>
  );
}
