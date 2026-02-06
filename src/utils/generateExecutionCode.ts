import type { PipelineStep } from '../types';

export function generateClaudeCodeScript(steps: PipelineStep[], taskDescription: string): string {
  const lines: string[] = [];

  lines.push('// ============================================');
  lines.push('// Agent Pipeline Execution Script');
  lines.push(`// Task: ${taskDescription || 'Untitled Pipeline'}`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('// ============================================');
  lines.push('');
  lines.push('// 이 코드는 Claude Code의 Task 도구 호출 형태로 생성되었습니다.');
  lines.push('// Claude Code 대화에서 아래 프롬프트를 복사하여 실행하세요.');
  lines.push('');

  for (const step of steps) {
    lines.push(`// --- Step ${step.step} ${step.parallel ? '(병렬 실행)' : '(순차 실행)'} ---`);

    if (step.parallel && step.agents.length > 1) {
      lines.push('// 아래 에이전트들을 동시에 실행합니다:');
      for (const agent of step.agents) {
        lines.push(`Task({`);
        lines.push(`  subagent_type: "oh-my-claudecode:${agent.type}",`);
        lines.push(`  model: "${agent.model}",`);
        lines.push(`  description: "${agent.type} - step ${step.step}",`);
        lines.push(`  prompt: \`${agent.prompt || `Step ${step.step}: ${agent.type} 작업 실행`}\``);
        lines.push(`});`);
        lines.push('');
      }
    } else {
      const agent = step.agents[0];
      lines.push(`Task({`);
      lines.push(`  subagent_type: "oh-my-claudecode:${agent.type}",`);
      lines.push(`  model: "${agent.model}",`);
      lines.push(`  description: "${agent.type} - step ${step.step}",`);
      lines.push(`  prompt: \`${agent.prompt || `Step ${step.step}: ${agent.type} 작업 실행`}\``);
      lines.push(`});`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function generateExecutionPrompt(steps: PipelineStep[], taskDescription: string): string {
  const lines: string[] = [];

  lines.push(`다음 에이전트 파이프라인을 순서대로 실행해줘.`);
  lines.push(`작업: ${taskDescription || '파이프라인 실행'}`);
  lines.push('');
  lines.push('## 실행 규칙');
  lines.push('- 같은 단계의 에이전트들은 반드시 병렬로 동시 실행할 것');
  lines.push('- 이전 단계가 완료되어야 다음 단계로 진행할 것');
  lines.push('- 각 에이전트의 결과를 다음 단계 에이전트에게 컨텍스트로 전달할 것');
  lines.push('- 실패 시 해당 단계를 재시도하고, 2회 실패 시 사용자에게 보고할 것');
  lines.push('');
  lines.push('## 파이프라인 단계');
  lines.push('');

  for (const step of steps) {
    const parallelTag = step.parallel ? ' [병렬]' : '';
    lines.push(`### ${step.step}단계${parallelTag}`);
    lines.push('');

    for (const agent of step.agents) {
      lines.push(`- **${agent.type}** (${agent.model})`);
      if (agent.prompt) {
        lines.push(`  - 지시: "${agent.prompt}"`);
      }
    }
    lines.push('');
  }

  lines.push('## 완료 조건');
  lines.push('- 모든 단계가 성공적으로 완료됨');
  lines.push('- 빌드 에러 없음');
  lines.push('- 최종 단계 에이전트의 검증 통과');

  return lines.join('\n');
}

export function generateRunnableScript(steps: PipelineStep[], taskDescription: string): string {
  const lines: string[] = [];
  const desc = taskDescription || 'Untitled Pipeline';

  // Shebang + header comments
  lines.push('#!/usr/bin/env node');
  lines.push(`// Pipeline: ${desc}`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('// npm install @anthropic-ai/sdk');
  lines.push('');

  // SDK import and client setup
  lines.push("const Anthropic = require('@anthropic-ai/sdk');");
  lines.push('const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 자동 사용');
  lines.push('');

  // Model mapping
  lines.push('const MODEL_MAP = {');
  lines.push("  haiku: 'claude-haiku-4-5-20251001',");
  lines.push("  sonnet: 'claude-sonnet-4-5-20250929',");
  lines.push("  opus: 'claude-opus-4-6',");
  lines.push('};');
  lines.push('');

  // Agent runner function with retry
  lines.push('async function runAgent(type, model, prompt, context, retries = 2) {');
  lines.push('  const systemPrompt = [');
  lines.push('    `당신은 ${type} 에이전트입니다.`,');
  lines.push("    '주어진 작업을 전문적으로 수행하고, 결과를 명확하게 보고하세요.',");
  lines.push("    '이전 단계의 결과가 제공된 경우, 그 내용을 참고하여 작업을 수행하세요.',");
  lines.push("  ].join(' ');");
  lines.push('');
  lines.push('  const userMessage = context');
  lines.push("    ? `이전 단계 결과:\\n${context}\\n\\n---\\n\\n작업: ${prompt}`");
  lines.push('    : prompt;');
  lines.push('');
  lines.push('  for (let attempt = 1; attempt <= retries; attempt++) {');
  lines.push('    try {');
  lines.push('      const response = await client.messages.create({');
  lines.push('        model: MODEL_MAP[model] || MODEL_MAP.sonnet,');
  lines.push('        max_tokens: 4096,');
  lines.push('        system: systemPrompt,');
  lines.push("        messages: [{ role: 'user', content: userMessage }],");
  lines.push('      });');
  lines.push("      return response.content[0].text;");
  lines.push('    } catch (err) {');
  lines.push('      console.error(`  [${type}] 시도 ${attempt}/${retries} 실패:`, err.message);');
  lines.push('      if (attempt === retries) throw err;');
  lines.push('      await new Promise((r) => setTimeout(r, 1000 * attempt));');
  lines.push('    }');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  // Main function
  lines.push('async function main() {');
  lines.push(`  console.log('='.repeat(60));`);
  lines.push(`  console.log('Pipeline 실행 시작: ${desc.replace(/'/g, "\\'")}');`);
  lines.push(`  console.log('='.repeat(60));`);
  lines.push('  console.log();');
  lines.push('  const startTime = Date.now();');
  lines.push("  let context = '';");
  lines.push('');

  for (const step of steps) {
    const stepVar = `step${step.step}Results`;
    lines.push(`  // --- Step ${step.step} ${step.parallel && step.agents.length > 1 ? '(병렬 실행)' : '(순차 실행)'} ---`);
    lines.push(`  console.log('[Step ${step.step}] 시작...');`);

    if (step.parallel && step.agents.length > 1) {
      lines.push(`  const ${stepVar} = await Promise.all([`);
      for (const agent of step.agents) {
        const prompt = (agent.prompt || `Step ${step.step}: ${agent.type} 작업 실행`).replace(/'/g, "\\'");
        lines.push(`    runAgent('${agent.type}', '${agent.model}', '${prompt}', context),`);
      }
      lines.push('  ]);');
    } else {
      const agent = step.agents[0];
      const prompt = (agent.prompt || `Step ${step.step}: ${agent.type} 작업 실행`).replace(/'/g, "\\'");
      lines.push(`  const ${stepVar} = [await runAgent('${agent.type}', '${agent.model}', '${prompt}', context)];`);
    }

    lines.push('');
    lines.push(`  ${stepVar}.forEach((result, i) => {`);
    lines.push(`    console.log(\`  [Step ${step.step} - Agent \${i + 1}] 완료\`);`);
    lines.push("    console.log('-'.repeat(40));");
    lines.push('    console.log(result.slice(0, 500));');
    lines.push("    console.log('-'.repeat(40));");
    lines.push('  });');
    lines.push(`  context = ${stepVar}.join('\\n---\\n');`);
    lines.push('');
  }

  lines.push("  console.log('='.repeat(60));");
  lines.push("  console.log(`Pipeline 완료! (${((Date.now() - startTime) / 1000).toFixed(1)}초)`);");
  lines.push("  console.log('='.repeat(60));");
  lines.push('}');
  lines.push('');
  lines.push('main().catch((err) => {');
  lines.push("  console.error('Pipeline 실행 중 오류 발생:', err);");
  lines.push('  process.exit(1);');
  lines.push('});');

  return lines.join('\n');
}

export function generateMermaidDiagram(steps: PipelineStep[]): string {
  const lines: string[] = ['graph TD'];
  let nodeCounter = 0;
  const stepNodes: string[][] = [];

  for (const step of steps) {
    const currentStepNodes: string[] = [];
    for (const agent of step.agents) {
      const nodeId = `N${nodeCounter++}`;
      const label = `${agent.type}\\n(${agent.model})`;
      lines.push(`  ${nodeId}["${label}"]`);
      currentStepNodes.push(nodeId);
    }
    stepNodes.push(currentStepNodes);
  }

  // Connect steps
  for (let i = 0; i < stepNodes.length - 1; i++) {
    for (const src of stepNodes[i]) {
      for (const tgt of stepNodes[i + 1]) {
        lines.push(`  ${src} --> ${tgt}`);
      }
    }
  }

  // Style parallel groups
  for (let i = 0; i < stepNodes.length; i++) {
    if (stepNodes[i].length > 1) {
      lines.push(`  subgraph Step${i + 1} [" ${i + 1}단계 - 병렬"]`);
      for (const node of stepNodes[i]) {
        lines.push(`    ${node}`);
      }
      lines.push('  end');
    }
  }

  return lines.join('\n');
}
