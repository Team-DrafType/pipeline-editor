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

/**
 * Extract context-relevant phrases from description for a given category.
 * Returns a concise string summarizing what the user wants related to that category.
 */
function extractContext(description: string, category: string): string {
  const lines = description.split(/[.\n,;]/).map(s => s.trim()).filter(Boolean);
  const categoryKeywords = KEYWORD_PATTERNS[category];
  const relevantPhrases = PHRASE_PATTERNS.filter(p => p.category === category);

  const matchedSegments: string[] = [];

  for (const line of lines) {
    // Check phrase patterns first (higher quality matches)
    for (const { pattern } of relevantPhrases) {
      if (pattern.test(line)) {
        matchedSegments.push(line.trim());
        break;
      }
    }
    // Check keyword patterns
    if (categoryKeywords) {
      for (const { pattern } of categoryKeywords) {
        if (pattern.test(line) && !matchedSegments.includes(line.trim())) {
          matchedSegments.push(line.trim());
          break;
        }
      }
    }
  }

  // Deduplicate and truncate
  const unique = [...new Set(matchedSegments)];
  if (unique.length === 0) return '';
  return unique.slice(0, 3).join(', ');
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
  const nodes: PresetPipeline['nodes'] = [];
  const edges: [number, number][] = [];

  // Helper: build context-aware prompt
  const contextPrompt = (base: string, category: string): string => {
    const ctx = extractContext(description, category);
    return ctx ? `${base}: ${ctx}` : base;
  };

  // --- Phase 1: Discovery ---
  const phase1Start = nodes.length;

  if (analysis.needsExplore || analysis.complexity !== 'low') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'explore-high' : 'explore',
      prompt: contextPrompt('프로젝트 구조 분석 및 관련 코드 탐색', 'explore'),
    });
  }

  if (analysis.needsResearch) {
    nodes.push({
      agentType: 'researcher',
      prompt: contextPrompt('관련 라이브러리/API 공식 문서 조사', 'research'),
    });
  }

  if (analysis.needsData) {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'scientist-high' : 'scientist',
      prompt: contextPrompt('데이터 구조 분석 및 요구사항 파악', 'data'),
    });
  }

  const phase1End = nodes.length;

  // --- Phase 2: Planning/Design ---
  const phase2Start = nodes.length;

  if (analysis.complexity === 'high') {
    nodes.push({
      agentType: 'analyst',
      prompt: contextPrompt('요구사항 분석 및 제약 조건 도출', 'complex'),
    });
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);

    nodes.push({
      agentType: 'architect',
      prompt: contextPrompt('아키텍처 설계 및 구현 전략 수립', 'complex'),
    });
    edges.push([phase2Start, phase2Start + 1]);
  } else if (analysis.complexity === 'medium') {
    nodes.push({
      agentType: 'architect-medium',
      prompt: contextPrompt('설계 검토 및 구현 방향 결정', 'explore'),
    });
    for (let i = phase1Start; i < phase1End; i++) edges.push([i, phase2Start]);
  }

  const phase2End = nodes.length;
  const connectFrom = phase2End > phase2Start ? phase2End - 1 : phase1End - 1;

  // --- Phase 3: Implementation ---
  const phase3Start = nodes.length;

  if (analysis.taskType === 'bugfix') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'executor-high' : 'executor',
      prompt: contextPrompt('버그 수정 구현', 'bugfix'),
    });
  } else if (analysis.taskType === 'fullstack') {
    nodes.push({
      agentType: 'executor',
      model: 'sonnet',
      prompt: contextPrompt('백엔드/API 구현', 'backend'),
    });
    nodes.push({
      agentType: analysis.needsDesign ? 'designer' : 'executor',
      model: 'sonnet',
      prompt: contextPrompt('프론트엔드 UI 구현', 'frontend'),
    });
  } else if (analysis.taskType === 'frontend') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'designer-high' : 'designer',
      prompt: contextPrompt('UI/UX 컴포넌트 구현', 'frontend'),
    });
  } else if (analysis.taskType === 'data') {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'scientist-high' : 'scientist',
      prompt: contextPrompt('데이터 처리 및 분석 구현', 'data'),
    });
  } else if (analysis.taskType === 'security') {
    nodes.push({
      agentType: 'executor',
      prompt: contextPrompt('보안 개선사항 구현', 'security'),
    });
  } else {
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'executor-high' : 'executor',
      prompt: contextPrompt('핵심 기능 구현', analysis.taskType === 'refactor' ? 'refactor' : 'explore'),
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

  nodes.push({
    agentType: analysis.complexity === 'high' ? 'build-fixer' : 'build-fixer-low',
    prompt: '빌드 오류 확인 및 수정',
  });
  for (let i = phase3Start; i < phase3End; i++) edges.push([i, phase4Start]);

  if (analysis.needsSecurity) {
    const secIdx = nodes.length;
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'security-reviewer' : 'security-reviewer-low',
      prompt: contextPrompt('보안 취약점 스캔 및 검토', 'security'),
    });
    edges.push([phase4Start, secIdx]);
  }

  if (analysis.needsTest) {
    const testIdx = nodes.length;
    nodes.push({
      agentType: analysis.complexity === 'high' ? 'qa-tester-high' : 'tdd-guide',
      prompt: contextPrompt('테스트 작성 및 검증', 'test'),
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

  if (analysis.needsDocs) {
    const docsIdx = nodes.length;
    nodes.push({
      agentType: 'writer',
      prompt: contextPrompt('문서화 및 README 업데이트', 'docs'),
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
