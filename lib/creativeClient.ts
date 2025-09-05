import { API_ENDPOINTS } from '@/constants/apiEndpoints';

export async function saveCreative(body: Record<string, unknown>) {
  const r = await fetch(API_ENDPOINTS.CREATIVE_SAVE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Save failed");
  return r.json();
}

export async function deleteCreativeApi(arg: { fileUrl?: string; creativeId?: string }) {
  const r = await fetch(API_ENDPOINTS.CREATIVE_DELETE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Delete failed");
  return r.json();
}

export async function saveHtml(arg: { fileUrl: string; html: string; newFileName?: string }) {
  const r = await fetch(API_ENDPOINTS.CREATIVE_SAVE_HTML, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Save HTML failed");
  return r.json();
}

export async function renameCreative(arg: { creativeId?: string; fileUrl?: string; newName: string }) {
  const r = await fetch(API_ENDPOINTS.CREATIVE_RENAME, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Rename failed");
  return r.json();
}

export async function saveCreativeMetadata(arg: {
  creativeId: string;
  fromLines?: string;
  subjectLines?: string;
  proofreadingData?: unknown;
  htmlContent?: string;
  additionalNotes?: string;
  metadata?: Record<string, unknown>;
}) {
  const r = await fetch(API_ENDPOINTS.CREATIVE_SAVE_METADATA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Save metadata failed");
  return r.json();
}

export async function getCreativeMetadata(creativeId: string) {
  const r = await fetch(`${API_ENDPOINTS.CREATIVE_GET_METADATA}?creativeId=${creativeId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error("Get metadata failed");
  return r.json();
}
