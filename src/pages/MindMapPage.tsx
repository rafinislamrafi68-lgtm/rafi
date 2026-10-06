import React, { useState, useEffect } from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Upload, 
  Sparkles, 
  Edit2, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  X, 
  Code, 
  List, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  FolderTree,
  Maximize2
} from 'lucide-react';
import { MindMap, MindMapNode } from '../types';
import { StorageService } from '../services/storage';
import { 
  DEFAULT_USER_MINDMAP_CODE, 
  parseMindMapInput, 
  normalizeMindMapNode 
} from '../utils/mindMapParser';

type CreateTabMode = 'code' | 'visual' | 'outline' | 'ai';

interface VisualBranchItem {
  id: string;
  label: string;
  isExpanded: boolean;
  subitems: string[];
}

export const MindMapPage: React.FC = () => {
  const [mindmaps, setMindmaps] = useState<MindMap[]>(() => StorageService.getMindMaps());
  const [selectedMapId, setSelectedMapId] = useState<string>(() => mindmaps[0]?.id || 'mm-rafi-main');
  const [zoom, setZoom] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('rafia');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeEditText, setNodeEditText] = useState('');
  
  // Toast notifications (replaces window.alert)
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // In-app delete confirmation modal (replaces window.confirm)
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);

  // Live Outline Drawer (allows user to type mind map directly while looking at canvas)
  const [isOutlineDrawerOpen, setIsOutlineDrawerOpen] = useState(false);
  const [liveOutlineText, setLiveOutlineText] = useState('');

  // Create Canvas Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTab, setCreateTab] = useState<CreateTabMode>('code');
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states for Create Modal
  // 1. Code mode
  const [codeSnippet, setCodeSnippet] = useState<string>(DEFAULT_USER_MINDMAP_CODE);
  
  // 2. Visual mode
  const [visualTopic, setVisualTopic] = useState('Rafi');
  const [visualBranches, setVisualBranches] = useState<VisualBranchItem[]>([
    { id: 'b1', label: 'Child 1', isExpanded: false, subitems: ['Subtopic 1.1', 'Subtopic 1.2'] },
    { id: 'b2', label: 'Child 2', isExpanded: false, subitems: ['Subtopic 2.1', 'Subtopic 2.2'] }
  ]);

  // 3. Outline mode
  const [outlineInput, setOutlineInput] = useState<string>(
`Rafi
  Child 1 (closed)
    Subtopic 1.1
    Subtopic 1.2
  Child 2 (closed)
    Subtopic 2.1
    Subtopic 2.2`
  );

  // 4. AI mode
  const [aiTopicInput, setAiTopicInput] = useState('');

  // Subscribe to storage changes
  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      const list = StorageService.getMindMaps();
      setMindmaps(list);
    });
    return () => unsub();
  }, []);

  // Guarantee valid selection
  useEffect(() => {
    if (!selectedMapId && mindmaps.length > 0) {
      setSelectedMapId(mindmaps[0].id);
    }
  }, [mindmaps, selectedMapId]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Safe active map with fallback to default Rafi map
  const activeMap: MindMap = mindmaps.find(m => m.id === selectedMapId) || mindmaps[0] || StorageService.createDefaultRafiMindMap();

  const refreshMap = (updated: MindMap) => {
    StorageService.saveMindMap(updated);
    const list = StorageService.getMindMaps();
    setMindmaps(list);
    setSelectedMapId(updated.id);
  };

  // Sync Live Outline text when activeMap changes
  useEffect(() => {
    if (activeMap) {
      const buildOutlineString = (node: MindMapNode, depth: number = 0): string => {
        const indent = '  '.repeat(depth);
        const stateTag = node.isExpanded === false ? ' (closed)' : '';
        const line = `${indent}${node.label || node.text || 'Node'}${stateTag}`;
        const childrenLines = (node.children || []).map(c => buildOutlineString(c, depth + 1)).join('\n');
        return childrenLines ? `${line}\n${childrenLines}` : line;
      };
      setLiveOutlineText(buildOutlineString(activeMap.rootNode));
    }
  }, [activeMap.id]);

  // Helper to locate node in tree
  const findNode = (root: MindMapNode, id: string): MindMapNode | null => {
    if (root.id === id) return root;
    for (const child of root.children || []) {
      const found = findNode(child, id);
      if (found) return found;
    }
    return null;
  };

  // Toggle expand/collapse for a specific node (isExpanded: true / false)
  const handleToggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    const target = findNode(cloned.rootNode, nodeId);
    if (target) {
      const isCurrentlyExpanded = target.isExpanded !== undefined ? target.isExpanded : (target.collapsed !== true);
      target.isExpanded = !isCurrentlyExpanded;
      target.collapsed = isCurrentlyExpanded;
      refreshMap(cloned);
    }
  };

  // Expand All or Collapse All branches
  const handleSetAllExpanded = (expand: boolean) => {
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    const updateRecursive = (node: MindMapNode) => {
      node.isExpanded = expand;
      node.collapsed = !expand;
      (node.children || []).forEach(updateRecursive);
    };
    updateRecursive(cloned.rootNode);
    refreshMap(cloned);
    showToast(expand ? 'All branches expanded' : 'All branches collapsed', 'info');
  };

  // Add child node to selected parent
  const handleAddChild = (parentId: string) => {
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    const parent = findNode(cloned.rootNode, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.isExpanded = true; // Ensure parent is expanded so new child is visible
      parent.collapsed = false;

      const newId = `node-${Date.now()}`;
      const newChild: MindMapNode = {
        id: newId,
        label: 'New Child Node',
        text: 'New Child Node',
        isExpanded: true,
        children: []
      };
      parent.children.push(newChild);
      refreshMap(cloned);
      setSelectedNodeId(newId);
      setEditingNodeId(newId);
      setNodeEditText('New Child Node');
      showToast('New child node added', 'success');
    }
  };

  // Add sibling node at the same level
  const handleAddSibling = (nodeId: string) => {
    if (nodeId === activeMap.rootNode.id) {
      handleAddChild(nodeId);
      return;
    }
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    let foundParent: MindMapNode | null = null;
    const findParent = (current: MindMapNode) => {
      if (current.children?.some(c => c.id === nodeId)) {
        foundParent = current;
        return;
      }
      current.children?.forEach(findParent);
    };
    findParent(cloned.rootNode);

    if (foundParent) {
      const p = foundParent as MindMapNode;
      const newId = `node-${Date.now()}`;
      const newSibling: MindMapNode = {
        id: newId,
        label: 'New Topic',
        text: 'New Topic',
        isExpanded: true,
        children: []
      };
      p.children = p.children || [];
      p.children.push(newSibling);
      refreshMap(cloned);
      setSelectedNodeId(newId);
      setEditingNodeId(newId);
      setNodeEditText('New Topic');
      showToast('New sibling node added', 'success');
    }
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    if (id === activeMap.rootNode.id) {
      showToast('Central root topic cannot be deleted.', 'error');
      return;
    }
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    const removeRecursive = (parent: MindMapNode) => {
      parent.children = (parent.children || []).filter(c => c.id !== id);
      parent.children.forEach(removeRecursive);
    };
    removeRecursive(cloned.rootNode);
    refreshMap(cloned);
    setSelectedNodeId(cloned.rootNode.id);
    showToast('Node deleted', 'info');
  };

  // Start inline editing
  const handleStartEditNode = (node: MindMapNode) => {
    setEditingNodeId(node.id);
    setNodeEditText(node.label || node.text || '');
  };

  // Save inline editing
  const handleSaveNodeEdit = () => {
    if (!editingNodeId) return;
    const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
    const target = findNode(cloned.rootNode, editingNodeId);
    if (target && nodeEditText.trim()) {
      target.label = nodeEditText.trim();
      target.text = nodeEditText.trim();
      refreshMap(cloned);
    }
    setEditingNodeId(null);
  };

  // Live Drawer Outline Update
  const handleSaveLiveOutline = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = parseMindMapInput(liveOutlineText);
      const cloned = JSON.parse(JSON.stringify(activeMap)) as MindMap;
      cloned.title = parsed.title || cloned.title;
      cloned.rootNode = parsed.rootNode;
      refreshMap(cloned);
      setIsOutlineDrawerOpen(false);
      showToast('Mind Map updated from outline!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not parse outline', 'error');
    }
  };

  // Visual tab branch helpers
  const handleAddVisualBranch = () => {
    const nextIdx = visualBranches.length + 1;
    setVisualBranches(prev => [
      ...prev,
      {
        id: 'b-' + Date.now(),
        label: `Child ${nextIdx}`,
        isExpanded: false,
        subitems: [`Subtopic ${nextIdx}.1`]
      }
    ]);
  };

  const handleRemoveVisualBranch = (id: string) => {
    setVisualBranches(prev => prev.filter(b => b.id !== id));
  };

  const handleToggleVisualBranchExpanded = (id: string) => {
    setVisualBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, isExpanded: !b.isExpanded } : b))
    );
  };

  // -----------------------------------------------------------------
  // MAIN "CREATE CANVAS" SUBMISSION HANDLER
  // -----------------------------------------------------------------
  const handleCreateCanvas = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setModalError(null);

    try {
      const wsId = StorageService.ensureActiveWorkspaceId();
      let createdTitle = 'Mind Map';
      let rootNode: MindMapNode;

      if (createTab === 'code') {
        // Parse user JS code structure (e.g. const mindMapData = ...)
        const parsed = parseMindMapInput(codeSnippet);
        createdTitle = parsed.title || 'Rafi';
        rootNode = parsed.rootNode;
      } else if (createTab === 'visual') {
        // Build directly from visual form fields
        createdTitle = visualTopic.trim() || 'Rafi';
        rootNode = {
          id: 'rafia',
          label: createdTitle,
          text: createdTitle,
          color: '#4f46e5',
          isExpanded: true, // Central node initially open
          children: visualBranches.map((b, idx) => ({
            id: `c${idx + 1}`,
            label: b.label || `Child ${idx + 1}`,
            text: b.label || `Child ${idx + 1}`,
            color: idx % 2 === 0 ? '#0284c7' : '#059669',
            isExpanded: b.isExpanded, // Respected boolean: true = open, false = closed initially
            collapsed: !b.isExpanded,
            children: (b.subitems || []).map((sub, sIdx) => ({
              id: `c${idx + 1}-${sIdx + 1}`,
              label: sub,
              text: sub,
              isExpanded: true,
              children: []
            }))
          }))
        };
      } else if (createTab === 'outline') {
        // Parse from indented text
        const parsed = parseMindMapInput(outlineInput);
        createdTitle = parsed.title || 'Mind Map';
        rootNode = parsed.rootNode;
      } else if (createTab === 'ai') {
        // AI Generator
        const topic = aiTopicInput.trim() || 'Study Topic';
        createdTitle = `${topic} (AI)`;
        rootNode = {
          id: 'root-ai',
          label: topic,
          text: topic,
          color: '#4f46e5',
          isExpanded: true,
          children: [
            {
              id: 'c1',
              label: 'Fundamental Concepts',
              text: 'Fundamental Concepts',
              color: '#0284c7',
              isExpanded: false,
              children: [
                { id: 'c1-1', label: 'Core Definition', text: 'Core Definition', isExpanded: true },
                { id: 'c1-2', label: 'Primary Principles', text: 'Primary Principles', isExpanded: true }
              ]
            },
            {
              id: 'c2',
              label: 'Key Mechanisms & Methods',
              text: 'Key Mechanisms & Methods',
              color: '#059669',
              isExpanded: false,
              children: [
                { id: 'c2-1', label: 'Inputs & Prerequisites', text: 'Inputs & Prerequisites', isExpanded: true },
                { id: 'c2-2', label: 'Execution Steps', text: 'Execution Steps', isExpanded: true }
              ]
            },
            {
              id: 'c3',
              label: 'Practical Applications',
              text: 'Practical Applications',
              color: '#ea580c',
              isExpanded: false,
              children: [
                { id: 'c3-1', label: 'Real-world Context', text: 'Real-world Context', isExpanded: true },
                { id: 'c3-2', label: 'Case Studies', text: 'Case Studies', isExpanded: true }
              ]
            }
          ]
        };
      } else {
        throw new Error('Unknown creation mode');
      }

      const newMap: MindMap = {
        id: 'mm-' + Date.now(),
        workspaceId: wsId,
        title: createdTitle,
        layout: 'radial',
        rootNode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncState: 'SYNC_PENDING'
      };

      StorageService.saveMindMap(newMap);
      const updatedList = StorageService.getMindMaps();
      setMindmaps(updatedList);
      setSelectedMapId(newMap.id);
      setSelectedNodeId(newMap.rootNode.id);
      setIsCreateModalOpen(false);
      showToast(`Canvas "${createdTitle}" created successfully!`, 'success');
    } catch (err: any) {
      setModalError(err.message || 'Could not parse mind map input. Please verify syntax.');
    }
  };

  // Delete Map handler
  const handleConfirmDeleteMap = () => {
    if (!mapToDelete) return;
    StorageService.deleteMindMap(mapToDelete);
    const remaining = StorageService.getMindMaps();
    setMindmaps(remaining);
    setSelectedMapId(remaining[0]?.id || '');
    setMapToDelete(null);
    showToast('Mind Map deleted.', 'info');
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!activeMap) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeMap, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeMap.title}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Mind Map exported as JSON', 'info');
  };

  // -----------------------------------------------------------------
  // RECURSIVE TREE RENDERER (Clean, interactive, expandable)
  // -----------------------------------------------------------------
  const renderTree = (node: MindMapNode, isRoot: boolean = false, depth: number = 0) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const nodeText = node.label || node.text || 'Untitled';
    const hasChildren = Boolean(node.children && node.children.length > 0);
    // Respect isExpanded: true (open initially) or false (collapsed initially)
    const isExpanded = node.isExpanded !== undefined ? node.isExpanded : (node.collapsed !== true);

    return (
      <div key={node.id} className="flex items-center my-2">
        {/* Node Box */}
        <div 
          onClick={() => setSelectedNodeId(node.id)}
          onDoubleClick={(e) => { e.stopPropagation(); handleStartEditNode(node); }}
          className={`px-3.5 py-2 rounded-2xl border transition-all cursor-pointer shadow-xs relative group flex items-center gap-2 select-none ${
            isRoot
              ? 'bg-indigo-600 text-white border-indigo-700 font-bold text-sm shadow-md ring-offset-2 ring-indigo-500'
              : depth === 1
              ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-950 dark:text-sky-200 border-sky-300 dark:border-sky-800 font-semibold text-xs'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 text-xs'
          } ${isSelected ? 'ring-2 ring-indigo-500 scale-102' : 'hover:border-indigo-400'}`}
        >
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input
                type="text"
                autoFocus
                value={nodeEditText}
                onChange={e => setNodeEditText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveNodeEdit();
                  if (e.key === 'Escape') setEditingNodeId(null);
                }}
                className="bg-transparent border-b border-indigo-500 focus:outline-none px-1 text-inherit min-w-[80px]"
              />
              <button 
                onClick={handleSaveNodeEdit} 
                className="p-1 hover:text-emerald-400 cursor-pointer rounded"
                title="Save changes"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span>{nodeText}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleStartEditNode(node); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-indigo-400 transition-opacity cursor-pointer"
                title="Edit label (or double-click)"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Interactive Expand / Collapse Pill Button */}
          {hasChildren && (
            <button
              onClick={(e) => handleToggleExpand(node.id, e)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-0.5 shadow-2xs ${
                isExpanded
                  ? 'bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 text-inherit'
                  : 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold scale-105'
              }`}
              title={isExpanded ? "Collapse branch" : `Expand ${node.children?.length} sub-branches`}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-3 h-3" />
                  <span>{node.children?.length}</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>+{node.children?.length}</span>
                </>
              )}
            </button>
          )}

          {/* Quick node action toolbar on selection */}
          {isSelected && (
            <div 
              className="absolute -top-7 right-0 flex items-center gap-1 bg-slate-900 text-white rounded-lg p-1 text-[10px] shadow-lg z-20"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => handleAddChild(node.id)}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded flex items-center gap-0.5 cursor-pointer text-indigo-300"
                title="Add child node"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Child</span>
              </button>
              
              {!isRoot && (
                <button 
                  onClick={() => handleAddSibling(node.id)}
                  className="px-1.5 py-0.5 hover:bg-slate-800 rounded flex items-center gap-0.5 cursor-pointer text-sky-300"
                  title="Add sibling node"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>Sibling</span>
                </button>
              )}

              {hasChildren && (
                <button
                  onClick={(e) => handleToggleExpand(node.id, e)}
                  className="px-1.5 py-0.5 hover:bg-slate-800 rounded cursor-pointer"
                  title="Toggle branch visibility"
                >
                  <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                </button>
              )}

              {!isRoot && (
                <button 
                  onClick={() => handleDeleteNode(node.id)}
                  className="px-1.5 py-0.5 hover:bg-rose-900 rounded text-rose-300 flex items-center gap-0.5 cursor-pointer"
                  title="Delete node"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Child branches connected with visual hierarchy lines */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col ml-8 border-l-2 border-indigo-200 dark:border-indigo-900/60 pl-6 space-y-1 relative before:absolute before:w-4 before:h-0.5 before:bg-indigo-200 dark:before:bg-indigo-900/60 before:-left-0 before:top-1/2">
            {node.children?.map(child => renderTree(child, false, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
            : toast.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
            : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Mind Map Studio
            </h1>
            <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
              Interactive Canvas
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Expandable and collapsible concept hierarchies with instant code/outline editing and real-time canvas visualization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Outline Drawer Toggle */}
          <button
            onClick={() => setIsOutlineDrawerOpen(prev => !prev)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Type mind map outline in real-time"
          >
            <List className="w-3.5 h-3.5" />
            <span>Type My Mind</span>
          </button>

          {/* Create Canvas Button (Primary Action) */}
          <button
            onClick={() => {
              setModalError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Canvas</span>
          </button>
        </div>
      </div>

      {/* Main Studio Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-sm min-h-[620px] flex flex-col relative overflow-hidden">
        {/* Canvas Toolbar with Map Selector, Expand/Collapse & Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            {/* Mind Map Selector */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs">Map:</span>
              <select
                value={selectedMapId}
                onChange={e => setSelectedMapId(e.target.value)}
                className="p-1.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                {mindmaps.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            {/* Global Expand All / Collapse All buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => handleSetAllExpanded(true)}
                className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                title="Expand all branches"
              >
                Expand All
              </button>
              <button
                onClick={() => handleSetAllExpanded(false)}
                className="px-2 py-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
                title="Collapse all branches"
              >
                Collapse All
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddChild(selectedNodeId)}
              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900"
              title="Add child to selected node"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Child</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              title="Export JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMapToDelete(activeMap.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
              title="Delete this Mind Map"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setZoom(Math.max(0.6, zoom - 0.1))} className="p-1 cursor-pointer hover:text-indigo-600" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(Math.min(1.5, zoom + 0.1))} className="p-1 cursor-pointer hover:text-indigo-600" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setZoom(1)} className="p-1 cursor-pointer hover:text-indigo-600" title="Reset Zoom">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Mind Map Canvas Body */}
        <div className="flex-1 bg-slate-50/70 dark:bg-slate-950/60 rounded-2xl p-8 overflow-auto border border-slate-200/50 dark:border-slate-800/50 relative min-h-[480px]">
          <div 
            className="transition-transform duration-200"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {renderTree(activeMap.rootNode, true, 0)}
          </div>
        </div>

        {/* Slide-out Drawer: "Type My Mind" Outline Live Editor */}
        {isOutlineDrawerOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 shadow-xl z-30 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <List className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Type My Mind</h3>
              </div>
              <button onClick={() => setIsOutlineDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-tight">
              Type or edit topics with indentation (use 2 spaces or tabs). Add <code className="text-amber-500">(closed)</code> for initially collapsed branches.
            </p>

            <form onSubmit={handleSaveLiveOutline} className="flex-1 flex flex-col space-y-3">
              <textarea
                value={liveOutlineText}
                onChange={e => setLiveOutlineText(e.target.value)}
                className="flex-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                placeholder="Rafi&#10;  Child 1 (closed)&#10;    Subtopic 1.1&#10;  Child 2 (closed)"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOutlineDrawerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Apply to Canvas
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE CANVAS (Unified, fail-safe with 4 tabs) */}
      {/* ------------------------------------------------------------- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create Mind Map Canvas
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Type your thoughts, paste your mindMapData structure, or design branches visually.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Buttons */}
            <div className="flex items-center gap-1.5 pt-3 pb-2 text-xs border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { setCreateTab('code'); setModalError(null); }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  createTab === 'code'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code / JS Object</span>
              </button>

              <button
                type="button"
                onClick={() => { setCreateTab('visual'); setModalError(null); }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  createTab === 'visual'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Visual Branches</span>
              </button>

              <button
                type="button"
                onClick={() => { setCreateTab('outline'); setModalError(null); }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  createTab === 'outline'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Text Outline</span>
              </button>

              <button
                type="button"
                onClick={() => { setCreateTab('ai'); setModalError(null); }}
                className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  createTab === 'ai'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Generator</span>
              </button>
            </div>

            {/* Error Banner inside Modal */}
            {modalError && (
              <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <div className="flex-1">
                  <p className="font-semibold">{modalError}</p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                    Tip: You can use the Visual Branches tab, or click &quot;Reset to Rafi Template&quot; below.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Body Form */}
            <form onSubmit={handleCreateCanvas} className="flex-1 overflow-y-auto py-3 space-y-4">
              {/* TAB 1: CODE / JS OBJECT MODE */}
              {createTab === 'code' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Paste or type mindMapData structure (supports Bengali comments, ellipsis, unquoted keys)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCodeSnippet(DEFAULT_USER_MINDMAP_CODE)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      Reset to Rafi Template
                    </button>
                  </div>
                  <textarea
                    rows={11}
                    required
                    value={codeSnippet}
                    onChange={e => {
                      setCodeSnippet(e.target.value);
                      if (modalError) setModalError(null);
                    }}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-emerald-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                  />
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Supported properties:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li><code className="text-indigo-500">isExpanded: true</code> — node branch will be open initially.</li>
                      <li><code className="text-amber-500">isExpanded: false</code> — node branch will be closed initially (clickable to expand).</li>
                      <li>Bengali notes and comments (e.g. <code className="text-slate-400">// প্রাথমিক অবস্থায় খোলা থাকবে</code>) are parsed cleanly.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* TAB 2: VISUAL BRANCHES MODE */}
              {createTab === 'visual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Central Topic Name
                    </label>
                    <input
                      type="text"
                      required
                      value={visualTopic}
                      onChange={e => setVisualTopic(e.target.value)}
                      placeholder="e.g. Rafi, Distributed Systems"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Branches & Children
                      </label>
                      <button
                        type="button"
                        onClick={handleAddVisualBranch}
                        className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-indigo-100"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Branch</span>
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {visualBranches.map((branch, bIdx) => (
                        <div key={branch.id} className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={branch.label}
                              onChange={e => {
                                const val = e.target.value;
                                setVisualBranches(prev =>
                                  prev.map(b => (b.id === branch.id ? { ...b, label: val } : b))
                                );
                              }}
                              className="font-semibold text-xs bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 focus:outline-none focus:border-indigo-500"
                              placeholder={`Child ${bIdx + 1}`}
                            />
                            
                            {/* Toggle initial isExpanded state */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisualBranchExpanded(branch.id)}
                              className={`px-2 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                                branch.isExpanded
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                              title="Toggle initial expansion"
                            >
                              {branch.isExpanded ? 'Initial: Open (খোলা)' : 'Initial: Closed (বন্ধ)'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveVisualBranch(branch.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Delete branch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-400 pl-2">
                            Sub-nodes: {branch.subitems.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: TEXT OUTLINE MODE */}
              {createTab === 'outline' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Type or paste freeform outline with indentation (tab or spaces):
                  </label>
                  <textarea
                    rows={9}
                    required
                    value={outlineInput}
                    onChange={e => {
                      setOutlineInput(e.target.value);
                      if (modalError) setModalError(null);
                    }}
                    className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Write <code className="text-amber-500 font-mono">(closed)</code> after a line to have that branch start collapsed on the canvas.
                  </p>
                </div>
              )}

              {/* TAB 4: AI GENERATOR MODE */}
              {createTab === 'ai' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Concept, Chapter or Subject to Map
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Memory Hierarchy, Microeconomics Elasticity, Cell Division"
                      value={aiTopicInput}
                      onChange={e => setAiTopicInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Structures concept foundations, principles, workflows, and case studies automatically into an interactive collapsible hierarchy.
                  </p>
                </div>
              )}

              {/* Modal Footer with Create Canvas button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Canvas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION (Replaces window.confirm) */}
      {/* ------------------------------------------------------------- */}
      {mapToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Mind Map?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete this mind map? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMapToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMap}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
