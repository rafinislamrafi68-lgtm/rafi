import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Cpu, 
  Cloud, 
  Files, 
  CheckCircle,
  Copy,
  RotateCcw
} from 'lucide-react';
import { AIMode, AIMessage } from '../types';
import { AIService, AI_MODES } from '../services/aiService';
import { SyncService } from '../services/syncService';
import { StorageService } from '../services/storage';

interface AIAssistantPageProps {
  initialPrompt?: string;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ initialPrompt = '' }) => {
  const activeWsId = StorageService.getActiveWorkspaceId();
  const workspaces = StorageService.getWorkspaces();
  const activeWs = workspaces.find(w => w.id === activeWsId);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Welcome to **RAFI Study AI Assistant**!\n\nI answer your questions grounded directly in your **uploaded sources, textbooks, and notes**.\n\nChoose an AI mode below to begin:`,
      provider: 'cloud',
      timestamp: 'Now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt);
  const [selectedMode, setSelectedMode] = useState<AIMode>('explain');
  const [isLoading, setIsLoading] = useState(false);

  const syncState = SyncService.getState();
  const isOffline = syncState.status === 'OFFLINE' || !syncState.isOnline;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: text,
      provider: isOffline ? 'on_device' : 'cloud',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await AIService.askAssistant(text, selectedMode, activeWsId || undefined);
      setMessages(prev => [...prev, response]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'Unable to process query. Your local offline database is secure. Please try again.',
          provider: 'on_device',
          timestamp: 'Now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Explain the core concept in my notes',
    'Summarize my active sources into key bullet points',
    'Generate an exam answer with headings',
    'Structure a mind map from this topic'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 h-[calc(100vh-100px)] flex flex-col justify-between">
      {/* Header & Provider Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">
              AI Study Assistant
            </h1>
            <p className="text-xs text-slate-400">
              {activeWs ? `Workspace: ${activeWs.name} · Source-grounded intelligence` : 'Source-grounded intelligence'}
            </p>
          </div>
        </div>

        {/* AI Hardware / Engine Badge */}
        <div className="flex items-center gap-2">
          {isOffline ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400">
              <Cpu className="w-3.5 h-3.5" />
              <span>On-device AI (Offline)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400">
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud AI (Gemini 2.5 Active)</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Modes Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl shrink-0 text-xs">
        {AI_MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedMode === mode.id
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-2">
              <span>{msg.role === 'user' ? 'You' : 'RAFI AI Assistant'}</span>
              <span>·</span>
              <span>{msg.timestamp}</span>
              {msg.provider && (
                <span className="text-[10px] font-mono text-slate-400">({msg.provider === 'cloud' ? 'Cloud' : 'Device'})</span>
              )}
            </div>

            <div
              className={`p-4 rounded-2xl max-w-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {msg.content}
              </div>

              {msg.citedSources && msg.citedSources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Files className="w-3.5 h-3.5 shrink-0" />
                  <span>Citations: {msg.citedSources.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl w-fit">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Analyzing your sources and formulating response...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs shrink-0 py-1">
        <span className="text-slate-400 shrink-0 font-medium">Suggestions:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-300 rounded-lg whitespace-nowrap cursor-pointer transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Bottom Prompt Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0"
      >
        <input
          type="text"
          placeholder={`Ask AI (${AI_MODES.find(m => m.id === selectedMode)?.label} mode)...`}
          value={inputPrompt}
          onChange={e => setInputPrompt(e.target.value)}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
