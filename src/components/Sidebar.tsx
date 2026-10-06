import React from 'react';
import { 
  LayoutDashboard, 
  FolderTree, 
  BookMarked, 
  Files, 
  FileText, 
  GitFork, 
  HelpCircle, 
  Bot, 
  Users, 
  Settings, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView 
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workspaces', label: 'Structure & Workspaces', icon: FolderTree },
    { id: 'notebooks', label: 'Notebooks', icon: BookMarked },
    { id: 'sources', label: 'Sources & Library', icon: Files },
    { id: 'notes', label: 'Smart Notes', icon: FileText },
    { id: 'mindmaps', label: 'Mind Map Studio', icon: GitFork, isCore: true },
    { id: 'quiz', label: 'Quiz & Recall', icon: HelpCircle },
    { id: 'ai', label: 'AI Study Assistant', icon: Bot },
    { id: 'collaborators', label: 'Collaboration & Roles', icon: Users },
    { id: 'settings', label: 'Settings & Cloud', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Platform Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span className="leading-tight">{item.label}</span>
                </div>
                {item.isCore && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Core
                  </span>
                )}
                {isActive && !item.isCore && (
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Offline Storage & Workspace Footnote */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Offline-First Engine</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Ready</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          All workspaces, sources, and mind maps are stored locally and accessible without internet.
        </p>
      </div>
    </aside>
  );
};
