import type { Pipeline, PipelineStep } from '../types';

export function exportToJson(steps: PipelineStep[], name?: string): Pipeline {
  return {
    name: name || 'Untitled Pipeline',
    steps: steps.map((step) => ({
      step: step.step,
      parallel: step.parallel,
      agents: step.agents.map((a) => ({
        type: a.type,
        model: a.model,
        prompt: a.prompt,
      })),
    })),
  };
}

export function exportToJsonString(steps: PipelineStep[], name?: string): string {
  return JSON.stringify(exportToJson(steps, name), null, 2);
}
