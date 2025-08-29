export interface UploadedFileMeta {
  id: string;
  name: string;
  url: string;
  size: number;
  type: 'html' | 'image' | 'other';
  source: 'single' | 'multiple' | 'url';
  html?: boolean;
  previewUrl?: string;
  assetCount?: number;
  hasAssets?: boolean;
}

export interface AnalyzedItem {
  id: string;
  name: string;
  type: "image" | "html" | "other";
  size: number;
  url: string;
  previewUrl?: string;
  html?: boolean;
}

export interface UploadAnalysis {
  uploadId: string;
  isSingleCreative: boolean;
  items: AnalyzedItem[];
  counts: { 
    images: number; 
    htmls: number; 
    others: number; 
    total: number 
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
