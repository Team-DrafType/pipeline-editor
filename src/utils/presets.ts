import type { PresetPipeline } from '../types';

export const PRESETS: PresetPipeline[] = [
  {
    id: 'review',
    name: 'Review Pipeline',
    description: 'explore → architect → critic → executor',
    nodes: [
      { agentType: 'explore', prompt: 'Analyze codebase structure and patterns' },
      { agentType: 'architect', prompt: 'Review architecture and identify improvements' },
      { agentType: 'critic', prompt: 'Evaluate the proposed changes and flag risks' },
      { agentType: 'executor', prompt: 'Implement the approved changes' },
    ],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: 'implement',
    name: 'Implement Pipeline',
    description: 'planner → executor → tdd-guide',
    nodes: [
      { agentType: 'planner', prompt: 'Plan the implementation strategy' },
      { agentType: 'executor', prompt: 'Implement the planned feature' },
      { agentType: 'tdd-guide', prompt: 'Write tests for the implementation' },
    ],
    edges: [[0, 1], [1, 2]],
  },
  {
    id: 'debug',
    name: 'Debug Pipeline',
    description: 'explore → architect → build-fixer',
    nodes: [
      { agentType: 'explore', prompt: 'Search for the bug location and root cause' },
      { agentType: 'architect', prompt: 'Analyze the bug and design the fix' },
      { agentType: 'build-fixer', prompt: 'Apply the fix and verify build passes' },
    ],
    edges: [[0, 1], [1, 2]],
  },
  {
    id: 'research',
    name: 'Research Pipeline',
    description: '(researcher + explore) → architect → writer',
    nodes: [
      { agentType: 'researcher', prompt: 'Research external documentation and APIs' },
      { agentType: 'explore', prompt: 'Explore existing codebase for related patterns' },
      { agentType: 'architect', prompt: 'Synthesize research into architectural plan' },
      { agentType: 'writer', prompt: 'Document the findings and recommendations' },
    ],
    edges: [[0, 2], [1, 2], [2, 3]],
  },
  {
    id: 'full-autopilot',
    name: 'Full Autopilot',
    description: '(analyst + architect) → executor×3 → build-fixer → architect',
    nodes: [
      { agentType: 'analyst', prompt: 'Analyze requirements and constraints' },
      { agentType: 'architect', prompt: 'Design the solution architecture' },
      { agentType: 'executor', prompt: 'Implement core logic' },
      { agentType: 'executor', model: 'sonnet', prompt: 'Implement API layer' },
      { agentType: 'executor', model: 'sonnet', prompt: 'Implement UI components' },
      { agentType: 'build-fixer', prompt: 'Fix any build errors' },
      { agentType: 'architect', model: 'opus', prompt: 'Final verification and review' },
    ],
    edges: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5], [5, 6]],
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'explore → security-reviewer → executor → security-reviewer-low',
    nodes: [
      { agentType: 'explore', prompt: 'Map attack surface and entry points' },
      { agentType: 'security-reviewer', prompt: 'Deep security analysis and vulnerability detection' },
      { agentType: 'executor', prompt: 'Apply security fixes' },
      { agentType: 'security-reviewer-low', prompt: 'Verify fixes and final security scan' },
    ],
    edges: [[0, 1], [1, 2], [2, 3]],
  },
];
