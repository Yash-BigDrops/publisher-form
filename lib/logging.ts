export async function sendToLoggingService(payload: Record<string, unknown>) {
  const url = process.env.LOG_WEBHOOK_URL;
  if (!url) { console.error('[log]', payload); return; }
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch (e) {
    console.error('[log-fail]', (e as Error).message, payload);
  }
}
