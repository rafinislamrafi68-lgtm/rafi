import { SyncConnectionStatus, ConflictRecord } from '../types';
import { StorageService } from './storage';

export interface SyncStateInfo {
  status: SyncConnectionStatus;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  lastSyncedAt: string | null;
  pendingChangesCount: number;
  activeConflict: ConflictRecord | null;
  driveConnected: boolean;
  driveAccount: string;
}

type SyncListener = (state: SyncStateInfo) => void;
const syncListeners: Set<SyncListener> = new Set();

let currentState: SyncStateInfo = {
  status: 'ONLINE',
  isOnline: navigator.onLine,
  isSimulatedOffline: false,
  lastSyncedAt: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  pendingChangesCount: 0,
  activeConflict: null,
  driveConnected: true,
  driveAccount: 'rafinislamrafi68@gmail.com'
};

function notify() {
  syncListeners.forEach(listener => listener({ ...currentState }));
}

// Window online/offline listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (!currentState.isSimulatedOffline) {
      currentState.isOnline = true;
      currentState.status = 'ONLINE';
      notify();
    }
  });

  window.addEventListener('offline', () => {
    currentState.isOnline = false;
    currentState.status = 'OFFLINE';
    notify();
  });
}

export const SyncService = {
  getState(): SyncStateInfo {
    return { ...currentState };
  },

  subscribe(listener: SyncListener): () => void {
    syncListeners.add(listener);
    listener({ ...currentState });
    return () => syncListeners.delete(listener);
  },

  // Toggle offline simulation for testing offline-first capabilities
  toggleSimulatedOffline(): void {
    currentState.isSimulatedOffline = !currentState.isSimulatedOffline;
    if (currentState.isSimulatedOffline) {
      currentState.isOnline = false;
      currentState.status = 'OFFLINE';
    } else {
      currentState.isOnline = navigator.onLine;
      currentState.status = navigator.onLine ? 'ONLINE' : 'OFFLINE';
    }
    notify();
  },

  triggerSyncNow(): Promise<{ success: boolean; message: string }> {
    if (currentState.status === 'OFFLINE' || !currentState.isOnline) {
      currentState.status = 'SYNC_ERROR';
      notify();
      return Promise.resolve({
        success: false,
        message: 'Cannot sync while offline. Changes are saved locally on this device.'
      });
    }

    currentState.status = 'SYNCING';
    notify();

    return new Promise((resolve) => {
      setTimeout(() => {
        // Mark all workspaces & notes as SYNCED
        const workspaces = StorageService.getWorkspaces().map(w => ({ ...w, syncState: 'SYNCED' as const }));
        const notes = StorageService.getNotes().map(n => ({ ...n, syncState: 'SYNCED' as const }));
        localStorage.setItem('rafi_study_workspaces', JSON.stringify(workspaces));
        localStorage.setItem('rafi_study_notes', JSON.stringify(notes));

        currentState.status = 'ONLINE';
        currentState.lastSyncedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        currentState.pendingChangesCount = 0;
        notify();
        resolve({
          success: true,
          message: 'All study materials synchronized with Google Drive (RAFI_Study backup).'
        });
      }, 1500);
    });
  },

  simulateConflict(): void {
    currentState.activeConflict = {
      entityType: 'note',
      entityId: 'note-1',
      title: 'Neural Networks Overview',
      localVersion: {
        content: 'Transformer architecture notes updated with multi-head attention math. (Local Device)',
        updatedAt: 'Today, 10:14 AM',
        device: 'This Windows PC'
      },
      cloudVersion: {
        content: 'Transformer architecture notes with code snippets added from Android. (Cloud)',
        updatedAt: 'Today, 09:42 AM',
        device: 'Android Phone (Rafi Galaxy)'
      }
    };
    currentState.status = 'ONLINE';
    notify();
  },

  resolveConflict(resolution: 'keep_local' | 'keep_cloud' | 'merge' | 'copy'): void {
    if (!currentState.activeConflict) return;

    const note = StorageService.getNotes().find(n => n.id === currentState.activeConflict?.entityId);
    if (note) {
      if (resolution === 'keep_cloud') {
        note.content += '\n\n*(Updated from Google Drive version)*';
        StorageService.saveNote(note);
      } else if (resolution === 'merge') {
        note.content += `\n\n### Merged Cloud Content (from Android):\n${currentState.activeConflict.cloudVersion.content}`;
        StorageService.saveNote(note);
      } else if (resolution === 'copy') {
        const copyNote = {
          ...note,
          id: 'note-copy-' + Date.now(),
          title: `${note.title} (Cloud Copy)`,
          content: `${note.content}\n\n### Cloud Version:\n${currentState.activeConflict.cloudVersion.content}`
        };
        StorageService.saveNote(copyNote);
      }
    }

    currentState.activeConflict = null;
    currentState.status = 'ONLINE';
    notify();
  },

  setDriveConnected(connected: boolean): void {
    currentState.driveConnected = connected;
    const settings = StorageService.getSettings();
    settings.driveConnected = connected;
    StorageService.saveSettings(settings);
    notify();
  }
};
