import React from 'react';
import { AlertCircle, Smartphone, Laptop, GitMerge, Copy, Check } from 'lucide-react';
import { ConflictRecord } from '../types';

interface ConflictModalProps {
  conflict: ConflictRecord | null;
  onResolve: (resolution: 'keep_local' | 'keep_cloud' | 'merge' | 'copy') => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflict,
  onResolve
}) => {
  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Two versions found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              The note <span className="font-semibold text-slate-800 dark:text-slate-200">"{conflict.title}"</span> was modified on both this device and Google Drive. Please choose how to resolve this:
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Local Device Version */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Laptop className="w-4 h-4 text-indigo-500" />
                <span>This Device Version</span>
              </div>
              <div className="text-slate-400 mb-2">Updated: {conflict.localVersion.updatedAt}</div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed max-h-28 overflow-y-auto border border-slate-100 dark:border-slate-800">
                {conflict.localVersion.content}
              </div>
            </div>
          </div>

          {/* Cloud Version */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <Smartphone className="w-4 h-4 text-sky-500" />
                <span>Cloud Version ({conflict.cloudVersion.device})</span>
              </div>
              <div className="text-slate-400 mb-2">Updated: {conflict.cloudVersion.updatedAt}</div>
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed max-h-28 overflow-y-auto border border-slate-100 dark:border-slate-800">
                {conflict.cloudVersion.content}
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onResolve('keep_local')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-center transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 text-indigo-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Keep Device</span>
            <span className="text-[10px] text-slate-400">Overwrite cloud</span>
          </button>

          <button
            onClick={() => onResolve('keep_cloud')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 text-center transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 text-sky-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Keep Cloud</span>
            <span className="text-[10px] text-slate-400">Use Drive version</span>
          </button>

          <button
            onClick={() => onResolve('merge')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 text-center transition-colors cursor-pointer"
          >
            <GitMerge className="w-4 h-4 text-emerald-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Merge Both</span>
            <span className="text-[10px] text-slate-400">Combine edits</span>
          </button>

          <button
            onClick={() => onResolve('copy')}
            className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 text-center transition-colors cursor-pointer"
          >
            <Copy className="w-4 h-4 text-purple-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Separate Copy</span>
            <span className="text-[10px] text-slate-400">Keep as copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
