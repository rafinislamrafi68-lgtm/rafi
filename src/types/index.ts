export type UserRole = 'OWNER' | 'ADMIN' | 'TEACHER' | 'EDITOR' | 'MEMBER' | 'VIEWER';

export type SyncConnectionStatus = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'SYNC_ERROR' | 'CONFLICT';

export type EntitySyncState = 'LOCAL_ONLY' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';

export type LayoutMode = 'radial' | 'tree' | 'left_to_right' | 'right_to_left' | 'top_to_bottom' | 'flow';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  isOnline?: boolean;
}

export interface WorkspacePermission {
  canEdit: boolean;
  canInvite: boolean;
  canManageSources: boolean;
  canExport: boolean;
  canDelete: boolean;
}

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  addedAt: string;
  status: 'active' | 'invited';
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string; // Emoji or Lucide icon identifier
  coverUrl?: string;
  themeColor: string;
  layout: 'standard' | 'compact' | 'focus';
  defaultLanguage: 'en' | 'bn' | 'auto';
  systemAiInstructions?: string;
  defaultMindMapStyle: LayoutMode;
  ownerId: string;
  collaborators: Collaborator[];
  notebookIds: string[];
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export interface Notebook {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  folderPath?: string; // nested folder path e.g. "School/Term1/Math"
  sourceIds: string[];
  noteIds: string[];
  mindMapIds: string[];
  quizIds: string[];
  flashcardIds: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export type SourceType = 'pdf' | 'docx' | 'txt' | 'web_url' | 'markdown' | 'copied_text';

export interface Source {
  id: string;
  workspaceId: string;
  notebookId?: string;
  title: string;
  type: SourceType;
  fileSize?: string;
  content: string; // Extracted text or body
  url?: string;
  totalPages?: number;
  currentPage?: number;
  isOfflineCached: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export interface Note {
  id: string;
  workspaceId: string;
  notebookId?: string;
  sourceId?: string; // Optional link to a source
  title: string;
  content: string; // Markdown or rich text
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export interface MindMapNode {
  id: string;
  text?: string;
  label?: string; // Support label alias
  description?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  linkUrl?: string;
  isExpanded?: boolean; // Primary expansion flag: true = open, false = closed
  collapsed?: boolean;
  children?: MindMapNode[];
}

export interface MindMap {
  id: string;
  workspaceId: string;
  notebookId?: string;
  sourceId?: string;
  title: string;
  layout: LayoutMode;
  rootNode: MindMapNode;
  activeCollaborators?: string[]; // user names currently viewing/editing
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'fill_in_the_blank';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  topicTag: string;
}

export interface Quiz {
  id: string;
  workspaceId: string;
  notebookId?: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
  syncState: EntitySyncState;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  workspaceId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeTakenSeconds: number;
  weakTopics: string[];
  completedAt: string;
}

export interface Flashcard {
  id: string;
  workspaceId: string;
  notebookId?: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'unreviewed';
  lastReviewedAt?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  targetType: 'note' | 'mindmap' | 'source' | 'quiz';
  targetId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export type AIMode = 
  | 'explain'        // Explain / Simplify
  | 'summarize'      // Summarize
  | 'exam_answer'    // Exam / Academic answer
  | 'short_notes'    // Bullet notes
  | 'generate_mindmap' // Mind Map Generation
  | 'generate_quiz'    // Quiz & MCQ generation
  | 'flashcards'     // Flashcard creation
  | 'compare_sources';// Compare multiple sources

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: AIMode;
  provider: 'cloud' | 'on_device';
  citedSources?: string[];
  timestamp: string;
}

export interface ConflictRecord {
  entityType: 'workspace' | 'notebook' | 'note' | 'mindmap' | 'source';
  entityId: string;
  title: string;
  localVersion: {
    content: string;
    updatedAt: string;
    device: string;
  };
  cloudVersion: {
    content: string;
    updatedAt: string;
    device: string;
  };
}

export interface UserSettings {
  userName: string;
  email: string;
  role: UserRole;
  currentWorkspaceId?: string;
  driveConnected: boolean;
  driveAccountEmail?: string;
  autoSync: boolean;
  syncFrequencyMinutes: number;
  onDeviceAISupported: boolean;
  preferOfflineAI: boolean;
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  dashboardWidgets: string[];
}
