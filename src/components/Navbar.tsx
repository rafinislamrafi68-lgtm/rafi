import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Search, 
  AlertTriangle,
  Sparkles,
  Moon,
  Sun,
  Layers,
  ChevronDown,
  Plus,
  Users
} from 'lucide-react';
import { SyncService, SyncStateInfo } from '../services/syncService';
import { StorageService } from '../services/storage';
import { Workspace } from '../types';

interface NavbarProps {
  onOpenSearch: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onCreateWorkspace: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenSearch, 
  setActiveView,
  darkMode,
  setDarkMode,
  onCreateWorkspace
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncStateInfo>(SyncService.getState());
  const [workspaces, setWorkspaces] = useState<Workspace[]>(StorageService.getWorkspaces());
  const [activeWsId, setActiveWsId] = useState<string | null>(StorageService.getActiveWorkspaceId());
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);

  useEffect(() => {
    const unsubSync = SyncService.subscribe(setSyncInfo);
    const unsubStorage = StorageService.subscribe(() => {
      setWorkspaces(StorageService.getWorkspaces());
      setActiveWsId(StorageService.getActiveWorkspaceId());
    });
    return () => {
      unsubSync();
      unsubStorage();
    };
  }, []);

  const activeWorkspace = workspaces.find(w => w.id === activeWsId) || null;

  return (
    <header className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Zone 1: Brand Wordmark & Workspace Switcher */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:scale-105 transition-transform">
            R
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              RAFI Study
            </span>
            <span className="block text-[10px] text-slate-400 font-medium">
              Knowledge Platform
            </span>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Dynamic Workspace Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span className="max-w-[120px] sm:max-w-[160px] truncate">
              {activeWorkspace ? activeWorkspace.name : 'No Workspace'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isWsDropdownOpen && (
            <div 
              className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 z-50 text-xs"
              onClick={() => setIsWsDropdownOpen(false)}
            >
              <div className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">
                Your Workspaces ({workspaces.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      StorageService.setActiveWorkspaceId(ws.id);
                      setActiveView('dashboard');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition-colors ${
                      ws.id === activeWsId
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === activeWsId && <span className="text-[10px] text-indigo-600 font-bold">Active</span>}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={onCreateWorkspace}
                  className="w-full flex items-center gap-1.5 p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zone 2: Global Search Affordance (Ctrl + K) */}
      <div className="flex-1 max-w-sm mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs rounded-xl border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search notebooks, sources, notes, mind maps...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Zone 3: Connection Status & Global Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Offline toggle simulator */}
        <button
          onClick={() => SyncService.toggleSimulatedOffline()}
          title="Click to toggle offline simulation for test"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
            syncInfo.status === 'OFFLINE'
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
          }`}
        >
          {syncInfo.status === 'OFFLINE' ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="font-semibold tracking-wider text-[11px]">OFFLINE</span>
            </>
          ) : syncInfo.status === 'SYNCING' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              <span className="font-semibold tracking-wider text-[11px] text-indigo-600">SYNCING</span>
            </>
          ) : syncInfo.status === 'SYNC_ERROR' ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-semibold tracking-wider text-[11px] text-rose-600">SYNC ERROR</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="font-semibold tracking-wider text-[11px]">ONLINE</span>
            </>
          )}
        </button>

        {/* Role Badge */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span>OWNER</span>
        </div>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle Light/Dark Theme"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mind Map Shortcut Button */}
        <button
          onClick={() => setActiveView('mindmaps')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mind Map</span>
        </button>
      </div>
    </header>
  );
};
