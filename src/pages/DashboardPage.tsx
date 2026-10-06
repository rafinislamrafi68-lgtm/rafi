import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  BookMarked, 
  Files, 
  GitFork, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  Bot, 
  BookOpen, 
  CheckCircle, 
  Layers,
  FileText
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Workspace, Notebook, MindMap, Note, Source } from '../types';

interface DashboardPageProps {
  onNavigate: (view: string, id?: string) => void;
  onCreateWorkspace: () => void;
  onCreateNotebook: () => void;
  onAddSource: () => void;
  onCreateMindMap: () => void;
  onInvitePeople: () => void;
  onQuickAskAI: (prompt: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
  onNavigate,
  onCreateWorkspace,
  onCreateNotebook,
  onAddSource,
  onCreateMindMap,
  onInvitePeople,
  onQuickAskAI
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(StorageService.getWorkspaces());
  const [activeWsId, setActiveWsId] = useState<string | null>(StorageService.getActiveWorkspaceId());
  const [quickQuery, setQuickQuery] = useState('');

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setWorkspaces(StorageService.getWorkspaces());
      setActiveWsId(StorageService.getActiveWorkspaceId());
    });
    return () => unsub();
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWsId) || null;
  const notebooks = StorageService.getNotebooks(activeWsId || undefined);
  const sources = StorageService.getSources(activeWsId || undefined);
  const mindmaps = StorageService.getMindMaps(activeWsId || undefined);
  const notes = StorageService.getNotes(activeWsId || undefined);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    onQuickAskAI(quickQuery.trim());
  };

  const handleLoadSample = () => {
    StorageService.loadSampleTemplate();
  };

  // -------------------------------------------------------------
  // BLANK INITIAL STATE: When no workspaces exist yet!
  // -------------------------------------------------------------
  if (workspaces.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-10">
        {/* Welcome Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Blank Clean Slate Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to RAFI Study
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Your personal, offline-first, AI-powered knowledge and study system. No hardcoded subjects or forced curricula—you design your own learning workspace.
          </p>
        </div>

        {/* 5 Core Initial Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Create Workspace */}
          <div
            onClick={onCreateWorkspace}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Workspace
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Start a space for School, University, Coding, Research, or Personal Knowledge.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* 2. Create Notebook */}
          <div
            onClick={onCreateNotebook}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookMarked className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Create Notebook
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  A modular container for notes, sources, questions, and revision material.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform">
              <span>New Notebook</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* 3. Add Source */}
          <div
            onClick={onAddSource}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Files className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Source
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Import PDF textbooks, docx, markdown, text, or web URLs for offline reading.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Import Sources</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* 4. Create Mind Map (Core) */}
          <div
            onClick={onCreateMindMap}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitFork className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create Mind Map
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                    Core
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Interactive visual mind-mapping editor with radial and tree layout modes.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              <span>Open Canvas</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* 5. Invite People */}
          <div
            onClick={onInvitePeople}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Invite People
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Collaborate with teachers, classmates, or study partners with customizable roles.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Collaboration</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>

          {/* Optional Demo Template Card */}
          <div
            onClick={handleLoadSample}
            className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
                  Explore Sample Template
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Load a sample workspace to test notebooks, sources, and mind maps immediately.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-slate-500 group-hover:underline">
              <span>Load Template</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ACTIVE WORKSPACE VIEW: When workspace is configured
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Workspace Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span 
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: activeWorkspace?.themeColor || '#4f46e5' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Active Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {activeWorkspace?.name}
          </h1>
          {activeWorkspace?.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {activeWorkspace.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onCreateNotebook}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Notebook</span>
          </button>
          <button
            onClick={() => onNavigate('workspaces')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Quick AI Search grounded in this workspace */}
      <form onSubmit={handleQuickSubmit} className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <Bot className="w-5 h-5 text-indigo-500 ml-2 mr-2 shrink-0" />
        <input
          type="text"
          placeholder={`Ask AI about sources or topics in "${activeWorkspace?.name}"...`}
          value={quickQuery}
          onChange={e => setQuickQuery(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none px-2"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>Ask AI</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Grid: Notebooks, Mind Maps, and Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notebooks & Mind Maps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notebooks Container */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Notebooks ({notebooks.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Customizable containers for your learning modules.
                </p>
              </div>
              <button
                onClick={onCreateNotebook}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Notebook</span>
              </button>
            </div>

            {notebooks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                No notebooks created yet in this workspace. Click "+ Add Notebook" to start organizing your topics.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {notebooks.map(nb => (
                  <div
                    key={nb.id}
                    onClick={() => onNavigate('notebooks', nb.id)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate">
                        {nb.title}
                      </h3>
                    </div>
                    {nb.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {nb.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mind Maps (First-Class Feature) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Mind Map Studio</span>
                  <span className="text-[10px] uppercase font-bold text-purple-600 bg-purple-100 dark:bg-purple-950 px-1.5 py-0.5 rounded">
                    Core
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive knowledge graphs and hierarchical visual models.
                </p>
              </div>
              <button
                onClick={onCreateMindMap}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Mind Map</span>
              </button>
            </div>

            {mindmaps.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                No mind maps yet. Click "New Mind Map" to create a visual tree or radial structure.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mindmaps.map(mm => (
                  <div
                    key={mm.id}
                    onClick={() => onNavigate('mindmaps', mm.id)}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 hover:border-purple-400 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GitFork className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors truncate">
                        {mm.title}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono capitalize">
                      Layout: {mm.layout}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Sources & Collaborators */}
        <div className="space-y-6">
          {/* Sources Summary */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sources ({sources.length})
              </h2>
              <button
                onClick={onAddSource}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
            </div>

            {sources.length === 0 ? (
              <p className="text-xs text-slate-400">
                No sources added yet. Import PDFs, documents, or paste notes to ground AI answers.
              </p>
            ) : (
              <div className="space-y-2">
                {sources.slice(0, 4).map(src => (
                  <div
                    key={src.id}
                    onClick={() => onNavigate('sources', src.id)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                      {src.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {src.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collaborators & Roles */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Collaborators ({activeWorkspace?.collaborators.length || 1})</span>
              </h2>
              <button
                onClick={onInvitePeople}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite</span>
              </button>
            </div>

            <div className="space-y-2">
              {activeWorkspace?.collaborators.map(c => (
                <div
                  key={c.userId}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.email}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 uppercase">
                    {c.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
