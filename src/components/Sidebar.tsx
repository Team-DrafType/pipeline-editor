import { type DragEvent } from 'react';
import { AGENT_DEFINITIONS, CATEGORY_LABELS, CATEGORY_COLORS } from '../constants/agents';
import { MODEL_BADGES } from '../constants/agents';

const grouped = AGENT_DEFINITIONS.reduce<Record<string, typeof AGENT_DEFINITIONS>>((acc, agent) => {
  if (!acc[agent.category]) acc[agent.category] = [];
  acc[agent.category].push(agent);
  return acc;
}, {});

const categories = Object.keys(grouped);

export default function Sidebar() {
  const onDragStart = (event: DragEvent, agentType: string) => {
    event.dataTransfer.setData('application/agentType', agentType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 h-full bg-[#1e293b] border-r border-slate-700 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Agents</h2>
        <p className="text-[11px] text-slate-500 mt-1">Drag to canvas to add</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: CATEGORY_COLORS[cat] }}
              />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            </div>
            <div className="space-y-1">
              {grouped[cat].map((agent) => {
                const badge = MODEL_BADGES[agent.defaultModel];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0f172a] border border-slate-700 cursor-grab hover:border-slate-500 hover:bg-slate-800 transition-colors active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => onDragStart(e, agent.id)}
                    title={agent.description}
                  >
                    <span className="text-xs text-slate-300 truncate mr-2">
                      {agent.label}
                    </span>
                    <span
                      className="text-[9px] font-medium px-1 py-0.5 rounded whitespace-nowrap"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
