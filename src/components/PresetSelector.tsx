import { useState, useRef, useEffect } from 'react';
import { PRESETS } from '../utils/presets';
import useFlowStore from '../store/useFlowStore';

export default function PresetSelector() {
  const [open, setOpen] = useState(false);
  const loadPreset = useFlowStore((s) => s.loadPreset);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      loadPreset(preset);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700/50 text-xs text-slate-300 hover:bg-slate-700 transition-colors border border-slate-600"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        Presets
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelect(preset.id)}
              className="w-full text-left px-3 py-2.5 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-b-0"
            >
              <div className="text-xs font-medium text-slate-200">{preset.name}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{preset.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
