const nodemailer = require('nodemailer');

// NOTE: Render's free tier blocks outbound SMTP ports (25/465/587), so Gmail
// SMTP can never connect from there (it just times out). When RESEND_API_KEY
// is set we send via Resend's HTTPS API (port 443, never blocked) instead.
// Without it, we fall back to SMTP via nodemailer (fine for local dev).

const buildHtml = ({ name, email, message, submittedAt }) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00d4ff, #0099cc); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
    .value { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #00d4ff; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
    .message-box { background: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Name:</span>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <span class="label">Email:</span>
        <div class="value"><a href="mailto:${email}">${email}</a></div>
      </div>
      <div class="field">
        <span class="label">Message:</span>
        <div class="message-box">${message}</div>
      </div>
      <div class="field">
        <span class="label">Submitted:</span>
        <div class="value">${new Date(submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</div>
      </div>
      <div style="margin-top: 30px; text-align: center;">
        <p style="color: #666;">Reply directly to <strong>${email}</strong> to respond to this inquiry.</p>
      </div>
    </div>
    <div class="footer">
      <p>This email was sent from your portfolio contact form.</p>
    </div>
  </div>
</body>
</html>
`;

const sendViaResend = async ({ name, email, message, submittedAt }) => {
  // On Resend's free tier (no verified custom domain), mail must be sent from
  // Resend's sandbox address. Set RESEND_FROM to your own verified address if
  // you add a custom domain later.
  const fromAddress = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Portfolio Contact <${fromAddress}>`,
      to: [process.env.NOTIFY_EMAIL],
      subject: `New Portfolio Contact: ${name}`,
      html: buildHtml({ name, email, message, submittedAt }),
      reply_to: email,
    }),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Resend API error ${response.status}: ${details}`);
  }
};

const sendViaSmtp = async ({ name, email, message, submittedAt }) => {
  // Skip if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping notification');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.NOTIFY_EMAIL,
    subject: `New Portfolio Contact: ${name}`,
    html: buildHtml({ name, email, message, submittedAt }),
    replyTo: email,
  });
};

// Send email notification for new contact form submission
const sendEmailNotification = async (payload) => {
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(payload);
      console.log('Email notification sent successfully (Resend)');
    } else {
      await sendViaSmtp(payload);
      console.log('Email notification sent successfully (SMTP)');
    }
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Don't throw error - we don't want to fail the contact submission if email fails
  }
};

module.exports = {
  sendEmailNotification
};
