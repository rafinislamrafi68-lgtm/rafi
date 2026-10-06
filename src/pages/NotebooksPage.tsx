import React, { useState } from 'react';
import { 
  BookMarked, 
  Plus, 
  Star, 
  Pin, 
  Trash2, 
  X, 
  Folder, 
  Files, 
  FileText, 
  GitFork,
  ArrowRight
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Notebook } from '../types';

interface NotebooksPageProps {
  onNavigateToContent?: (view: string, id: string) => void;
}

export const NotebooksPage: React.FC<NotebooksPageProps> = ({ onNavigateToContent }) => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const [notebooks, setNotebooks] = useState<Notebook[]>(StorageService.getNotebooks(activeWsId || undefined));
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(notebooks[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [color, setColor] = useState('#4f46e5');

  const refresh = () => {
    const list = StorageService.getNotebooks(activeWsId || undefined);
    setNotebooks(list);
    if (!selectedNotebookId && list[0]) {
      setSelectedNotebookId(list[0].id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const wsId = StorageService.ensureActiveWorkspaceId();

    const newNb: Notebook = {
      id: 'nb-' + Date.now(),
      workspaceId: wsId,
      title: title.trim(),
      description: desc.trim() || undefined,
      color,
      folderPath: folderPath.trim() || undefined,
      sourceIds: [],
      noteIds: [],
      mindMapIds: [],
      quizIds: [],
      flashcardIds: [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    StorageService.saveNotebook(newNb);
    refresh();
    setSelectedNotebookId(newNb.id);
    setIsAddModalOpen(false);
    setTitle('');
    setDesc('');
    setFolderPath('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this notebook?')) {
      StorageService.deleteNotebook(id);
      refresh();
    }
  };

  const activeNb = notebooks.find(n => n.id === selectedNotebookId) || notebooks[0] || null;
  const notebookNotes = StorageService.getNotes(activeWsId || undefined, activeNb?.id);
  const notebookSources = StorageService.getSources(activeWsId || undefined, activeNb?.id);
  const notebookMindMaps = StorageService.getMindMaps(activeWsId || undefined, activeNb?.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Custom Notebooks
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Flexible containers for sources, notes, mind maps, quizzes, and flashcards.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Notebook</span>
        </button>
      </div>

      {notebooks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <BookMarked className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Notebooks Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create your first notebook to organize a subject, topic, chapter, project, or research area.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Notebook</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Notebooks Cards list */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-400 uppercase px-1">
              Notebooks ({notebooks.length})
            </div>
            {notebooks.map(nb => {
              const isSelected = nb.id === selectedNotebookId;
              return (
                <div
                  key={nb.id}
                  onClick={() => setSelectedNotebookId(nb.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                      : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: nb.color || '#4f46e5' }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {nb.title}
                      </h3>
                    </div>
                  </div>
                  {nb.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {nb.description}
                    </p>
                  )}
                  {nb.folderPath && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
                      <Folder className="w-3 h-3" />
                      <span>{nb.folderPath}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Selected Notebook Details */}
          {activeNb && (
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {activeNb.title}
                    </h2>
                    {activeNb.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{activeNb.description}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(activeNb.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Delete Notebook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sub-modules inside this Notebook */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <Files className="w-4 h-4 text-emerald-500" />
                      <span>Sources ({notebookSources.length})</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">PDFs, documents, and web links</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>Notes ({notebookNotes.length})</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Markdown & lecture notes</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                      <GitFork className="w-4 h-4 text-purple-500" />
                      <span>Mind Maps ({notebookMindMaps.length})</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Hierarchical concept trees</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: New Notebook */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Notebook</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Notebook Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 3: Mechanics, Unit 1: Algorithms, Term Paper"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kinematics, vectors, and force laws"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Folder Path (for nested organization)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science / Physics / Year 1"
                  value={folderPath}
                  onChange={e => setFolderPath(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {['#4f46e5', '#0284c7', '#059669', '#ea580c', '#7c3aed', '#db2777'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${color === c ? 'scale-110 ring-2 ring-slate-900 dark:ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Save Notebook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
