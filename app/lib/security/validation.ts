import { z } from 'zod';
import { NextResponse } from 'next/server';

export const affiliateIdSchema = z.string()
  .regex(/^[A-Z0-9_-]{3,20}$/, 'Affiliate ID must be 3-20 characters, letters, numbers, hyphens, or underscores only')
  .min(3, 'Affiliate ID must be at least 3 characters')
  .max(20, 'Affiliate ID must be no more than 20 characters');

export const companyNameSchema = z.string()
  .min(2, 'Company name must be at least 2 characters')
  .max(100, 'Company name must be no more than 100 characters')
  .trim();

export const firstNameSchema = z.string()
  .min(1, 'First name is required')
  .max(50, 'First name must be no more than 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters')
  .trim();

export const lastNameSchema = z.string()
  .min(1, 'Last name is required')
  .max(50, 'Last name must be no more than 50 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters')
  .trim();

export const formSchema = z.object({
  affiliateId: affiliateIdSchema,
  companyName: companyNameSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  csrf_token: z.string().min(1, 'CSRF token is required')
});

export type FormData = z.infer<typeof formSchema>;

export function validateFormData(data: FormData): { success: true; data: FormData } | { success: false; errors: Record<string, string> } {
  try {
    const parsedData = formSchema.parse(data);
    return { success: true, data: parsedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.reduce((acc, err) => {
        const field = err.path.join('.');
        acc[field] = err.message;
        return acc;
      }, {} as Record<string, string>);
      
      return { success: false, errors: fieldErrors };
    }
    throw error;
  }
}

export function validationErrorResponse(errors: Record<string, string>): NextResponse {
  return NextResponse.json(
    { 
      error: 'Validation failed',
      fieldErrors: errors
    },
    { status: 400 }
  );
}
