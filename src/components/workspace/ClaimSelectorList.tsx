import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertOctagon
} from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import type { ClaimVerdict } from '../../types/audit';


export const ClaimSelectorList: React.FC = () => {
  const { 
    currentSession, 
    selectedClaimId, 
    setSelectedClaimId, 
    claimFilter 
  } = useAudit();

  const claims = currentSession.verificationResult?.claims || [];

  const filteredClaims = claims.filter(c => {
    if (claimFilter === 'all') return true;
    return c.verdict === claimFilter;
  });

  const getVerdictIcon = (verdict: ClaimVerdict) => {
    switch (verdict) {
      case 'supported':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'refuted':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'insufficient_evidence':
        return <HelpCircle className="w-3.5 h-3.5 text-amber-600" />;
      case 'ambiguous':
        return <AlertOctagon className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  const getVerdictBadge = (verdict: ClaimVerdict) => {
    switch (verdict) {
      case 'supported':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
            SUPPORTED
          </span>
        );
      case 'refuted':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800">
            REFUTED
          </span>
        );
      case 'insufficient_evidence':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
            INSUFFICIENT
          </span>
        );
      case 'ambiguous':
        return (
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800">
            AMBIGUOUS
          </span>
        );
    }
  };

  if (claims.length === 0) {
    return null;
  }

  return (
    <div className="surface-card rounded-xl p-4 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Claims Index ({filteredClaims.length} of {claims.length})
        </span>
        <span className="text-[11px] text-slate-400">
          Click any claim to jump & inspect
        </span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {filteredClaims.map((claim) => {
          const isSelected = claim.id === selectedClaimId;
          const evCount = claim.supportingEvidence.length + claim.contradictingEvidence.length;

          return (
            <button
              key={claim.id}
              onClick={() => setSelectedClaimId(claim.id)}
              className={`
                w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3
                ${isSelected 
                  ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400 shadow-2xs' 
                  : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200/80'
                }
              `}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                  C{claim.claimNumber}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {getVerdictBadge(claim.verdict)}
                    {evCount > 0 && (
                      <span className="text-[10px] text-slate-400">
                        • {evCount} citation{evCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 font-medium truncate m-0">
                    {claim.text}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center">
                {getVerdictIcon(claim.verdict)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
