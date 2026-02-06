import { useState } from 'react';
import { generatePipeline, type AnalysisResult } from '../utils/pipelineGenerator';
import useFlowStore from '../store/useFlowStore';

interface GeneratorModalProps {
  open: boolean;
  onClose: () => void;
}

const EXAMPLE_PROMPTS = [
  '사용자 인증 시스템 구현 (JWT 기반, 로그인/회원가입 UI 포함)',
  'React 대시보드에 차트 컴포넌트 추가, 반응형 레이아웃 적용',
  '기존 REST API를 리팩토링하고 성능 최적화, 테스트 추가',
  '보안 감사: XSS/CSRF 취약점 스캔 및 수정',
  'CSV 데이터 분석 파이프라인 구축, 통계 리포트 생성',
  'TypeScript 마이그레이션 + 전체 아키텍처 리팩토링',
];

const TASK_TYPE_LABELS: Record<string, string> = {
  'new-feature': '새 기능',
  refactor: '리팩토링',
  bugfix: '버그 수정',
  security: '보안',
  research: '리서치',
  fullstack: '풀스택',
  frontend: '프론트엔드',
  backend: '백엔드',
  data: '데이터',
  general: '일반',
};

const COMPLEXITY_STYLES: Record<string, { label: string; color: string }> = {
  low: { label: '낮음', color: 'text-green-400' },
  medium: { label: '보통', color: 'text-yellow-400' },
  high: { label: '높음', color: 'text-red-400' },
};

const CATEGORY_LABELS: Record<string, string> = {
  research: '리서치',
  explore: '탐색',
  frontend: '프론트엔드',
  backend: '백엔드',
  security: '보안',
  test: '테스트',
  data: '데이터',
  docs: '문서화',
  refactor: '리팩토링',
  bugfix: '버그수정',
  complex: '복합',
  build: '빌드',
  review: '리뷰',
};

export default function GeneratorModal({ open, onClose }: GeneratorModalProps) {
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generated, setGenerated] = useState(false);
  const loadPreset = useFlowStore((s) => s.loadPreset);

  if (!open) return null;

  const handleGenerate = () => {
    if (!description.trim()) return;
    const result = generatePipeline(description, projectName || undefined);
    setAnalysis(result.analysis);
    loadPreset(result.pipeline);
    setGenerated(true);
  };

  const handleClose = () => {
    setGenerated(false);
    setAnalysis(null);
    onClose();
  };

  const handleExample = (example: string) => {
    setDescription(example);
    setGenerated(false);
    setAnalysis(null);
  };

  const maxScore = analysis ? Math.max(...Object.values(analysis.scores), 1) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={handleClose}>
      <div className="w-[640px] max-h-[85vh] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h2 className="text-sm font-bold text-slate-200">Pipeline Generator</h2>
            <span className="text-[10px] text-slate-500">프로젝트 설명으로 자동 생성</span>
          </div>
          <button onClick={handleClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Project name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              파이프라인 이름 (선택)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="예: 사용자 인증 시스템"
              className="w-full px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              프로젝트 / 작업 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setGenerated(false); setAnalysis(null); }}
              placeholder="구현하려는 기능, 프로젝트 목적, 기술 스택, 요구사항 등을 자유롭게 작성하세요.&#10;&#10;예: React + TypeScript 기반 대시보드 앱에 사용자 인증 기능을 추가하고 싶어.&#10;JWT 기반 로그인/회원가입, 보안 검토, 테스트도 필요해."
              className="w-full h-36 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Example prompts */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              예시 (클릭하여 입력)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(ex)}
                  className="px-2 py-1 rounded-md bg-[#0f172a] border border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors truncate max-w-[280px]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Analysis result */}
          {analysis && (
            <div className="rounded-lg bg-[#0f172a] border border-slate-700 p-3 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                분석 결과
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <div>
                  <span className="text-slate-500">작업 유형: </span>
                  <span className="text-slate-200 font-medium">{TASK_TYPE_LABELS[analysis.taskType]}</span>
                </div>
                <div>
                  <span className="text-slate-500">복잡도: </span>
                  <span className={`font-medium ${COMPLEXITY_STYLES[analysis.complexity].color}`}>
                    {COMPLEXITY_STYLES[analysis.complexity].label}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">예상 에이전트: </span>
                  <span className="text-slate-200 font-medium">{analysis.suggestedAgentCount}개</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.needsExplore && <span className="px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 text-[9px]">탐색</span>}
                {analysis.needsResearch && <span className="px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 text-[9px]">리서치</span>}
                {analysis.needsDesign && <span className="px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-400 text-[9px]">UI/UX</span>}
                {analysis.needsSecurity && <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 text-[9px]">보안</span>}
                {analysis.needsTest && <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 text-[9px]">테스트</span>}
                {analysis.needsData && <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px]">데이터</span>}
                {analysis.needsDocs && <span className="px-1.5 py-0.5 rounded bg-gray-500/15 text-gray-400 text-[9px]">문서화</span>}
              </div>

              {/* Category score bars */}
              {analysis.scores && (
                <div className="space-y-1 mt-2">
                  {Object.entries(analysis.scores)
                    .filter(([, v]) => v > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, score]) => (
                      <div key={cat} className="flex items-center gap-2 text-[10px]">
                        <span className="w-16 text-slate-500 text-right">{CATEGORY_LABELS[cat] || cat}</span>
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((score / maxScore) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-slate-400 w-6 text-right">{score}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Phrase matches */}
              {analysis.phraseMatches && analysis.phraseMatches.length > 0 && (
                <div className="text-[10px] text-slate-500 mt-1">
                  구문 매칭: {analysis.phraseMatches.join(', ')}
                </div>
              )}

              {analysis.detectedKeywords.length > 0 && (
                <div className="text-[10px] text-slate-600 mt-1">
                  감지된 키워드: {analysis.detectedKeywords.slice(0, 10).join(', ')}
                </div>
              )}
              {generated && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <span className="text-[11px] text-green-400 font-medium">
                    파이프라인이 캔버스에 생성되었습니다! 닫고 수정하세요.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <span className="text-[11px] text-slate-500">
            설명을 분석하여 최적의 에이전트 조합을 자동 생성합니다
          </span>
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || generated}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {generated ? '생성 완료!' : '파이프라인 생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
