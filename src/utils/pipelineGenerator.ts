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
}

const KEYWORD_PATTERNS: Record<string, RegExp[]> = {
  research: [/문서/i, /조사/i, /리서치/i, /research/i, /doc/i, /api/i, /라이브러리/i, /library/i, /sdk/i, /프레임워크/i, /framework/i],
  explore: [/분석/i, /파악/i, /구조/i, /이해/i, /탐색/i, /explore/i, /codebase/i, /코드베이스/i, /기존/i, /현재/i],
  frontend: [/ui/i, /ux/i, /프론트/i, /front/i, /컴포넌트/i, /component/i, /react/i, /vue/i, /svelte/i, /css/i, /스타일/i, /디자인/i, /design/i, /레이아웃/i, /layout/i, /반응형/i, /responsive/i, /페이지/i, /page/i, /화면/i],
  backend: [/api/i, /서버/i, /server/i, /백엔드/i, /backend/i, /데이터베이스/i, /database/i, /db/i, /rest/i, /graphql/i, /엔드포인트/i, /endpoint/i, /인증/i, /auth/i, /미들웨어/i, /middleware/i],
  security: [/보안/i, /security/i, /취약점/i, /vulnerability/i, /xss/i, /csrf/i, /인증/i, /auth/i, /암호/i, /encrypt/i, /owasp/i],
  test: [/테스트/i, /test/i, /tdd/i, /qa/i, /검증/i, /verify/i, /커버리지/i, /coverage/i],
  data: [/데이터/i, /data/i, /분석/i, /analy/i, /통계/i, /statistic/i, /ml/i, /머신러닝/i, /machine learning/i, /ai/i, /모델/i, /model/i, /학습/i, /train/i, /csv/i, /시각화/i, /visuali/i, /chart/i, /차트/i, /그래프/i, /graph/i, /pandas/i, /matplotlib/i, /plotly/i, /streamlit/i, /jupyter/i, /notebook/i],
  docs: [/문서화/i, /document/i, /readme/i, /주석/i, /comment/i, /가이드/i, /guide/i],
  refactor: [/리팩토링/i, /refactor/i, /개선/i, /improve/i, /최적화/i, /optimiz/i, /성능/i, /performance/i, /정리/i, /cleanup/i],
  bugfix: [/버그/i, /bug/i, /수정/i, /fix/i, /오류/i, /error/i, /에러/i, /디버그/i, /debug/i, /문제/i, /issue/i, /깨진/i, /broken/i],
  complex: [/시스템/i, /system/i, /아키텍처/i, /architect/i, /전체/i, /마이그레이션/i, /migrat/i, /대규모/i, /풀스택/i, /fullstack/i, /full-stack/i],
};

