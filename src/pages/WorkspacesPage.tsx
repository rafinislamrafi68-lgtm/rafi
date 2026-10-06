import React, { useState } from 'react';
import { 
  FolderPlus, 
  Trash2, 
  Edit3, 
  Plus, 
  Layers, 
  Users, 
  Sparkles, 
  Check, 
  X, 
  RotateCcw,
  Palette,
  Shield,
  Bot
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Workspace, UserRole } from '../types';

export const WorkspacesPage: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(StorageService.getWorkspaces());
  const [activeWsId, setActiveWsId] = useState<string | null>(StorageService.getActiveWorkspaceId());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // New Workspace form
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [aiInstructions, setAiInstructions] = useState('');
  const [mindMapStyle, setMindMapStyle] = useState<'radial' | 'tree' | 'left_to_right'>('radial');

  // New Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER');

  const refresh = () => {
    setWorkspaces(StorageService.getWorkspaces());
    setActiveWsId(StorageService.getActiveWorkspaceId());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWs: Workspace = {
      id: 'ws-' + Date.now(),
      name: name.trim(),
      description: desc.trim() || undefined,
      icon: 'Folder',
      themeColor,
      layout: 'standard',
      defaultLanguage: 'auto',
      defaultMindMapStyle: mindMapStyle,
      systemAiInstructions: aiInstructions.trim() || undefined,
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

    StorageService.saveWorkspace(newWs);
    refresh();
    setIsAddModalOpen(false);
    setName('');
    setDesc('');
    setAiInstructions('');
  };

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !activeWsId) return;

    const targetWs = workspaces.find(w => w.id === activeWsId);
    if (targetWs) {
      targetWs.collaborators.push({
        userId: 'collab-' + Date.now(),
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        addedAt: new Date().toISOString(),
        status: 'active'
      });
      StorageService.saveWorkspace(targetWs);
      refresh();
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this workspace and all nested notebooks?')) {
      StorageService.deleteWorkspace(id);
      refresh();
    }
  };

  const handleReset = () => {
    if (confirm('Clear all workspaces and reset to clean blank state?')) {
      StorageService.resetAllToBlank();
      refresh();
    }
  };

  const activeWs = workspaces.find(w => w.id === activeWsId) || workspaces[0] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Custom Workspaces & Knowledge Structure
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define your learning domain: School, University, Coding, Research, Business, or PKM.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Reset to blank slate"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Workspaces list */}
        <div className="space-y-3 md:col-span-1">
          <div className="text-xs font-semibold text-slate-400 uppercase">
            All Workspaces ({workspaces.length})
          </div>

          {workspaces.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-xs text-slate-400">
              No workspaces created yet. Click "+ Create Workspace" above.
            </div>
          ) : (
            <div className="space-y-2">
              {workspaces.map(ws => {
                const isActive = ws.id === activeWsId;
                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      StorageService.setActiveWorkspaceId(ws.id);
                      refresh();
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ws.themeColor }}
                        />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {ws.name}
                        </h3>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">Active</span>
                      )}
                    </div>
                    {ws.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{ws.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Selected Workspace Configuration & Collaborators */}
        {activeWs ? (
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: activeWs.themeColor }}
                  >
                    {activeWs.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {activeWs.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Created: {new Date(activeWs.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Invite Collaborator</span>
                  </button>
                  <button
                    onClick={() => handleDelete(activeWs.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workspace Settings Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-purple-500" />
                    <span>Custom System AI Prompt</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {activeWs.systemAiInstructions || 'Default educational assistant behavior.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Default Mind Map Style</span>
                  </div>
                  <p className="text-slate-400 text-[11px] font-mono capitalize">
                    {activeWs.defaultMindMapStyle} layout
                  </p>
                </div>
              </div>

              {/* Collaborators List & Role Permissions */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase">
                  Collaborators & Role-Based Access ({activeWs.collaborators.length})
                </div>

                <div className="space-y-2">
                  {activeWs.collaborators.map(c => (
                    <div
                      key={c.userId}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {c.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Modal: Create Workspace */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create Workspace</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University Semester 1, Computer Science, Personal Knowledge Base"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Collaborative notes and research papers"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Custom System AI Directive
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Always explain in simple Bengali with exam-ready bullet points."
                  value={aiInstructions}
                  onChange={e => setAiInstructions(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-2">
                    {['#4f46e5', '#0284c7', '#059669', '#ea580c', '#7c3aed', '#db2777'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setThemeColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${themeColor === c ? 'scale-110 ring-2 ring-slate-900 dark:ring-white' : ''}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Default Mind Map Layout
                  </label>
                  <select
                    value={mindMapStyle}
                    onChange={e => setMindMapStyle(e.target.value as any)}
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  >
                    <option value="radial">Radial Layout</option>
                    <option value="tree">Hierarchical Tree</option>
                    <option value="left_to_right">Left-to-Right</option>
                  </select>
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
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Collaborator */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Collaborator</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Smith"
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@university.edu"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
                >
                  <option value="TEACHER">TEACHER (Can manage education content)</option>
                  <option value="EDITOR">EDITOR (Can edit notes & mind maps)</option>
                  <option value="MEMBER">MEMBER (Can view & participate)</option>
                  <option value="VIEWER">VIEWER (Read-only access)</option>
                  <option value="ADMIN">ADMIN (Full management)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
