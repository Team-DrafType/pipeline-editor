import type { Node, Edge } from '@xyflow/react';

export type ModelTier = 'haiku' | 'sonnet' | 'opus';

export type AgentCategory =
  | 'execution'
  | 'analysis'
  | 'search'
  | 'research'
  | 'frontend'
  | 'testing'
  | 'security'
  | 'build'
  | 'review'
  | 'planning'
  | 'docs'
  | 'visual'
  | 'data';

export interface AgentDefinition {
  id: string;
  label: string;
  category: AgentCategory;
  defaultModel: ModelTier;
  availableModels: ModelTier[];
  color: string;
  description: string;
}

export interface AgentNodeData {
  agentType: string;
  label: string;
  model: ModelTier;
  prompt: string;
  category: AgentCategory;
  color: string;
  description: string;
  [key: string]: unknown;
}

export type AgentNode = Node<AgentNodeData>;

export interface PipelineStep {
  step: number;
  parallel: boolean;
  agents: {
    type: string;
    model: ModelTier;
    prompt: string;
  }[];
}

export interface Pipeline {
  name: string;
  steps: PipelineStep[];
}

export interface PresetPipeline {
  id: string;
  name: string;
  description: string;
  nodes: { agentType: string; model?: ModelTier; prompt?: string }[];
  edges: [number, number][];
}

export interface SavedPipeline {
  id: string;
  name: string;
  timestamp: number;
  nodes: Node[];
  edges: Edge[];
}
