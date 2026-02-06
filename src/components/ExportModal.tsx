import { useState } from 'react';
import useFlowStore from '../store/useFlowStore';
import { analyzeGraph } from '../utils/graphAnalyzer';
import { exportToPrompt } from '../utils/exportPrompt';
import { exportToJsonString } from '../utils/exportJson';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const { nodes, edges } = useFlowStore();
  const [tab, setTab] = useState<'prompt' | 'json'>('prompt');
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('My Pipeline');

  if (!open) return null;

  const steps = analyzeGraph(nodes, edges);
  const output = tab === 'prompt' ? exportToPrompt(steps, name) : exportToJsonString(steps, name);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[640px] max-h-[80vh] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-sm font-bold text-slate-200">Export Pipeline</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pipeline name */}
        <div className="px-4 pt-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pipeline name"
            className="w-full px-3 py-2 rounded-md bg-[#0f172a] border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          <button
            onClick={() => setTab('prompt')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'prompt' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            Prompt Text
          </button>
          <button
            onClick={() => setTab('json')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === 'json' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            JSON
          </button>
        </div>

        {/* Output */}
        <div className="flex-1 p-4 overflow-hidden">
          <pre className="h-full min-h-[200px] max-h-[400px] overflow-auto p-4 rounded-lg bg-[#0f172a] border border-slate-700 text-xs text-slate-300 font-mono whitespace-pre-wrap">
            {output}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700">
          <span className="text-[11px] text-slate-500">
            {steps.length} step{steps.length !== 1 ? 's' : ''} / {nodes.length} agent{nodes.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-md bg-indigo-500 text-white text-xs font-medium hover:bg-indigo-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
