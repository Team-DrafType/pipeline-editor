import type { PipelineStep } from '../types';

export function exportToPrompt(steps: PipelineStep[], name?: string, edgeContexts?: Map<string, string>): string {
  if (steps.length === 0) return '// Empty pipeline - add some agents first!';

  const lines: string[] = [];

  lines.push(`다음 에이전트 파이프라인을 순서대로 실행해줘.`);
  lines.push(`작업: ${name || '파이프라인 실행'}`);
  lines.push('');
  lines.push('## 실행 규칙');
  lines.push('- 같은 단계의 에이전트들은 반드시 병렬로 동시 실행할 것');
  lines.push('- 이전 단계가 완료되어야 다음 단계로 진행할 것');
  lines.push('- 각 에이전트의 결과를 다음 단계 에이전트에게 컨텍스트로 전달할 것');
  lines.push('- 실패 시 해당 단계를 재시도하고, 2회 실패 시 사용자에게 보고할 것');
  lines.push('');
  lines.push('## 파이프라인 단계');
  lines.push('');

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const parallelTag = step.parallel ? ' [병렬]' : '';
    lines.push(`### ${step.step}단계${parallelTag}`);
    lines.push('');

    for (const agent of step.agents) {
      lines.push(`- **${agent.type}** (${agent.model})`);
      if (agent.prompt) {
        lines.push(`  - 지시: "${agent.prompt}"`);
      }
      if (agent.contextFrom) {
        lines.push(`  - 입력 컨텍스트: ${agent.contextFrom}`);
      }
    }

    // Show context flow to next step if edgeContexts provided
    if (edgeContexts && edgeContexts.size > 0 && i < steps.length - 1) {
      const contextLabels: string[] = [];
      for (const [key, value] of edgeContexts) {
        // Check if this context flows from current step's agents
        const parts = key.split('\u2192');
        if (parts.length === 2) {
          // We check by matching node IDs - the edgeContexts uses node IDs
          contextLabels.push(value);
        }
      }
      // Deduplicate
      const unique = [...new Set(contextLabels)];
      if (unique.length > 0) {
        lines.push('');
        lines.push(`> 다음 단계로 전달: ${unique.join(', ')}`);
      }
    }

    if (step.contextOutputs && step.contextOutputs.length > 0) {
      lines.push('');
      lines.push(`> 출력 데이터: ${step.contextOutputs.join(', ')}`);
    }

    lines.push('');
  }

  lines.push('## 완료 조건');
  lines.push('- 모든 단계가 성공적으로 완료됨');
  lines.push('- 빌드 에러 없음');
  lines.push('- 최종 단계 에이전트의 검증 통과');

  return lines.join('\n').trimEnd();
}
