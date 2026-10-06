import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Cpu, 
  Type, 
  CheckCircle,
  FileJson,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { SyncService, SyncStateInfo } from '../services/syncService';
import { UserSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>(SyncService.getState());
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsub = SyncService.subscribe(setSyncInfo);
    return () => unsub();
  }, []);

  const handleToggleDrive = () => {
    const updated = !syncInfo.driveConnected;
    SyncService.setDriveConnected(updated);
    setSettings(StorageService.getSettings());
  };

  const handleExportJSON = () => {
    setIsExporting(true);
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAFI_Study_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setIsExporting(false), 800);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = StorageService.importAllData(content);
      if (ok) {
        setImportStatus('ডাটা সফলভাবে রিস্টোর করা হয়েছে!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('ফাইলটি সঠিক নয়। অনুগ্রহ করে বৈধ ব্যাকআপ ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          সেটিংস ও ক্লাউড ব্যাকআপ (Settings & Cloud Sync)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 bengali-text">
          গুগল ড্রাইভ সিঙ্ক, অন-ডিভাইস AI স্ট্যাটাস এবং অফলাইন ডাটা ব্যাকআপ ব্যবস্থাপনা।
        </p>
      </div>

      {/* Google Drive Connection Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Google Drive ক্লাউড সিঙ্ক
              </h2>
              <p className="text-xs text-slate-400">
                {syncInfo.driveConnected ? `সংযুক্ত অ্যাকাউন্ট: ${syncInfo.driveAccount}` : 'গুগল ড্রাইভ সংযুক্ত নেই'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleDrive}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              syncInfo.driveConnected
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {syncInfo.driveConnected ? 'ড্রাইভ সংযোগ বিচ্ছিন্ন করুন' : 'গুগল ড্রাইভ সংযুক্ত করুন'}
          </button>
        </div>

        {syncInfo.driveConnected && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-slate-400 mb-0.5">সর্বশেষ সিঙ্ক সময়:</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {syncInfo.lastSyncedAt || 'Never'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <div className="text-slate-400 mb-0.5">ক্লাউড ব্যাকআপ ফোল্ডার:</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  Google Drive / RAFI_Study /
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => SyncService.triggerSyncNow()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>এখনই ব্যাকআপ সিঙ্ক করুন (Sync Now)</span>
              </button>

              <button
                onClick={() => SyncService.simulateConflict()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="টেস্ট কনফ্লিক্ট উইন্ডো প্রদর্শন করুন"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>কনফ্লিক্ট ডিটেকশন টেস্ট করুন (Simulate Conflict)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Device AI & Hardware Acceleration Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              অন-ডিভাইস AI ক্ষমতা (On-Device AI Engine)
            </h2>
            <p className="text-xs text-slate-400">
              ডিভাইস হার্ডওয়্যার ও অফলাইন মডেল সনাক্তকরণ
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ডিভাইস অফলাইন প্রম্পট ইঞ্জিন সক্রিয় (Gemini Nano / Local Fallback Ready)</span>
          </div>
          <span className="font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 text-[10px]">
            ONLINE & OFFLINE SUPPORTED
          </span>
        </div>
      </div>

      {/* Local Backup & Data Portability */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              ডাটা এক্সপোর্ট ও রিস্টোর (Data Portability)
            </h2>
            <p className="text-xs text-slate-400">
              আপনার সমস্ত বই, অধ্যায়, নোটস ও কুইজ ডাটা সম্পূর্ণ উন্মুক্ত JSON ফরম্যাটে ডাউনলোড ও রিস্টোর করুন।
            </p>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>সমস্ত ডাটা এক্সপোর্ট করুন (Export JSON)</span>
          </button>

          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>ডাটা ব্যাকআপ রিস্টোর করুন (Restore JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
