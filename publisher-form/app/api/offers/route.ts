import { NextResponse } from 'next/server';

export async function GET() {
  const EVERFLOW_API_KEY = process.env.EVERFLOW_API_KEY;

  if (!EVERFLOW_API_KEY) {
    return NextResponse.json({ error: 'Everflow API key is not configured.' }, { status: 500 });
  }

  try {
    console.log('🔍 Starting offer fetch process...');
    console.log('📋 API Key type check: Key starts with:', EVERFLOW_API_KEY.substring(0, 10) + '...');

    console.log('🔄 Method 1: Trying affiliate runnable offers...');
    try {
      const runnableResponse = await fetch('https://api.eflow.team/v1/affiliates/offersrunnable', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': EVERFLOW_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        cache: 'no-store',
      });

      console.log('📊 Runnable offers response status:', runnableResponse.status);
      
      if (runnableResponse.ok) {
        const runnableData = await runnableResponse.json();
        console.log('📄 Runnable offers raw response:', JSON.stringify(runnableData, null, 2));
        
        if (runnableData.offers && runnableData.offers.length > 0) {
          console.log(`✅ Found ${runnableData.offers.length} runnable offers!`);
          const offerIds = runnableData.offers
            .map((offer: { network_offer_id: string | number }) => offer.network_offer_id.toString())
            .sort((a: string, b: string) => parseInt(a, 10) - parseInt(b, 10));
          
          console.log('🎯 Returning runnable offer IDs:', offerIds);
          return NextResponse.json(offerIds);
        } else {
          console.log('⚠️ Runnable offers endpoint returned empty or no offers array');
        }
      } else {
        console.log('❌ Runnable offers endpoint failed with status:', runnableResponse.status);
        const errorText = await runnableResponse.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.log('❌ Error fetching runnable offers:', error);
    }

    console.log('🔄 Method 2: Trying affiliate all offers...');
    try {
      const allOffersResponse = await fetch('https://api.eflow.team/v1/affiliates/alloffers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': EVERFLOW_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        cache: 'no-store',
      });

      console.log('📊 All offers response status:', allOffersResponse.status);
      
      if (allOffersResponse.ok) {
        const allOffersData = await allOffersResponse.json();
        console.log('📄 All offers raw response:', JSON.stringify(allOffersData, null, 2));
        
        if (allOffersData.offers && allOffersData.offers.length > 0) {
          console.log(`✅ Found ${allOffersData.offers.length} visible offers!`);
          const offerIds = allOffersData.offers
            .map((offer: { network_offer_id: string | number }) => offer.network_offer_id.toString())
            .sort((a: string, b: string) => parseInt(a, 10) - parseInt(b, 10));
          
          console.log('🎯 Returning visible offer IDs:', offerIds);
          return NextResponse.json(offerIds);
        } else {
          console.log('⚠️ All offers endpoint returned empty or no offers array');
        }
      } else {
        console.log('❌ All offers endpoint failed with status:', allOffersResponse.status);
        const errorText = await allOffersResponse.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.log('❌ Error fetching all offers:', error);
    }

    console.log('🔄 Method 3: Trying network offers as fallback...');
    try {
      console.log('📄 Fetching all network offers with URL pagination...');
      
      const networkResponse = await fetch('https://api.eflow.team/v1/networks/offerstable?page=1&page_size=1000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Eflow-API-Key': EVERFLOW_API_KEY,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
        },
        body: JSON.stringify({
          filters: {
            offer_status: "active"
          },
          sort_by: {
            column: "created",
            order: "desc"
          }
        }),
        cache: 'no-store',
      });

      console.log('📊 Network offers response status:', networkResponse.status);
      
      if (networkResponse.ok) {
        const networkData = await networkResponse.json();
        console.log('📄 Network offers response structure:', Object.keys(networkData));
        console.log('📄 Paging info:', networkData.paging);
        
        const offers = networkData.offers || networkData.entries || [];
        
        if (offers && offers.length > 0) {
          console.log(`✅ Found ${offers.length} offers in single request`);
          console.log(`📊 Total count from paging: ${networkData.paging?.total_count || 'unknown'}`);
          
          const allOfferIds = offers.map((offer: { network_offer_id: string | number }) => offer.network_offer_id.toString());
          const uniqueOfferIds = [...new Set(allOfferIds)].sort((a, b) => parseInt(a as string, 10) - parseInt(b as string, 10));
          
          console.log(`🔍 Removed duplicates: ${allOfferIds.length} → ${uniqueOfferIds.length} unique offers`);
          console.log('🎯 Returning unique network offer IDs:', uniqueOfferIds);
          return NextResponse.json(uniqueOfferIds);
        } else {
          console.log('⚠️ Network offers endpoint returned empty offers array');
        }
      } else {
        console.log('❌ Network offers endpoint failed with status:', networkResponse.status);
        const errorText = await networkResponse.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.log('❌ Error fetching network offers:', error);
    }

    console.log('❌ All offer fetch methods failed. Returning empty array.');
    return NextResponse.json([]);

  } catch (error) {
    console.error('💥 Unexpected error during offer fetch:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}