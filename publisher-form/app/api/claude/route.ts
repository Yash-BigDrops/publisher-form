import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Claude API endpoint called');
    
    const { companyName, offerId, creativeType, notes, creativeContent } = await request.json();
    
    console.log('Request data:', {
      companyName: companyName?.substring(0, 50) + '...',
      offerId,
      creativeType,
      notesLength: notes?.length || 0,
      creativeContentLength: creativeContent?.length || 0
    });

    if (!companyName || !offerId) {
      console.error('Missing required fields:', { companyName: !!companyName, offerId: !!offerId });
      return NextResponse.json({ error: 'Missing required fields: companyName and offerId are required' }, { status: 400 });
    }

    if (!process.env.CLAUDE_API_KEY) {
      console.error('CLAUDE_API_KEY not configured');
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 });
    }

    const prompt = `
You are an expert in crafting engaging and high-converting email "From" and "Subject" lines.

Campaign details:
- Company: ${companyName}
- Offer ID: ${offerId}
- Creative type: ${creativeType || 'N/A'}
- Notes: ${notes || 'N/A'}

Here is the creative content for context:
"""
${creativeContent || 'No creative text provided'}
"""

Task:
1. Suggest 5 professional "From" lines.
2. Suggest 10 high-converting "Subject" lines.

Please format your response exactly as follows:

From Lines:
1. [First from line suggestion]
2. [Second from line suggestion]
3. [Third from line suggestion]
4. [Fourth from line suggestion]
5. [Fifth from line suggestion]

Subject Lines:
1. [First subject line suggestion]
2. [Second subject line suggestion]
3. [Third subject line suggestion]
4. [Fourth subject line suggestion]
5. [Fifth subject line suggestion]
6. [Sixth subject line suggestion]
7. [Seventh subject line suggestion]
8. [Eighth subject line suggestion]
9. [Ninth subject line suggestion]
10. [Tenth subject line suggestion]
    `;

    console.log('Sending request to Claude API...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('Claude API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error response:', errorText);
      return NextResponse.json({ 
        error: `Claude API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('Claude API response received');
    
    const text = data?.content?.[0]?.text;
    if (!text) {
      console.error('No text content in Claude response:', data);
      return NextResponse.json({ error: 'No suggestions generated from Claude API' }, { status: 500 });
    }

    console.log('Suggestions generated successfully, length:', text.length);
    return NextResponse.json({ suggestions: text });
    
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json({ 
      error: 'Claude API request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 