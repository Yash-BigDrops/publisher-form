export interface UploadAssetEntry {
  fileId: string;
  name: string;
  path: string;
  size: number;
  type: string;
}

export interface UploadAssetIndex {
  byPath: Map<string, UploadAssetEntry>;   
  byBase: Map<string, UploadAssetEntry[]>; 
}

const uploadIndexes = new Map<string, UploadAssetIndex>();

export function createUploadAssetIndex(files: Array<{
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  originalPath?: string; 
}>): UploadAssetIndex {
  const byPath = new Map<string, UploadAssetEntry>();
  const byBase = new Map<string, UploadAssetEntry[]>();

  for (const file of files) {
    const path = file.originalPath || file.fileName;
    const normalizedPath = normalizePath(path).toLowerCase();
    const basename = path.split('/').pop()?.toLowerCase() || '';

    const entry: UploadAssetEntry = {
      fileId: file.fileId,
      name: file.fileName,
      path: normalizedPath,
      size: file.fileSize,
      type: file.fileType,
    };

    byPath.set(normalizedPath, entry);

    if (basename) {
      if (!byBase.has(basename)) {
        byBase.set(basename, []);
      }
      byBase.get(basename)!.push(entry);
    }
  }

  return { byPath, byBase };
}

export function storeUploadAssetIndex(uploadId: string, index: UploadAssetIndex): void {
  uploadIndexes.set(uploadId, index);
}

export function getUploadAssetIndex(uploadId: string): UploadAssetIndex | null {
  return uploadIndexes.get(uploadId) || null;
}

export function removeUploadAssetIndex(uploadId: string): void {
  uploadIndexes.delete(uploadId);
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, '/')           
    .replace(/^\/+/, '')           
    .replace(/\/+/g, '/')          
    .replace(/\/$/, '');           
}

export function resolveAssetInUpload(
  uploadId: string,
  htmlPath: string,
  assetRef: string
): UploadAssetEntry | null {
  const index = getUploadAssetIndex(uploadId);
  if (!index) {
    return null;
  }

  if (/^(data:|https?:|mailto:|javascript:)/i.test(assetRef)) {
    return null;
  }

  const relativePath = resolveRelativePath(htmlPath, assetRef);
  if (relativePath) {
    const normalizedRelative = normalizePath(relativePath).toLowerCase();
    const exactMatch = index.byPath.get(normalizedRelative);
    if (exactMatch) {
      return exactMatch;
    }
  }

  const rootishPath = normalizePath(assetRef).toLowerCase();
  const rootishMatch = index.byPath.get(rootishPath);
  if (rootishMatch) {
    return rootishMatch;
  }

  const basename = assetRef.split('/').pop()?.toLowerCase() || '';
  if (basename) {
    const basenameMatches = index.byBase.get(basename) || [];
    if (basenameMatches.length === 1) {
      return basenameMatches[0];
    }
  }

  return null;
}

function resolveRelativePath(htmlPath: string, assetRef: string): string | null {
  const htmlDir = htmlPath.split('/').slice(0, -1).join('/');
  
  const resolved = htmlDir ? `${htmlDir}/${assetRef}` : assetRef;
  
  if (resolved.includes('..')) {
    return null;
  }
  
  return resolved;
}

export function getAllAssetsForUpload(uploadId: string): UploadAssetEntry[] {
  const index = getUploadAssetIndex(uploadId);
  if (!index) return [];
  
  return Array.from(index.byPath.values());
}
