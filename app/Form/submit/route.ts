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
    if (!verifyCsrfToken(data.csrf_token)) {
      return csrfErrorResponse();
    }
    
    // Validate form data
    const validation = validateFormData(data);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }
    
    // Process the form data (replace with actual business logic)
    console.log('Form submitted successfully:', {
      affiliateId: data.affiliateId,
      companyName: data.companyName,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
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
