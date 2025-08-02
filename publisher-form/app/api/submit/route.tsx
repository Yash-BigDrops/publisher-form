import { put } from '@vercel/blob';
import { sql } from '@vercel/postgres';
import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  const formData = await request.formData();
  const offerId = formData.get('offerId') as string;
  const files = formData.getAll('files') as File[];
  const contactEmail = formData.get('contactEmail') as string;

  if (!offerId || files.length === 0 || !contactEmail) {
    return NextResponse.json({ error: 'Offer ID, files, and an email address are required.' }, { status: 400 });
  }

  let fileBuffer: Buffer;
  let fileName: string;
  let originalFilename: string;
  let contentType: string;

  if (files.length > 1) {
    const zip = new JSZip();
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      zip.file(file.name, arrayBuffer);
    }
    fileBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    fileName = `${offerId}.zip`;
    originalFilename = `${offerId}.zip`;
    contentType = 'application/zip';
  } else {
    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
    const extension = file.name.split('.').pop() || 'bin';
    fileName = `${offerId}.${extension}`;
    originalFilename = file.name;
    contentType = file.type;
  }

  try {
    const blob = await put(fileName, fileBuffer, {
      access: 'public',
      contentType: contentType,
      allowOverwrite: true,
    });

    const telegramId = formData.get('telegramId') as string | null;
    const fromLine = formData.get('fromLine') as string | null;
    const subjectLines = formData.get('subjectLines') as string | null;
    const otherRequest = formData.get('otherRequest') as string | null;

    const submissionResult = await sql`
      INSERT INTO submissions (
        offer_id, file_url, file_key, original_filename, 
        contact_method, contact_info, telegram_chat_id,
        from_lines, subject_lines, other_request 
      )
      VALUES (
        ${offerId}, ${blob.url}, ${blob.pathname}, ${originalFilename}, 
        'email', ${contactEmail}, ${telegramId},
        ${fromLine}, ${subjectLines}, ${otherRequest}
      )
      RETURNING id;
    `;

    const newSubmissionId = submissionResult.rows[0].id;
    const trackingLink = `https://www.bigdropsmarketing.com/tracking_link/BDMG${newSubmissionId}`;


    const EVERFLOW_API_KEY = process.env.EVERFLOW_API_KEY;

    if (EVERFLOW_API_KEY && offerId) {
      try {
        const everflowApiUrl = `https://api.eflow.team/v1/networks/offers/${offerId}`;
        const response = await fetch(everflowApiUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'X-Eflow-API-Key': EVERFLOW_API_KEY },
          cache: 'no-store',
        });
        if (response.ok) {
          await response.json(); // Fetch but don't store since we don't use it
        }
      } catch (e) {
        console.error("Failed to fetch offer details for email, but proceeding anyway.", e);
      }
    }

    if (contactEmail && resend) {
      try {
        // Create a simple HTML email template
        const contactName = formData.get('firstName') as string || 'there';
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Submission Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background: #f9fafb; }
              .tracking-link { background: #e0e7ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Submission Confirmed!</h1>
              </div>
              <div class="content">
                <p>Hello ${contactName},</p>
                <p>Thank you for your submission! We have received your creative and it is now being processed.</p>
                <div class="tracking-link">
                  <strong>Your Tracking Link:</strong><br>
                  <a href="${trackingLink}" style="color: #3b82f6;">${trackingLink}</a>
                </div>
                <p>You can use this link to track the status of your submission.</p>
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Best regards,<br>Big Drops Marketing Team</p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;
        
        await resend.emails.send({
          from: 'Big Drops Marketing <onboarding@resend.dev>',
          to: [contactEmail],
          subject: 'Your Submission Has Been Received!',
          html: emailHtml,
        });
        console.log('Confirmation email sent successfully.');
      } catch (exception) {
        console.error('An unexpected exception occurred while sending email:', exception);
      }
    }

    if (telegramId) {
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const telegramAdminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

      if (telegramBotToken && telegramAdminChatId) {
        try {
          const adminMessage = `
<b>New Submission Received!</b>
-----------------------------------
<b>Affiliate ID:</b> ${formData.get("affiliateId")}
<b>Company:</b> ${formData.get("companyName")}
<b>Name:</b> ${formData.get("firstName")} ${formData.get("lastName")}
<b>Offer ID:</b> ${offerId}
<b>Email:</b> ${contactEmail}
<b>Telegram:</b> ${telegramId}
-----------------------------------
<b>Tracking Link:</b> ${trackingLink}
          `;
          const telegramApiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
          await fetch(telegramApiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramAdminChatId,
              text: adminMessage,
              parse_mode: "HTML",
            }),
          });
          console.log("Telegram admin notification sent.");
        } catch (exception) {
          console.error(
            "Failed to send Telegram admin notification:",
            exception
          );
        }
      }
    }

    return NextResponse.json({ success: true, url: blob.url, trackingLink: trackingLink });

  } catch (error) {
    console.error('Error during submission:', error);
    return NextResponse.json({ error: 'Server error during submission.' }, { status: 500 });
  }
}