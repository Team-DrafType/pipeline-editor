import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  MarkerType,
} from '@xyflow/react';
import { AGENT_DEFINITIONS } from '../constants/agents';
import type { AgentNodeData, PresetPipeline } from '../types';

let nodeIdCounter = 0;

const getNextId = () => `node_${++nodeIdCounter}`;

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (agentType: string, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<AgentNodeData>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  loadPreset: (preset: PresetPipeline) => void;
  clear: () => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    const edge = {
      ...connection,
      id: `edge_${connection.source}_${connection.target}`,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      style: { stroke: '#64748b', strokeWidth: 2 },
    };
    set({ edges: addEdge(edge, get().edges) });
  },

  addNode: (agentType, position) => {
    const def = AGENT_DEFINITIONS.find((a) => a.id === agentType);
    if (!def) return;

    const newNode: Node = {
      id: getNextId(),
      type: 'agentNode',
      position,
      data: {
        agentType: def.id,
        label: def.label,
        model: def.defaultModel,
        prompt: '',
        category: def.category,
        color: def.color,
        description: def.description,
      } satisfies AgentNodeData,
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  updateNodeData: (id, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  loadPreset: (preset) => {
    nodeIdCounter = 0;
    const COLS = 2;
    const X_SPACING = 280;
    const Y_SPACING = 120;
    const X_OFFSET = 100;
    const Y_OFFSET = 80;

    const nodes: Node[] = preset.nodes.map((n, i) => {
      const def = AGENT_DEFINITIONS.find((a) => a.id === n.agentType);
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      return {
        id: getNextId(),
        type: 'agentNode',
        position: { x: X_OFFSET + col * X_SPACING, y: Y_OFFSET + row * Y_SPACING },
        data: {
          agentType: n.agentType,
          label: def?.label ?? n.agentType,
          model: n.model ?? def?.defaultModel ?? 'sonnet',
          prompt: n.prompt ?? '',
          category: def?.category ?? 'execution',
          color: def?.color ?? '#3b82f6',
          description: def?.description ?? '',
        } satisfies AgentNodeData,
      };
    });

    const edges: Edge[] = preset.edges.map(([srcIdx, tgtIdx]) => ({
      id: `edge_${nodes[srcIdx].id}_${nodes[tgtIdx].id}`,
      source: nodes[srcIdx].id,
      target: nodes[tgtIdx].id,
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      style: { stroke: '#64748b', strokeWidth: 2 },
    }));

    set({ nodes, edges, selectedNodeId: null });
  },

  clear: () => {
    nodeIdCounter = 0;
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));

export default useFlowStore;