function analyzeDescription(text: string): AnalysisResult {
  const detected: string[] = [];
  const matches: Record<string, number> = {};

  for (const [category, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    const count = patterns.filter((p) => p.test(text)).length;
    matches[category] = count;
    if (count > 0) {
      patterns.filter((p) => p.test(text)).forEach((p) => {
        const match = text.match(p);
        if (match) detected.push(match[0]);
      });
    }
  }

  const needsResearch = matches.research > 0;
  const needsExplore = matches.explore > 0 || matches.refactor > 0;
  const needsDesign = matches.frontend > 0;
  const needsSecurity = matches.security > 0;
  const needsTest = matches.test > 0;
  const needsData = matches.data > 0;
  const needsDocs = matches.docs > 0;

  // Determine complexity
  const totalMatches = Object.values(matches).reduce((a, b) => a + b, 0);
  const complexity = matches.complex > 0 || totalMatches > 8 ? 'high'
    : totalMatches > 4 ? 'medium' : 'low';

  // Determine task type
  let taskType: AnalysisResult['taskType'] = 'general';
  if (matches.bugfix > 1) taskType = 'bugfix';
  else if (matches.security > 1) taskType = 'security';
  else if (matches.data > 1) taskType = 'data';
  else if (matches.frontend > 2 && matches.backend <= 1) taskType = 'frontend';
  else if (matches.backend > 2 && matches.frontend <= 1) taskType = 'backend';
  else if (matches.frontend > 0 && matches.backend > 0) taskType = 'fullstack';
  else if (matches.refactor > 0) taskType = 'refactor';
  else if (matches.research > 1) taskType = 'research';
  else taskType = 'new-feature';

  return { needsResearch, needsExplore, needsDesign, needsSecurity, needsTest, needsData, needsDocs, complexity, taskType, detectedKeywords: [...new Set(detected)] };
}

export function generatePipeline(description: string, projectName?: string): { pipeline: PresetPipeline; analysis: AnalysisResult } {
  const analysis = analyzeDescription(description);
  const nodes: PresetPipeline['nodes'] = [];
  const edges: [number, number][] = [];

  // --- Phase 1: Discovery ---
  const phase1Start = nodes.length;

  if (analysis.needsExplore || analysis.complexity !== 'low') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'explore-high' : 'explore',
      prompt: '프로젝트 구조 분석 및 관련 코드 탐색',
    });
  }

  if (analysis.needsResearch) {
    nodes.push({
      agentType: 'researcher',
      prompt: '관련 라이브러리/API 공식 문서 조사',
    });
  }

  if (analysis.needsData) {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'scientist-high' : 'scientist',
      prompt: '데이터 구조 분석 및 요구사항 파악',
    });
  }

  const phase1End = nodes.length;

  // --- Phase 2: Planning/Design ---
  const phase2Start = nodes.length;

  if (analysis.complexity === 'high') {
    nodes.push({
      agentType: 'analyst',
      prompt: '요구사항 분석 및 제약 조건 도출',
    });
    // Connect phase1 → analyst
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);

    nodes.push({
      agentType: 'architect',
      prompt: '아키텍처 설계 및 구현 전략 수립',
    });
    edges.push([phase2Start, phase2Start + 1]); // analyst → architect
  } else if (analysis.complexity === 'medium') {
    nodes.push({
      agentType: 'architect-medium',
      prompt: '설계 검토 및 구현 방향 결정',
    });
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);
  } else {
    // Low complexity - skip planning, connect directly
  }

  const phase2End = nodes.length;
  const connectFrom = phase2End > phase2Start ? phase2End - 1 : phase1End - 1;

  // --- Phase 3: Implementation ---
  const phase3Start = nodes.length;

  if (analysis.taskType === 'bugfix') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'executor-high' : 'executor',
      prompt: '버그 수정 구현',
    });
  } else if (analysis.taskType === 'fullstack') {
    nodes.push({
      agentType: 'executor',
      model: 'sonnet',
      prompt: '백엔드/API 구현',
    });
    nodes.push({
      agentType: analysis.needsDesign ? 'designer' : 'executor',
      model: 'sonnet',
      prompt: '프론트엔드 UI 구현',
    });
  } else if (analysis.taskType === 'frontend') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'designer-high' : 'designer',
      prompt: 'UI/UX 컴포넌트 구현',
    });
  } else if (analysis.taskType === 'data') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'scientist-high' : 'scientist',
      prompt: '데이터 처리 및 분석 구현',
    });
  } else if (analysis.taskType === 'security') {
    nodes.push({
      agentType: 'executor',
      prompt: '보안 개선사항 구현',
    });
  } else {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'executor-high' : 'executor',
      prompt: '핵심 기능 구현',
    });
  }

  // Connect planning → implementation
  if (connectFrom >= 0) {
    for (let i = phase3Start; i < nodes.length; i++) {
      edges.push([connectFrom, i]);
    }
  }
  // If no planning phase, connect discovery → implementation
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

  // Build fixer
  nodes.push({
    agentType: analysis.complexity === 'high' ? 'build-fixer' : 'build-fixer-low',
    prompt: '빌드 오류 확인 및 수정',
  });
  for (let i = phase3Start; i < phase3End; i++) edges.push([i, phase4Start]);

  // Security review if needed
  if (analysis.needsSecurity) {
    const secIdx = nodes.length;
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'security-reviewer' : 'security-reviewer-low',
      prompt: '보안 취약점 스캔 및 검토',
    });
    edges.push([phase4Start, secIdx]);
  }

  // Tests if needed
  if (analysis.needsTest) {
    const testIdx = nodes.length;
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'qa-tester-high' : 'tdd-guide',
      prompt: '테스트 작성 및 검증',
    });
    edges.push([phase4Start, testIdx]);
  }

  const phase4End = nodes.length;

  // --- Phase 5: Final Review ---
  const finalIdx = nodes.length;
  nodes.push({
    agentType: analysis.complexity === 'high' ? 'architect' : 'architect-low',
    prompt: '최종 코드 품질 및 아키텍처 검증',
  });
  for (let i = phase4Start; i < phase4End; i++) edges.push([i, finalIdx]);

  // Docs if needed
  if (analysis.needsDocs) {
    const docsIdx = nodes.length;
    nodes.push({
      agentType: 'writer',
      prompt: '문서화 및 README 업데이트',
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
          { agentType: 'explore', prompt: '프로젝트 구조 파악' },
          { agentType: 'architect-medium', prompt: '설계 및 구현 방향 결정' },
          { agentType: 'executor', prompt: '기능 구현' },
          { agentType: 'build-fixer-low', prompt: '빌드 확인' },
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
