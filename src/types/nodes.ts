export type NodeType = 'input-image' | 'input-canvas' | 'input-color' | 'particle-emitter' | 'fluid-sim' | 'modifier-pixelate' | 'modifier-glow' | 'modifier-trail' | 'modifier-blur' | 'modifier-dissolve' | 'modifier-color-remap' | 'output-render';

export type NodeCategory = 'input' | 'simulation' | 'modifier' | 'output';

export interface Port {
  id: string;
  name: string;
  type: 'input' | 'output';
  dataType: 'image' | 'simulation' | 'any';
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  id: string;
  type: NodeType;
  category: NodeCategory;
  label: string;
  position: NodePosition;
  ports: Port[];
  params: Record<string, any>;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface GraphState {
  nodes: NodeData[];
  connections: Connection[];
  selectedNodeId: string | null;
}

export interface HistoryEntry {
  nodes: NodeData[];
  connections: Connection[];
}

export const NODE_CATEGORY_COLORS: Record<NodeCategory, string> = {
  input: 'hsl(210, 90%, 60%)',
  simulation: 'hsl(145, 70%, 50%)',
  modifier: 'hsl(30, 90%, 55%)',
  output: 'hsl(0, 80%, 58%)',
};

export const NODE_TEMPLATES: Record<NodeType, Omit<NodeData, 'id' | 'position'>> = {
  'input-image': {
    type: 'input-image',
    category: 'input',
    label: 'Image Upload',
    ports: [{ id: 'out', name: 'Image', type: 'output', dataType: 'image' }],
    params: { imageData: null },
  },
  'input-canvas': {
    type: 'input-canvas',
    category: 'input',
    label: 'Pixel Canvas',
    ports: [{ id: 'out', name: 'Image', type: 'output', dataType: 'image' }],
    params: { width: 32, height: 32, canvasData: null },
  },
  'input-color': {
    type: 'input-color',
    category: 'input',
    label: 'Color Fill',
    ports: [{ id: 'out', name: 'Image', type: 'output', dataType: 'image' }],
    params: { color: '#ff0000', width: 32, height: 32 },
  },
  'particle-emitter': {
    type: 'particle-emitter',
    category: 'simulation',
    label: 'Particle Emitter',
    ports: [
      { id: 'in', name: 'Source', type: 'input', dataType: 'image' },
      { id: 'out', name: 'Result', type: 'output', dataType: 'image' },
    ],
    params: {
      spawnRate: 10,
      lifetime: 60,
      gravity: 0.1,
      velocityX: 0,
      velocityY: -2,
      spread: 1,
      color: '#ffaa00',
      size: 1,
      fadeOut: true,
    },
  },
  'fluid-sim': {
    type: 'fluid-sim',
    category: 'simulation',
    label: 'Fluid Simulation',
    ports: [
      { id: 'in', name: 'Source', type: 'input', dataType: 'image' },
      { id: 'out', name: 'Result', type: 'output', dataType: 'image' },
    ],
    params: {
      viscosity: 0.1,
      diffusion: 0.001,
      pressure: 0.5,
      gravityX: 0,
      gravityY: 0.5,
      color: '#3388ff',
      resolution: 64,
    },
  },
  'modifier-pixelate': {
    type: 'modifier-pixelate',
    category: 'modifier',
    label: 'Pixelate',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { pixelSize: 4 },
  },
  'modifier-glow': {
    type: 'modifier-glow',
    category: 'modifier',
    label: 'Glow',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { intensity: 0.5, radius: 3, color: '#ffffff' },
  },
  'modifier-trail': {
    type: 'modifier-trail',
    category: 'modifier',
    label: 'Trail / Afterimage',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { length: 5, opacity: 0.5 },
  },
  'modifier-blur': {
    type: 'modifier-blur',
    category: 'modifier',
    label: 'Blur',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { radius: 2 },
  },
  'modifier-dissolve': {
    type: 'modifier-dissolve',
    category: 'modifier',
    label: 'Dissolve',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { threshold: 0.5, noise: 0.3 },
  },
  'modifier-color-remap': {
    type: 'modifier-color-remap',
    category: 'modifier',
    label: 'Color Remap',
    ports: [
      { id: 'in', name: 'Input', type: 'input', dataType: 'any' },
      { id: 'out', name: 'Output', type: 'output', dataType: 'image' },
    ],
    params: { palette: ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'] },
  },
  'output-render': {
    type: 'output-render',
    category: 'output',
    label: 'Final Render',
    ports: [{ id: 'in', name: 'Input', type: 'input', dataType: 'any' }],
    params: { width: 64, height: 64, fps: 12, duration: 60 },
  },
};
