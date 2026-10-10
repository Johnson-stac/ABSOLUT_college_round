import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Cpu, 
  Loader2,
  Filter,
  Sparkles,
  Clock
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { ClaimFilterType } from '../../context/auditContextDef';

export const ClaimNavigationHeader: React.FC = () => {
  const { 
    currentSession, 
    claimFilter, 
    setClaimFilter, 
    isVerifying, 
    runVerification,
    openCorrectionModal,
    setScreen
  } = useAudit();

  const result = currentSession.verificationResult;
  const claims = result?.claims || [];
  const summary = result?.summary;

  const totalCount = claims.length;
  const supportedCount = summary?.supportedCount ?? claims.filter(c => c.verdict === 'supported').length;
  const refutedCount = summary?.refutedCount ?? claims.filter(c => c.verdict === 'refuted').length;
  const insufficientCount = summary?.insufficientCount ?? claims.filter(c => c.verdict === 'insufficient_evidence').length;
  const ambiguousCount = summary?.ambiguousCount ?? claims.filter(c => c.verdict === 'ambiguous').length;

  const hallucinationsCount = summary?.hallucinationsCount ?? claims.filter(c => c.errorCategory === 'hallucinated_fact').length;
  const reasoningCount = summary?.logicalInconsistenciesCount ?? claims.filter(c => c.reasoningCheck?.hasLogicalFlaw || c.errorCategory === 'logical_inconsistency').length;
  const safetyCount = summary?.unsafeRecommendationsCount ?? claims.filter(c => c.safetyRisk === 'critical' || c.safetyRisk === 'moderate' || c.errorCategory === 'unsafe_recommendation').length;

  const filterButtons: { id: ClaimFilterType; label: string; count: number; activeClass: string }[] = [
    { id: 'all', label: 'All Claims', count: totalCount, activeClass: 'bg-slate-900 text-white' },
    { id: 'supported', label: 'Supported', count: supportedCount, activeClass: 'bg-emerald-600 text-white' },
    { id: 'refuted', label: 'Refuted', count: refutedCount, activeClass: 'bg-rose-600 text-white' },
    { id: 'insufficient_evidence', label: 'Insufficient Evidence', count: insufficientCount, activeClass: 'bg-amber-600 text-white' },
  ];

  if (ambiguousCount > 0) {
    filterButtons.push({
      id: 'ambiguous',
      label: 'Ambiguous',
      count: ambiguousCount,
      activeClass: 'bg-purple-600 text-white',
    });
  }

  if (hallucinationsCount > 0) {
    filterButtons.push({
      id: 'hallucinations',
      label: 'Hallucinations',
      count: hallucinationsCount,
      activeClass: 'bg-rose-700 text-white ring-2 ring-rose-300',
    });
  }

  if (reasoningCount > 0) {
    filterButtons.push({
      id: 'reasoning_flaws',
      label: 'Logic Flaws',
      count: reasoningCount,
      activeClass: 'bg-indigo-600 text-white ring-2 ring-indigo-300',
    });
  }

  if (safetyCount > 0) {
    filterButtons.push({
      id: 'safety_risks',
      label: 'Safety Risks',
      count: safetyCount,
      activeClass: 'bg-red-600 text-white ring-2 ring-red-300 animate-pulse',
    });
  }

  const getOverallBadge = () => {
    if (!result) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Audit Pending</span>
        </span>
      );
    }

    if (safetyCount > 0 || (summary?.refutedCount && summary.refutedCount > 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Critical Discrepancies ({summary?.refutedCount || 0} refuted{safetyCount > 0 ? `, ${safetyCount} safety alerts` : ''})</span>
        </span>
      );
    }

    if (summary?.insufficientCount && summary.insufficientCount > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Verified with Caveats</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>100% Evidence Grounded</span>
      </span>
    );
  };

  return (
    <div className="surface-card rounded-2xl p-5 bg-white border border-slate-200/90 shadow-xs space-y-4">
      {/* Top Row: Overall Statistics & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">Claim Verification Status</h3>
          </div>
          {getOverallBadge()}

          {summary && (
            <span className="text-xs text-slate-500 font-medium">
              Factual Grounding Score: <strong className="text-slate-800 font-semibold">{summary.truthfulnessScore}%</strong>
            </span>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {result && (
            <button
              onClick={openCorrectionModal}
              disabled={isVerifying}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="Generate evidence-grounded corrected answer powered by Google Gemini"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentSession.correctionResult ? 'Re-generate with Gemini' : 'Generate Corrected Answer'}</span>
            </button>
          )}

          {currentSession.correctionResult && (
            <button
              onClick={() => setScreen('correction')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View Corrected Result</span>
            </button>
          )}

          <button
            onClick={runVerification}
            disabled={isVerifying || currentSession.documents.length === 0}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-slate-500" />
                <span>{result ? 'Re-run Verification' : 'Run Claim Verification'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statistics Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block">Total Claims</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">{totalCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
          <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Supported</span>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">{supportedCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
          <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">Refuted</span>
          <div className="text-xl font-bold text-rose-900 mt-0.5">{refutedCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
          <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">Insufficient</span>
          <div className="text-xl font-bold text-amber-900 mt-0.5">{insufficientCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-rose-100/60 border border-rose-300/70">
          <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-wider block">Hallucinations</span>
          <div className="text-xl font-bold text-rose-950 mt-0.5">{hallucinationsCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
          <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider block">Logic Flaws</span>
          <div className="text-xl font-bold text-indigo-900 mt-0.5">{reasoningCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/70">
          <span className="text-[10px] font-semibold text-red-700 uppercase tracking-wider block">Safety Risks</span>
          <div className="text-xl font-bold text-red-900 mt-0.5">{safetyCount}</div>
        </div>
      </div>

      {/* Filter Buttons Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Claims:</span>
        </span>

        {filterButtons.map((btn) => {
          const isActive = claimFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setClaimFilter(btn.id)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5
                ${isActive 
                  ? `${btn.activeClass} shadow-xs font-semibold` 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }
              `}
            >
              <span>{btn.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {btn.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
