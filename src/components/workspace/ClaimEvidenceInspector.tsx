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
  BookOpen
} from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
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
    setSelectedClaimId 
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

  // Previous and Next claim navigation
  const currentIndex = claims.findIndex(c => c.id === selectedClaim?.id);
  const handlePrev = () => {
    if (claims.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : claims.length - 1;
    setSelectedClaimId(claims[prevIdx].id);
  };

  const handleNext = () => {
    if (claims.length === 0) return;
    const nextIdx = currentIndex < claims.length - 1 ? currentIndex + 1 : 0;
    setSelectedClaimId(claims[nextIdx].id);
  };

  if (!selectedClaim) {
    return (
      <div className="surface-card rounded-xl p-8 bg-white border border-slate-200 flex flex-col items-center justify-center text-center h-full text-slate-400">
        <BookOpen className="w-10 h-10 text-slate-300 mb-3 stroke-[1.5]" />
        <h4 className="text-sm font-semibold text-slate-700 m-0">No Claim Selected</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Click any highlighted statement in the answer reader to inspect citations and supporting evidence.
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
            <span>SUPPORTED (FACTUAL)</span>
          </span>
        );
      case 'refuted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>REFUTED (CONTRADICTED)</span>
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
            <span>AMBIGUOUS / CONFLICTING</span>
          </span>
        );
    }
  };

  const hasSupporting = selectedClaim.supportingEvidence && selectedClaim.supportingEvidence.length > 0;
  const hasContradicting = selectedClaim.contradictingEvidence && selectedClaim.contradictingEvidence.length > 0;

  return (
    <div className={`
      surface-card rounded-xl bg-white border border-slate-200 flex flex-col h-full overflow-hidden
      ${isMobileModal ? 'fixed inset-4 z-50 shadow-2xl max-w-xl mx-auto my-auto max-h-[90vh]' : ''}
    `}>
      {/* Header with Claim Index, Verdict, and Prev/Next */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
            Claim C{selectedClaim.claimNumber}
          </span>
          {getVerdictBadge()}
          {selectedClaim.confidence !== undefined && (
            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
              {Math.round(selectedClaim.confidence * 100)}% Confidence
            </span>
          )}
        </div>

        {/* Prev / Next / Close controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Previous claim"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400 font-mono px-1">
            {currentIndex + 1}/{claims.length}
          </span>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Next claim"
          >
            <ArrowRight className="w-4 h-4" />
          </button>

          {isMobileModal && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 ml-2 rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* 1. Exact Claim Text Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 relative group">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            <span>Statement Extracted from AI Output</span>
            <button
              onClick={handleCopyClaim}
              className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              {copiedClaim ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedClaim ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-sm font-medium text-slate-900 leading-relaxed m-0 italic font-sans">
            "{selectedClaim.text}"
          </p>
        </div>

        {/* 2. Model Verification Verdict & Explanation */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
            <span>Verdict Assessment & Synthesis</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 m-0">
            {selectedClaim.explanation}
          </p>
        </div>

        {/* 3. Reason for Insufficient Evidence if applicable */}
        {selectedClaim.verdict === 'insufficient_evidence' && (
          <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Evidence Limitation Notice</span>
            </div>
            <p className="m-0 leading-normal text-amber-800">
              {selectedClaim.insufficientReason || 'The supplied documents do not contain direct or inferable evidence to substantiate or disprove this statement.'}
            </p>
          </div>
        )}

        {/* 4. Ambiguity / Conflict Reason if applicable */}
        {selectedClaim.verdict === 'ambiguous' && selectedClaim.ambiguityReason && (
          <div className="p-3.5 rounded-lg bg-purple-50/80 border border-purple-200 text-xs text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-purple-600" />
              <span>Source Ambiguity Notice</span>
            </div>
            <p className="m-0 leading-normal text-purple-800">
              {selectedClaim.ambiguityReason}
            </p>
          </div>
        )}

        {/* 5. Contradicting Evidence Excerpts (Red Alert) */}
        {hasContradicting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Contradicting Evidence ({selectedClaim.contradictingEvidence.length})</span>
              </h4>
            </div>

            {selectedClaim.contradictingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 shadow-2xs space-y-2.5"
              >
                {/* Source Metadata Banner */}
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

                {/* Excerpt Quote */}
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

        {/* 6. Supporting Evidence Excerpts (Green) */}
        {hasSupporting && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider m-0 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Supporting Evidence ({selectedClaim.supportingEvidence.length})</span>
              </h4>
            </div>

            {selectedClaim.supportingEvidence.map((ev) => (
              <div 
                key={ev.id}
                className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-2.5"
              >
                {/* Source Metadata Banner */}
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

                {/* Excerpt Quote */}
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

        {/* 7. Clear indication when no reliable evidence was found */}
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
      <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous Claim</span>
        </button>

        <span className="font-mono text-[11px]">
          Claim {currentIndex + 1} of {claims.length}
        </span>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <span>Next Claim</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
