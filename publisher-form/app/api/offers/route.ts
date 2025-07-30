import { NextResponse } from 'next/server';

async function fetchActiveOfferPage(apiKey: string, page: number, pageSize: number) {
  const everflowApiUrl = `https://api.eflow.team/v1/networks/offerstable?page=${page}&page_size=${pageSize}&relationship=ruleset`;
  
  const response = await fetch(everflowApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Eflow-API-Key': apiKey,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    },
    body: JSON.stringify({
      filters: {
        offer_status: "active"
      },
      sort_by: {
        "column": "created",
        "order": "desc"
      },
      search_terms: [
        {
          "search_type": "name",
          "value": ""
        }
      ]
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Everflow API failed for page ${page} with status ${response.status}`, errorBody);
    throw new Error(`Everflow API failed for page ${page}`);
  }

  return response.json();
}

export async function GET() {
  const EVERFLOW_API_KEY = process.env.EVERFLOW_API_KEY;

  if (!EVERFLOW_API_KEY) {
    return NextResponse.json({ error: 'Everflow API key is not configured.' }, { status: 500 });
  }

  try {
    let allActiveOffers: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const pageSize = 500;

    while (hasMorePages) {
      console.log(`Fetching page ${currentPage} of active offers...`);
      const data = await fetchActiveOfferPage(EVERFLOW_API_KEY, currentPage, pageSize);

      if (data && Array.isArray(data.entries) && data.entries.length > 0) {
        allActiveOffers = allActiveOffers.concat(data.entries);
        currentPage++;
        if (data.entries.length < pageSize) hasMorePages = false;
      } else {
        hasMorePages = false;
      }
    }

    console.log(`Fetched a total of ${allActiveOffers.length} active offers.`);

    const offerIds = allActiveOffers
      .map((offer: any) => offer.network_offer_id.toString())
      .sort((a: string, b: string) => parseInt(a, 10) - parseInt(b, 10));
    
    return NextResponse.json(offerIds);

  } catch (error) {
    console.error('An unexpected error occurred during fetch:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}