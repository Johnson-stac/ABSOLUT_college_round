import React from 'react';
import { 
  Menu, 
  Plus, 
  RefreshCw, 
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { useAudit } from '../../context/AuditContext';

interface TopNavProps {
  onToggleSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onToggleSidebar }) => {
  const { 
    currentScreen, 
    setScreen, 
    backendHealth, 
    isCheckingBackend, 
    checkBackendStatus,
    currentSession,
    createNewSession
  } = useAudit();

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard': return 'Operational Dashboard';
      case 'new-audit': return 'New Audit Intake';
      case 'workspace': return 'Evidence & Claims Workspace';
      case 'history': return 'Audit History & Archives';
      case 'settings': return 'System Settings & API Contract';
      default: return 'SecondOpinion';
    }
  };

  const isConnected = backendHealth?.status === 'ok';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium hidden sm:inline">SecondOpinion</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <h1 className="font-semibold text-slate-800 text-sm sm:text-base m-0 tracking-tight">
            {getScreenTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Backend indicator & Actions */}
      <div className="flex items-center gap-3">
        {/* Backend Connectivity Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-slate-600 font-medium">
            {isConnected ? 'API :8000 Live' : 'API Standby (Local Mock Active)'}
          </span>
          <button
            onClick={checkBackendStatus}
            disabled={isCheckingBackend}
            title="Refresh backend status"
            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isCheckingBackend ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Action Button */}
        {currentScreen !== 'new-audit' && (
          <button
            onClick={() => {
              createNewSession();
              setScreen('new-audit');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Audit</span>
          </button>
        )}

        {/* Go to Workspace if documents exist */}
        {currentScreen === 'new-audit' && currentSession.documents.length > 0 && (
          <button
            onClick={() => setScreen('workspace')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Workspace</span>
          </button>
        )}
      </div>
    </header>
  );
};
