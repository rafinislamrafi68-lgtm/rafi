import React, { useState } from 'react';
import { 
  Users, 
  Share2, 
  Plus, 
  Copy, 
  Check, 
  ShieldCheck, 
  Mail, 
  UserPlus, 
  X,
  Lock,
  Globe
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Workspace, UserRole } from '../types';

export const CollaboratorsPage: React.FC = () => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const workspaces = StorageService.getWorkspaces();
  const activeWs = workspaces.find(w => w.id === activeWsId) || workspaces[0] || null;

  const [isCopied, setIsCopied] = useState(false);
  const [sharePermission, setSharePermission] = useState<'private' | 'view' | 'edit'>('view');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER');

  const shareLink = activeWs ? `https://rafi-study.app/share/${activeWs.id}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim() || !activeWs) return;

    activeWs.collaborators.push({
      userId: 'user-' + Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      addedAt: new Date().toISOString(),
      status: 'active'
    });

    StorageService.saveWorkspace(activeWs);
    setIsInviteOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  if (!activeWs) {
    return (
      <div className="p-12 text-center text-slate-400">
        Please create or select a workspace first to manage collaborators.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Collaboration, Roles & Sharing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Invite teachers, study partners, or classmates. Control permissions and generate shareable links.
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Share Link Generation Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Workspace Share Link
            </h2>
            <p className="text-xs text-slate-400">
              Anyone with this link can join based on your access rules.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
          <div className="flex-1 flex items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
            <span className="truncate">{shareLink}</span>
          </div>
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="perm" 
              checked={sharePermission === 'view'} 
              onChange={() => setSharePermission('view')} 
            />
            <span>Anyone with link can view (Read-only)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="radio" 
              name="perm" 
              checked={sharePermission === 'edit'} 
              onChange={() => setSharePermission('edit')} 
            />
            <span>Anyone with link can edit (Collaborative)</span>
          </label>
        </div>
      </div>

      {/* Role Hierarchy Definition */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Active Collaborators ({activeWs.collaborators.length})
        </h2>

        <div className="space-y-2">
          {activeWs.collaborators.map(c => (
            <div
              key={c.userId}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{c.name}</div>
                  <div className="text-[11px] text-slate-400">{c.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {c.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Definitions Explainer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="font-bold text-slate-800 dark:text-slate-200">TEACHER</div>
          <p className="text-slate-400 text-[11px]">Can create/edit educational content, quizzes, and publish sources.</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="font-bold text-slate-800 dark:text-slate-200">EDITOR</div>
          <p className="text-slate-400 text-[11px]">Can edit shared notes, mind maps, and add personal comments.</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1">
          <div className="font-bold text-slate-800 dark:text-slate-200">VIEWER</div>
          <p className="text-slate-400 text-[11px]">Read-only access to study materials, textbooks, and quizzes.</p>
        </div>
      </div>

      {/* Modal: Invite */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Invite Collaborator</h3>
              <button onClick={() => setIsInviteOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Chen"
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
                  placeholder="e.g. alex@studygroup.org"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Permission Role
                </label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none"
                >
                  <option value="TEACHER">TEACHER (Can create/edit educational content)</option>
                  <option value="EDITOR">EDITOR (Can edit notes & mind maps)</option>
                  <option value="MEMBER">MEMBER (Can view and participate)</option>
                  <option value="VIEWER">VIEWER (Read-only)</option>
                  <option value="ADMIN">ADMIN (Full management)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
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
