import React, { useState, useEffect, useRef } from 'react';
import { Search, Files, FileText, GitFork, BookMarked, Layers, X, ArrowRight } from 'lucide-react';
import { StorageService } from '../services/storage';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (view: string, id?: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const workspaces = StorageService.getWorkspaces();
  const notebooks = StorageService.getNotebooks();
  const sources = StorageService.getSources();
  const notes = StorageService.getNotes();
  const mindmaps = StorageService.getMindMaps();

  const q = query.toLowerCase().trim();

  const filteredWorkspaces = workspaces.filter(w =>
    !q || w.name.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredNotebooks = notebooks.filter(nb =>
    !q || nb.title.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredSources = sources.filter(s =>
    !q || s.title.toLowerCase().includes(q)
  ).slice(0, 3);

  const filteredNotes = notes.filter(n => 
    !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q))
  ).slice(0, 3);

  const filteredMindMaps = mindmaps.filter(m =>
    !q || m.title.toLowerCase().includes(q)
  ).slice(0, 3);

  const totalResults = filteredWorkspaces.length + filteredNotebooks.length + filteredSources.length + filteredNotes.length + filteredMindMaps.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search workspaces, notebooks, sources, notes, mind maps..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Results */}
        <div className="p-3 overflow-y-auto space-y-4">
          {totalResults === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No results found for "{query}".
            </div>
          ) : (
            <>
              {/* Workspaces */}
              {filteredWorkspaces.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1">
                    Workspaces
                  </div>
                  <div className="space-y-1">
                    {filteredWorkspaces.map(ws => (
                      <button
                        key={ws.id}
                        onClick={() => {
                          StorageService.setActiveWorkspaceId(ws.id);
                          onSelectResult('workspaces', ws.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {ws.name}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notebooks */}
              {filteredNotebooks.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1">
                    Notebooks
                  </div>
                  <div className="space-y-1">
                    {filteredNotebooks.map(nb => (
                      <button
                        key={nb.id}
                        onClick={() => {
                          onSelectResult('notebooks', nb.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <BookMarked className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {nb.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {filteredSources.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1">
                    Sources
                  </div>
                  <div className="space-y-1">
                    {filteredSources.map(src => (
                      <button
                        key={src.id}
                        onClick={() => {
                          onSelectResult('sources', src.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Files className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {src.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{src.type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {filteredNotes.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1">
                    Notes
                  </div>
                  <div className="space-y-1">
                    {filteredNotes.map(n => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectResult('notes', n.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {n.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mind Maps */}
              {filteredMindMaps.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase px-2 mb-1">
                    Mind Maps
                  </div>
                  <div className="space-y-1">
                    {filteredMindMaps.map(mm => (
                      <button
                        key={mm.id}
                        onClick={() => {
                          onSelectResult('mindmaps', mm.id);
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <GitFork className="w-4 h-4 text-purple-500 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {mm.title}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Local offline search across all modules</span>
          <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-[10px]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
