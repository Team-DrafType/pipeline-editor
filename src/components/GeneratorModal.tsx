import { useState } from 'react';
import { generatePipeline, type AnalysisResult } from '../utils/pipelineGenerator';
import { generatePipelineWithLLM } from '../utils/llmGenerator';
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('pipeline-editor-api-key') || '');
  const [mode, setMode] = useState<'claude-code' | 'llm' | 'keyword'>('claude-code');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [ccDescription, setCcDescription] = useState('');
  const [ccCopied, setCcCopied] = useState(false);
  const loadPreset = useFlowStore((s) => s.loadPreset);

  if (!open) return null;

  const handleGenerate = async () => {
    setError(null);

    if (mode === 'claude-code') {
      if (!jsonInput.trim()) return;
      try {
        const jsonMatch = jsonInput.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없습니다.');

        const parsed = JSON.parse(jsonMatch[0]) as {
          name?: string;
          description?: string;
          nodes: { agentType: string; model?: string; prompt?: string }[];
          edges?: [number, number][];
        };

        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error('"nodes" 배열이 필요합니다.');
        }

        const pipeline = {
          id: 'imported',
          name: parsed.name || '가져온 파이프라인',
          description: parsed.description || '',
          nodes: parsed.nodes.map(n => ({
            agentType: n.agentType,
            model: undefined,
            prompt: n.prompt || '',
          })),
          edges: (parsed.edges || []).filter(
            ([s, t]) => s >= 0 && s < parsed.nodes.length && t >= 0 && t < parsed.nodes.length && s !== t
          ),
        };

        loadPreset(pipeline);
        setGenerated(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'JSON 파싱 실패');
      }
      return;
    }

    if (!description.trim()) return;

    if (mode === 'llm' && apiKey.trim()) {
      setIsLoading(true);
      try {
        // API 키 저장
        localStorage.setItem('pipeline-editor-api-key', apiKey);
        const result = await generatePipelineWithLLM(apiKey, description, projectName || undefined);
        loadPreset(result.pipeline);
        setGenerated(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'LLM 호출 실패. API 키를 확인하세요.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 기존 키워드 방식 fallback
      const result = generatePipeline(description, projectName || undefined);
      setAnalysis(result.analysis);
      loadPreset(result.pipeline);
      setGenerated(true);
    }
  };

  const handleClose = () => {
    setGenerated(false);
    setAnalysis(null);
    setError(null);
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

          {/* 생성 모드 선택 */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              생성 모드
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setMode('claude-code'); setGenerated(false); setAnalysis(null); setError(null); }}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all border ${
                  mode === 'claude-code'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
              >
                Claude Code
              </button>
              <button
                onClick={() => { setMode('llm'); setGenerated(false); setAnalysis(null); setError(null); }}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all border ${
                  mode === 'llm'
                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
              >
                API Key
              </button>
              <button
                onClick={() => { setMode('keyword'); setGenerated(false); setAnalysis(null); setError(null); }}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all border ${
                  mode === 'keyword'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-transparent text-slate-400 border-slate-700 hover:text-slate-300'
                }`}
              >
                키워드 분석
              </button>
            </div>
          </div>

          {/* Claude Code 모드 UI */}
          {mode === 'claude-code' && (
            <>
              {/* 작업 설명 입력 */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  작업 설명 (텍스트 / MD)
                </label>
                <textarea
                  value={ccDescription}
                  onChange={(e) => { setCcDescription(e.target.value); setCcCopied(false); }}
                  placeholder={"구현하려는 기능, 프로젝트 목적 등을 자유롭게 작성하세요.\nMD 파일 내용을 붙여넣어도 됩니다.\n\n예: CSV 데이터 시각화 대시보드 구현.\npandas, matplotlib, plotly 사용.\nbar chart, line chart 생성."}
                  className="w-full h-36 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* 복사 버튼 */}
              <button
                onClick={async () => {
                  const prompt = `다음 작업에 맞는 에이전트 파이프라인을 만들어서 pipeline-editor에 로드해줘:\n\n${ccDescription}`;
                  await navigator.clipboard.writeText(prompt);
                  setCcCopied(true);
                  setTimeout(() => setCcCopied(false), 3000);
                }}
                disabled={!ccDescription.trim()}
                className="w-full py-2.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {ccCopied ? '복사됨! Claude Code에 붙여넣으세요' : '프롬프트를 클립보드에 복사'}
              </button>

              {/* 자동 감지 상태 */}
              <div className="rounded-lg bg-[#0f172a] border border-slate-700 p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-green-400 font-medium">자동 감지 활성화됨</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  Claude Code가 파이프라인을 생성하면 자동으로 캔버스에 로드됩니다. 이 창을 닫아도 동작합니다.
                </p>
              </div>

              {/* JSON 직접 붙여넣기 (접이식) */}
              <details className="group">
                <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-400 transition-colors">
                  또는 JSON 직접 붙여넣기 ▸
                </summary>
                <div className="mt-2">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => { setJsonInput(e.target.value); setGenerated(false); setError(null); }}
                    placeholder='파이프라인 JSON을 붙여넣으세요...'
                    className="w-full h-36 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </details>
            </>
          )}

          {/* API Key 입력 (LLM 모드일 때만) */}
          {mode === 'llm' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className="w-full px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors font-mono"
              />
              <p className="text-[10px] text-slate-600 mt-1">
                API 키는 브라우저 localStorage에 저장됩니다. 서버로 전송되지 않습니다.
              </p>
            </div>
          )}

          {/* Description (Claude Code 모드가 아닐 때만) */}
          {mode !== 'claude-code' && (
            <>
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
            </>
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          {/* Analysis result */}
          {mode === 'keyword' && analysis && (
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
            {mode === 'claude-code'
              ? 'Claude Code에게 말하면 자동으로 파이프라인이 로드됩니다'
              : mode === 'llm'
              ? 'Claude API로 최적의 파이프라인을 설계합니다'
              : '키워드 분석으로 파이프라인을 자동 생성합니다'}
          </span>
          <button
            onClick={handleGenerate}
            disabled={
              (mode === 'claude-code' && (!jsonInput.trim() || generated)) ||
              (mode !== 'claude-code' && (!description.trim() || generated || isLoading)) ||
              (mode === 'llm' && !apiKey.trim())
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                AI 생성 중...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {generated ? '로드 완료!' : mode === 'claude-code' ? '파이프라인 로드' : mode === 'llm' ? 'AI로 생성' : '키워드 분석으로 생성'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
