import useFlowStore from '../store/useFlowStore';
import { AGENT_DEFINITIONS, MODEL_BADGES } from '../constants/agents';
import type { AgentNodeData, ModelTier } from '../types';

const MODEL_OPTIONS: ModelTier[] = ['haiku', 'sonnet', 'opus'];

export default function NodeSettingsPanel() {
  const { nodes, edges, selectedNodeId, selectedEdgeId, updateNodeData, updateEdgeLabel, deleteNode, setSelectedNode, setSelectedEdge } = useFlowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (selectedEdge) {
    const sourceNode = nodes.find(n => n.id === selectedEdge.source);
    const targetNode = nodes.find(n => n.id === selectedEdge.target);
    const sourceData = sourceNode?.data as AgentNodeData | undefined;
    const targetData = targetNode?.data as AgentNodeData | undefined;

    return (
      <div className="w-72 h-full bg-[#1e293b] border-l border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <h3 className="text-sm font-bold text-slate-200">데이터 흐름</h3>
            </div>
            <button onClick={() => setSelectedEdge(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Connection info */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">연결</label>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[#0f172a] border border-slate-700 text-slate-300">
                {sourceData?.label || selectedEdge.source}
              </span>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="px-2 py-1 rounded bg-[#0f172a] border border-slate-700 text-slate-300">
                {targetData?.label || selectedEdge.target}
              </span>
            </div>
          </div>

          {/* Context label */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              전달 컨텍스트
            </label>
            <textarea
              value={(selectedEdge.data as { contextLabel?: string })?.contextLabel || (selectedEdge.label as string) || ''}
              onChange={(e) => updateEdgeLabel(selectedEdge.id, e.target.value)}
              placeholder={'이 연결을 통해 전달되는 데이터를 설명하세요...\n예: 탐색 결과, 아키텍처 설계서, API 스펙'}
              className="w-full h-24 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              비워두면 기본 데이터 전달 (이전 결과 전체 전달)
            </p>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              빠른 설정
            </label>
            <div className="flex flex-wrap gap-1">
              {['탐색 결과', '설계서', 'API 스펙', '코드 리뷰', '테스트 결과', '빌드 로그', '분석 리포트'].map(preset => (
                <button
                  key={preset}
                  onClick={() => updateEdgeLabel(selectedEdge.id, preset)}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedNode) {
    return (
      <div className="w-72 h-full bg-[#1e293b] border-l border-slate-700 flex items-center justify-center p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <p className="text-sm text-slate-500">Select a node to edit</p>
          <p className="text-[11px] text-slate-600 mt-1">Click on any agent node on the canvas</p>
        </div>
      </div>
    );
  }

  const data = selectedNode.data as unknown as AgentNodeData;
  const def = AGENT_DEFINITIONS.find((a) => a.id === data.agentType);

  return (
    <div className="w-72 h-full bg-[#1e293b] border-l border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: data.color }} />
            <h3 className="text-sm font-bold text-slate-200">{data.label}</h3>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">{data.description}</p>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Model selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Model
          </label>
          <div className="flex gap-1.5">
            {MODEL_OPTIONS.map((model) => {
              const badge = MODEL_BADGES[model];
              const isActive = data.model === model;
              return (
                <button
                  key={model}
                  onClick={() => updateNodeData(selectedNode.id, { model })}
                  className="flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all border"
                  style={{
                    background: isActive ? badge.bg : 'transparent',
                    color: isActive ? badge.text : '#94a3b8',
                    borderColor: isActive ? badge.text + '40' : '#475569',
                  }}
                >
                  {badge.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent type info */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Agent Type
          </label>
          <div className="px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-xs text-slate-300">
            {def?.id ?? data.agentType}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Prompt / Instructions
          </label>
          <textarea
            value={data.prompt}
            onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
            placeholder="Enter task instructions for this agent..."
            className="w-full h-32 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Label override */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Display Label
          </label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
            className="w-full px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Delete button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="w-full py-2 rounded-md bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
