import { useState } from 'react';
import useFlowStore from '../store/useFlowStore';
import PresetSelector from './PresetSelector';
import ExportModal from './ExportModal';
import SaveLoadDialog from './SaveLoadDialog';
import RunPanel from './RunPanel';
import GeneratorModal from './GeneratorModal';

export default function Toolbar() {
  const { nodes, clear } = useFlowStore();
  const [exportOpen, setExportOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  return (
    <>
      <div className="h-12 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-bold text-slate-200">Pipeline Editor</span>
          </div>
          <span className="text-[10px] text-slate-600 hidden sm:inline">Agent Pipeline Visual Designer</span>
        </div>

        {/* Center: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGenOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/30 transition-colors border border-amber-500/30"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Generate
          </button>

          <PresetSelector />

          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700/50 text-xs text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Save
          </button>

          <button
            onClick={() => setLoadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700/50 text-xs text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Load
          </button>

          <button
            onClick={() => setExportOpen(true)}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>

          <button
            onClick={() => setRunOpen(true)}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500/20 text-xs text-green-300 hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Run
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1" />

          <button
            onClick={clear}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>

        {/* Right: Node count */}
        <div className="text-[11px] text-slate-500">
          {nodes.length} node{nodes.length !== 1 ? 's' : ''}
        </div>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <SaveLoadDialog open={saveOpen} onClose={() => setSaveOpen(false)} mode="save" />
      <SaveLoadDialog open={loadOpen} onClose={() => setLoadOpen(false)} mode="load" />
      <RunPanel open={runOpen} onClose={() => setRunOpen(false)} />
      <GeneratorModal open={genOpen} onClose={() => setGenOpen(false)} />
    </>
  );
}
