import type { Node, Edge } from '@xyflow/react';
import type { AgentNodeData, PipelineStep } from '../types';

export function analyzeGraph(nodes: Node[], edges: Edge[]): PipelineStep[] {
  if (nodes.length === 0) return [];

  // Build adjacency info
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  // BFS topological sort by levels
  const steps: PipelineStep[] = [];
  let currentLevel = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);
  let stepNum = 1;

  const visited = new Set<string>();

  while (currentLevel.length > 0) {
    const agents = currentLevel.map((node) => {
      const data = node.data as unknown as AgentNodeData;
      visited.add(node.id);
      return {
        type: data.agentType,
        model: data.model,
        prompt: data.prompt || '',
      };
    });

    steps.push({
      step: stepNum++,
      parallel: agents.length > 1,
      agents,
    });

    // Find next level
    const nextLevel: Node[] = [];
    for (const node of currentLevel) {
      for (const targetId of adjacency.get(node.id) ?? []) {
        inDegree.set(targetId, (inDegree.get(targetId) ?? 0) - 1);
        if ((inDegree.get(targetId) ?? 0) === 0 && !visited.has(targetId)) {
          const targetNode = nodes.find((n) => n.id === targetId);
          if (targetNode) nextLevel.push(targetNode);
        }
      }
    }

    currentLevel = nextLevel;
  }

  // Add any unvisited nodes (disconnected) as a final step
  const unvisited = nodes.filter((n) => !visited.has(n.id));
  if (unvisited.length > 0) {
    steps.push({
      step: stepNum,
      parallel: unvisited.length > 1,
      agents: unvisited.map((node) => {
        const data = node.data as unknown as AgentNodeData;
        return {
          type: data.agentType,
          model: data.model,
          prompt: data.prompt || '',
        };
      }),
    });
  }

  return steps;
}

export function extractEdgeContexts(edges: Edge[]): Map<string, string> {
  const contexts = new Map<string, string>();
  for (const edge of edges) {
    const label = (edge.data as { contextLabel?: string })?.contextLabel || (edge.label as string) || '';
    if (label) {
      contexts.set(`${edge.source}\u2192${edge.target}`, label);
    }
  }
  return contexts;
}
