import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Star, 
  Pin, 
  Trash2, 
  Tag, 
  BookMarked, 
  Save, 
  Check, 
  Share2
} from 'lucide-react';
import { Note } from '../types';
import { StorageService } from '../services/storage';

interface NotesPageProps {
  initialNoteId?: string;
}

export const NotesPage: React.FC<NotesPageProps> = ({ initialNoteId }) => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const [notes, setNotes] = useState<Note[]>(StorageService.getNotes(activeWsId || undefined));
  const [selectedNoteId, setSelectedNoteId] = useState<string>(initialNoteId || notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Editor states
  const activeNote = notes.find(n => n.id === selectedNoteId) || notes[0] || null;
  const [editTitle, setEditTitle] = useState(activeNote?.title || '');
  const [editContent, setEditContent] = useState(activeNote?.content || '');
  const [editTags, setEditTags] = useState(activeNote?.tags.join(', ') || '');
  const [isSavedToast, setIsSavedToast] = useState(false);

  const notebooks = StorageService.getNotebooks(activeWsId || undefined);

  const refresh = (newSelectedId?: string) => {
    const list = StorageService.getNotes(activeWsId || undefined);
    setNotes(list);
    if (newSelectedId) {
      setSelectedNoteId(newSelectedId);
      const target = list.find(n => n.id === newSelectedId);
      if (target) {
        setEditTitle(target.title);
        setEditContent(target.content);
        setEditTags(target.tags.join(', '));
      }
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
  };

  const handleCreateNewNote = () => {
    const wsId = StorageService.ensureActiveWorkspaceId();

    const newNote: Note = {
      id: 'note-' + Date.now(),
      workspaceId: wsId,
      notebookId: notebooks[0]?.id || undefined,
      title: 'Untitled Study Note',
      content: '## New Section\n\nStart writing notes, formulas, or summaries...',
      tags: ['General'],
      isPinned: false,
      isFavorite: false,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    StorageService.saveNote(newNote);
    refresh(newNote.id);
  };

  const handleSaveNote = () => {
    if (!activeNote) return;

    const parsedTags = editTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const updated: Note = {
      ...activeNote,
      title: editTitle.trim() || 'Untitled Note',
      content: editContent,
      tags: parsedTags,
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    StorageService.saveNote(updated);
    refresh(updated.id);
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Delete this note?')) {
      StorageService.deleteNote(id);
      const remaining = StorageService.getNotes(activeWsId || undefined);
      setNotes(remaining);
      if (remaining[0]) {
        handleSelectNote(remaining[0]);
      }
    }
  };

  const handleTogglePin = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...note, isPinned: !note.isPinned };
    StorageService.saveNote(updated);
    refresh();
  };

  const handleToggleFav = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...note, isFavorite: !note.isFavorite };
    StorageService.saveNote(updated);
    refresh();
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !selectedTag || n.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Smart Notes Studio
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Offline-first markdown notes linked to your notebooks and sources.
          </p>
        </div>
        <button
          onClick={handleCreateNewNote}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Notes Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Take lecture notes, write code summaries, or formulate exam review sheets.
          </p>
          <button
            onClick={handleCreateNewNote}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Note</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Notes List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Tags row */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium shrink-0 cursor-pointer ${
                    selectedTag === null ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  All
                </button>
                {allTags.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium shrink-0 cursor-pointer ${
                      selectedTag === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
              {filteredNotes.map(note => {
                const isSelected = selectedNoteId === note.id;
                const notebook = notebooks.find(nb => nb.id === note.notebookId);

                return (
                  <div
                    key={note.id}
                    onClick={() => handleSelectNote(note)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={e => handleTogglePin(note, e)}
                          className={`p-1 rounded cursor-pointer ${note.isPinned ? 'text-indigo-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => handleToggleFav(note, e)}
                          className={`p-1 rounded cursor-pointer ${note.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {note.content.replace(/#/g, '')}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="truncate max-w-[150px] font-medium text-indigo-600 dark:text-indigo-400">
                        {notebook?.title || 'General'}
                      </span>
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Markdown Note Editor */}
          {activeNote && (
            <div className="lg:col-span-8 space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      Offline Local Note
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSavedToast && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </span>
                    )}

                    <button
                      onClick={handleSaveNote}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save (Ctrl+S)</span>
                    </button>

                    <button
                      onClick={() => handleDeleteNote(activeNote.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Note Title..."
                  className="w-full text-xl font-bold bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-slate-200 focus:border-indigo-500 pb-1 focus:outline-none"
                />

                {/* Tags */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <input
                    type="text"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated, e.g. Algorithms, Physics, Research)"
                    className="w-full bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>

                {/* Content */}
                <textarea
                  rows={16}
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  placeholder="Write your study notes in markdown or plain text..."
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm leading-relaxed border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
