import React, { useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  CheckCircle2
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { AnswerEditor } from '../components/workspace/AnswerEditor';
import { DocumentUploadZone } from '../components/workspace/DocumentUploadZone';
import { animatePageEntry } from '../utils/animations';

export const NewAuditView: React.FC = () => {
  const { currentSession, setScreen } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const hasValidAnswer = currentSession.wordCount >= 10;
  const hasReadyDocument = currentSession.documents.some(d => d.status === 'ready');
  const canProceed = hasValidAnswer && hasReadyDocument;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Title & Explanation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700 uppercase tracking-wider">
              Phase 1 Intake Workflow
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs text-slate-500 font-medium">Dual-Stream Evidence Grounding</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
            Intake & Evidence Alignment
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-normal">
            Input the AI-generated answer alongside supporting ground-truth PDF documentation. SecondOpinion establishes sentence-level claims and parses source evidence before performing verification.
          </p>
        </div>
      </div>

      {/* Main 2-Input Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Column 1: AI Generated Output */}
        <div className="h-full">
          <AnswerEditor />
        </div>

        {/* Column 2: Supporting Documents */}
        <div className="h-full">
          <DocumentUploadZone />
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-4 border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Readiness Checklist */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium w-full sm:w-auto">
          <div className="flex items-center gap-2">
            {hasValidAnswer ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
            )}
            <span className={hasValidAnswer ? 'text-slate-800' : 'text-slate-400'}>
              AI Answer ({currentSession.wordCount}/10 words)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {hasReadyDocument ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
            )}
            <span className={hasReadyDocument ? 'text-slate-800' : 'text-slate-400'}>
              Evidence Source ({currentSession.documents.filter(d => d.status === 'ready').length} ready)
            </span>
          </div>
        </div>

        {/* Proceed Action Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {!canProceed && (
            <span className="text-xs text-slate-400 hidden md:inline">
              Add both answer and PDF to proceed
            </span>
          )}

          <button
            onClick={() => setScreen('workspace')}
            disabled={!canProceed}
            className={`
              w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer
              ${canProceed 
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-blue-500/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }
            `}
          >
            <span>Proceed to Audit Workspace</span>
            <ArrowRight className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
