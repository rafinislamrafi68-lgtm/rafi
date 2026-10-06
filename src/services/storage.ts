import { 
  Workspace, 
  Notebook, 
  Source, 
  Note, 
  MindMap, 
  Quiz, 
  QuizAttempt, 
  Flashcard, 
  UserSettings, 
  Collaborator 
} from '../types';

const STORAGE_KEYS = {
  WORKSPACES: 'rafi_study_workspaces',
  NOTEBOOKS: 'rafi_study_notebooks',
  SOURCES: 'rafi_study_sources',
  NOTES: 'rafi_study_notes',
  MINDMAPS: 'rafi_study_mindmaps',
  QUIZZES: 'rafi_study_quizzes',
  ATTEMPTS: 'rafi_study_quiz_attempts',
  FLASHCARDS: 'rafi_study_flashcards',
  SETTINGS: 'rafi_study_settings',
  ACTIVE_WORKSPACE_ID: 'rafi_study_active_ws'
};

const INITIAL_SETTINGS: UserSettings = {
  userName: 'Rafi Islam',
  email: 'rafinislamrafi68@gmail.com',
  role: 'OWNER',
  driveConnected: false,
  autoSync: true,
  syncFrequencyMinutes: 5,
  onDeviceAISupported: true,
  preferOfflineAI: false,
  theme: 'light',
  accentColor: '#4f46e5',
  dashboardWidgets: ['recent_notebooks', 'recent_mindmaps', 'recent_notes', 'ai_assistant', 'collaborators']
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export const StorageService = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  init(): void {
    // Blank initial workspace by default. No hardcoded subjects or curriculum!
    if (!localStorage.getItem(STORAGE_KEYS.WORKSPACES)) {
      localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTEBOOKS)) {
      localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SOURCES)) {
      localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MINDMAPS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.MINDMAPS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify([this.createDefaultRafiMindMap()]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUIZZES)) {
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FLASHCARDS)) {
      localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
  },

  // Workspaces
  getWorkspaces(): Workspace[] {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.WORKSPACES) || '[]');
    } catch {
      return [];
    }
  },

  getActiveWorkspaceId(): string | null {
    const list = this.getWorkspaces();
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    if (stored && list.some(w => w.id === stored)) {
      return stored;
    }
    return list[0]?.id || null;
  },

  ensureActiveWorkspaceId(): string {
    const existing = this.getActiveWorkspaceId();
    if (existing) return existing;

    const defaultWs: Workspace = {
      id: 'ws-' + Date.now(),
      name: 'My Workspace',
      description: 'Default personal study and knowledge workspace.',
      icon: 'Folder',
      themeColor: '#4f46e5',
      layout: 'standard',
      defaultLanguage: 'auto',
      defaultMindMapStyle: 'radial',
      ownerId: 'user-current',
      collaborators: [
        {
          userId: 'user-current',
          name: 'You (Owner)',
          email: 'you@rafi-study.app',
          role: 'OWNER',
          addedAt: new Date().toISOString(),
          status: 'active'
        }
      ],
      notebookIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNC_PENDING'
    };

    this.saveWorkspace(defaultWs);
    return defaultWs.id;
  },

  setActiveWorkspaceId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID, id);
    notifyListeners();
  },

  saveWorkspace(ws: Workspace): void {
    const list = this.getWorkspaces();
    const idx = list.findIndex(w => w.id === ws.id);
    if (idx >= 0) {
      list[idx] = { ...ws, updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' };
    } else {
      list.push({ ...ws, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' });
    }
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(list));
    this.setActiveWorkspaceId(ws.id);
    notifyListeners();
  },

  deleteWorkspace(id: string): void {
    const list = this.getWorkspaces().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(list));
    // Cascade delete notebooks in this workspace
    const notebooks = this.getNotebooks().filter(n => n.workspaceId !== id);
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(notebooks));
    this.setActiveWorkspaceId(list[0]?.id || '');
    notifyListeners();
  },

  // Notebooks
  getNotebooks(workspaceId?: string): Notebook[] {
    this.init();
    try {
      const all: Notebook[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTEBOOKS) || '[]');
      if (workspaceId) {
        return all.filter(n => n.workspaceId === workspaceId);
      }
      return all;
    } catch {
      return [];
    }
  },

  saveNotebook(nb: Notebook): void {
    const list = this.getNotebooks();
    const idx = list.findIndex(n => n.id === nb.id);
    if (idx >= 0) {
      list[idx] = { ...nb, updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' };
    } else {
      list.unshift({ ...nb, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' });
    }
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(list));
    notifyListeners();
  },

  deleteNotebook(id: string): void {
    const list = this.getNotebooks().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(list));
    notifyListeners();
  },

  // Sources
  getSources(workspaceId?: string, notebookId?: string): Source[] {
    this.init();
    try {
      let list: Source[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.SOURCES) || '[]');
      if (workspaceId) list = list.filter(s => s.workspaceId === workspaceId);
      if (notebookId) list = list.filter(s => s.notebookId === notebookId);
      return list;
    } catch {
      return [];
    }
  },

  saveSource(source: Source): void {
    const list = this.getSources();
    const idx = list.findIndex(s => s.id === source.id);
    if (idx >= 0) {
      list[idx] = { ...source, updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' };
    } else {
      list.unshift({ ...source, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' });
    }
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(list));
    notifyListeners();
  },

  deleteSource(id: string): void {
    const list = this.getSources().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(list));
    notifyListeners();
  },

  // Notes
  getNotes(workspaceId?: string, notebookId?: string): Note[] {
    this.init();
    try {
      let list: Note[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES) || '[]');
      if (workspaceId) list = list.filter(n => n.workspaceId === workspaceId);
      if (notebookId) list = list.filter(n => n.notebookId === notebookId);
      return list;
    } catch {
      return [];
    }
  },

  saveNote(note: Note): void {
    const list = this.getNotes();
    const idx = list.findIndex(n => n.id === note.id);
    if (idx >= 0) {
      list[idx] = { ...note, updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' };
    } else {
      list.unshift({ ...note, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' });
    }
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    notifyListeners();
  },

  deleteNote(id: string): void {
    const list = this.getNotes().filter(n => n.id !== id);
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(list));
    notifyListeners();
  },

  createDefaultRafiMindMap(): MindMap {
    const wsId = this.getActiveWorkspaceId() || 'ws-default';
    return {
      id: 'mm-rafi-main',
      workspaceId: wsId,
      title: 'Rafi',
      layout: 'radial',
      rootNode: {
        id: 'rafia',
        label: 'Rafi',
        text: 'Rafi',
        color: '#4f46e5',
        isExpanded: true, // প্রাথমিক অবস্থায় খোলা থাকবে
        children: [
          {
            id: 'c1',
            label: 'Child 1',
            text: 'Child 1',
            color: '#0284c7',
            isExpanded: false, // collapsed initially
            children: [
              { id: 'c1-1', label: 'Subtopic 1.1', text: 'Subtopic 1.1', isExpanded: true, children: [] },
              { id: 'c1-2', label: 'Subtopic 1.2', text: 'Subtopic 1.2', isExpanded: true, children: [] }
            ]
          },
          {
            id: 'c2',
            label: 'Child 2',
            text: 'Child 2',
            color: '#059669',
            isExpanded: false, // collapsed initially
            children: [
              { id: 'c2-1', label: 'Subtopic 2.1', text: 'Subtopic 2.1', isExpanded: true, children: [] },
              { id: 'c2-2', label: 'Subtopic 2.2', text: 'Subtopic 2.2', isExpanded: true, children: [] }
            ]
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNCED'
    };
  },

  // Mind Maps
  getMindMaps(workspaceId?: string, notebookId?: string): MindMap[] {
    this.init();
    try {
      let list: MindMap[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MINDMAPS) || '[]');
      if (list.length === 0) {
        const defaultMap = this.createDefaultRafiMindMap();
        list = [defaultMap];
        localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify(list));
      }
      if (workspaceId) {
        const filtered = list.filter(m => m.workspaceId === workspaceId || !m.workspaceId);
        return filtered.length > 0 ? filtered : list;
      }
      if (notebookId) list = list.filter(m => m.notebookId === notebookId);
      return list;
    } catch {
      return [this.createDefaultRafiMindMap()];
    }
  },

  saveMindMap(map: MindMap): void {
    const list = this.getMindMaps();
    const idx = list.findIndex(m => m.id === map.id);
    if (idx >= 0) {
      list[idx] = { ...map, updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' };
    } else {
      list.unshift({ ...map, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncState: 'SYNC_PENDING' });
    }
    localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify(list));
    notifyListeners();
  },

  deleteMindMap(id: string): void {
    const list = this.getMindMaps().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify(list));
    notifyListeners();
  },

  // Quizzes
  getQuizzes(workspaceId?: string): Quiz[] {
    this.init();
    try {
      let list: Quiz[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
      if (workspaceId) list = list.filter(q => q.workspaceId === workspaceId);
      return list;
    } catch {
      return [];
    }
  },

  saveQuiz(quiz: Quiz): void {
    const list = this.getQuizzes();
    const idx = list.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      list[idx] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(quiz);
    }
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(list));
    notifyListeners();
  },

  getAttempts(): QuizAttempt[] {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ATTEMPTS) || '[]');
    } catch {
      return [];
    }
  },

  saveAttempt(attempt: QuizAttempt): void {
    const list = this.getAttempts();
    list.unshift(attempt);
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(list));
    notifyListeners();
  },

  // Flashcards
  getFlashcards(workspaceId?: string): Flashcard[] {
    this.init();
    try {
      let list: Flashcard[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLASHCARDS) || '[]');
      if (workspaceId) list = list.filter(f => f.workspaceId === workspaceId);
      return list;
    } catch {
      return [];
    }
  },

  saveFlashcard(card: Flashcard): void {
    const list = this.getFlashcards();
    const idx = list.findIndex(f => f.id === card.id);
    if (idx >= 0) {
      list[idx] = card;
    } else {
      list.unshift(card);
    }
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(list));
    notifyListeners();
  },

  // Settings
  getSettings(): UserSettings {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || JSON.stringify(INITIAL_SETTINGS));
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    notifyListeners();
  },

  // Optional: Explicitly load a sample customizable template upon user request
  loadSampleTemplate(): Workspace {
    const sampleWs: Workspace = {
      id: 'ws-sample-' + Date.now(),
      name: 'Computer Science & AI Research',
      description: 'Sample template demonstrating customizable notebooks, sources, and mind maps.',
      icon: 'Brain',
      themeColor: '#4f46e5',
      layout: 'standard',
      defaultLanguage: 'en',
      defaultMindMapStyle: 'radial',
      systemAiInstructions: 'Provide clear, academic answers with structured examples.',
      ownerId: 'user-rafi',
      collaborators: [
        { userId: 'user-rafi', name: 'Rafi Islam', email: 'rafinislamrafi68@gmail.com', role: 'OWNER', addedAt: new Date().toISOString(), status: 'active' },
        { userId: 'user-teacher', name: 'Dr. Sarah Smith', email: 'sarah@university.edu', role: 'TEACHER', addedAt: new Date().toISOString(), status: 'active' }
      ],
      notebookIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNCED'
    };

    const sampleNb: Notebook = {
      id: 'nb-sample-1',
      workspaceId: sampleWs.id,
      title: 'Neural Networks & Deep Learning',
      description: 'Foundations of artificial neural networks, backpropagation, and transformers.',
      icon: 'Cpu',
      color: '#4f46e5',
      sourceIds: [],
      noteIds: [],
      mindMapIds: [],
      quizIds: [],
      flashcardIds: [],
      isPinned: true,
      isFavorite: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNCED'
    };

    const sampleNote: Note = {
      id: 'note-sample-1',
      workspaceId: sampleWs.id,
      notebookId: sampleNb.id,
      title: 'Attention Mechanism & Transformers',
      content: '## Transformer Architecture\n\nThe core innovation of the Transformer is the **Self-Attention Mechanism** which computes attention weights across input tokens in parallel.\n\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$',
      tags: ['AI', 'Transformers', 'DeepLearning'],
      isPinned: true,
      isFavorite: true,
      commentsCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNCED'
    };

    const sampleMindMap: MindMap = {
      id: 'mm-sample-1',
      workspaceId: sampleWs.id,
      notebookId: sampleNb.id,
      title: 'Machine Learning Overview',
      layout: 'radial',
      rootNode: {
        id: 'root',
        text: 'Machine Learning',
        color: '#4f46e5',
        children: [
          {
            id: 'c1',
            text: 'Supervised Learning',
            children: [
              { id: 'c1-1', text: 'Classification' },
              { id: 'c1-2', text: 'Regression' }
            ]
          },
          {
            id: 'c2',
            text: 'Unsupervised Learning',
            children: [
              { id: 'c2-1', text: 'Clustering' },
              { id: 'c2-2', text: 'Dimensionality Reduction' }
            ]
          },
          {
            id: 'c3',
            text: 'Reinforcement Learning',
            children: [
              { id: 'c3-1', text: 'Policy Gradient' },
              { id: 'c3-2', text: 'Q-Learning' }
            ]
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'SYNCED'
    };

    this.saveWorkspace(sampleWs);
    this.saveNotebook(sampleNb);
    this.saveNote(sampleNote);
    this.saveMindMap(sampleMindMap);
    return sampleWs;
  },

  // Clear everything to a clean blank slate
  resetAllToBlank(): void {
    localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKSPACE_ID);
    notifyListeners();
  },

  // Export full JSON backup
  exportAllData(): string {
    const dump = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      workspaces: this.getWorkspaces(),
      notebooks: this.getNotebooks(),
      sources: this.getSources(),
      notes: this.getNotes(),
      mindmaps: this.getMindMaps(),
      quizzes: this.getQuizzes(),
      attempts: this.getAttempts(),
      flashcards: this.getFlashcards(),
      settings: this.getSettings()
    };
    return JSON.stringify(dump, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.workspaces) localStorage.setItem(STORAGE_KEYS.WORKSPACES, JSON.stringify(data.workspaces));
      if (data.notebooks) localStorage.setItem(STORAGE_KEYS.NOTEBOOKS, JSON.stringify(data.notebooks));
      if (data.sources) localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(data.sources));
      if (data.notes) localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes));
      if (data.mindmaps) localStorage.setItem(STORAGE_KEYS.MINDMAPS, JSON.stringify(data.mindmaps));
      if (data.quizzes) localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(data.quizzes));
      if (data.attempts) localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(data.attempts));
      if (data.flashcards) localStorage.setItem(STORAGE_KEYS.FLASHCARDS, JSON.stringify(data.flashcards));
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      notifyListeners();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
