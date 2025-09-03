import { API_ENDPOINTS, buildFileUrl } from '@/constants/apiEndpoints';

export async function deleteFileById(id: string) {
  const r = await fetch(buildFileUrl(id), { method: 'DELETE' });
  if (!r.ok) throw new Error('delete failed');
  return r.json();
}

export async function bulkDeleteByIds(ids: string[]) {
  const r = await fetch(API_ENDPOINTS.FILES_BULK_DELETE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!r.ok) throw new Error('bulk delete failed');
  return r.json();
}

export function parseIdsFromUrl(u: string) {
  try {
    if (u.includes('/api/files/')) {
      const m = u.match(/\/api\/files\/([^/]+)\/([^?#]+)/);
      if (m) return { id: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) };
    }
    if (u.includes('/api/uploads')) {
      const url = new URL(u, 'http://x');
      const id = url.searchParams.get('id') || '';
      const name = url.searchParams.get('name') || '';
      if (id && name) return { id, name };
    }
  } catch {}
  return { id: '', name: '' };
}
