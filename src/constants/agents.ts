import type { AgentDefinition } from '../types';

export const CATEGORY_COLORS: Record<string, string> = {
  execution: '#3b82f6',
  analysis: '#8b5cf6',
  search: '#22c55e',
  research: '#14b8a6',
  frontend: '#ec4899',
  testing: '#f97316',
  security: '#ef4444',
  build: '#eab308',
  review: '#6366f1',
  planning: '#7c3aed',
  docs: '#6b7280',
  visual: '#06b6d4',
  data: '#10b981',
};

export const AGENT_DEFINITIONS: AgentDefinition[] = [
  // Execution
  { id: 'executor-low', label: 'Executor (Low)', category: 'execution', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.execution, description: '단일 파일 수정, 간단한 코드 변경을 빠르게 처리하는 경량 실행 에이전트' },
  { id: 'executor', label: 'Executor', category: 'execution', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.execution, description: '기능 구현, 버그 수정 등 중간 규모 코딩 작업을 수행하는 핵심 실행 에이전트' },
  { id: 'executor-high', label: 'Executor (High)', category: 'execution', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.execution, description: '여러 파일에 걸친 복잡한 리팩토링, 대규모 기능 구현을 처리하는 고급 실행 에이전트' },
  // Analysis
  { id: 'architect-low', label: 'Architect (Low)', category: 'analysis', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.analysis, description: '간단한 코드 질문, 함수 동작 확인 등 빠른 분석을 담당하는 경량 아키텍트' },
  { id: 'architect-medium', label: 'Architect (Medium)', category: 'analysis', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.analysis, description: '아키텍처 검토, 디버깅 조언, 설계 패턴 분석을 수행하는 중급 아키텍트' },
  { id: 'architect', label: 'Architect', category: 'analysis', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.analysis, description: '시스템 전체 아키텍처 설계, 복잡한 버그 근본 원인 분석, 전략적 기술 의사결정을 담당하는 최고급 아키텍트' },
  // Search
  { id: 'explore', label: 'Explore', category: 'search', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.search, description: '파일 검색, 패턴 매칭, 코드베이스 구조 빠른 파악을 담당하는 경량 탐색 에이전트' },
  { id: 'explore-medium', label: 'Explore (Medium)', category: 'search', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.search, description: '코드 흐름 추적, 의존성 분석 등 논리적 추론이 필요한 심층 탐색 에이전트' },
  { id: 'explore-high', label: 'Explore (High)', category: 'search', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.search, description: '시스템 전반의 아키텍처 이해, 심볼 참조 추적, 복잡한 코드 관계 분석을 수행하는 고급 탐색 에이전트' },
  // Research
  { id: 'researcher-low', label: 'Researcher (Low)', category: 'research', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.research, description: '공식 문서 빠른 조회, API 사용법 확인 등 간단한 리서치를 수행하는 경량 연구 에이전트' },
  { id: 'researcher', label: 'Researcher', category: 'research', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.research, description: '외부 라이브러리 문서 조사, API 스펙 분석, 기술 비교 연구를 수행하는 전문 연구 에이전트' },
  // Frontend
  { id: 'designer-low', label: 'Designer (Low)', category: 'frontend', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.frontend, description: '간단한 스타일 수정, 색상 변경, 마진/패딩 조정 등 경미한 UI 작업을 처리하는 경량 디자이너' },
  { id: 'designer', label: 'Designer', category: 'frontend', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.frontend, description: '컴포넌트 설계, 반응형 레이아웃, 사용자 경험을 고려한 UI 구현을 담당하는 프론트엔드 디자이너' },
  { id: 'designer-high', label: 'Designer (High)', category: 'frontend', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.frontend, description: '디자인 시스템 구축, 복잡한 UI 아키텍처, 인터랙션 설계를 담당하는 고급 프론트엔드 아키텍트' },
  // Testing
  { id: 'qa-tester', label: 'QA Tester', category: 'testing', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.testing, description: 'CLI 인터랙티브 테스트, 시나리오 기반 검증, 기능 동작 확인을 수행하는 QA 전문가' },
  { id: 'qa-tester-high', label: 'QA Tester (High)', category: 'testing', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.testing, description: '프로덕션 수준의 종합 QA, 엣지 케이스 발견, 회귀 테스트를 수행하는 고급 QA 전문가' },
  { id: 'tdd-guide', label: 'TDD Guide', category: 'testing', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.testing, description: '테스트 먼저 작성하는 TDD 방법론을 적용하여 80%+ 커버리지를 달성하도록 가이드하는 에이전트' },
  { id: 'tdd-guide-low', label: 'TDD Guide (Low)', category: 'testing', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.testing, description: '빠른 테스트 케이스 제안, 간단한 단위 테스트 아이디어를 제공하는 경량 TDD 가이드' },
  // Security
  { id: 'security-reviewer', label: 'Security Reviewer', category: 'security', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.security, description: 'OWASP Top 10 취약점 탐지, 인증/인가 결함 분석, 보안 패턴 심층 검토를 수행하는 보안 전문가' },
  { id: 'security-reviewer-low', label: 'Security Reviewer (Low)', category: 'security', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.security, description: '하드코딩된 시크릿 탐지, 기본적인 취약점 스캔 등 빠른 보안 점검을 수행하는 경량 보안 에이전트' },
  // Build
  { id: 'build-fixer', label: 'Build Fixer', category: 'build', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.build, description: '컴파일 오류, 타입 에러, 빌드 실패를 최소한의 변경으로 빠르게 해결하는 빌드 전문가' },
  { id: 'build-fixer-low', label: 'Build Fixer (Low)', category: 'build', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.build, description: '단순한 타입 에러, import 누락 등 사소한 빌드 오류를 즉시 수정하는 경량 빌드 에이전트' },
  // Review
  { id: 'code-reviewer', label: 'Code Reviewer', category: 'review', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.review, description: '코드 품질, 보안, 유지보수성, 성능을 종합적으로 검토하고 심각도별 피드백을 제공하는 코드 리뷰 전문가' },
  { id: 'code-reviewer-low', label: 'Code Reviewer (Low)', category: 'review', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.review, description: '소규모 변경사항에 대한 빠른 코드 품질 체크를 수행하는 경량 코드 리뷰어' },
  { id: 'critic', label: 'Critic', category: 'review', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.review, description: '작업 계획의 논리적 결함, 누락된 요구사항, 잠재적 위험을 날카롭게 지적하는 비평 전문가' },
  // Planning
  { id: 'planner', label: 'Planner', category: 'planning', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.planning, description: '요구사항을 분석하고 단계별 구현 전략을 수립하는 전략 기획 전문가. 인터뷰 워크플로우로 사용자와 소통' },
  { id: 'analyst', label: 'Analyst', category: 'planning', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.planning, description: '기획 전 요구사항 분석, 제약 조건 파악, 기술적 타당성 검토를 수행하는 사전 분석 전문가' },
  // Docs
  { id: 'writer', label: 'Writer', category: 'docs', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.docs, description: 'README, API 문서, 코드 주석 등 기술 문서를 작성하는 테크니컬 라이터' },
  // Visual
  { id: 'vision', label: 'Vision', category: 'visual', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.visual, description: '이미지, PDF, 다이어그램 등 시각 자료를 분석하고 내용을 해석하는 멀티모달 분석 에이전트' },
  // Data
  { id: 'scientist-low', label: 'Scientist (Low)', category: 'data', defaultModel: 'haiku', availableModels: ['haiku'], color: CATEGORY_COLORS.data, description: '빠른 데이터 조회, 간단한 통계 확인, CSV 미리보기 등을 수행하는 경량 데이터 에이전트' },
  { id: 'scientist', label: 'Scientist', category: 'data', defaultModel: 'sonnet', availableModels: ['sonnet'], color: CATEGORY_COLORS.data, description: '데이터 분석, 시각화, 통계 처리, 실험 실행을 수행하는 데이터 사이언스 에이전트' },
  { id: 'scientist-high', label: 'Scientist (High)', category: 'data', defaultModel: 'opus', availableModels: ['opus'], color: CATEGORY_COLORS.data, description: '복잡한 가설 검증, 머신러닝 모델 분석, 대규모 연구 설계를 수행하는 고급 데이터 과학자' },
];

export const MODEL_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  haiku: { label: 'Haiku', bg: '#dcfce7', text: '#166534' },
  sonnet: { label: 'Sonnet', bg: '#dbeafe', text: '#1e40af' },
  opus: { label: 'Opus', bg: '#f3e8ff', text: '#6b21a8' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  execution: '실행',
  analysis: '분석',
  search: '탐색',
  research: '연구',
  frontend: '프론트엔드',
  testing: '테스팅',
  security: '보안',
  build: '빌드',
  review: '리뷰',
  planning: '기획',
  docs: '문서',
  visual: '시각',
  data: '데이터 과학',
};
