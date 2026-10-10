import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertOctagon, 
  Copy, 
  Check, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  ShieldAlert, 
  BookOpen,
  BrainCircuit,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { EvidenceExcerpt } from '../../types/audit';

interface ClaimEvidenceInspectorProps {
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

export const ClaimEvidenceInspector: React.FC<ClaimEvidenceInspectorProps> = ({ 
  isMobileModal, 
  onCloseMobile 
}) => {
  const { 
    currentSession, 
    selectedClaimId, 
    goToNextClaim,
    goToPrevClaim
  } = useAudit();

  const [copiedClaim, setCopiedClaim] = useState(false);
  const [copiedEvidenceId, setCopiedEvidenceId] = useState<string | null>(null);

  const claims = currentSession.verificationResult?.claims || [];
  const selectedClaim = claims.find(c => c.id === selectedClaimId) || claims[0];

  const handleCopyClaim = () => {
    if (!selectedClaim) return;
    navigator.clipboard.writeText(selectedClaim.text);
    setCopiedClaim(true);
    setTimeout(() => setCopiedClaim(false), 2000);
  };

  const handleCopyEvidence = (ev: EvidenceExcerpt) => {
    navigator.clipboard.writeText(`"${ev.text}" — Source: ${ev.source.documentName} (Page ${ev.source.pageNumber || 1})`);
    setCopiedEvidenceId(ev.id);
    setTimeout(() => setCopiedEvidenceId(null), 2000);
  };

  const currentIndex = claims.findIndex(c => c.id === selectedClaim?.id);

  if (!selectedClaim) {
    return (
      <div className="surface-card rounded-2xl p-8 bg-white border border-slate-200/90 flex flex-col items-center justify-center text-center h-full text-slate-400">
        <BookOpen className="w-10 h-10 text-slate-300 mb-3 stroke-[1.5]" />
        <h4 className="text-sm font-semibold text-slate-700 m-0">No Claim Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click any highlighted statement in the answer reader to inspect citations, reasoning checks, and source passages.
        </p>
      </div>
    );
  }

  const getVerdictBadge = () => {
    switch (selectedClaim.verdict) {
      case 'supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>SUPPORTED</span>
          </span>
        );
      case 'refuted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>REFUTED</span>
          </span>
        );
      case 'insufficient_evidence':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>INSUFFICIENT EVIDENCE</span>
          </span>
        );
      case 'ambiguous':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <AlertOctagon className="w-3.5 h-3.5 text-purple-700" />
            <span>AMBIGUOUS</span>
          </span>
        );
    }
  };

  const getErrorCategoryBadge = () => {
    if (!selectedClaim.errorCategory || selectedClaim.errorCategory === 'none') return null;

    switch (selectedClaim.errorCategory) {
      case 'hallucinated_fact':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Hallucinated Fact</span>
          </span>
        );
      case 'logical_inconsistency':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <BrainCircuit className="w-3 h-3 text-indigo-600" />
            <span>Logical Inconsistency</span>
          </span>
        );
      case 'unsafe_recommendation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-red-600" />
            <span>Unsafe Recommendation</span>
          </span>
        );
      case 'unsupported_claim':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>Unsupported Scope</span>
          </span>
        );
      default:
        return null;
    }
  };

  const hasSupporting = selectedClaim.supportingEvidence && selectedClaim.supportingEvidence.length > 0;
  const hasContradicting = selectedClaim.contradictingEvidence && selectedClaim.contradictingEvidence.length > 0;

  return (
    <div className={`
      surface-card rounded-2xl bg-white border border-slate-200/90 flex flex-col h-full overflow-hidden shadow-xs
      ${isMobileModal ? 'fixed inset-4 z-50 shadow-2xl max-w-xl mx-auto my-auto max-h-[90vh]' : ''}
    `}>
      {/* Header with Claim Index, Verdict, and Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
            Claim C{selectedClaim.claimNumber}
          </span>
          {getVerdictBadge()}
          {getErrorCategoryBadge()}
        </div>

        {/* Prev / Next / Close controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevClaim}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Previous claim"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono px-1">
            {currentIndex + 1}/{claims.length}
          </span>
          <button
            onClick={goToNextClaim}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Next claim"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {isMobileModal && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 ml-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* 1. Exact Claim Text Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 relative group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>Statement Extracted from AI Output</span>
            <button
              onClick={handleCopyClaim}
              className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {copiedClaim ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              <span>{copiedClaim ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed m-0 italic font-sans">
            "{selectedClaim.text}"
          </p>
        </div>

        {/* 2. Safety Risk Alert (if critical or moderate) */}
        {selectedClaim.safetyRisk && selectedClaim.safetyRisk !== 'none' && (
          <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
            selectedClaim.safetyRisk === 'critical' 
              ? 'bg-rose-50/90 border-rose-300 text-rose-950' 
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}>
            <ShieldAlert className={`w-4 h-4 shrink-0 mt-0.5 ${
              selectedClaim.safetyRisk === 'critical' ? 'text-rose-600' : 'text-amber-600'
            }`} />
            <div>
              <span className="font-bold uppercase tracking-wider text-[11px] block">
                {selectedClaim.safetyRisk} Risk Alert: {selectedClaim.errorCategory === 'unsafe_recommendation' ? 'Potentially Hazardous Instruction' : 'High Risk Error'}
              </span>
              <p className="m-0 mt-0.5 text-xs opacity-90 leading-normal">
                This claim contains actionable statements that violate ground truth standards or guidance. It must not be deployed without correction.
              </p>
            </div>
          </div>
        )}

        {/* 3. Reasoning Consistency Analysis */}
        {selectedClaim.reasoningCheck?.hasLogicalFlaw && (
          <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/90 text-xs text-indigo-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-900">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <span>Reasoning Consistency Check: {selectedClaim.reasoningCheck.flawType?.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <p className="m-0 text-indigo-900/90 leading-normal">
              {selectedClaim.reasoningCheck.explanation || 'The conclusion stated does not logically follow from the provided evidence premises.'}
            </p>
          </div>
        )}

        {/* 4. Confidence-Calibrated Reporting */}
        {selectedClaim.confidenceCalibration && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                <span>Confidence Calibration</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {Math.round(selectedClaim.confidenceCalibration.score * 100)}% Certainty
              </span>
            </div>
            {/* Uncertainty Interval bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${selectedClaim.confidenceCalibration.score * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Bound: {selectedClaim.confidenceCalibration.uncertaintyInterval[0]}</span>
                <span className="capitalize">{selectedClaim.confidenceCalibration.calibrationLevel.replace(/_/g, ' ')}</span>
                <span>Upper: {selectedClaim.confidenceCalibration.uncertaintyInterval[1]}</span>
              </div>
            </div>
            {selectedClaim.confidenceCalibration.epistemicCaveat && (
              <p className="text-[11px] text-slate-500 m-0 italic">
                {selectedClaim.confidenceCalibration.epistemicCaveat}
              </p>
            )}
          </div>
        )}

        {/* 5. Verdict Explanation */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0">
            Evidential Justification
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 m-0">
            {selectedClaim.explanation}
          </p>
        </div>

        {/* 6. Insufficient Reason if applicable */}
        {selectedClaim.verdict === 'insufficient_evidence' && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Evidence Boundary Notice</span>
            </div>
            <p className="m-0 leading-normal text-amber-800">
              {selectedClaim.insufficientReason || 'The supplied documents do not contain direct or inferable evidence to substantiate or disprove this statement.'}
            </p>
          </div>
        )}

        {/* 7. Ambiguity Notice */}
        {selectedClaim.verdict === 'ambiguous' && selectedClaim.ambiguityReason && (
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-purple-600" />
              <span>Source Ambiguity Notice</span>
            </div>
            <p className="m-0 leading-normal text-purple-800">
              {selectedClaim.ambiguityReason}
            </p>
          </div>
        )}

        {/* 8. Contradicting Evidence Excerpts */}
        {hasContradicting && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Contradicting Ground Truth ({selectedClaim.contradictingEvidence.length})</span>
            </h4>

            {selectedClaim.contradictingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-rose-200/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium text-rose-900">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-semibold">{ev.source.documentName}</span>
                    {ev.source.pageNumber && (
                      <span className="text-[11px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                        Page {ev.source.pageNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.source.relevanceScore && (
                      <span className="text-[10px] font-mono text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded font-bold">
                        {Math.round(ev.source.relevanceScore * 100)}% match
                      </span>
                    )}
                    <button
                      onClick={() => handleCopyEvidence(ev)}
                      className="text-rose-700 hover:text-rose-900 p-1 rounded hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Copy citation"
                    >
                      {copiedEvidenceId === ev.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <blockquote className="m-0 pl-3 border-l-2 border-rose-400 font-mono text-xs text-rose-950 leading-relaxed whitespace-pre-wrap">
                  "{ev.text}"
                </blockquote>

                {ev.source.section && (
                  <div className="text-[11px] text-rose-700">
                    Section: <span className="font-medium text-rose-900">{ev.source.section}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 9. Supporting Evidence Excerpts */}
        {hasSupporting && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Supporting Ground Truth ({selectedClaim.supportingEvidence.length})</span>
            </h4>

            {selectedClaim.supportingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-emerald-200/60 pb-2">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-900">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold">{ev.source.documentName}</span>
                    {ev.source.pageNumber && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                        Page {ev.source.pageNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.source.relevanceScore && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-bold">
                        {Math.round(ev.source.relevanceScore * 100)}% match
                      </span>
                    )}
                    <button
                      onClick={() => handleCopyEvidence(ev)}
                      className="text-emerald-700 hover:text-emerald-900 p-1 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                      title="Copy citation"
                    >
                      {copiedEvidenceId === ev.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <blockquote className="m-0 pl-3 border-l-2 border-emerald-400 font-mono text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  "{ev.text}"
                </blockquote>

                {ev.source.section && (
                  <div className="text-[11px] text-emerald-700">
                    Section: <span className="font-medium text-emerald-900">{ev.source.section}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 10. Fallback when no direct quotes */}
        {!hasSupporting && !hasContradicting && (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500 space-y-1">
            <ShieldAlert className="w-5 h-5 text-slate-400 mx-auto" />
            <p className="font-semibold text-slate-700 m-0">No Direct Document Citations</p>
            <p className="text-[11px] text-slate-400 m-0">
              The verification model did not locate supporting or refuting excerpts for this statement in the uploaded PDF.
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={goToPrevClaim}
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Claim</span>
        </button>

        <span className="font-mono text-[11px]">
          Claim {currentIndex + 1} of {claims.length}
        </span>

        <button
          onClick={goToNextClaim}
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <span>Next Claim</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
