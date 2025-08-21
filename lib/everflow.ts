const BASE = process.env.EVERFLOW_BASE_URL || 'https://api.eflow.team/v1';
const KEY = process.env.EVERFLOW_API_KEY || '';

export async function fetchOffers(search?: string) {
  if (!KEY) {

    return [];
  }
  const url = new URL(`${BASE}/offers`);
  if (search) url.searchParams.set('search', search);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${KEY}` }});
  if (!res.ok) throw new Error(`Everflow error ${res.status}`);
  const data = await res.json();

  return (data.items || data).map((o: { offer_id?: string; id?: string; name: string }) => ({ 
    label: `${o.offer_id || o.id} — ${o.name}`, 
    value: String(o.offer_id || o.id) 
  }));
}
