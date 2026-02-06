import { useState, useRef, useCallback, useEffect } from 'react';
import useFlowStore from '../store/useFlowStore';
import { analyzeGraph } from '../utils/graphAnalyzer';
import { simulateExecution, createInitialState, type ExecutionState, type StepStatus } from '../utils/executionEngine';
import { generateClaudeCodeScript, generateMermaidDiagram, generateRunnableScript } from '../utils/generateExecutionCode';
import { exportToPrompt } from '../utils/exportPrompt';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const STATUS_STYLES: Record<StepStatus, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-slate-700/30', text: 'text-slate-500', icon: '○' },
  running: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '◉' },
  completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✓' },
  failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '✗' },
};

const MODEL_COLORS: Record<string, string> = {
  haiku: 'text-green-400',
  sonnet: 'text-blue-400',
  opus: 'text-purple-400',
};

interface RunPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function RunPanel({ open, onClose }: RunPanelProps) {
  const { nodes, edges } = useFlowStore();
  const [execState, setExecState] = useState<ExecutionState | null>(null);
  const [activeTab, setActiveTab] = useState<'simulate' | 'code' | 'prompt' | 'mermaid' | 'script' | 'execute'>('simulate');
  const [taskDesc, setTaskDesc] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ step: number; agent: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 대화형 터미널 상태
  const [projectDir, setProjectDir] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const termContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const steps = analyzeGraph(nodes, edges);

