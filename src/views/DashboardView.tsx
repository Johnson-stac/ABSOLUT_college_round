import React, { useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  ArrowRight, 
  FileText, 
  Server,
  BrainCircuit,
  AlertTriangle,
  Scale,
  BookOpenCheck
} from 'lucide-react';
import { useAudit } from '../context/useAudit';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';
import { animatePageEntry } from '../utils/animations';
import { AuditMetricsCharts } from '../components/dashboard/AuditMetricsCharts';
import { FloatingTypographyField } from '../components/ui/FloatingTypographyField';

export const DashboardView: React.FC = () => {
  const { setScreen, history, loadSamplePreset, createNewSession, backendHealth, currentSession } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const isConnected = backendHealth?.status === 'ok';

  // Compute aggregate or active session metrics
  const activeSummary = currentSession.verificationResult?.summary || SAMPLE_PRESETS[0].verificationResult.summary;

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Hero Welcome Banner with Floating Typography Field */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-10 text-white shadow-xl border border-slate-800">
        <FloatingTypographyField 
          density="medium" 
          motionIntensity="normal" 
          themeVariant="dark-hero" 
          interactive={true} 
        />
        <div className="relative z-10 max-w-3xl pointer-events-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-4 backdrop-blur-xs">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>SecondOpinion • AI Auditing Platform</span>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-normal">{isConnected ? 'Engine Connected' : 'Fixture/Local Mode'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 leading-tight font-sans">
            Audit Another AI with Ground-Truth Evidence
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-2xl font-normal">
            Evaluate AI-generated answers against primary PDF evidence. Detect hallucinated facts, localize errors, check reasoning consistency, flag unsafe recommendations, and generate evidence-grounded corrections.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                createNewSession();
                setScreen('new-audit');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer hover:shadow-blue-500/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Audit</span>
            </button>

            <button
              onClick={() => setScreen('workspace')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/15 transition-all cursor-pointer backdrop-blur-xs"
            >
              <BookOpenCheck className="w-4 h-4 text-blue-400" />
              <span>Open Active Workspace</span>
            </button>

            <button
              onClick={() => setScreen('settings')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200 font-medium text-sm transition-all cursor-pointer"
            >
              <Server className="w-4 h-4 text-slate-500" />
              <span>System & API Status</span>
            </button>
          </div>
        </div>

        {/* Subtle Decorative Pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <div className="w-full h-full bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>
      </div>

      {/* Key Architectural Capabilities Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card rounded-2xl p-4 border border-[var(--border-subtle)] shadow-2xs">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Claim-Level Verification</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] m-0">Exact character offset alignment & token highlighting</p>
        </div>

        <div className="surface-card rounded-2xl p-4 border border-[var(--border-subtle)] shadow-2xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Hallucination Localization</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] m-0">Pinpoints conflicting statements with page citations</p>
        </div>

        <div className="surface-card rounded-2xl p-4 border border-[var(--border-subtle)] shadow-2xs">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Reasoning Checks</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] m-0">Detects non-sequiturs & ungrounded logical leaps</p>
        </div>

        <div className="surface-card rounded-2xl p-4 border border-[var(--border-subtle)] shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Calibrated Confidence</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] m-0">Uncertainty intervals & epistemic caveats</p>
        </div>
      </div>

      {/* Operational Analytics & Visual Diagnostics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] m-0">Live Audit Telemetry & Diagnostics</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time breakdown of grounding verdicts, error categories, and reliability scores.</p>
          </div>
          <button
            onClick={() => setScreen('workspace')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect in Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <AuditMetricsCharts summary={activeSummary} />
      </div>

      {/* Pre-Loaded Quick Testing Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] m-0">One-Click Demonstration Scenarios</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Explore real-world verification across clinical trials, statutory compliance, and SEC financial filings.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {SAMPLE_PRESETS.map((preset) => (
            <div 
              key={preset.id}
              className="surface-card surface-card-hover rounded-2xl p-5 border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    {preset.domain}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">{preset.documentPages} pages in PDF</span>
                </div>

                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5 m-0 leading-snug">{preset.name}</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  {preset.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[160px]">{preset.documentName}</span>
                <button
                  onClick={() => {
                    loadSamplePreset(preset.id);
                    setScreen('workspace');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                >
                  <span>Audit Scenario</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Audits Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] m-0">Recent Audits</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Audit runs and historical intake records.</p>
          </div>
          <button
            onClick={() => setScreen('history')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Archives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="surface-card rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Audit Title</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Evidence Sources</th>
                  <th className="px-4 py-3.5">Factual Score</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--text-primary)] flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate max-w-sm font-semibold">{item.title}</span>
                    </td>
                    <td className="px-4 py-4 text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)] font-medium">
                      {item.documentCount} PDF source{item.documentCount !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-4">
                      {item.truthfulnessScore !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-xs ${
                            item.truthfulnessScore >= 70 ? 'text-emerald-700 dark:text-emerald-400' :
                            item.truthfulnessScore >= 50 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
                          }`}>
                            {item.truthfulnessScore}%
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            ({item.flaggedClaimsCount || 0} flagged)
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)]">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Completed
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          const presetId = item.title.includes('EMPEROR') ? 'clinical-empagliflozin' :
                            item.title.includes('EU AI') ? 'legal-eu-ai-act' : 'financial-nvidia-earnings';
                          loadSamplePreset(presetId);
                          setScreen('workspace');
                        }}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
