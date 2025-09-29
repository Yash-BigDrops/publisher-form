import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    if (!process.env.ADMIN_PORTAL_URL || !process.env.ADMIN_API_TOKEN) {
      console.error('Missing webhook configuration');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Webhook configuration missing' 
        },
        { status: 500 }
      );
    }
    
    const response = await fetch(process.env.ADMIN_PORTAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN}`
      },
      body: JSON.stringify({
        affiliateId: formData.affiliateId,
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        telegramId: formData.telegramId,
        offerId: formData.offerId,
        creativeType: formData.creativeType,
        priority: formData.priority,
        additionalNotes: formData.additionalNotes,
        submissionDate: new Date().toISOString()
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Form submitted successfully',
        submissionId: result.submissionId 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit form' 
    }, { status: 500 });
  }
}
