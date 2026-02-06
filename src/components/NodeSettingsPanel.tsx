import useFlowStore from '../store/useFlowStore';
import { AGENT_DEFINITIONS, MODEL_BADGES } from '../constants/agents';
import type { AgentNodeData, ModelTier } from '../types';

const MODEL_OPTIONS: ModelTier[] = ['haiku', 'sonnet', 'opus'];

export default function NodeSettingsPanel() {
  const { nodes, selectedNodeId, updateNodeData, deleteNode, setSelectedNode } = useFlowStore();
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

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
