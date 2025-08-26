export type ProofreadEdit = {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  reason: string;
  severity: "minor" | "major";
};

export type ProofreadResult = {
  corrected: string;
  edits: ProofreadEdit[];
};
