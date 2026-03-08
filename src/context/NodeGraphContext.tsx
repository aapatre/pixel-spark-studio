import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { NodeData, Connection, GraphState, HistoryEntry, NODE_TEMPLATES, NodeType } from '@/types/nodes';

interface NodeGraphContextType {
  state: GraphState;
  history: HistoryEntry[];
  historyIndex: number;
  addNode: (type: NodeType, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  updateNodeParams: (id: string, params: Record<string, any>) => void;
  addConnection: (conn: Omit<Connection, 'id'>) => void;
  removeConnection: (id: string) => void;
  undo: () => void;
  redo: () => void;
  loadPreset: (nodes: NodeData[], connections: Connection[]) => void;
  canUndo: boolean;
  canRedo: boolean;
}

type Action =
  | { type: 'ADD_NODE'; payload: NodeData }
  | { type: 'REMOVE_NODE'; payload: string }
  | { type: 'MOVE_NODE'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'UPDATE_PARAMS'; payload: { id: string; params: Record<string, any> } }
  | { type: 'ADD_CONNECTION'; payload: Connection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'LOAD_PRESET'; payload: { nodes: NodeData[]; connections: Connection[] } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

interface FullState {
  graph: GraphState;
  history: HistoryEntry[];
  historyIndex: number;
}

function pushHistory(state: FullState): HistoryEntry[] {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({
    nodes: JSON.parse(JSON.stringify(state.graph.nodes)),
    connections: JSON.parse(JSON.stringify(state.graph.connections)),
  });
  if (newHistory.length > 50) newHistory.shift();
  return newHistory;
}

function reducer(state: FullState, action: Action): FullState {
  switch (action.type) {
    case 'ADD_NODE': {
      // Ensure there is only ever one output-render node
      if (
        action.payload.type === 'output-render' &&
        state.graph.nodes.some(n => n.type === 'output-render')
      ) {
        return state;
      }
      const history = pushHistory(state);
      return {
        graph: { ...state.graph, nodes: [...state.graph.nodes, action.payload] },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'REMOVE_NODE': {
      // Prevent deletion of the default output-render node
      const nodeToRemove = state.graph.nodes.find(n => n.id === action.payload);
      if (nodeToRemove?.type === 'output-render') return state;
      const history = pushHistory(state);
      return {
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.filter(n => n.id !== action.payload),
          connections: state.graph.connections.filter(
            c => c.fromNodeId !== action.payload && c.toNodeId !== action.payload
          ),
          selectedNodeId: state.graph.selectedNodeId === action.payload ? null : state.graph.selectedNodeId,
        },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'MOVE_NODE': {
      return {
        ...state,
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map(n =>
            n.id === action.payload.id ? { ...n, position: action.payload.position } : n
          ),
        },
      };
    }
    case 'SELECT_NODE':
      return { ...state, graph: { ...state.graph, selectedNodeId: action.payload } };
    case 'UPDATE_PARAMS': {
      const history = pushHistory(state);
      return {
        graph: {
          ...state.graph,
          nodes: state.graph.nodes.map(n =>
            n.id === action.payload.id ? { ...n, params: { ...n.params, ...action.payload.params } } : n
          ),
        },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'ADD_CONNECTION': {
      const existing = state.graph.connections.find(
        c => c.toNodeId === action.payload.toNodeId && c.toPortId === action.payload.toPortId
      );
      const history = pushHistory(state);
      return {
        graph: {
          ...state.graph,
          connections: existing
            ? state.graph.connections.map(c => c.id === existing.id ? action.payload : c)
            : [...state.graph.connections, action.payload],
        },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'REMOVE_CONNECTION': {
      const history = pushHistory(state);
      return {
        graph: {
          ...state.graph,
          connections: state.graph.connections.filter(c => c.id !== action.payload),
        },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'LOAD_PRESET': {
      const history = pushHistory(state);
      return {
        graph: {
          nodes: action.payload.nodes,
          connections: action.payload.connections,
          selectedNodeId: null,
        },
        history,
        historyIndex: history.length - 1,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const idx = state.historyIndex - 1;
      const entry = state.history[idx];
      return {
        ...state,
        graph: {
          nodes: JSON.parse(JSON.stringify(entry.nodes)),
          connections: JSON.parse(JSON.stringify(entry.connections)),
          selectedNodeId: null,
        },
        historyIndex: idx,
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const idx = state.historyIndex + 1;
      const entry = state.history[idx];
      return {
        ...state,
        graph: {
          nodes: JSON.parse(JSON.stringify(entry.nodes)),
          connections: JSON.parse(JSON.stringify(entry.connections)),
          selectedNodeId: null,
        },
        historyIndex: idx,
      };
    }
    default:
      return state;
  }
}

const defaultOutputNode: NodeData = {
  id: 'output-render-default',
  type: 'output-render',
  category: 'output',
  label: 'Final Render',
  position: { x: 600, y: 100 },
  ports: [{ id: 'output-render-default_in', name: 'Input', type: 'input', dataType: 'any' }],
  params: { width: 64, height: 64, fps: 12, duration: 60 },
};

const initialState: FullState = {
  graph: { nodes: [defaultOutputNode], connections: [], selectedNodeId: null },
  history: [{ nodes: [defaultOutputNode], connections: [] }],
  historyIndex: 0,
};

const NodeGraphContext = createContext<NodeGraphContextType | null>(null);

let nodeIdCounter = 0;

export function NodeGraphProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addNode = useCallback((type: NodeType, position: { x: number; y: number }) => {
    const template = NODE_TEMPLATES[type];
    const id = `node_${++nodeIdCounter}_${Date.now()}`;
    const node: NodeData = {
      ...JSON.parse(JSON.stringify(template)),
      id,
      position,
      ports: template.ports.map(p => ({ ...p, id: `${id}_${p.id}` })),
    };
    dispatch({ type: 'ADD_NODE', payload: node });
  }, []);

  const removeNode = useCallback((id: string) => dispatch({ type: 'REMOVE_NODE', payload: id }), []);
  const moveNode = useCallback((id: string, position: { x: number; y: number }) =>
    dispatch({ type: 'MOVE_NODE', payload: { id, position } }), []);
  const selectNode = useCallback((id: string | null) => dispatch({ type: 'SELECT_NODE', payload: id }), []);
  const updateNodeParams = useCallback((id: string, params: Record<string, any>) =>
    dispatch({ type: 'UPDATE_PARAMS', payload: { id, params } }), []);
  const addConnection = useCallback((conn: Omit<Connection, 'id'>) => {
    const id = `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: 'ADD_CONNECTION', payload: { ...conn, id } });
  }, []);
  const removeConnection = useCallback((id: string) => dispatch({ type: 'REMOVE_CONNECTION', payload: id }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const loadPreset = useCallback((nodes: NodeData[], connections: Connection[]) =>
    dispatch({ type: 'LOAD_PRESET', payload: { nodes, connections } }), []);

  return (
    <NodeGraphContext.Provider value={{
      state: state.graph,
      history: state.history,
      historyIndex: state.historyIndex,
      addNode, removeNode, moveNode, selectNode, updateNodeParams,
      addConnection, removeConnection, undo, redo, loadPreset,
      canUndo: state.historyIndex > 0,
      canRedo: state.historyIndex < state.history.length - 1,
    }}>
      {children}
    </NodeGraphContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNodeGraph() {
  const ctx = useContext(NodeGraphContext);
  if (!ctx) throw new Error('useNodeGraph must be used within NodeGraphProvider');
  return ctx;
}
