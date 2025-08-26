export async function saveCreative(body: Record<string, unknown>) {
  const r = await fetch("/api/creative/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Save failed");
  return r.json();
}

export async function deleteCreativeApi(arg: { fileUrl?: string; creativeId?: string }) {
  const r = await fetch("/api/creative/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Delete failed");
  return r.json();
}

export async function saveHtml(arg: { fileUrl: string; html: string; newFileName?: string }) {
  const r = await fetch("/api/creative/save-html", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Save HTML failed");
  return r.json();
}

export async function renameCreative(arg: { creativeId?: string; fileUrl?: string; newName: string }) {
  const r = await fetch("/api/creative/rename", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!r.ok) throw new Error("Rename failed");
  return r.json();
}
