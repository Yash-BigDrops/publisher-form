
import { NextResponse } from 'next/server';

export async function GET() {
  const EVERFLOW_API_KEY = process.env.EVERFLOW_API_KEY;
  if (!EVERFLOW_API_KEY) {
    return NextResponse.json({ error: 'Everflow API key is not configured.' }, { status: 500 });
  }

  try {
    try {
      const runnableResponse = await fetch('https://api.eflow.team/v1/affiliates/offersrunnable', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': EVERFLOW_API_KEY,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      });

      if (runnableResponse.ok) {
        const runnableData = await runnableResponse.json();
        if (runnableData.offers?.length) {
          const offerIds = runnableData.offers
            .map((o: { network_offer_id: string | number }) => o.network_offer_id.toString())
            .sort((a: string, b: string) => parseInt(a, 10) - parseInt(b, 10));
          return NextResponse.json(offerIds);
        }
      }
    } catch {}

    try {
      const allOffersResponse = await fetch('https://api.eflow.team/v1/affiliates/alloffers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': EVERFLOW_API_KEY,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
        cache: 'no-store',
      });

      if (allOffersResponse.ok) {
        const allOffersData = await allOffersResponse.json();
        if (allOffersData.offers?.length) {
          const offerIds = allOffersData.offers
            .map((o: { network_offer_id: string | number }) => o.network_offer_id.toString())
            .sort((a: string, b: string) => parseInt(a, 10) - parseInt(b, 10));
          return NextResponse.json(offerIds);
        }
      }
    } catch {}

    try {
      const networkResponse = await fetch(
        'https://api.eflow.team/v1/networks/offerstable?page=1&page_size=1000',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Eflow-API-Key': EVERFLOW_API_KEY,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            filters: { offer_status: 'active' },
            sort_by: { column: 'created', order: 'desc' },
          }),
          cache: 'no-store',
        }
      );

      if (networkResponse.ok) {
        const networkData = await networkResponse.json();
        const offers = networkData.offers || networkData.entries || [];
        if (offers.length) {
          const allOfferIds = offers.map(
            (o: { network_offer_id: string | number }) => o.network_offer_id.toString()
          );
          const unique = Array.from(new Set(allOfferIds)).sort(
            (a, b) => parseInt(a as string, 10) - parseInt(b as string, 10)
          );
          return NextResponse.json(unique);
        }
      }
    } catch {}

    return NextResponse.json([]);
  } catch {
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
