import type { PresetPipeline } from '../types';

interface AnalysisResult {
  needsResearch: boolean;
  needsExplore: boolean;
  needsDesign: boolean;
  needsSecurity: boolean;
  needsTest: boolean;
  needsData: boolean;
  needsDocs: boolean;
  complexity: 'low' | 'medium' | 'high';
  taskType: 'new-feature' | 'refactor' | 'bugfix' | 'security' | 'research' | 'fullstack' | 'frontend' | 'backend' | 'data' | 'general';
  detectedKeywords: string[];
  scores: Record<string, number>;
  phraseMatches: string[];
  suggestedAgentCount: number;
}

// --- Keyword patterns with per-keyword weights ---
const KEYWORD_PATTERNS: Record<string, { pattern: RegExp; weight: number }[]> = {
  research: [
    { pattern: /문서/i, weight: 1 }, { pattern: /조사/i, weight: 1 }, { pattern: /리서치/i, weight: 2 },
    { pattern: /research/i, weight: 2 }, { pattern: /doc/i, weight: 1 }, { pattern: /api/i, weight: 1 },
    { pattern: /라이브러리/i, weight: 1 }, { pattern: /library/i, weight: 1 }, { pattern: /sdk/i, weight: 2 },
    { pattern: /프레임워크/i, weight: 1 }, { pattern: /framework/i, weight: 1 },
  ],
  explore: [
    { pattern: /분석/i, weight: 1 }, { pattern: /파악/i, weight: 1 }, { pattern: /구조/i, weight: 1 },
    { pattern: /이해/i, weight: 1 }, { pattern: /탐색/i, weight: 2 }, { pattern: /explore/i, weight: 2 },
    { pattern: /codebase/i, weight: 2 }, { pattern: /코드베이스/i, weight: 2 },
    { pattern: /기존/i, weight: 1 }, { pattern: /현재/i, weight: 1 },
  ],
  frontend: [
    { pattern: /ui/i, weight: 2 }, { pattern: /ux/i, weight: 2 }, { pattern: /프론트/i, weight: 2 },
    { pattern: /front/i, weight: 2 }, { pattern: /컴포넌트/i, weight: 1 }, { pattern: /component/i, weight: 1 },
    { pattern: /react/i, weight: 1 }, { pattern: /vue/i, weight: 1 }, { pattern: /svelte/i, weight: 1 },
    { pattern: /css/i, weight: 1 }, { pattern: /스타일/i, weight: 1 }, { pattern: /디자인/i, weight: 1 },
    { pattern: /design/i, weight: 1 }, { pattern: /레이아웃/i, weight: 1 }, { pattern: /layout/i, weight: 1 },
    { pattern: /반응형/i, weight: 1 }, { pattern: /responsive/i, weight: 1 },
    { pattern: /페이지/i, weight: 1 }, { pattern: /page/i, weight: 1 }, { pattern: /화면/i, weight: 1 },
  ],
  backend: [
    { pattern: /api/i, weight: 1 }, { pattern: /서버/i, weight: 2 }, { pattern: /server/i, weight: 2 },
    { pattern: /백엔드/i, weight: 2 }, { pattern: /backend/i, weight: 2 },
    { pattern: /데이터베이스/i, weight: 2 }, { pattern: /database/i, weight: 2 }, { pattern: /db/i, weight: 1 },
    { pattern: /rest/i, weight: 1 }, { pattern: /graphql/i, weight: 2 },
    { pattern: /엔드포인트/i, weight: 1 }, { pattern: /endpoint/i, weight: 1 },
    { pattern: /인증/i, weight: 1 }, { pattern: /auth/i, weight: 1 },
    { pattern: /미들웨어/i, weight: 1 }, { pattern: /middleware/i, weight: 1 },
  ],
  security: [
    { pattern: /보안/i, weight: 2 }, { pattern: /security/i, weight: 2 },
    { pattern: /취약점/i, weight: 2 }, { pattern: /vulnerability/i, weight: 2 },
    { pattern: /xss/i, weight: 2 }, { pattern: /csrf/i, weight: 2 },
    { pattern: /인증/i, weight: 1 }, { pattern: /auth/i, weight: 1 },
    { pattern: /암호/i, weight: 2 }, { pattern: /encrypt/i, weight: 2 }, { pattern: /owasp/i, weight: 3 },
  ],
  test: [
    { pattern: /테스트/i, weight: 2 }, { pattern: /test/i, weight: 2 }, { pattern: /tdd/i, weight: 2 },
    { pattern: /qa/i, weight: 2 }, { pattern: /검증/i, weight: 1 }, { pattern: /verify/i, weight: 1 },
    { pattern: /커버리지/i, weight: 2 }, { pattern: /coverage/i, weight: 2 },
  ],
  data: [
    { pattern: /데이터/i, weight: 1 }, { pattern: /data/i, weight: 1 },
    { pattern: /분석/i, weight: 1 }, { pattern: /analy/i, weight: 1 },
    { pattern: /통계/i, weight: 2 }, { pattern: /statistic/i, weight: 2 },
    { pattern: /ml/i, weight: 2 }, { pattern: /머신러닝/i, weight: 3 },
    { pattern: /machine learning/i, weight: 3 }, { pattern: /ai/i, weight: 1 },
    { pattern: /모델/i, weight: 1 }, { pattern: /model/i, weight: 1 },
    { pattern: /학습/i, weight: 2 }, { pattern: /train/i, weight: 2 },
    { pattern: /csv/i, weight: 2 }, { pattern: /시각화/i, weight: 2 }, { pattern: /visuali/i, weight: 2 },
    { pattern: /chart/i, weight: 1 }, { pattern: /차트/i, weight: 1 },
    { pattern: /그래프/i, weight: 1 }, { pattern: /graph/i, weight: 1 },
    { pattern: /pandas/i, weight: 2 }, { pattern: /matplotlib/i, weight: 2 },
    { pattern: /plotly/i, weight: 2 }, { pattern: /streamlit/i, weight: 2 },
    { pattern: /jupyter/i, weight: 2 }, { pattern: /notebook/i, weight: 1 },
  ],
  docs: [
    { pattern: /문서화/i, weight: 2 }, { pattern: /document/i, weight: 1 },
    { pattern: /readme/i, weight: 2 }, { pattern: /주석/i, weight: 1 },
    { pattern: /comment/i, weight: 1 }, { pattern: /가이드/i, weight: 1 }, { pattern: /guide/i, weight: 1 },
  ],
  refactor: [
    { pattern: /리팩토링/i, weight: 2 }, { pattern: /refactor/i, weight: 2 },
    { pattern: /개선/i, weight: 1 }, { pattern: /improve/i, weight: 1 },
    { pattern: /최적화/i, weight: 2 }, { pattern: /optimiz/i, weight: 2 },
    { pattern: /성능/i, weight: 1 }, { pattern: /performance/i, weight: 1 },
    { pattern: /정리/i, weight: 1 }, { pattern: /cleanup/i, weight: 1 },
  ],
  bugfix: [
    { pattern: /버그/i, weight: 2 }, { pattern: /bug/i, weight: 2 },
    { pattern: /수정/i, weight: 1 }, { pattern: /fix/i, weight: 1 },
    { pattern: /오류/i, weight: 2 }, { pattern: /error/i, weight: 1 },
    { pattern: /에러/i, weight: 2 }, { pattern: /디버그/i, weight: 2 }, { pattern: /debug/i, weight: 2 },
    { pattern: /문제/i, weight: 1 }, { pattern: /issue/i, weight: 1 },
    { pattern: /깨진/i, weight: 2 }, { pattern: /broken/i, weight: 2 },
  ],
  complex: [
    { pattern: /시스템/i, weight: 1 }, { pattern: /system/i, weight: 1 },
    { pattern: /아키텍처/i, weight: 2 }, { pattern: /architect/i, weight: 2 },
    { pattern: /전체/i, weight: 1 }, { pattern: /마이그레이션/i, weight: 2 }, { pattern: /migrat/i, weight: 2 },
    { pattern: /대규모/i, weight: 2 }, { pattern: /풀스택/i, weight: 2 },
    { pattern: /fullstack/i, weight: 2 }, { pattern: /full-stack/i, weight: 2 },
  ],
};

