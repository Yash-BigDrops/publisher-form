import * as nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('SMTP env vars missing (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)');
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT as string, 10),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export const createSubmissionEmail = (data: { contactName: string; priority: string; trackingLink: string; }) => `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}.header{background:#3b82f6;color:#fff;padding:20px;text-align:center}.content{padding:20px;background:#f9fafb}.tracking-link{background:#e0e7ff;padding:15px;border-radius:8px;margin:20px 0}.footer{text-align:center;padding:20px;color:#6b7280;font-size:14px}
</style></head><body><div class="container"><div class="header"><h1>Submission Confirmed!</h1></div><div class="content">
<p>Hello ${data.contactName},</p><p>Thank you for your submission! We have received your creative.</p>
<p><strong>Priority:</strong> ${data.priority}</p>
<div class="tracking-link"><strong>Your Tracking Link:</strong><br><a href="${data.trackingLink}" style="color:#3b82f6">${data.trackingLink}</a></div>
<p>You can use this link to track your submission.</p><p>Best,<br>Big Drops Marketing Team</p></div>
<div class="footer"><p>This is an automated message. Please do not reply.</p></div></div></body></html>
`;

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  const emailTransporter = getTransporter();
  const info = await emailTransporter.sendMail({
    from: `"Big Drops Marketing" <${process.env.SMTP_USER}>`,
    to: opts.to, subject: opts.subject, html: opts.html
  });
  return { success: true, messageId: info.messageId };
}
