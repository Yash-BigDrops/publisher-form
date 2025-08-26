export type AnalyzedItem = {
  id: string;           
  name: string;         
  type: "image" | "html" | "other";
  size: number;
  url: string;
  previewUrl?: string;
  html?: boolean;
};

export type UploadAnalysis = {
  uploadId: string;
  isSingleCreative: boolean;
  items: AnalyzedItem[];
  counts: { images: number; htmls: number; others: number; total: number };
};
