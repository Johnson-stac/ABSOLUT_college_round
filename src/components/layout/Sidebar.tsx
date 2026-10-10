import React from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  LayoutDashboard, 
  BookOpenCheck, 
  History, 
  Settings, 
  Server,
  Sparkles
} from 'lucide-react';
import { useAudit } from '../../context/useAudit';
import type { ScreenType } from '../../context/auditContextDef';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { currentScreen, setScreen, currentSession, backendHealth, createNewSession } = useAudit();

  const navItems: { id: ScreenType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-audit', label: 'New Audit', icon: PlusCircle, badge: 'Phase 1' },
    { id: 'workspace', label: 'Audit Workspace', icon: BookOpenCheck, badge: currentSession.documents.length > 0 ? `${currentSession.documents.length} doc` : undefined },
    { id: 'correction', label: 'Corrected Answer', icon: Sparkles, badge: 'Phase 4' },
    { id: 'history', label: 'Audit History', icon: History },
    { id: 'settings', label: 'Settings & Contract', icon: Settings },
  ];

  const handleNav = (screen: ScreenType) => {
    setScreen(screen);
    onCloseMobile?.();
  };

  const isBackendOnline = backendHealth?.status === 'ok';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shadow-blue-500/30">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-900 tracking-tight text-base leading-none">SecondOpinion</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">Evidence Engine</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => {
              createNewSession();
              handleNav('new-audit');
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm shadow-xs transition-all duration-150 group cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
            <span>Start New Audit</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                  ${isActive 
                    ? 'bg-blue-50/80 text-blue-700 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`
                    text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider
                    ${isActive 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-slate-100 text-slate-500'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current Active Audit Quick Card */}
        {currentSession.originalAnswer && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Audit</span>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            </div>
            <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
              {currentSession.title}
            </p>
            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>{currentSession.wordCount} words</span>
              <span>{currentSession.documents.length} PDF{currentSession.documents.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Backend Contract Status Box */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">Backend API</span>
            </div>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
              isBackendOnline 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-amber-50 text-amber-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {isBackendOnline ? 'Connected' : 'Offline / Mock'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            {isBackendOnline 
              ? 'PDF parser ready on :8000' 
              : 'Standby for teammate backend'}
          </p>
        </div>
      </aside>
    </>
  );
};
