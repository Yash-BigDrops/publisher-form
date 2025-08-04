import * as nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email template for creative submission
export const createSubmissionEmail = (data: {
  contactName: string;
  priority: string;
  trackingLink: string;
}) => {
  return `
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
          <p>Hello ${data.contactName},</p>
          <p>Thank you for your submission! We have received your creative and it is now being processed.</p>
          <p><strong>Priority Level:</strong> ${data.priority}</p>
          <div class="tracking-link">
            <strong>Your Tracking Link:</strong><br>
            <a href="${data.trackingLink}" style="color: #3b82f6;">${data.trackingLink}</a>
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
};

// Send email function
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  try {
    const mailOptions = {
      from: `"Big Drops Marketing" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Verify SMTP connection
export const verifySMTPConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error);
    return false;
  }
}; 