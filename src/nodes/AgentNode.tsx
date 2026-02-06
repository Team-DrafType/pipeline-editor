import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AgentNodeData } from '../types';
import { MODEL_BADGES } from '../constants/agents';
import useFlowStore from '../store/useFlowStore';

function AgentNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as AgentNodeData;
  const badge = MODEL_BADGES[nodeData.model];
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const isSelected = selected || selectedNodeId === id;

  return (
    <div
      className="relative min-w-[200px] rounded-lg shadow-lg transition-all duration-200"
      style={{
        border: isSelected ? `2px solid ${nodeData.color}` : '2px solid #475569',
        background: '#1e293b',
      }}
    >
      {/* Category color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
        style={{ background: nodeData.color }}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-400 hover:!bg-indigo-400 hover:!border-indigo-300 transition-colors"
      />

      {/* Content */}
      <div className="pl-4 pr-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-100 truncate">
            {nodeData.label}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[11px] text-slate-400 truncate max-w-[160px]">
            {nodeData.prompt || nodeData.description}
          </span>
          {nodeData.prompt && (
            <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-500 !border-2 !border-slate-400 hover:!bg-indigo-400 hover:!border-indigo-300 transition-colors"
      />
    </div>
  );
}

export default memo(AgentNodeComponent);
