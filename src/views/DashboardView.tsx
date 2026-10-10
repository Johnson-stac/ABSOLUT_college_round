import React, { useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  FileSearch, 
  Layers, 
  PlusCircle, 
  ArrowRight, 
  FileText, 
  TrendingUp,
  Server
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { SAMPLE_PRESETS } from '../data/sampleAnswers';
import { animatePageEntry } from '../utils/animations';
import { FloatingTypographyField } from '../components/ui/FloatingTypographyField';

export const DashboardView: React.FC = () => {
  const { setScreen, history, loadSamplePreset, createNewSession, backendHealth } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const isConnected = backendHealth?.status === 'ok';

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Hero Welcome Banner with Floating Typography Field */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800/80">
        <FloatingTypographyField 
          density="medium" 
          motionIntensity="normal" 
          themeVariant="dark-hero" 
          interactive={true} 
        />
        <div className="relative z-10 max-w-2xl pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium mb-3 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>SecondOpinion • Phase 1 Intake System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 font-sans">
            Verify AI-Generated Answers Against Ground-Truth Documents
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-xl">
            Input AI answers, upload source PDFs, parse multi-page evidence, and audit every claim with sentence-level precision before publication or deployment.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                createNewSession();
                setScreen('new-audit');
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start New Audit</span>
            </button>
            <button
              onClick={() => setScreen('settings')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/10 transition-all cursor-pointer backdrop-blur-xs"
            >
              <Server className="w-4 h-4 text-slate-400" />
              <span>Inspect Backend Contract</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-xl p-5">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audits Conducted</span>
            <FileSearch className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{history.length + 1}</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Total active & completed runs</p>
        </div>

        <div className="surface-card rounded-xl p-5">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">PDF Sources</span>
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {history.reduce((a, b) => a + b.documentCount, 0) + 1}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Ground truth documents verified</p>
        </div>

        <div className="surface-card rounded-xl p-5">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Grounding Pipeline</span>
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">Phase 1</div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Dual-stream intake & parser active</p>
        </div>

        <div className="surface-card rounded-xl p-5">
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Backend Service</span>
            <Server className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'Connected' : 'Contract Defined'}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">Port 8000 / Local Dev</p>
        </div>
      </div>

      {/* Pre-Loaded Quick Testing Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] m-0">Curated Reference Benchmark Scenarios</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Test the complete intake and document reading pipeline immediately with real-world scenarios.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_PRESETS.map((preset) => (
            <div 
              key={preset.id}
              className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300">
                    {preset.domain}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{preset.documentPages} pages in PDF</span>
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1.5 m-0">{preset.name}</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  {preset.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[200px]">{preset.documentName}</span>
                <button
                  onClick={() => {
                    loadSamplePreset(preset.id);
                    setScreen('new-audit');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                >
                  <span>Load Scenario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
            <h3 className="text-base font-bold text-slate-900 m-0">Recent Audits</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit runs and historical intake records.</p>
          </div>
          <button
            onClick={() => setScreen('history')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Archives</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="surface-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Audit Title</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Word Count</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-secondary)]">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-subtle)]/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-[var(--text-primary)] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="truncate max-w-xs">{item.title}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)] font-medium">
                      {item.documentCount} PDF
                    </td>
                    <td className="px-4 py-3.5 text-[var(--text-secondary)]">
                      {item.wordCount} words
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        Ready
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          loadSamplePreset(item.id.includes('1') ? 'clinical-empagliflozin' : 'legal-eu-ai-act');
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
