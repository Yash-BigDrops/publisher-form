import { ProofreadResult } from "@/types/proofread";

export async function proofreadTextClaude(text: string): Promise<ProofreadResult> {
  const res = await fetch("/api/proofread-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("proofread-text failed");
  return res.json();
}

export async function proofreadImageGPT(imageUrl: string): Promise<ProofreadResult> {
  const res = await fetch("/api/proofread-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw new Error("proofread-image failed");
  return res.json();
}
