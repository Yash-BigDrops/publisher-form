import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfToken, csrfErrorResponse } from '@/app/lib/security/csrf';
import { validateFormData, validationErrorResponse, type FormData } from '@/app/lib/security/validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const data: FormData = {
      affiliateId: formData.get('affiliateId') as string,
      companyName: formData.get('companyName') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      csrf_token: formData.get('csrf_token') as string
    };
    
    // Verify CSRF token
    if (!(await verifyCsrfToken(data.csrf_token))) {
      return csrfErrorResponse();
    }
    
    // Validate form data
    const validation = validateFormData(data);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }
    
    // Use validated data
    const validatedData = validation.data;
    
    // Process the form data and send to webhook
    const submissionData = {
      affiliateId: validatedData.affiliateId,
      companyName: validatedData.companyName,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      submittedAt: new Date().toISOString()
    };

    // Send data to admin portal webhook
    if (!process.env.ADMIN_PORTAL_URL || !process.env.ADMIN_API_TOKEN) {
      console.error('Missing webhook configuration');
      return NextResponse.json(
        { error: 'Webhook configuration missing' },
        { status: 500 }
      );
    }

    const response = await fetch(process.env.ADMIN_PORTAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_API_TOKEN}`,
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      console.error('Webhook call failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to submit form data' },
        { status: 500 }
      );
    }

    console.log('Form submitted successfully and sent to webhook');
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Form submitted successfully' 
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
