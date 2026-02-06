import Anthropic from '@anthropic-ai/sdk';
import type { PresetPipeline } from '../types';

// 사용 가능한 에이전트 목록 (Claude에게 알려줄 정보)
const AVAILABLE_AGENTS = [
  { id: 'explore', model: 'haiku', description: '빠른 코드베이스 탐색, 파일/구조 파악' },
  { id: 'explore-medium', model: 'sonnet', description: '심층 코드 흐름 분석, 모듈 간 의존성 파악' },
  { id: 'explore-high', model: 'opus', description: '아키텍처 수준 탐색, 확장 포인트 식별' },
  { id: 'researcher', model: 'sonnet', description: '외부 문서/라이브러리/API 조사' },
  { id: 'researcher-low', model: 'haiku', description: '빠른 문서 조회' },
  { id: 'architect', model: 'opus', description: '아키텍처 설계 및 전략 수립 (READ-ONLY)' },
  { id: 'architect-medium', model: 'sonnet', description: '설계 검토 및 구현 방향 결정' },
  { id: 'architect-low', model: 'haiku', description: '빠른 코드 질문, 간단한 분석' },
  { id: 'analyst', model: 'opus', description: '요구사항 분석, 제약 조건 도출' },
  { id: 'planner', model: 'opus', description: '전략 기획, 인터뷰 워크플로우' },
  { id: 'critic', model: 'opus', description: '계획 비평 및 검토' },
  { id: 'executor-low', model: 'haiku', description: '단일 파일 간단 수정' },
  { id: 'executor', model: 'sonnet', description: '표준 기능 구현' },
  { id: 'executor-high', model: 'opus', description: '복잡한 멀티 파일 구현/리팩토링' },
  { id: 'designer-low', model: 'haiku', description: '간단한 스타일링, UI 미세 조정' },
  { id: 'designer', model: 'sonnet', description: 'UI/UX 컴포넌트 구현' },
  { id: 'designer-high', model: 'opus', description: '디자인 시스템, 복잡한 UI 아키텍처' },
  { id: 'build-fixer-low', model: 'haiku', description: '간단한 빌드 에러 수정' },
  { id: 'build-fixer', model: 'sonnet', description: '빌드/컴파일 에러 해결' },
  { id: 'security-reviewer-low', model: 'haiku', description: '빠른 보안 스캔' },
  { id: 'security-reviewer', model: 'opus', description: '종합 보안 취약점 검토' },
  { id: 'code-reviewer-low', model: 'haiku', description: '빠른 코드 품질 체크' },
  { id: 'code-reviewer', model: 'opus', description: '종합 코드 리뷰 (품질, 보안, 유지보수성)' },
  { id: 'qa-tester', model: 'sonnet', description: 'CLI 테스트, 기능 검증' },
  { id: 'qa-tester-high', model: 'opus', description: '종합 QA (시나리오, 엣지케이스, 성능)' },
  { id: 'tdd-guide', model: 'sonnet', description: 'TDD 워크플로우, 테스트 먼저 작성' },
  { id: 'tdd-guide-low', model: 'haiku', description: '빠른 테스트 제안' },
  { id: 'writer', model: 'haiku', description: 'README, API 문서, 주석 작성' },
  { id: 'vision', model: 'sonnet', description: '이미지/PDF/다이어그램 분석' },
  { id: 'scientist-low', model: 'haiku', description: '빠른 데이터 확인, 간단한 통계' },
  { id: 'scientist', model: 'sonnet', description: '데이터 분석, 시각화, 통계' },
  { id: 'scientist-high', model: 'opus', description: '복잡한 연구, 가설 검증, ML' },
];

const SYSTEM_PROMPT = `당신은 Claude Code 서브에이전트 파이프라인 설계 전문가입니다.
사용자의 작업 설명을 분석하여 최적의 에이전트 파이프라인을 설계합니다.

## 사용 가능한 에이전트 목록
${AVAILABLE_AGENTS.map(a => `- ${a.id} (${a.model}): ${a.description}`).join('\n')}

## 규칙
1. 각 에이전트의 prompt는 해당 작업에 맞게 **구체적이고 상세하게** 작성하세요.
2. 같은 단계(step)의 에이전트들은 병렬로 실행됩니다.
3. 단계 간에는 순차 실행됩니다 (이전 단계 완료 후 다음 단계 시작).
4. 비용 효율을 고려하세요: 간단한 작업은 haiku, 복잡한 작업은 opus.
5. 불필요한 에이전트는 포함하지 마세요. 최소한의 에이전트로 최대 효과.
6. 각 에이전트의 prompt는 그 에이전트가 **정확히 무엇을 해야 하는지** 구체적으로 기술하세요.
   - BAD: "프로젝트 구조 분석"
   - GOOD: "src/ 디렉토리의 React 컴포넌트 구조 파악, API 호출 패턴 분석, 상태 관리 방식 확인"

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "name": "파이프라인 이름",
  "description": "파이프라인 설명",
  "nodes": [
    { "agentType": "에이전트ID", "prompt": "구체적인 작업 지시" }
  ],
  "edges": [[소스인덱스, 타겟인덱스], ...]
}

edges는 nodes 배열의 인덱스(0부터)를 사용합니다.
같은 단계에서 병렬 실행할 에이전트들은 동일한 소스에서 연결합니다.`;

export interface LLMGeneratorResult {
  pipeline: PresetPipeline;
  rawResponse: string;
}

export async function generatePipelineWithLLM(
  apiKey: string,
  description: string,
  projectName?: string,
): Promise<LLMGeneratorResult> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `다음 작업에 최적의 에이전트 파이프라인을 설계해주세요:\n\n${description}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱 (코드 블록 안에 있을 수 있음)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('LLM 응답에서 JSON을 찾을 수 없습니다.');
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    name: string;
    description: string;
    nodes: { agentType: string; model?: string; prompt: string }[];
    edges: [number, number][];
  };

  // 유효성 검사: 에이전트 ID가 실제 존재하는지
  const validAgentIds = new Set(AVAILABLE_AGENTS.map(a => a.id));
  for (const node of parsed.nodes) {
    if (!validAgentIds.has(node.agentType)) {
      // 가장 유사한 에이전트로 대체 시도
      const closest = AVAILABLE_AGENTS.find(a =>
        a.id.includes(node.agentType) || node.agentType.includes(a.id)
      );
      if (closest) {
        node.agentType = closest.id;
      } else {
        node.agentType = 'executor'; // fallback
      }
    }
  }

  // edges 유효성 검사
  const validEdges = parsed.edges.filter(
    ([src, tgt]) => src >= 0 && src < parsed.nodes.length && tgt >= 0 && tgt < parsed.nodes.length && src !== tgt
  );

  const pipeline: PresetPipeline = {
    id: 'llm-generated',
    name: projectName || parsed.name || '생성된 파이프라인',
    description: parsed.description || description.slice(0, 100),
    nodes: parsed.nodes.map(n => ({
      agentType: n.agentType,
      model: undefined, // 에이전트 기본 모델 사용
      prompt: n.prompt,
    })),
    edges: validEdges,
  };

  return { pipeline, rawResponse: text };
}
