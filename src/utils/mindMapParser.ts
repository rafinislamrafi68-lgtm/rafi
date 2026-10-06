import { MindMapNode } from '../types';

export const DEFAULT_USER_MINDMAP_CODE = `const mindMapData = {
  id: "rafia",
  label: "Rafi",
  isExpanded: true, // প্রাথমিক অবস্থায় খোলা থাকবে
  children: [
    { 
      id: "c1", 
      label: "Child 1", 
      isExpanded: false, 
      children: [
        { id: "c1-1", label: "Subtopic 1.1", isExpanded: true },
        { id: "c1-2", label: "Subtopic 1.2", isExpanded: true }
      ] 
    },
    { 
      id: "c2", 
      label: "Child 2", 
      isExpanded: false, 
      children: [
        { id: "c2-1", label: "Subtopic 2.1", isExpanded: true },
        { id: "c2-2", label: "Subtopic 2.2", isExpanded: true }
      ] 
    }
  ]
};`;

/**
 * Normalizes any parsed JS/JSON node into a strongly-typed MindMapNode.
 * Correctly respects `isExpanded` and `collapsed`.
 */
export function normalizeMindMapNode(node: any, defaultId: string = 'root'): MindMapNode {
  if (!node || typeof node !== 'object') {
    const textVal = String(node || 'Node');
    return {
      id: defaultId,
      label: textVal,
      text: textVal,
      isExpanded: true,
      collapsed: false,
      children: []
    };
  }

  const label = node.label || node.text || node.title || node.name || 'Node';
  const id = node.id ? String(node.id) : defaultId;

  // Primary expansion flag: true = open, false = closed
  let isExpanded = true;
  if (typeof node.isExpanded === 'boolean') {
    isExpanded = node.isExpanded;
  } else if (typeof node.collapsed === 'boolean') {
    isExpanded = !node.collapsed;
  }

  const rawChildren = Array.isArray(node.children) ? node.children : [];
  const children: MindMapNode[] = rawChildren.map((child: any, idx: number) =>
    normalizeMindMapNode(child, `${id}-c${idx + 1}`)
  );

  return {
    id,
    label,
    text: label,
    color: node.color,
    description: node.description,
    isExpanded,
    collapsed: !isExpanded,
    children
  };
}

/**
 * Parses free-form text outline (with tabs, spaces, or dashes).
 * e.g.:
 * Rafi
 *   Child 1 (collapsed)
 *     Subtopic 1.1
 *   Child 2 (collapsed)
 */
export function parseTextOutline(text: string): { title: string; rootNode: MindMapNode } {
  const lines = text
    .split('\n')
    .map(line => line.replace(/\r/, ''))
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    throw new Error('Please type at least one topic name.');
  }

  interface OutlineItem {
    depth: number;
    text: string;
    isExpanded: boolean;
    children: OutlineItem[];
  }

  const getIndent = (line: string): number => {
    const match = line.match(/^(\s*)/);
    if (!match) return 0;
    const whitespace = match[1];
    return whitespace.replace(/\t/g, '  ').length;
  };

  const cleanText = (raw: string): { text: string; isExpanded: boolean } => {
    let t = raw.trim().replace(/^[-*•]\s*/, '');
    let isExpanded = true;
    if (/\(collapsed\)/i.test(t) || /\(closed\)/i.test(t) || /\(বন্ধ\)/i.test(t)) {
      isExpanded = false;
      t = t.replace(/\((?:collapsed|closed|বন্ধ)\)/i, '').trim();
    } else if (/\(expanded\)/i.test(t) || /\(open\)/i.test(t) || /\(খোলা\)/i.test(t)) {
      isExpanded = true;
      t = t.replace(/\((?:expanded|open|খোলা)\)/i, '').trim();
    }
    return { text: t, isExpanded };
  };

  const rootClean = cleanText(lines[0]);
  const rootItem: OutlineItem = {
    depth: 0,
    text: rootClean.text || 'Central Topic',
    isExpanded: rootClean.isExpanded,
    children: []
  };

  const stack: { item: OutlineItem; depth: number }[] = [{ item: rootItem, depth: 0 }];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const indent = getIndent(rawLine);
    const { text: lineText, isExpanded } = cleanText(rawLine);
    if (!lineText) continue;

    const newItem: OutlineItem = {
      depth: indent,
      text: lineText,
      isExpanded,
      children: []
    };

    while (stack.length > 1 && stack[stack.length - 1].depth >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    parent.item.children.push(newItem);
    stack.push({ item: newItem, depth: indent });
  }

  const convertItemToNode = (item: OutlineItem, prefix: string): MindMapNode => {
    return {
      id: prefix,
      label: item.text,
      text: item.text,
      isExpanded: item.isExpanded,
      collapsed: !item.isExpanded,
      children: item.children.map((c, idx) => convertItemToNode(c, `${prefix}-${idx + 1}`))
    };
  };

  const rootNode = convertItemToNode(rootItem, 'root');
  return {
    title: rootNode.label || 'Mind Map',
    rootNode
  };
}