// --- Phrase patterns for contextual multi-word matching ---
const PHRASE_PATTERNS: { pattern: RegExp; category: string; weight: number }[] = [
  { pattern: /REST\s*API/i, weight: 3, category: 'backend' },
  { pattern: /데이터\s*시각화/i, weight: 3, category: 'data' },
  { pattern: /대시보드/i, weight: 2, category: 'frontend' },
  { pattern: /인증\s*시스템/i, weight: 3, category: 'security' },
  { pattern: /CI\s*\/?\s*CD/i, weight: 2, category: 'build' },
  { pattern: /단위\s*테스트/i, weight: 2, category: 'test' },
  { pattern: /코드\s*리뷰/i, weight: 2, category: 'review' },
  { pattern: /마이크로\s*서비스/i, weight: 3, category: 'complex' },
  { pattern: /모노레포/i, weight: 2, category: 'complex' },
  { pattern: /풀스택\s*(앱|어플|개발)/i, weight: 3, category: 'complex' },
  { pattern: /머신\s*러닝/i, weight: 3, category: 'data' },
  { pattern: /디자인\s*시스템/i, weight: 3, category: 'frontend' },
  { pattern: /보안\s*감사/i, weight: 3, category: 'security' },
  { pattern: /성능\s*최적화/i, weight: 2, category: 'refactor' },
  { pattern: /성능\s*테스트/i, weight: 2, category: 'test' },
  { pattern: /리팩토링/i, weight: 2, category: 'refactor' },
  { pattern: /API\s*문서/i, weight: 2, category: 'docs' },
  { pattern: /데이터\s*파이프라인/i, weight: 3, category: 'data' },
  { pattern: /실시간/i, weight: 2, category: 'backend' },
  { pattern: /웹\s*소켓/i, weight: 2, category: 'backend' },
];

