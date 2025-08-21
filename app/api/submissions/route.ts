import { NextRequest, NextResponse } from 'next/server';
import { createSubmissionEmail, sendEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  const { contactName, priority, email, trackingLink } = await req.json();
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  const html = createSubmissionEmail({ contactName, priority, trackingLink });
  const res = await sendEmail({ to: email, subject: 'Submission Confirmation', html });
  return NextResponse.json(res);
}
