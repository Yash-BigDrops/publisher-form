export type UploadOpts = {
  endpoint: string;
  headers?: Record<string,string>;
  onProgress?: (pct:number)=>void;
  retry?: { retries:number; baseDelayMs:number };
  chunking?: { enabled:boolean; chunkSize:number };
  compressImages?: boolean;
  metadata?: Record<string, unknown>;
};

async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }

async function maybeCompress(file: File, compress: boolean): Promise<File> {
  if (!compress || !file.type.startsWith('image/')) return file;
  const mod = await import('browser-image-compression');
  const blob = await mod.default(file, { maxSizeMB: 1.5, maxWidthOrHeight: 2000, useWebWorker: true });
  return new File([blob], file.name, { type: file.type });
}

function xhrUpload(url:string, file:Blob, headers:Record<string,string>, onProgress?: (n:number)=>void) {
  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    for (const [k,v] of Object.entries(headers||{})) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded/e.total)*100));
    };
    xhr.onload = () => resolve(new Response(xhr.responseText, { status: xhr.status }));
    xhr.onerror = () => reject(new Error('Network error'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}

export async function uploadFile(file: File, opts: UploadOpts) {
  const {
    endpoint, headers={}, onProgress, retry={retries:0, baseDelayMs:300},
    compressImages=false, metadata
  } = opts;

  const prepared = await maybeCompress(file, compressImages);

  let attempt = 0;
  while (true) {
    try {
      const uploadUrl = endpoint; 
      const res = await xhrUpload(uploadUrl, prepared, { ...headers, ...(metadata ? {'X-Meta': JSON.stringify(metadata)} : {}) }, onProgress);
      if (!res.ok) throw new Error(`Upload failed (${res.status}) ${await res.text()}`);
      return await res.json().catch(()=> ({}));
    } catch (e) {
      if (attempt >= retry.retries) throw e as Error;
      attempt++;
      await sleep(retry.baseDelayMs * Math.pow(2, attempt-1));
    }
  }
}