  const handleRun = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setExecState(createInitialState(steps));
    simulateExecution(steps, (state) => setExecState({ ...state }), controller.signal);
  }, [steps]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setExecState((prev) => prev ? { ...prev, isRunning: false } : null);
  }, []);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 터미널 초기화 & 정리
  useEffect(() => {
    if (open && activeTab === 'execute' && termContainerRef.current && !xtermRef.current) {
      // requestAnimationFrame으로 DOM이 완전히 렌더링된 후 초기화
      requestAnimationFrame(() => {
        if (!termContainerRef.current || xtermRef.current) return;

        const term = new Terminal({
          theme: {
            background: '#0f172a',
            foreground: '#cbd5e1',
            cursor: '#818cf8',
            selectionBackground: '#334155',
          },
          fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
          fontSize: 12,
          cursorBlink: true,
          convertEol: true,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(termContainerRef.current);
        fitAddon.fit();

        term.writeln('\x1b[90m프로젝트 경로를 입력하고 실행 버튼을 클릭하세요.\x1b[0m');
        term.writeln('\x1b[90mClaude Code 대화형 터미널이 여기에 표시됩니다.\x1b[0m\r\n');

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;
      });
    }
  }, [open, activeTab]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      xtermRef.current?.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // 리사이즈 핸들러
  useEffect(() => {
    const handleResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 대화형 실행 핸들러
  const handleExecute = useCallback(() => {
    if (!projectDir.trim() || isExecuting || steps.length === 0) return;

    const term = xtermRef.current;
    if (!term) return;

    // 이전 세션 정리
    wsRef.current?.close();
    term.clear();
    term.writeln('\x1b[32m[시작]\x1b[0m 파이프라인 실행 중...');
    term.writeln(`\x1b[90m프로젝트: ${projectDir.trim()}\x1b[0m\r\n`);

    const prompt = exportToPrompt(steps, taskDesc);
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsExecuting(true);
      ws.send(JSON.stringify({
        type: 'start',
        projectDir: projectDir.trim(),
        prompt,
        cols: term.cols,
        rows: term.rows,
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'output') {
          term.write(msg.data);
        } else if (msg.type === 'exit') {
          term.writeln(`\r\n\x1b[32m[완료]\x1b[0m 종료 코드: ${msg.code ?? 0}`);
          setIsExecuting(false);
        } else if (msg.type === 'error') {
          term.writeln(`\r\n\x1b[31m[오류]\x1b[0m ${msg.data}`);
          setIsExecuting(false);
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {
      term.writeln('\r\n\x1b[31m[오류]\x1b[0m WebSocket 연결 실패');
      setIsExecuting(false);
    };

    ws.onclose = () => {
      setIsExecuting(false);
    };

    // 사용자 키보드 입력 → PTY 전달
    const inputDisposable = term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // 터미널 리사이즈 → PTY 리사이즈
    const resizeDisposable = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    // 연결 종료 시 리스너 정리
    ws.addEventListener('close', () => {
      inputDisposable.dispose();
      resizeDisposable.dispose();
    }, { once: true });
  }, [projectDir, steps, taskDesc, isExecuting]);

  const handleStopExecution = useCallback(() => {
    wsRef.current?.close();
    setIsExecuting(false);
    xtermRef.current?.writeln('\r\n\x1b[33m[중단됨]\x1b[0m 사용자가 실행을 중단했습니다.');
  }, []);

  // 모달 다시 열릴 때 터미널 refit
  useEffect(() => {
    if (open && activeTab === 'execute' && fitAddonRef.current) {
      setTimeout(() => fitAddonRef.current?.fit(), 50);
    }
  }, [open, activeTab]);

  const codeOutput = generateClaudeCodeScript(steps, taskDesc);
  const promptOutput = exportToPrompt(steps, taskDesc);
  const mermaidOutput = generateMermaidDiagram(steps);
  const scriptOutput = generateRunnableScript(steps, taskDesc);

  const totalAgents = steps.reduce((sum, s) => sum + s.agents.length, 0);
  const completedAgents = execState?.steps.reduce(
    (sum, s) => sum + s.agents.filter((a) => a.status === 'completed').length, 0
  ) ?? 0;
  const elapsed = execState?.startedAt
    ? ((execState.completedAt ?? Date.now()) - execState.startedAt) / 1000
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ display: open ? undefined : 'none' }}>
      <div className="w-[780px] max-h-[85vh] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-200">Pipeline Runner</h2>
            <span className="text-[10px] text-slate-500">
              {steps.length} steps / {totalAgents} agents
            </span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task description */}
        <div className="px-4 pt-3">
          <input
            type="text"
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            placeholder="작업 설명을 입력하세요 (예: 사용자 인증 시스템 구현)"
            className="w-full px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {([
            ['simulate', '시뮬레이션'],
            ['execute', '실제 실행'],
            ['prompt', '실행 프롬프트'],
            ['code', 'Task 코드'],
            ['mermaid', 'Mermaid'],
            ['script', 'Node.js 스크립트'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === key
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-300 border border-transparent'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          {activeTab === 'simulate' && (
            <div className="h-full flex flex-col">
              {/* Controls */}
              <div className="flex items-center gap-2 mb-3">
                {!execState?.isRunning ? (
                  <button
                    onClick={handleRun}
                    disabled={steps.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-40"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    실행 시뮬레이션
                  </button>
                ) : (
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                    중지
                  </button>
                )}
                {execState && (
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{completedAgents}/{totalAgents} 완료</span>
                    <span>{elapsed.toFixed(1)}초</span>
                    {!execState.isRunning && execState.completedAt && (
                      <span className="text-green-400 font-medium">완료!</span>
                    )}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {execState && (
                <div className="w-full h-1.5 bg-slate-700 rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalAgents > 0 ? (completedAgents / totalAgents) * 100 : 0}%` }}
                  />
                </div>
              )}

              {/* Steps visualization */}
              <div className={`${selectedAgent ? 'max-h-[40%]' : 'flex-1'} overflow-y-auto space-y-2`}>
                {(execState?.steps ?? createInitialState(steps).steps).map((step) => {
                  const style = STATUS_STYLES[step.status];
                  return (
                    <div key={step.step} className={`rounded-lg border border-slate-700/50 ${style.bg} p-3`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm font-mono ${style.text}`}>{style.icon}</span>
                        <span className="text-xs font-semibold text-slate-300">
                          {step.step}단계
                        </span>
                        {step.agents.length > 1 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                            병렬
                          </span>
                        )}
                        {step.status === 'running' && (
                          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="space-y-1 pl-5">
                        {step.agents.map((agent, j) => {
                          const agentStyle = STATUS_STYLES[agent.status];
                          const isSelected = selectedAgent?.step === step.step && selectedAgent?.agent === j;
                          const hasOutput = 'output' in agent && agent.output;
                          return (
                            <div
                              key={j}
                              className={`flex items-center justify-between rounded px-1.5 py-0.5 transition-colors ${
                                hasOutput ? 'cursor-pointer hover:bg-slate-700/40' : ''
                              } ${isSelected ? 'bg-slate-700/50 ring-1 ring-indigo-500/40' : ''}`}
                              onClick={() => hasOutput && setSelectedAgent(isSelected ? null : { step: step.step, agent: j })}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-mono ${agentStyle.text}`}>
                                  {agentStyle.icon}
                                </span>
                                <span className="text-xs text-slate-300">{agent.type}</span>
                                <span className={`text-[10px] ${MODEL_COLORS[agent.model] ?? 'text-slate-400'}`}>
                                  {agent.model}
                                </span>
                                {hasOutput && (
                                  <span className="text-[9px] text-indigo-400/70">
                                    {isSelected ? '▼ 결과' : '▶ 결과 보기'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {agent.status === 'running' && (
                                  <span className="text-[10px] text-blue-400 animate-pulse">처리 중...</span>
                                )}
                                {agent.duration != null && (
                                  <span className="text-[10px] text-slate-500">
                                    {(agent.duration / 1000).toFixed(1)}s
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Output viewer */}
              {selectedAgent && execState && (() => {
                const stepData = execState.steps.find((s) => s.step === selectedAgent.step);
                const agentData = stepData?.agents[selectedAgent.agent];
                if (!agentData?.output) return null;
                return (
                  <div className="mt-3 flex-1 min-h-[120px] flex flex-col">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-indigo-300">
                          {agentData.type} ({agentData.model}) 실행 결과
                        </span>
                        {agentData.duration != null && (
                          <span className="text-[10px] text-slate-500">{(agentData.duration / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAgent(null)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        닫기 ✕
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-3 rounded-lg bg-[#0f172a] border border-indigo-500/20 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                      {agentData.output}
                    </pre>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="h-full flex flex-col">
              {/* 프로젝트 경로 + 실행 버튼 */}
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={projectDir}
                  onChange={(e) => setProjectDir(e.target.value)}
                  placeholder="프로젝트 경로 (예: /Users/woojin/my-project)"
                  className="flex-1 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-xs"
                />
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/pick-folder', { method: 'POST' });
                      const data = await res.json();
                      if (data.path) setProjectDir(data.path);
                    } catch { /* 사용자가 취소함 */ }
                  }}
                  disabled={isExecuting}
                  className="px-2.5 py-2 rounded-md bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors border border-slate-700 disabled:opacity-40"
                  title="폴더 선택"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </button>
                {!isExecuting ? (
                  <button
                    onClick={handleExecute}
                    disabled={!projectDir.trim() || steps.length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-green-500/20 text-green-300 text-xs font-medium hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-40 whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    실행
                  </button>
                ) : (
                  <button
                    onClick={handleStopExecution}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors border border-red-500/30 whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                    중지
                  </button>
                )}
                {isExecuting && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] text-green-400 whitespace-nowrap">실행 중</span>
                  </div>
                )}
              </div>

              {/* xterm.js 대화형 터미널 */}
              <div
                ref={termContainerRef}
                className="flex-1 min-h-[350px] rounded-lg overflow-hidden border border-slate-700"
                style={{ backgroundColor: '#0f172a' }}
              />
            </div>
          )}

          {activeTab !== 'simulate' && activeTab !== 'execute' && (
            <div className="h-full flex flex-col">
              <pre className="flex-1 min-h-[300px] max-h-[500px] overflow-auto p-4 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {activeTab === 'code' && codeOutput}
                {activeTab === 'prompt' && promptOutput}
                {activeTab === 'mermaid' && mermaidOutput}
                {activeTab === 'script' && scriptOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <span className="text-[11px] text-slate-500">
            {activeTab === 'simulate' && '시뮬레이션은 모델별 예상 응답 시간을 반영합니다'}
            {activeTab === 'execute' && '대화형 터미널 - Claude Code와 직접 상호작용 (승인/거부/입력 가능)'}
            {activeTab !== 'simulate' && activeTab !== 'execute' && '클립보드에 복사하여 Claude Code에서 사용하세요'}
          </span>
          {activeTab !== 'simulate' && activeTab !== 'execute' && (
            <button
              onClick={() => handleCopy(
                activeTab === 'code' ? codeOutput : activeTab === 'prompt' ? promptOutput : activeTab === 'script' ? scriptOutput : mermaidOutput
              )}
              className="px-4 py-2 rounded-md bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
            >
              {copied ? '복사됨!' : '클립보드에 복사'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
