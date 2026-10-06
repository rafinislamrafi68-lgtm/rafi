import React, { useState } from 'react';
import { 
  Files, 
  Plus, 
  Search, 
  Trash2, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Globe, 
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Source, SourceType } from '../types';

export const SourcesPage: React.FC = () => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const [sources, setSources] = useState<Source[]>(StorageService.getSources(activeWsId || undefined));
  const [selectedSource, setSelectedSource] = useState<Source | null>(sources[0] || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SourceType>('pdf');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState('');

  const refresh = () => {
    const list = StorageService.getSources(activeWsId || undefined);
    setSources(list);
    if (selectedSource) {
      setSelectedSource(list.find(s => s.id === selectedSource.id) || list[0] || null);
    } else if (list[0]) {
      setSelectedSource(list[0]);
    }
  };

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const wsId = StorageService.ensureActiveWorkspaceId();

    const newSource: Source = {
      id: 'src-' + Date.now(),
      workspaceId: wsId,
      title: title.trim(),
      type,
      fileSize: type === 'pdf' ? '8.4 MB' : type === 'docx' ? '2.1 MB' : '15 KB',
      content: content.trim() || 'Imported source text and reference material.',
      url: url.trim() || undefined,
      totalPages: type === 'pdf' ? 45 : 1,
      currentPage: 1,
      isOfflineCached: true,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    StorageService.saveSource(newSource);
    refresh();
    setSelectedSource(newSource);
    setIsAddModalOpen(false);
    setTitle('');
    setContent('');
    setUrl('');
    setTags('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this source?')) {
      StorageService.deleteSource(id);
      refresh();
    }
  };

  const filteredSources = sources.filter(s =>
    !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sources & Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Import PDFs, DOCX, TXT, web links, or raw text. Stored locally on-device.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Source</span>
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <Files className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Sources Added</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add PDF books, class handouts, scientific articles, or URLs. The AI assistant uses these sources for grounded answers.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Source</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Source list */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              {filteredSources.map(src => {
                const isSelected = selectedSource?.id === src.id;
                return (
                  <div
                    key={src.id}
                    onClick={() => setSelectedSource(src)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {src.type === 'pdf' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 uppercase font-mono">PDF</span>
                        ) : src.type === 'web_url' ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-600 uppercase font-mono">URL</span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 uppercase font-mono">{src.type}</span>
                        )}
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {src.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{src.fileSize || 'Local'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Offline Ready</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Source Viewer */}
          {selectedSource && (
            <div className="lg:col-span-8 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedSource.title}
                    </h2>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Type: {selectedSource.type.toUpperCase()} · Stored on device
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(selectedSource.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Delete Source"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Source Reading Canvas */}
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 min-h-[400px] overflow-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap">
                  {selectedSource.content}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Source */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Source</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSource} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Source Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Chemistry Principles, React Documentation"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Source Type
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as SourceType)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
                >
                  <option value="pdf">PDF Textbook / Document</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="markdown">Markdown (.md)</option>
                  <option value="txt">Plain Text (.txt)</option>
                  <option value="web_url">Web Page URL</option>
                  <option value="copied_text">Copied / Snippet Text</option>
                </select>
              </div>

              {type === 'web_url' && (
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Source Content / Notes / Summary
                </label>
                <textarea
                  rows={6}
                  placeholder="Paste or write the text from this source to allow local offline search and grounded AI answers..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
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
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
