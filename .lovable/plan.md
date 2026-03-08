

# PixelVFX Studio — Pixel Art VFX & Simulation Tool

## Overview
A browser-based, Houdini-inspired node graph editor for creating pixel art VFX — focusing on fluid simulations and particle effects with a fully non-destructive workflow. Users connect effect nodes visually, preview results in real-time on a pixel canvas, and export as video, GIF, spritesheet, or frame sequence.

## Pages & Layout

### Main Editor (Single-page app)
A dark-themed editor with 3 main panels:
- **Left Panel** — Asset browser (uploaded sprites, built-in samples, presets) + simple pixel editor for creating input sprites
- **Center Panel** — Pixel art preview canvas with playback controls (play/pause/scrub timeline), zoom, and grid overlay
- **Right Panel** — Node properties inspector showing parameters for the selected node (sliders, color pickers, curves)
- **Bottom Panel** — Node graph workspace where users connect nodes via drag-and-drop wires

### Node Graph System (Non-destructive core)
- **Input nodes**: Image Upload, Pixel Canvas, Color/Shape generators
- **Simulation nodes**: Fluid Sim (pressure, viscosity, density), Particle Emitter (gravity, velocity, lifetime, spawn rate), Explosion, Smoke, Fire, Dust
- **Modifier nodes**: Pixelate, Color Remap, Blur, Glow, Trail/Afterimage, Dissolve
- **Output node**: Final Render — connects to the preview canvas
- Nodes connect via ports; data flows left-to-right. Each node is independently configurable and the chain is fully reorderable/removable (non-destructive).

### Pixel Art Simulations
- **Fluid simulation**: Grid-based pressure solver rendered at pixel resolution — configure viscosity, color, gravity, boundaries. Renders liquid/blood/magic effects.
- **Particle system**: Configurable emitters with pixel-snapped rendering — spawn shapes, apply forces, set lifetime/fade. For explosions, sparks, dust, smoke.
- All simulations run on a configurable canvas size (e.g., 32×32, 64×64, 128×128) with adjustable frame rate and duration.

### Built-in Pixel Editor
- Simple drawing tools (pencil, eraser, fill, color picker) on a small canvas
- Output feeds directly into the node graph as an input node
- Palette selector with common pixel art palettes

### Presets & Samples
- Built-in sample sprites (character, sword, potion, etc.)
- Effect presets: "Blood Splash", "Magic Burst", "Dust Cloud", "Fire Trail", "Explosion" — each is a pre-wired node graph users can load and tweak

### Timeline & Playback
- Frame-by-frame timeline at bottom of preview
- Play/pause, frame stepping, loop toggle
- Adjustable duration (number of frames) and FPS

### Export System
- **Video (WebM)** — uses Canvas recording API to capture the animation
- **GIF** — rendered client-side using a GIF encoder library
- **Spritesheet PNG** — all frames laid out in a grid, trimmed and optimized
- **Frame sequence ZIP** — individual PNG frames bundled for download
- Export dialog with format selection, scale multiplier (1x, 2x, 4x), and background transparency toggle

## Design
- Dark theme (dark grays/charcoal) with accent colors for node types (blue for input, green for simulation, orange for modifiers, red for output)
- Pixel-perfect preview with crisp nearest-neighbor scaling
- Neon-accented wires in the node graph
- Compact, information-dense UI inspired by professional VFX tools

## Technical Approach
- Node graph: custom React canvas component with drag-and-drop node/wire system
- Simulations: HTML5 Canvas 2D with pixel-level rendering, requestAnimationFrame loop
- Fluid sim: simplified Navier-Stokes on a low-res grid
- Particles: simple Euler integration with pixel snapping
- Export: MediaRecorder API for video, gif.js for GIF, canvas.toBlob for PNGs, JSZip for frame sequences
- All state managed in React context — full undo/redo history stack for non-destructive editing

