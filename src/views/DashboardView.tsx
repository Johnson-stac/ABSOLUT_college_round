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

export const DashboardView: React.FC = () => {
  const { setScreen, history, loadSamplePreset, createNewSession, backendHealth } = useAudit();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const isConnected = backendHealth?.status === 'ok';

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-medium mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>SecondOpinion • Phase 1 Intake System</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 font-medium text-sm border border-white/10 transition-all cursor-pointer"
            >
              <Server className="w-4 h-4 text-slate-400" />
              <span>Inspect Backend Contract</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card rounded-xl p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audits Conducted</span>
            <FileSearch className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{history.length + 1}</div>
          <p className="text-xs text-slate-500 mt-1">Total active & completed runs</p>
        </div>

        <div className="surface-card rounded-xl p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">PDF Sources</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {history.reduce((a, b) => a + b.documentCount, 0) + 1}
          </div>
          <p className="text-xs text-slate-500 mt-1">Ground truth documents verified</p>
        </div>

        <div className="surface-card rounded-xl p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Grounding Pipeline</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">Phase 1</div>
          <p className="text-xs text-slate-500 mt-1">Dual-stream intake & parser active</p>
        </div>

        <div className="surface-card rounded-xl p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Backend Service</span>
            <Server className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isConnected ? 'Connected' : 'Contract Defined'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Port 8000 / Local Dev</p>
        </div>
      </div>

      {/* Pre-Loaded Quick Testing Scenarios */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 m-0">One-Click Demonstration Scenarios</h3>
            <p className="text-xs text-slate-500 mt-0.5">Test the complete intake and document reading pipeline immediately with real-world scenarios.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_PRESETS.map((preset) => (
            <div 
              key={preset.id}
              className="surface-card surface-card-hover rounded-xl p-5 bg-white border border-slate-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                    {preset.domain}
                  </span>
                  <span className="text-xs text-slate-400">{preset.documentPages} pages in PDF</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 m-0">{preset.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {preset.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{preset.documentName}</span>
                <button
                  onClick={() => {
                    loadSamplePreset(preset.id);
                    setScreen('new-audit');
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
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

        <div className="surface-card rounded-xl bg-white border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Audit Title</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Word Count</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate max-w-xs">{item.title}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {item.documentCount} PDF
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {item.wordCount} words
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        Ready
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => {
                          loadSamplePreset(item.id.includes('1') ? 'clinical-empagliflozin' : 'legal-eu-ai-act');
                          setScreen('workspace');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
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
