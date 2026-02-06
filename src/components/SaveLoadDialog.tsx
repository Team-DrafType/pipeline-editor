import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import useFlowStore from '../store/useFlowStore';

interface SaveLoadDialogProps {
  open: boolean;
  onClose: () => void;
  mode: 'save' | 'load';
}

export default function SaveLoadDialog({ open, onClose, mode }: SaveLoadDialogProps) {
  const { nodes, edges, setNodes, setEdges } = useFlowStore();
  const { getSavedPipelines, savePipeline, deletePipeline } = useLocalStorage();
  const [saveName, setSaveName] = useState('');
  const [saved, setSaved] = useState(false);

  if (!open) return null;

  const pipelines = getSavedPipelines();

  const handleSave = () => {
    if (!saveName.trim()) return;
    savePipeline(saveName.trim(), nodes, edges);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  const handleLoad = (id: string) => {
    const pipeline = pipelines.find((p) => p.id === id);
    if (!pipeline) return;
    setNodes(pipeline.nodes);
    setEdges(pipeline.edges);
    onClose();
  };

  const handleDelete = (id: string) => {
    deletePipeline(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[480px] max-h-[70vh] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-slate-200">
            {mode === 'save' ? 'Save Pipeline' : 'Load Pipeline'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Save input */}
        {mode === 'save' && (
          <div className="p-4 border-b border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter pipeline name..."
                className="flex-1 px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-4 py-2 rounded-md bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Pipeline list */}
        <div className="flex-1 overflow-y-auto">
          {pipelines.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No saved pipelines</p>
              <p className="text-[11px] text-slate-600 mt-1">
                {mode === 'save' ? 'Enter a name above to save' : 'Save a pipeline first'}
              </p>
            </div>
          ) : (
            pipelines.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <div
                  className={mode === 'load' ? 'cursor-pointer flex-1' : 'flex-1'}
                  onClick={() => mode === 'load' && handleLoad(p.id)}
                >
                  <div className="text-xs font-medium text-slate-200">{p.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(p.timestamp).toLocaleString()} &middot; {p.nodes.length} nodes
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="ml-2 p-1 text-slate-600 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