// --- Entity extraction for specific prompt generation ---

interface ExtractedEntities {
  files: string[];      // 파일명: "sample.csv", "dashboard.py" 등
  techs: string[];      // 기술: "pandas", "React", "JWT" 등
  actions: string[];    // 핵심 동작: "로드", "분석", "시각화", "인증" 등
  targets: string[];    // 대상: "대시보드", "API", "컴포넌트" 등
}

function extractEntities(text: string): ExtractedEntities {
  const files = [...text.matchAll(/[\w-]+\.\w{1,5}/g)].map(m => m[0]);

  const techPatterns = [
    /pandas/i, /matplotlib/i, /plotly/i, /streamlit/i, /numpy/i,
    /react/i, /vue/i, /svelte/i, /next\.?js/i, /express/i,
    /typescript/i, /python/i, /node\.?js/i,
    /jwt/i, /oauth/i, /graphql/i, /rest/i, /websocket/i,
    /postgresql/i, /mongodb/i, /redis/i, /sqlite/i, /mysql/i,
    /docker/i, /kubernetes/i, /aws/i, /gcp/i,
    /tailwind/i, /css/i, /sass/i, /styled-components/i,
    /jest/i, /vitest/i, /pytest/i, /cypress/i,
  ];
  const techs = techPatterns
    .filter(p => p.test(text))
    .map(p => { const m = text.match(p); return m ? m[0] : ''; })
    .filter(Boolean);

  const actionPatterns: [RegExp, string][] = [
    [/로드|불러오|읽/i, '데이터 로드'],
    [/분석|파악|조사/i, '분석'],
    [/시각화|차트|그래프/i, '시각화'],
    [/생성|만들|구축|작성/i, '생성'],
    [/수정|변경|업데이트/i, '수정'],
    [/삭제|제거/i, '삭제'],
    [/인증|로그인|회원가입/i, '인증'],
    [/테스트|검증|확인/i, '테스트'],
    [/배포|deploy/i, '배포'],
    [/최적화|성능/i, '최적화'],
    [/리팩토링|개선/i, '리팩토링'],
    [/마이그레이션|전환/i, '마이그레이션'],
    [/문서화|README/i, '문서화'],
    [/모니터링|로깅/i, '모니터링'],
    [/스타일|디자인|UI|레이아웃/i, 'UI 구현'],
    [/API|엔드포인트/i, 'API 구현'],
    [/CRUD|생성.*조회.*수정.*삭제/i, 'CRUD'],
  ];
  const actions = actionPatterns
    .filter(([p]) => p.test(text))
    .map(([, label]) => label);

  const targetPatterns: [RegExp, string][] = [
    [/대시보드/i, '대시보드'],
    [/컴포넌트/i, '컴포넌트'],
    [/페이지/i, '페이지'],
    [/서버/i, '서버'],
    [/클라이언트/i, '클라이언트'],
    [/데이터베이스|DB/i, '데이터베이스'],
    [/리포트|보고서/i, '리포트'],
    [/차트/i, '차트'],
    [/테이블/i, '테이블'],
    [/폼|양식/i, '폼'],
    [/모달/i, '모달'],
    [/파이프라인/i, '파이프라인'],
    [/스크립트/i, '스크립트'],
    [/앱|어플리케이션/i, '앱'],
  ];
  const targets = targetPatterns
    .filter(([p]) => p.test(text))
    .map(([, label]) => label);

  return { files, techs, actions, targets };
}

