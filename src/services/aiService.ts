import { AIMode, AIMessage, Source, Note } from '../types';
import { StorageService } from './storage';
import { SyncService } from './syncService';

export const AI_MODES: { id: AIMode; label: string; desc: string }[] = [
  { id: 'explain', label: 'Explain Concept', desc: 'Simplify difficult ideas with intuitive analogies' },
  { id: 'summarize', label: 'Summarize', desc: 'Synthesize key insights and takeaway points' },
  { id: 'exam_answer', label: 'Exam Answer', desc: 'Structured academic answer with headings & citations' },
  { id: 'short_notes', label: 'Short Notes', desc: 'Concise bullet points for rapid review' },
  { id: 'generate_mindmap', label: 'Generate Mind Map', desc: 'Hierarchical node structure ready for the editor' },
  { id: 'generate_quiz', label: 'Generate Quiz', desc: 'MCQ & short questions from selected sources' },
  { id: 'flashcards', label: 'Flashcards', desc: 'Question-answer recall cards' },
  { id: 'compare_sources', label: 'Compare Sources', desc: 'Identify agreements, contradictions, and nuances' }
];

export const AIService = {
  // Source-grounded retrieval across user-created sources & notes
  searchUserSources(query: string, workspaceId?: string, notebookId?: string): { title: string; snippet: string; type: string }[] {
    const q = query.toLowerCase();
    const results: { title: string; snippet: string; type: string }[] = [];

    // Search in user's custom sources
    const sources = StorageService.getSources(workspaceId, notebookId);
    for (const src of sources) {
      if (src.title.toLowerCase().includes(q) || (src.content && src.content.toLowerCase().includes(q))) {
        results.push({
          title: src.title,
          snippet: src.content ? src.content.slice(0, 160) + '...' : 'User Source',
          type: src.type.toUpperCase()
        });
      }
    }

    // Search in user's custom notes
    const notes = StorageService.getNotes(workspaceId, notebookId);
    for (const note of notes) {
      if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
        results.push({
          title: note.title,
          snippet: note.content.slice(0, 160) + '...',
          type: 'Note'
        });
      }
    }

    return results.slice(0, 4);
  },

  async askAssistant(
    prompt: string, 
    mode: AIMode = 'explain', 
    workspaceId?: string, 
    notebookId?: string
  ): Promise<AIMessage> {
    const syncState = SyncService.getState();
    const isOffline = !syncState.isOnline || syncState.status === 'OFFLINE';
    const provider: 'cloud' | 'on_device' = isOffline ? 'on_device' : 'cloud';

    // Retrieve active workspace for custom AI behavior/instructions
    const workspaces = StorageService.getWorkspaces();
    const activeWs = workspaces.find(w => w.id === workspaceId);
    const customInstructions = activeWs?.systemAiInstructions || '';

    // Search user's sources
    const matchedSources = this.searchUserSources(prompt, workspaceId, notebookId);
    const hasSourceContext = matchedSources.length > 0;
    const citedTitles = matchedSources.map(s => s.title);

    let preamble = '';
    if (hasSourceContext) {
      preamble = `[Grounded in user sources: ${citedTitles.join(', ')}]\n\n`;
    } else {
      preamble = `[Information was not found in your selected sources. Answering from general knowledge base]:\n\n`;
    }

    let answer = '';
    if (mode === 'generate_mindmap') {
      answer = `${preamble}Here is a structured mind map hierarchy based on "${prompt}":\n\n* **${prompt}**\n  * **Core Concept 1**: Principles and fundamentals\n    * Sub-topic A: Key definition\n    * Sub-topic B: Practical example\n  * **Core Concept 2**: Methodologies & Workflows\n    * Step 1: Initialization\n    * Step 2: Implementation\n  * **Applications & Case Studies**: Real-world context\n\n*(You can import this directly into the Mind Map Editor)*`;
    } else if (mode === 'exam_answer') {
      answer = `${preamble}### Academic Formulation: ${prompt}\n\n**1. Theoretical Definition:**\n${prompt} represents a systematic domain concept structured by clear first principles.\n\n**2. Core Analysis & Evidence:**\n- Primary characteristic: Demonstrable efficiency and structured reasoning.\n- Comparative advantage: Eliminates ambiguity and ensures reproducible knowledge.\n\n**3. Evaluation & Conclusion:**\nSynthesizing these attributes provides a robust foundation for examination and real-world deployment.`;
    } else if (mode === 'summarize') {
      answer = `${preamble}**Summary of "${prompt}":**\n\n- **Key Takeaway**: Primary conceptual breakthrough.\n- **Essential Pillars**: Systematic breakdown of components.\n- **Actionable Insight**: How to retain and apply this knowledge immediately.`;
    } else if (mode === 'generate_quiz') {
      answer = `${preamble}**Practice Quiz on "${prompt}":**\n\n1. What is the fundamental premise behind ${prompt}?\n   A) Trial and error\n   B) Systematic structured reasoning\n   C) Random allocation\n   *Correct Answer: B*\n\n2. True or False: This concept applies only to isolated scenarios.\n   *Correct Answer: False*`;
    } else {
      answer = `${preamble}**Explanation of "${prompt}":**\n\n${prompt} is an essential topic. Breaking it down:\n\n1. **What it is**: The fundamental definition and background.\n2. **Why it matters**: How it connects to your overarching study and knowledge goals.\n3. **Practical Application**: Concrete examples showing the concept in action.${customInstructions ? `\n\n*(Workspace Custom Directive: ${customInstructions})*` : ''}`;
    }

    return {
      id: 'ai-msg-' + Date.now(),
      role: 'assistant',
      content: answer,
      mode,
      provider,
      citedSources: citedTitles,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }
};
