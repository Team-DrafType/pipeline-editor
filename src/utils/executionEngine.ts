import type { PipelineStep } from '../types';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentExecState {
  type: string;
  model: string;
  prompt: string;
  status: StepStatus;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  output?: string;
}

export interface ExecutionState {
  isRunning: boolean;
  currentStep: number;
  steps: {
    step: number;
    status: StepStatus;
    agents: AgentExecState[];
  }[];
  startedAt?: number;
  completedAt?: number;
}

const SIMULATED_OUTPUTS: Record<string, (prompt: string) => string> = {
  explore: (p) => `[탐색 완료] ${p || '코드베이스 탐색'}\n\n발견된 파일: 24개\n주요 디렉토리: src/components, src/utils, src/hooks\n진입점: src/main.tsx → App.tsx\n의존성: react, zustand, @xyflow/react`,
  'explore-medium': (p) => `[심층 탐색 완료] ${p || '코드 흐름 분석'}\n\n호출 그래프 분석 완료\n핵심 모듈 간 의존성 맵 생성\n잠재적 순환 참조: 없음`,
  'explore-high': (p) => `[아키텍처 탐색 완료] ${p || '시스템 분석'}\n\n아키텍처 패턴: Component-based (React)\n상태 관리: Zustand (중앙 집중)\n데이터 흐름: 단방향\n확장 포인트 3곳 식별`,
  researcher: (p) => `[리서치 완료] ${p || '문서 조사'}\n\n공식 문서 확인 완료\n관련 API 엔드포인트 5개 파악\n권장 패턴: 공식 가이드 기준 구현\n주의사항: 버전 호환성 확인 필요`,
  'researcher-low': (p) => `[빠른 조회 완료] ${p || '문서 확인'}\n\nAPI 사용법 확인됨\n파라미터 타입 검증 완료`,
  architect: (p) => `[아키텍처 분석 완료] ${p || '설계 검토'}\n\n권장 아키텍처:\n1. 컴포넌트 계층 분리 (Presentation / Container)\n2. 상태 관리 레이어 독립\n3. 유틸리티 순수 함수화\n\n위험 요소: 없음\n승인: APPROVED`,
  'architect-medium': (p) => `[설계 검토 완료] ${p || '아키텍처 조언'}\n\n개선 제안 2건\n현재 구조 적합도: 85%`,
  'architect-low': (p) => `[빠른 분석] ${p || '코드 확인'}\n\n문제없음. 기존 패턴과 일치합니다.`,
  executor: (p) => `[구현 완료] ${p || '기능 구현'}\n\n수정된 파일: 3개\n- src/components/NewFeature.tsx (생성)\n- src/utils/helpers.ts (수정)\n- src/App.tsx (수정)\n\n추가된 코드: 142줄\n삭제된 코드: 8줄\n빌드 상태: 성공`,
  'executor-low': (p) => `[간단 수정 완료] ${p || '코드 수정'}\n\n수정된 파일: 1개\n변경사항: 12줄\n빌드 상태: 성공`,
  'executor-high': (p) => `[복잡한 구현 완료] ${p || '대규모 리팩토링'}\n\n수정된 파일: 8개\n새로 생성: 3개\n총 변경: 487줄\n테스트 추가: 24개\n모든 테스트 통과`,
  'build-fixer': (p) => `[빌드 수정 완료] ${p || '빌드 오류 해결'}\n\n발견된 오류: 3개\n- TS2345: 타입 불일치 (수정됨)\n- TS2307: 모듈 미발견 (import 경로 수정)\n- TS7006: 암시적 any (타입 추가)\n\n빌드 상태: 성공 (0 errors, 0 warnings)`,
  'build-fixer-low': (p) => `[빠른 수정] ${p || '빌드 수정'}\n\n오류 1개 수정됨\n빌드 성공`,
  'code-reviewer': (p) => `[코드 리뷰 완료] ${p || '코드 검토'}\n\n검토 결과:\n- 심각도 HIGH: 0건\n- 심각도 MEDIUM: 1건 (에러 핸들링 보강 권장)\n- 심각도 LOW: 2건 (네이밍 컨벤션)\n\n전체 품질: GOOD`,
  'code-reviewer-low': (p) => `[빠른 리뷰] 이상 없음. 코드 품질 양호.`,
  critic: (p) => `[비평 완료] ${p || '계획 검토'}\n\n강점: 명확한 단계 분리, 적절한 에이전트 선택\n약점: 에러 복구 전략 부재\n제안: 4단계 후 검증 단계 추가 권장\n판정: 조건부 승인`,
  planner: (p) => `[계획 수립 완료] ${p || '전략 기획'}\n\n실행 계획:\n1. 요구사항 분석 (30분)\n2. 설계 및 프로토타이핑 (1시간)\n3. 핵심 구현 (2시간)\n4. 테스트 및 검증 (1시간)\n\n예상 총 소요: 4.5시간`,
  analyst: (p) => `[분석 완료] ${p || '요구사항 분석'}\n\n핵심 요구사항 5개 도출\n기술적 제약조건 2개 확인\n우선순위 매트릭스 생성 완료`,
  'security-reviewer': (p) => `[보안 감사 완료] ${p || '보안 검토'}\n\n취약점 스캔 결과:\n- CRITICAL: 0건\n- HIGH: 0건\n- MEDIUM: 1건 (CSRF 토큰 검증 권장)\n- LOW: 2건\n\n전체 보안 등급: B+`,
  'security-reviewer-low': (p) => `[빠른 보안 스캔] 하드코딩된 시크릿: 없음. 기본 점검 통과.`,
  'qa-tester': (p) => `[QA 완료] ${p || '테스트 실행'}\n\n테스트 결과: 12/12 통과\n커버리지: 78%\n발견된 버그: 0건`,
  'qa-tester-high': (p) => `[종합 QA 완료] ${p || 'QA 검증'}\n\n시나리오 테스트: 24/24 통과\n엣지 케이스: 8/8 통과\n성능 테스트: 응답시간 < 200ms\n커버리지: 92%`,
  'tdd-guide': (p) => `[TDD 가이드] ${p || 'TDD 적용'}\n\nRed-Green-Refactor 사이클 완료\n작성된 테스트: 8개\n커버리지 향상: 65% → 84%`,
  'tdd-guide-low': (p) => `[테스트 제안] 단위 테스트 3개 추가 권장`,
  writer: (p) => `[문서 작성 완료] ${p || '문서화'}\n\nREADME.md 업데이트\nAPI 문서 생성\n인라인 주석 추가: 12곳`,
  vision: (p) => `[시각 분석 완료] ${p || '이미지 분석'}\n\n이미지 내용 해석 완료\n UI 요소 14개 식별`,
  'designer': (p) => `[UI 구현 완료] ${p || 'UI 작업'}\n\n컴포넌트 생성: 3개\n반응형 브레이크포인트: 3개 (sm/md/lg)\n접근성: WCAG 2.1 AA 준수`,
  'designer-low': (p) => `[스타일 수정 완료] ${p || '스타일링'}\n\n수정된 스타일: 5곳`,
  'designer-high': (p) => `[디자인 시스템 완료] ${p || 'UI 아키텍처'}\n\n디자인 토큰 정의: 24개\n컴포넌트 라이브러리: 8개\n테마 시스템 구축 완료`,
  'scientist-low': (p) => `[데이터 확인] ${p || '데이터 조회'}\n\n레코드 수: 1,247개\n결측값: 3%`,
  scientist: (p) => `[분석 완료] ${p || '데이터 분석'}\n\n통계 요약 생성\n시각화 차트 3개 생성\n주요 인사이트 도출`,
  'scientist-high': (p) => `[연구 완료] ${p || 'ML 분석'}\n\n모델 정확도: 94.2%\n가설 검증: 지지됨 (p < 0.01)\n논문 수준 리포트 생성`,
};