// --- Agent-specific prompt builder ---

function buildAgentPrompt(
  agentType: string,
  phase: 'discovery' | 'planning' | 'implementation' | 'verification' | 'review',
  entities: ExtractedEntities,
  description: string,
): string {
  const { files, techs, actions, targets } = entities;
  const fileStr = files.length > 0 ? files.join(', ') : '';
  const techStr = techs.length > 0 ? techs.join(', ') : '';
  const actionStr = actions.length > 0 ? actions.join(', ') : '';
  const targetStr = targets.length > 0 ? targets.join(', ') : '';

  // 첫 문장 또는 핵심 요약 (80자 이내)
  const summary = description.split(/[.\n]/).filter(s => s.trim())[0]?.trim().slice(0, 80) || description.slice(0, 80);

  const templates: Record<string, () => string> = {
    // -- Discovery phase --
    'explore': () => {
      const parts = ['프로젝트 구조 파악'];
      if (fileStr) parts.push(`${fileStr} 파일 위치 및 내용 확인`);
      if (techStr) parts.push(`${techStr} 관련 기존 코드 탐색`);
      if (!fileStr && !techStr) parts.push('관련 코드와 설정 파일 탐색');
      return parts.join(', ');
    },
    'explore-high': () => {
      const parts = ['아키텍처 수준 코드 분석'];
      if (techStr) parts.push(`${techStr} 사용 패턴과 의존성 그래프 파악`);
      parts.push('확장 포인트 식별');
      return parts.join(', ');
    },
    'explore-medium': () => {
      const parts = ['코드 흐름 분석'];
      if (targets.length) parts.push(`${targetStr} 관련 모듈 간 의존성 파악`);
      return parts.join(', ');
    },
    'researcher': () => {
      if (techStr) return `${techStr} 공식 문서에서 ${actionStr || '사용법'} 관련 API와 모범 사례 조사`;
      return `${summary} 관련 라이브러리/프레임워크 공식 문서 조사`;
    },
    'researcher-low': () => {
      if (techStr) return `${techs[0]} API 사용법 빠른 확인`;
      return '관련 문서 빠른 조회';
    },
    'scientist': () => {
      if (phase === 'discovery') {
        if (fileStr) return `${fileStr}의 컬럼 구조, 데이터 타입, 결측값 비율 분석. ${targetStr ? targetStr + '에' : ''} 포함할 주요 지표 도출`;
        return '데이터 구조 탐색적 분석 (EDA), 주요 통계 지표 도출, 데이터 품질 확인';
      }
      if (techs.length) return `${techStr}로 ${fileStr || '데이터'} ${actions.includes('시각화') ? '로드 및 시각화 차트 생성' : '처리 및 분석 구현'}. ${targetStr ? targetStr + ' 스크립트 작성' : '분석 스크립트 작성'}`;
      return '데이터 처리 파이프라인 구현, 통계 분석 및 결과 출력';
    },
    'scientist-high': () => {
      if (phase === 'discovery') return `${fileStr || '데이터셋'} 심층 분석: 분포, 상관관계, 이상치 탐지. 가설 수립 및 통계적 검증 계획`;
      return '고급 분석 모델 구현: 가설 검증, 예측 모델링, 종합 리포트 생성';
    },
    'scientist-low': () => `${fileStr || '데이터'} 기본 정보 확인: 행 수, 컬럼명, 기술통계`,

    // -- Planning phase --
    'analyst': () => `"${summary}" 요구사항 분석: 기능 요구사항, 기술 제약조건, 우선순위 매트릭스 도출`,
    'architect': () => {
      if (phase === 'planning') {
        const parts = ['아키텍처 설계'];
        if (techStr) parts.push(`${techStr} 기반 구현 전략 수립`);
        if (targets.length) parts.push(`${targetStr} 구조 설계`);
        return parts.join(', ');
      }
      // review phase
      return `최종 코드 품질 검증: ${techStr ? techStr + ' 모범 사례 준수 여부, ' : ''}아키텍처 일관성, 확장성 평가`;
    },
    'architect-medium': () => {
      const parts = ['설계 검토'];
      if (techStr) parts.push(`${techStr} 활용 방향 결정`);
      if (targets.length) parts.push(`${targetStr} 구현 접근법 선택`);
      return parts.join(', ');
    },
    'architect-low': () => `최종 코드 리뷰: ${techStr ? techStr + ' 패턴 준수 확인, ' : ''}코드 품질 및 일관성 검증`,

    // -- Implementation phase --
    'executor': () => {
      const parts: string[] = [];
      if (actions.length) parts.push(actionStr);
      if (techStr) parts.push(`${techStr} 활용`);
      if (targets.length) parts.push(`${targetStr} 구현`);
      if (fileStr) parts.push(`(${fileStr} 대상)`);
      return parts.length > 0 ? parts.join(', ') : `${summary} 구현`;
    },
    'executor-high': () => `${summary}: 멀티 파일 구현, ${techStr ? techStr + ' 통합, ' : ''}에러 핸들링 및 엣지 케이스 처리 포함`,
    'executor-low': () => {
      if (targets.length) return `${targets[0]} 관련 단일 파일 수정`;
      return '핵심 로직 간단 수정';
    },
    'designer': () => {
      const parts = ['UI 컴포넌트 구현'];
      if (targets.length) parts.push(`${targetStr} 레이아웃 및 스타일링`);
      if (techs.some(t => /react|vue|svelte/i.test(t))) parts.push('반응형 디자인 적용');
      return parts.join(', ');
    },
    'designer-high': () => `${targetStr || 'UI'} 디자인 시스템 설계: 컴포넌트 라이브러리, 테마, 반응형 레이아웃, 접근성(WCAG 2.1)`,
    'designer-low': () => `${targetStr || 'UI'} 기본 스타일링 및 레이아웃 조정`,

    // -- Verification phase --
    'build-fixer': () => `빌드 및 타입 오류 확인: ${techStr ? techStr + ' 호환성 검증, ' : ''}import 경로 및 타입 정합성 수정`,
    'build-fixer-low': () => `빌드 실행 및 오류 수정. ${techStr ? techStr + ' 의존성 확인' : '컴파일 에러 해결'}`,
    'security-reviewer': () => `보안 감사: ${actions.includes('인증') ? 'JWT/세션 보안, ' : ''}OWASP Top 10 취약점 스캔, 입력 검증, 시크릿 노출 확인`,
    'security-reviewer-low': () => `빠른 보안 점검: 하드코딩된 시크릿, XSS/인젝션 기본 검사`,
    'qa-tester': () => `기능 테스트: ${actionStr ? actionStr + ' 동작 검증' : '주요 시나리오 테스트'}, ${techStr ? techStr + ' 환경에서' : ''} 엣지 케이스 확인`,
    'qa-tester-high': () => `종합 QA: 시나리오 테스트, 엣지 케이스, 성능 테스트, 크로스 브라우저 검증. 커버리지 90%+ 목표`,
    'tdd-guide': () => `${targetStr || '핵심 기능'} 테스트 작성: Red-Green-Refactor 사이클, ${techStr ? techStr + ' 테스트 프레임워크 활용' : '단위/통합 테스트'}`,
    'tdd-guide-low': () => `${targetStr || '주요 함수'} 단위 테스트 추가 제안`,
    'code-reviewer': () => `코드 리뷰: ${techStr ? techStr + ' 모범 사례 준수, ' : ''}보안, 성능, 유지보수성 관점 검토`,
    'code-reviewer-low': () => `빠른 코드 검토: 명명 규칙, 중복 코드, 명백한 버그 확인`,
    'critic': () => '계획 비평: 실현 가능성, 에러 복구 전략, 누락된 단계 점검',
    'planner': () => `"${summary}" 실행 계획 수립: 단계별 작업 분해, 의존성 정의, 리스크 식별`,
    'writer': () => `문서화: ${targetStr ? targetStr + ' ' : ''}README, API 문서, 주요 함수 인라인 주석 작성`,
    'vision': () => '시각 자료 분석: UI 목업/다이어그램에서 구현 요소 식별',
  };

  const generator = templates[agentType];
  if (generator) return generator();

  // fallback
  return `${summary} 관련 ${agentType} 작업 수행`;
}

