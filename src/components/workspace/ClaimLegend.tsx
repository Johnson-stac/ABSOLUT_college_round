import React from 'react';


export const ClaimLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Verdict Legend:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        {/* Supported / Factual */}
        <div className="flex items-center gap-1.5" title="Evidence directly corroborates the claim.">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs ring-2 ring-emerald-100" />
          <span className="font-semibold text-emerald-900">Supported</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">(Factual)</span>
        </div>

        {/* Refuted / Non-factual */}
        <div className="flex items-center gap-1.5" title="Evidence explicitly contradicts or refutes the claim.">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-100" />
          <span className="font-semibold text-rose-900">Refuted</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">(Non-factual)</span>
        </div>

        {/* Insufficient Evidence */}
        <div className="flex items-center gap-1.5" title="Supplied documents do not contain enough data to verify or disprove.">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs ring-2 ring-amber-100" />
          <span className="font-semibold text-amber-900">Insufficient Evidence</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">(Unverified)</span>
        </div>

        {/* Ambiguous / Conflicting */}
        <div className="flex items-center gap-1.5" title="Sources disagree or evidence contains unresolved ambiguity.">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs ring-2 ring-purple-100" />
          <span className="font-semibold text-purple-900">Ambiguous</span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">(Conflicting sources)</span>
        </div>
      </div>
    </div>
  );
};