function getSimulatedOutput(agentType: string, prompt: string): string {
  const generator = SIMULATED_OUTPUTS[agentType];
  if (generator) return generator(prompt);
  return `[${agentType} 완료] ${prompt || '작업 수행'}\n\n작업이 성공적으로 완료되었습니다.`;
}

export function createInitialState(steps: PipelineStep[]): ExecutionState {
  return {
    isRunning: false,
    currentStep: 0,
    steps: steps.map((s) => ({
      step: s.step,
      status: 'pending' as StepStatus,
      agents: s.agents.map((a) => ({
        type: a.type,
        model: a.model,
        prompt: a.prompt,
        status: 'pending' as StepStatus,
        output: undefined,
      })),
    })),
  };
}

// Simulates pipeline execution with realistic timing
export async function simulateExecution(
  steps: PipelineStep[],
  onUpdate: (state: ExecutionState) => void,
  signal?: AbortSignal
): Promise<ExecutionState> {
  const state = createInitialState(steps);
  state.isRunning = true;
  state.startedAt = Date.now();
  onUpdate({ ...state });

  const MODEL_DELAYS: Record<string, [number, number]> = {
    haiku: [800, 1500],
    sonnet: [1500, 3000],
    opus: [2500, 5000],
  };

  const randomDelay = (model: string): number => {
    const [min, max] = MODEL_DELAYS[model] || [1000, 2000];
    return min + Math.random() * (max - min);
  };

  for (let i = 0; i < state.steps.length; i++) {
    if (signal?.aborted) {
      state.isRunning = false;
      return state;
    }

    state.currentStep = i + 1;
    state.steps[i].status = 'running';

    // Start all agents in this step
    const agentPromises = state.steps[i].agents.map(async (agent, j) => {
      state.steps[i].agents[j].status = 'running';
      state.steps[i].agents[j].startedAt = Date.now();
      onUpdate({ ...state });

      const delay = randomDelay(agent.model);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, delay);
        signal?.addEventListener('abort', () => { clearTimeout(timer); resolve(); });
      });

      if (!signal?.aborted) {
        state.steps[i].agents[j].status = 'completed';
        state.steps[i].agents[j].completedAt = Date.now();
        state.steps[i].agents[j].duration = Date.now() - (state.steps[i].agents[j].startedAt ?? Date.now());
        state.steps[i].agents[j].output = getSimulatedOutput(agent.type, agent.prompt);
        onUpdate({ ...state });
      }
    });

    await Promise.all(agentPromises);

    if (!signal?.aborted) {
      state.steps[i].status = 'completed';
      onUpdate({ ...state });
    }
  }

  state.isRunning = false;
  state.completedAt = Date.now();
  onUpdate({ ...state });
  return state;
}