/**
 * Universal mind map input parser.
 * Handles:
 * - JavaScript variables (const mindMapData = ...)
 * - Bengali and English inline comments (// প্রাথমিক অবস্থায় খোলা থাকবে)
 * - Placeholder ellipsis (children: [...])
 * - Unquoted object keys
 * - Trailing commas and single quotes
 * - Freeform outline text
 */
export function parseMindMapInput(rawInput: string): { title: string; rootNode: MindMapNode } {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please type or paste mind map content.');
  }

  // If input contains curly braces, treat as JS object or JSON
  if (trimmed.includes('{') && trimmed.includes('}')) {
    // 1. Remove JS declarations (const mindMapData =, let data =, var obj =, etc.)
    let cleaned = trimmed.replace(/^(?:const|let|var)\s+[\w$]+\s*=\s*/m, '');
    
    // 2. Remove trailing semicolon
    cleaned = cleaned.replace(/;\s*$/, '');

    // 3. Strip multiline comments (/* ... */)
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');

    // 4. Strip single-line comments (// ...) including Bengali / Unicode characters
    cleaned = cleaned.replace(/\/\/.*$/gm, '');

    // 5. Replace placeholder ellipsis `children: [...]` or `[...]` with `children: []`
    cleaned = cleaned.replace(/children\s*:\s*\[\s*\.\.\.\s*\]/gi, 'children: []');
    cleaned = cleaned.replace(/:\s*\[\s*\.\.\.\s*\]/g, ': []');
    cleaned = cleaned.replace(/\[\s*\.\.\.\s*\]/g, '[]');

    let parsedObj: any = null;

    // Try standard JSON.parse first
    try {
      parsedObj = JSON.parse(cleaned);
    } catch {
      // Fallback: evaluate JS object expression safely
      try {
        // eslint-disable-next-line no-new-func
        parsedObj = new Function(`"use strict"; return (${cleaned});`)();
      } catch {
        // If Function evaluation fails, try aggressive regex normalization for JSON
        try {
          const jsonNormalized = cleaned
            .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
            .replace(/(['"])?([a-zA-Z0-9_$]+)(['"])?\s*:/g, '"$2":') // quote keys
            .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"'); // single to double quotes
          parsedObj = JSON.parse(jsonNormalized);
        } catch (finalErr: any) {
          throw new Error('Could not parse mind map structure. Please check syntax or switch to Text Outline mode.');
        }
      }
    }

    if (parsedObj && typeof parsedObj === 'object') {
      const rootCandidate = parsedObj.rootNode || parsedObj;
      const rootNode = normalizeMindMapNode(rootCandidate, rootCandidate.id || 'rafia');
      const title = parsedObj.title || rootNode.label || rootNode.text || 'Rafi';
      return { title, rootNode };
    }
  }

  // Otherwise, treat as Text Outline
  return parseTextOutline(trimmed);
}
