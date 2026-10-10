import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { ClaimNavigationHeader } from '../components/workspace/ClaimNavigationHeader';
import { AnnotatedAnswerReader } from '../components/workspace/AnnotatedAnswerReader';
import { ClaimEvidenceInspector } from '../components/workspace/ClaimEvidenceInspector';
import { ClaimSelectorList } from '../components/workspace/ClaimSelectorList';
import { ExtractedTextModal } from '../components/workspace/ExtractedTextModal';
import { animatePageEntry } from '../utils/animations';
import { CorrectionResultView } from '../components/workspace/CorrectionResultView';
import { GenerateCorrectionModal } from '../components/workspace/GenerateCorrectionModal';

export const AuditWorkspaceView: React.FC = () => {
  const { 
    currentSession, 
    setScreen, 
    createNewSession, 
    selectedClaimId, 
    isVerifying,
    runVerification,
    openCorrectionModal
  } = useAudit();

  const containerRef = useRef<HTMLDivElement>(null);
  const [showRawPdfModal, setShowRawPdfModal] = useState(false);
  const [isMobileInspectorOpen, setIsMobileInspectorOpen] = useState(false);


  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  // If session has answer and documents but no verification result, auto-trigger verification
  useEffect(() => {
    if (
      currentSession.originalAnswer && 
      currentSession.documents.length > 0 && 
      !currentSession.verificationResult &&
      !isVerifying
    ) {
      runVerification();
    }
  }, [currentSession.originalAnswer, currentSession.documents.length, currentSession.verificationResult, isVerifying, runVerification]);

  // Open mobile drawer when claim is selected on small screens
  useEffect(() => {
    if (selectedClaimId && window.innerWidth < 1024) {
      setIsMobileInspectorOpen(true);
    }
  }, [selectedClaimId]);

  const activeDoc = currentSession.documents[0] || null;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <button
            onClick={() => setScreen('new-audit')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Intake Editor</span>
          </button>

          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
              {currentSession.title}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Phase 2 Audit Active
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Ground Truth: {currentSession.documents.map(d => d.name).join(', ') || 'No PDFs attached'}</span>
            <span>•</span>
            <span>{currentSession.wordCount} words</span>
            {currentSession.verificationResult?.isSimulated && (
              <>
                <span>•</span>
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Client Verification Simulation
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {currentSession.verificationResult && (
            <button
              onClick={openCorrectionModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentSession.correctionResult ? 'Re-generate Correction' : 'Correct with Gemini'}</span>
            </button>
          )}

          {currentSession.correctionResult && (
            <button
              onClick={() => setScreen('correction')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View Full Correction</span>
            </button>
          )}

          {activeDoc && (
            <button
              onClick={() => setShowRawPdfModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Inspect raw extracted PDF text"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Inspect Source PDF</span>
            </button>
          )}

          <button
            onClick={() => setScreen('new-audit')}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Edit Inputs
          </button>

          <button
            onClick={() => {
              createNewSession();
              setScreen('new-audit');
            }}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Verification Simulation Disclaimer Banner */}
      {currentSession.verificationResult?.isSimulated && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Integration Notice for Teammate: </span>
              <span>
                Displaying high-fidelity verification test data with exact character offset highlighting. The frontend is configured to call your live verification pipeline via <code className="bg-amber-100 px-1 py-0.2 rounded font-mono text-[11px]">POST /api/audits/verify</code>.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Phase 2 Claim Navigation & Metrics Header */}
      <ClaimNavigationHeader />

      {/* Main Split-Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Original AI-Generated Answer Reader (7 cols on desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <AnnotatedAnswerReader />
          <ClaimSelectorList />
        </div>

        {/* RIGHT PANEL: Claim Evidence Inspector (5 cols on desktop) */}
        <div className="hidden lg:block lg:col-span-5 h-[680px] sticky top-20">
          <ClaimEvidenceInspector />
        </div>
      </div>

      {/* Mobile Drawer/Modal for Claim Evidence Inspector */}
      {isMobileInspectorOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 lg:hidden"
          onClick={() => setIsMobileInspectorOpen(false)}
        >
          <div 
            className="w-full max-w-lg h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <ClaimEvidenceInspector 
              isMobileModal={true} 
              onCloseMobile={() => setIsMobileInspectorOpen(false)} 
            />
          </div>
        </div>
      )}

      {/* Phase 4 Evidence-Grounded Correction Result Preview (when generated) */}
      {currentSession.correctionResult && (
        <div className="mt-8">
          <CorrectionResultView correction={currentSession.correctionResult} />
        </div>
      )}

      {/* Raw Extracted PDF Text Modal */}
      {showRawPdfModal && (
        <ExtractedTextModal
          document={activeDoc}
          onClose={() => setShowRawPdfModal(false)}
        />
      )}

      {/* Phase 4 Generate Correction Modal */}
      <GenerateCorrectionModal />

    </div>
  );
};