function analyzeDescription(text: string): AnalysisResult {
  const detected: string[] = [];
  const scores: Record<string, number> = {};
  const phraseMatches: string[] = [];

  // --- Step 1: Weighted keyword scoring ---
  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    let score = 0;
    for (const { pattern, weight } of patterns) {
      if (pattern.test(text)) {
        score += weight;
        const match = text.match(pattern);
        if (match) detected.push(match[0]);
      }
    }
    scores[category] = score;
  }

  // --- Step 2: Phrase pattern scoring (additive, on top of keyword scores) ---
  let phraseScore = 0;
  for (const { pattern, category, weight } of PHRASE_PATTERNS) {
    if (pattern.test(text)) {
      const match = text.match(pattern);
      if (match) phraseMatches.push(match[0]);
      scores[category] = (scores[category] || 0) + weight;
      phraseScore += weight;
    }
  }

  // --- Step 3: Determine boolean flags from weighted scores ---
  const needsResearch = scores.research > 0;
  const needsExplore = scores.explore > 0 || scores.refactor > 0;
  const needsDesign = scores.frontend > 0;
  const needsSecurity = scores.security > 0;
  const needsTest = scores.test > 0;
  const needsData = scores.data > 0;
  const needsDocs = scores.docs > 0;

  // --- Step 4: Multi-dimensional complexity analysis ---
  const categoryDiversity = Object.values(scores).filter(v => v > 0).length;
  const lineCount = text.split('\n').filter(l => l.trim()).length;
  const complexity: AnalysisResult['complexity'] =
    categoryDiversity >= 5 || phraseScore >= 8 || lineCount >= 8 ? 'high'
    : categoryDiversity >= 3 || phraseScore >= 4 || lineCount >= 4 ? 'medium'
    : 'low';

  // --- Step 5: Determine task type using weighted scores ---
  let taskType: AnalysisResult['taskType'] = 'general';
  const sortedCategories = Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);

  const topCategory = sortedCategories[0]?.[0];
  const topScore = sortedCategories[0]?.[1] ?? 0;

  if (topCategory === 'bugfix' && topScore >= 2) taskType = 'bugfix';
  else if (topCategory === 'security' && topScore >= 2) taskType = 'security';
  else if (topCategory === 'data' && topScore >= 2) taskType = 'data';
  else if (scores.frontend > 0 && scores.backend > 0 && scores.frontend >= 2 && scores.backend >= 2) taskType = 'fullstack';
  else if (topCategory === 'frontend' && topScore >= 3) taskType = 'frontend';
  else if (topCategory === 'backend' && topScore >= 3) taskType = 'backend';
  else if (topCategory === 'refactor' && topScore >= 2) taskType = 'refactor';
  else if (topCategory === 'research' && topScore >= 2) taskType = 'research';
  else if (topScore > 0) taskType = 'new-feature';

  // --- Step 6: Estimate suggested agent count ---
  const boolFlags = [needsResearch, needsExplore, needsDesign, needsSecurity, needsTest, needsData, needsDocs];
  const activeFlags = boolFlags.filter(Boolean).length;
  // Base: 3 (explore/plan + impl + verify), plus extras
  let suggestedAgentCount = 3 + activeFlags;
  if (complexity === 'high') suggestedAgentCount += 2; // analyst + architect
  if (complexity === 'medium') suggestedAgentCount += 1; // architect-medium
  if (taskType === 'fullstack') suggestedAgentCount += 1; // separate frontend+backend executors

  return {
    needsResearch, needsExplore, needsDesign, needsSecurity,
    needsTest, needsData, needsDocs,
    complexity, taskType,
    detectedKeywords: [...new Set(detected)],
    scores,
    phraseMatches: [...new Set(phraseMatches)],
    suggestedAgentCount,
  };
}

