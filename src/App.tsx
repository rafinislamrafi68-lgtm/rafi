import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { ConflictModal } from './components/ConflictModal';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacesPage } from './pages/WorkspacesPage';
import { NotebooksPage } from './pages/NotebooksPage';
import { SourcesPage } from './pages/SourcesPage';
import { NotesPage } from './pages/NotesPage';
import { MindMapPage } from './pages/MindMapPage';
import { QuizPage } from './pages/QuizPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { CollaboratorsPage } from './pages/CollaboratorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyncService, SyncStateInfo } from './services/syncService';
import { StorageService } from './services/storage';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeEntityId, setActiveEntityId] = useState<string | undefined>(undefined);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [syncState, setSyncState] = useState<SyncStateInfo>(SyncService.getState());

  useEffect(() => {
    StorageService.init();
    const unsub = SyncService.subscribe(setSyncState);
    return () => unsub();
  }, []);

  // Keyboard shortcuts (Ctrl+K = Search, Ctrl+N = New, Ctrl+S = Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setActiveView('notes');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleNavigate = (view: string, id?: string) => {
    setActiveView(view);
    setActiveEntityId(id);
  };

  const handleQuickAskAI = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setActiveView('ai');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onCreateWorkspace={() => setActiveView('workspaces')}
      />

      {/* Main Layout Shell */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          setActiveView={view => {
            setActiveView(view);
            setActiveEntityId(undefined);
          }}
        />

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeView === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              onCreateWorkspace={() => setActiveView('workspaces')}
              onCreateNotebook={() => setActiveView('notebooks')}
              onAddSource={() => setActiveView('sources')}
              onCreateMindMap={() => setActiveView('mindmaps')}
              onInvitePeople={() => setActiveView('collaborators')}
              onQuickAskAI={handleQuickAskAI}
            />
          )}

          {activeView === 'workspaces' && <WorkspacesPage />}

          {activeView === 'notebooks' && (
            <NotebooksPage onNavigateToContent={handleNavigate} />
          )}

          {activeView === 'sources' && <SourcesPage />}

          {activeView === 'notes' && <NotesPage initialNoteId={activeEntityId} />}

          {activeView === 'mindmaps' && <MindMapPage />}

          {activeView === 'quiz' && <QuizPage />}

          {activeView === 'ai' && <AIAssistantPage initialPrompt={aiInitialPrompt} />}

          {activeView === 'collaborators' && <CollaboratorsPage />}

          {activeView === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(view, id) => {
          handleNavigate(view, id);
        }}
      />

      {/* Cloud Conflict Resolution Modal */}
      <ConflictModal
        conflict={syncState.activeConflict}
        onResolve={resolution => {
          SyncService.resolveConflict(resolution);
        }}
      />
    </div>
  );
}
