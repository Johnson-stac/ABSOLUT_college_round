import React, { useState, useEffect, useRef } from 'react';
import { 
  History, 
  Search, 
  FileText, 
  Trash2, 
  Calendar, 
  FileCheck2,
  ArrowRight
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { animatePageEntry } from '../utils/animations';

export const AuditHistoryView: React.FC = () => {
  const { history, setScreen, loadSessionFromHistory, deleteSessionFromHistory, createNewSession } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return animatePageEntry(containerRef.current);
  }, []);

  const filteredHistory = history.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight m-0">
            Audit Archive & History
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Access previous answers, verified source documents, and historical session logs.
          </p>
        </div>

        <button
          onClick={() => {
            createNewSession();
            setScreen('new-audit');
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>New Audit Intake</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filter audits by title or topic..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* History Items Grid */}
      {filteredHistory.length === 0 ? (
        <div className="surface-card rounded-xl p-12 text-center bg-white border border-slate-200">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-700 m-0">No historical audits found</h4>
          <p className="text-xs text-slate-400 mt-1">Start a new audit or change your filter search terms.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="surface-card surface-card-hover rounded-xl p-5 bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate m-0">
                    {item.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{item.wordCount} words in answer</span>
                    <span>•</span>
                    <span>{item.documentCount} PDF source{item.documentCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  onClick={() => loadSessionFromHistory(item.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open in Workspace</span>
                </button>
                <button
                  onClick={() => deleteSessionFromHistory(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