export function generatePipeline(description: string, projectName?: string): { pipeline: PresetPipeline; analysis: AnalysisResult } {
  const analysis = analyzeDescription(description);
  const entities = extractEntities(description);
  const nodes: PresetPipeline['nodes'] = [];
  const edges: [number, number][] = [];

  // --- Phase 1: Discovery ---
  const phase1Start = nodes.length;

  if (analysis.needsExplore || analysis.complexity !== 'low') {
    const exploreType = analysis.complexity === 'high' ? 'explore-high' : 'explore';
    nodes.push({
      agentType: exploreType,
      prompt: buildAgentPrompt(exploreType, 'discovery', entities, description),
    });
  }

  if (analysis.needsResearch) {
    nodes.push({
      agentType: 'researcher',
      prompt: buildAgentPrompt('researcher', 'discovery', entities, description),
    });
  }

  if (analysis.needsData) {
    const sciType = analysis.complexity === 'high' ? 'scientist-high' : 'scientist';
    nodes.push({
      agentType: sciType,
      prompt: buildAgentPrompt(sciType, 'discovery', entities, description),
    });
  }

  const phase1End = nodes.length;

  // --- Phase 2: Planning/Design ---
  const phase2Start = nodes.length;

  if (analysis.complexity === 'high') {
    nodes.push({
      agentType: 'analyst',
      prompt: buildAgentPrompt('analyst', 'planning', entities, description),
    });
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);

    nodes.push({
      agentType: 'architect',
      prompt: buildAgentPrompt('architect', 'planning', entities, description),
    });
    edges.push([phase2Start, phase2Start + 1]);
  } else if (analysis.complexity === 'medium') {
    nodes.push({
      agentType: 'architect-medium',
      prompt: buildAgentPrompt('architect-medium', 'planning', entities, description),
    });
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);
  }

  const phase2End = nodes.length;
  const connectFrom = phase2End > phase2Start ? phase2End - 1 : phase1End - 1;

  // --- Phase 3: Implementation ---
  const phase3Start = nodes.length;

  if (analysis.taskType === 'bugfix') {
    const execType = analysis.complexity === 'high' ? 'executor-high' : 'executor';
    nodes.push({
      agentType: execType,
      prompt: buildAgentPrompt(execType, 'implementation', entities, description),
    });
  } else if (analysis.taskType === 'fullstack') {
    nodes.push({
      agentType: 'executor',
      model: 'sonnet',
      prompt: buildAgentPrompt('executor', 'implementation', entities, description),
    });
    const frontType = analysis.needsDesign ? 'designer' : 'executor';
    nodes.push({
      agentType: frontType,
      model: 'sonnet',
      prompt: buildAgentPrompt(frontType, 'implementation', entities, description),
    });
  } else if (analysis.taskType === 'frontend') {
    const designType = analysis.complexity === 'high' ? 'designer-high' : 'designer';
    nodes.push({
      agentType: designType,
      prompt: buildAgentPrompt(designType, 'implementation', entities, description),
    });
  } else if (analysis.taskType === 'data') {
    const sciType = analysis.complexity === 'high' ? 'scientist-high' : 'scientist';
    nodes.push({
      agentType: sciType,
      prompt: buildAgentPrompt(sciType, 'implementation', entities, description),
    });
  } else if (analysis.taskType === 'security') {
    nodes.push({
      agentType: 'executor',
      prompt: buildAgentPrompt('executor', 'implementation', entities, description),
    });
  } else {
    const execType = analysis.complexity === 'high' ? 'executor-high' : 'executor';
    nodes.push({
      agentType: execType,
      prompt: buildAgentPrompt(execType, 'implementation', entities, description),
    });
  }

  // Connect planning -> implementation
  if (connectFrom >= 0) {
    for (let i = phase3Start; i < nodes.length; i++) {
      edges.push([connectFrom, i]);
    }
  }
  // If no planning phase, connect discovery -> implementation
  if (phase2End === phase2Start && phase1End > phase1Start) {
    for (let i = phase3Start; i < nodes.length; i++) {
      for (let j = phase1Start; j < phase1End; j++) {
        edges.push([j, i]);
      }
    }
  }

  const phase3End = nodes.length;

  // --- Phase 4: Verification ---
  const phase4Start = nodes.length;

  const buildFixerType = analysis.complexity === 'high' ? 'build-fixer' : 'build-fixer-low';
  nodes.push({
    agentType: buildFixerType,
    prompt: buildAgentPrompt(buildFixerType, 'verification', entities, description),
  });
  for (let i = phase3Start; i < phase3End; i++) edges.push([i, phase4Start]);

  if (analysis.needsSecurity) {
    const secIdx = nodes.length;
    const secType = analysis.complexity === 'high' ? 'security-reviewer' : 'security-reviewer-low';
    nodes.push({
      agentType: secType,
      prompt: buildAgentPrompt(secType, 'verification', entities, description),
    });
    edges.push([phase4Start, secIdx]);
  }

  if (analysis.needsTest) {
    const testIdx = nodes.length;
    const testType = analysis.complexity === 'high' ? 'qa-tester-high' : 'tdd-guide';
    nodes.push({
      agentType: testType,
      prompt: buildAgentPrompt(testType, 'verification', entities, description),
    });
    edges.push([phase4Start, testIdx]);
  }

  const phase4End = nodes.length;

  // --- Phase 5: Final Review ---
  const finalIdx = nodes.length;
  const reviewType = analysis.complexity === 'high' ? 'architect' : 'architect-low';
  nodes.push({
    agentType: reviewType,
    prompt: buildAgentPrompt(reviewType, 'review', entities, description),
  });
  for (let i = phase4Start; i < phase4End; i++) edges.push([i, finalIdx]);

  if (analysis.needsDocs) {
    const docsIdx = nodes.length;
    nodes.push({
      agentType: 'writer',
      prompt: buildAgentPrompt('writer', 'review', entities, description),
    });
    edges.push([finalIdx, docsIdx]);
  }

  // If pipeline is empty (no keywords matched), create a sensible default
  if (nodes.length === 0) {
    return {
      pipeline: {
        id: 'generated',
        name: projectName || '생성된 파이프라인',
        description: '기본 파이프라인',
        nodes: [
          { agentType: 'explore', prompt: buildAgentPrompt('explore', 'discovery', entities, description) },
          { agentType: 'architect-medium', prompt: buildAgentPrompt('architect-medium', 'planning', entities, description) },
          { agentType: 'executor', prompt: buildAgentPrompt('executor', 'implementation', entities, description) },
          { agentType: 'build-fixer-low', prompt: buildAgentPrompt('build-fixer-low', 'verification', entities, description) },
        ],
        edges: [[0, 1], [1, 2], [2, 3]],
      },
      analysis,
    };
  }

  return {
    pipeline: {
      id: 'generated',
      name: projectName || '생성된 파이프라인',
      description: `${analysis.taskType} / ${analysis.complexity} complexity`,
      nodes,
      edges,
    },
    analysis,
  };
}

export type { AnalysisResult };
