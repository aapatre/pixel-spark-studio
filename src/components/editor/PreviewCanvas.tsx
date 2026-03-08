import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNodeGraph } from '@/context/NodeGraphContext';
import { ParticleEngine } from '@/engines/ParticleEngine';
import { FluidEngine } from '@/engines/FluidEngine';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Grid3X3, ZoomIn, ZoomOut } from 'lucide-react';

export default function PreviewCanvas() {
  const { state } = useNodeGraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(4);
  const animRef = useRef<number>(0);
  const particleRef = useRef<ParticleEngine | null>(null);
  const fluidRef = useRef<FluidEngine | null>(null);
  const frameRef = useRef(0);

  // Find output node params for canvas size
  const outputNode = state.nodes.find(n => n.type === 'output-render');
  const canvasWidth = outputNode?.params.width || 64;
  const canvasHeight = outputNode?.params.height || 64;
  const fps = outputNode?.params.fps || 12;
  const totalFrames = outputNode?.params.duration || 60;

  // Initialize engines from nodes
  useEffect(() => {
    const particleNode = state.nodes.find(n => n.type === 'particle-emitter');
    if (particleNode) {
      particleRef.current = new ParticleEngine(canvasWidth, canvasHeight, {
        spawnRate: particleNode.params.spawnRate,
        lifetime: particleNode.params.lifetime,
        gravity: particleNode.params.gravity,
        velocityX: particleNode.params.velocityX,
        velocityY: particleNode.params.velocityY,
        spread: particleNode.params.spread,
        color: particleNode.params.color,
        size: particleNode.params.size,
        fadeOut: particleNode.params.fadeOut,
      });
    } else {
      particleRef.current = null;
    }

    const fluidNode = state.nodes.find(n => n.type === 'fluid-sim');
    if (fluidNode) {
      fluidRef.current = new FluidEngine({
        viscosity: fluidNode.params.viscosity,
        diffusion: fluidNode.params.diffusion,
        pressure: fluidNode.params.pressure,
        gravityX: fluidNode.params.gravityX,
        gravityY: fluidNode.params.gravityY,
        color: fluidNode.params.color,
        resolution: fluidNode.params.resolution,
      });
      // Add initial density in center
      const N = fluidNode.params.resolution;
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          fluidRef.current.addDensity(N / 2 + i, N / 2 + j, 50);
        }
      }
      fluidRef.current.addVelocity(N / 2, N / 2, 0, 5);
    } else {
      fluidRef.current = null;
    }
  }, [state.nodes, canvasWidth, canvasHeight]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Render color fill input nodes
    for (const node of state.nodes) {
      if (node.type === 'input-color') {
        ctx.fillStyle = node.params.color;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    }

    // Step and render fluid
    if (fluidRef.current) {
      fluidRef.current.step(0.1);
      fluidRef.current.render(ctx, canvasWidth, canvasHeight);
    }

    // Step and render particles
    if (particleRef.current) {
      particleRef.current.step();
      particleRef.current.render(ctx);
    }
  }, [state.nodes, canvasWidth, canvasHeight]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = 0;
    const interval = 1000 / fps;

    const loop = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        renderFrame();
        frameRef.current++;
        setCurrentFrame(frameRef.current);
        if (frameRef.current >= totalFrames) {
          frameRef.current = 0;
          // Reset engines
          particleRef.current?.reset();
          fluidRef.current?.reset();
          const fluidNode = state.nodes.find(n => n.type === 'fluid-sim');
          if (fluidRef.current && fluidNode) {
            const N = fluidNode.params.resolution;
            for (let i = -2; i <= 2; i++) {
              for (let j = -2; j <= 2; j++) {
                fluidRef.current.addDensity(N / 2 + i, N / 2 + j, 50);
              }
            }
            fluidRef.current.addVelocity(N / 2, N / 2, 0, 5);
          }
        }
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, fps, totalFrames, renderFrame, state.nodes]);

  const handleReset = () => {
    setIsPlaying(false);
    frameRef.current = 0;
    setCurrentFrame(0);
    particleRef.current?.reset();
    fluidRef.current?.reset();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(220,15%,8%)]">
      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div className="relative" style={{ width: canvasWidth * zoom, height: canvasHeight * zoom }}>
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(220,12%,30%) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(220,12%,30%) 1px, transparent 1px)
                `,
                backgroundSize: `${zoom}px ${zoom}px`,
              }}
            />
          )}
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="pixel-canvas border border-border"
            style={{
              width: canvasWidth * zoom,
              height: canvasHeight * zoom,
            }}
          />
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-card">
        <button onClick={handleReset} className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground">
          <RotateCcw size={14} />
        </button>
        <button onClick={() => { frameRef.current = Math.max(0, frameRef.current - 1); setCurrentFrame(frameRef.current); }}
          className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground">
          <SkipBack size={14} />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 hover:bg-accent rounded transition-colors text-foreground bg-accent">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => { frameRef.current = Math.min(totalFrames - 1, frameRef.current + 1); setCurrentFrame(frameRef.current); }}
          className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground">
          <SkipForward size={14} />
        </button>

        <div className="flex-1 mx-2">
          <div className="h-1 bg-secondary rounded-full relative">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(currentFrame / totalFrames) * 100}%`,
                background: 'hsl(200, 80%, 55%)',
              }}
            />
          </div>
        </div>

        <span className="text-[10px] text-muted-foreground font-mono w-16 text-right">
          {currentFrame}/{totalFrames}
        </span>

        <div className="flex items-center gap-1 ml-2 border-l border-border pl-2">
          <button onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${showGrid ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <Grid3X3 size={14} />
          </button>
          <button onClick={() => setZoom(Math.max(1, zoom - 1))}
            className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground">
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] text-muted-foreground font-mono w-6 text-center">{zoom}x</span>
          <button onClick={() => setZoom(Math.min(12, zoom + 1))}
            className="p-1.5 hover:bg-accent rounded transition-colors text-muted-foreground hover:text-foreground">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
