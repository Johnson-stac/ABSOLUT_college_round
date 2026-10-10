import React, { useMemo, useRef, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertOctagon,
  Copy,
  Check
} from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { ClaimLegend } from './ClaimLegend';
import { validateAndAlignClaims, buildTextSegments } from '../../utils/claimOffsets';
import type { ClaimVerdict } from '../../types/audit';

export const AnnotatedAnswerReader: React.FC = () => {
  const { 
    currentSession, 
    selectedClaimId, 
    setSelectedClaimId, 
    claimFilter 
  } = useAudit();

  const [copiedAnswer, setCopiedAnswer] = React.useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const claimRefs = useRef<Map<string, HTMLElement>>(new Map());

  const originalText = currentSession.originalAnswer || '';
  const rawClaims = currentSession.verificationResult?.claims || [];

  // Align and validate claim character offsets
  const alignedClaims = useMemo(() => {
    return validateAndAlignClaims(originalText, rawClaims);
  }, [originalText, rawClaims]);

  // Build segmented render tokens
  const segments = useMemo(() => {
    return buildTextSegments(originalText, alignedClaims);
  }, [originalText, alignedClaims]);

  // Scroll active claim into view smoothly
  useEffect(() => {
    if (selectedClaimId) {
      const el = claimRefs.current.get(selectedClaimId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedClaimId]);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(originalText);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  // Previous and Next claim navigation
  const currentIndex = alignedClaims.findIndex(c => c.id === selectedClaimId);

  const handlePrev = () => {
    if (alignedClaims.length === 0) return;
    const nextIdx = currentIndex > 0 ? currentIndex - 1 : alignedClaims.length - 1;
    setSelectedClaimId(alignedClaims[nextIdx].id);
  };

  const handleNext = () => {
    if (alignedClaims.length === 0) return;
    const nextIdx = currentIndex < alignedClaims.length - 1 ? currentIndex + 1 : 0;
    setSelectedClaimId(alignedClaims[nextIdx].id);
  };

  // Helper styles based on verdict
  const getVerdictStyles = (verdict: ClaimVerdict, isSelected: boolean, isFilteredOut: boolean) => {
    if (isFilteredOut) {
      return 'opacity-35 grayscale-[50%] bg-slate-100 text-slate-500 border-slate-200';
    }

    switch (verdict) {
      case 'supported':
        return isSelected
          ? 'bg-emerald-100 text-emerald-950 border-b-2 border-emerald-600 ring-2 ring-emerald-500 ring-offset-1 shadow-xs'
          : 'bg-emerald-50/90 text-emerald-900 border-b-2 border-emerald-400 hover:bg-emerald-100/80';
      case 'refuted':
        return isSelected
          ? 'bg-rose-100 text-rose-950 border-b-2 border-rose-600 ring-2 ring-rose-500 ring-offset-1 shadow-xs'
          : 'bg-rose-50/90 text-rose-900 border-b-2 border-rose-400 hover:bg-rose-100/80';
      case 'insufficient_evidence':
        return isSelected
          ? 'bg-amber-100 text-amber-950 border-b-2 border-amber-600 ring-2 ring-amber-500 ring-offset-1 shadow-xs'
          : 'bg-amber-50/90 text-amber-900 border-b-2 border-amber-400 hover:bg-amber-100/80';
      case 'ambiguous':
        return isSelected
          ? 'bg-purple-100 text-purple-950 border-b-2 border-purple-600 ring-2 ring-purple-500 ring-offset-1 shadow-xs'
          : 'bg-purple-50/90 text-purple-900 border-b-2 border-purple-400 hover:bg-purple-100/80';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getVerdictIcon = (verdict: ClaimVerdict) => {
    switch (verdict) {
      case 'supported':
        return <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0 inline ml-1" />;
      case 'refuted':
        return <XCircle className="w-3 h-3 text-rose-700 shrink-0 inline ml-1" />;
      case 'insufficient_evidence':
        return <HelpCircle className="w-3 h-3 text-amber-700 shrink-0 inline ml-1" />;
      case 'ambiguous':
        return <AlertOctagon className="w-3 h-3 text-purple-700 shrink-0 inline ml-1" />;
    }
  };

  return (
    <div className="surface-card rounded-xl p-5 sm:p-6 bg-white border border-slate-200 flex flex-col h-full">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-base font-bold text-slate-900 m-0">
              Annotated AI-Generated Answer
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any highlighted statement to inspect primary evidence and citations.
          </p>
        </div>

        {/* Claim Navigation Controls & Copy */}
        <div className="flex items-center gap-2">
          {alignedClaims.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-xs font-medium text-slate-700">
              <button
                onClick={handlePrev}
                title="Previous claim (Left arrow)"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono font-semibold">
                {currentIndex !== -1 ? `C${currentIndex + 1} of ${alignedClaims.length}` : `${alignedClaims.length} claims`}
              </span>
              <button
                onClick={handleNext}
                title="Next claim (Right arrow)"
                className="p-1 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopyAnswer}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {copiedAnswer ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAnswer ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4">
        <ClaimLegend />
      </div>

      {/* Main Annotated Text Reader Body */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto pr-2 font-sans text-sm sm:text-base leading-relaxed text-slate-800 whitespace-pre-wrap selection:bg-blue-100 min-h-[380px]"
      >
        {segments.map((segment) => {
          if (segment.type === 'text') {
            return (
              <span key={segment.key} className="text-slate-800">
                {segment.content}
              </span>
            );
          }

          const claim = segment.claim;
          const isSelected = claim.id === selectedClaimId;
          const isFilteredOut = claimFilter !== 'all' && claim.verdict !== claimFilter;
          const verdictStyles = getVerdictStyles(claim.verdict, isSelected, isFilteredOut);

          return (
            <mark
              key={segment.key}
              ref={(el) => {
                if (el) claimRefs.current.set(claim.id, el);
                else claimRefs.current.delete(claim.id);
              }}
              tabIndex={0}
              role="button"
              aria-label={`Claim C${claim.claimNumber}: ${claim.verdict}. ${claim.text}`}
              onClick={() => setSelectedClaimId(claim.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedClaimId(claim.id);
                }
              }}
              title={`C${claim.claimNumber} • ${claim.verdict.toUpperCase()}${claim.confidence ? ` (${Math.round(claim.confidence * 100)}% conf)` : ''} - Click to inspect`}
              className={`
                relative inline rounded-sm px-1 py-0.5 mx-0.5 transition-all duration-150 cursor-pointer outline-none group
                ${verdictStyles}
              `}
            >
              {/* Claim Number Badge */}
              <span className={`
                inline-flex items-center text-[10px] font-mono font-bold px-1 py-0.2 rounded mr-1 align-baseline
                ${claim.verdict === 'supported' ? 'bg-emerald-200 text-emerald-800' : ''}
                ${claim.verdict === 'refuted' ? 'bg-rose-200 text-rose-800' : ''}
                ${claim.verdict === 'insufficient_evidence' ? 'bg-amber-200 text-amber-800' : ''}
                ${claim.verdict === 'ambiguous' ? 'bg-purple-200 text-purple-800' : ''}
              `}>
                C{claim.claimNumber}
              </span>

              {/* The Text */}
              <span>{claim.text}</span>

              {/* Status Icon */}
              {getVerdictIcon(claim.verdict)}
            </mark>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Preserved verbatim with exact character alignment.</span>
        <span>Keyboard: Enter / Space to inspect claim</span>
      </div>
    </div>
  );
};
