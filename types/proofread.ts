export interface ProofreadResult {
  originalText?: string;
  correctedText?: string;
  corrected?: string;
  suggestions?: ProofreadSuggestion[];
  edits?: ProofreadEdit[];
  summary?: string;
  confidence?: number;
  language?: string;
}

export interface ProofreadSuggestion {
  type: 'spelling' | 'grammar' | 'style' | 'punctuation' | 'clarity';
  message: string;
  suggestion: string;
  start: number;
  end: number;
  confidence: number;
}

export interface ProofreadEdit {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  reason: string;
  severity: 'minor' | 'major';
}

export interface ProofreadRequest {
  text: string;
  language?: string;
  focus?: 'spelling' | 'grammar' | 'style' | 'all';
}
