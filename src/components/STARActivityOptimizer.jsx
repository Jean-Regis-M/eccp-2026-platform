import React, { useState } from 'react';

export function STARActivityOptimizer() {
  const [situation, setSituation] = useState('');
  const [action, setAction] = useState('');
  const [result, setResult] = useState('');

  // Auto-combining character count checking
  const combinedDesc = `${situation} ${action} ${result}`.trim();
  const maxChars = 150; // Common App activities constraint limit

  return (
    <div className="p-5 bg-slate-900 border border-slate-850 rounded-2xl space-y-4">
      <div>
        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-4 h-4 text-amber-400 animate-pulse">⭐</span>
          Common App Activities Optimizer (STAR)
        </h4>
        <p className="text-[11px] text-slate-400 font-medium">
          Draft high-impact activity descriptions under the precise 150-character Common App length limit.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Situation / Leadership Scope
          </label>
          <input
            type="text"
            placeholder="e.g., Led the student council technology club representing 200 scholars."
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Action / Initiative Taken
          </label>
          <input
            type="text"
            placeholder="e.g., Designed secure exam portal and trained 15 peer tutors."
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Measurable Outcome / Results achieved
          </label>
          <input
            type="text"
            placeholder="e.g., Decreased tutorial scheduling errors by 40% over 6 months."
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 focus:border-amber-500 rounded-xl p-2 text-xs text-slate-200 outline-none transition"
          />
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">
            Generated Description Output
          </span>
          <span className={`text-[10px] font-mono font-bold ${combinedDesc.length > maxChars ? 'text-rose-450' : 'text-emerald-400'}`}>
            {combinedDesc.length} / {maxChars} Characters
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium italic select-all cursor-pointer leading-relaxed">
          {combinedDesc || "Please start filling the fields above to output optimized activities descriptive sentence."}
        </p>
      </div>
    </div>
  );
}