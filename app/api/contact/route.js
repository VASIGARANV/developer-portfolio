import axios from 'axios';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { personalData } from '@/utils/data/personal-data';

// Create and configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSKEY, 
  },
});

// If SMTP credentials are missing, warn (helpful during development)
if (!process.env.EMAIL_ADDRESS || !process.env.GMAIL_PASSKEY) {
  console.warn('SMTP not configured: set EMAIL_ADDRESS and GMAIL_PASSKEY environment variables. Contact emails will fail until configured.');
}

// Helper function to send a message via Telegram
async function sendTelegramMessage(token, chat_id, message) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await axios.post(url, {
      text: message,
      chat_id,
    });
    return res.data.ok;
  } catch (error) {
    console.error('Error sending Telegram message:', error.response?.data || error.message);
    return false;
  }
};

// HTML email template
const generateEmailTemplate = (name, email, userMessage) => `
  <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #007BFF;">New Message Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="border-left: 4px solid #007BFF; padding-left: 10px; margin-left: 0;">
        ${userMessage}
      </blockquote>
      <p style="font-size: 12px; color: #888;">Click reply to respond to the sender.</p>
    </div>
  </div>
`;

// Helper function to send an email via Nodemailer
async function sendEmail(payload, message) {
  const { name, email, message: userMessage } = payload;
  
  const mailOptions = {
    from: `Portfolio <${process.env.EMAIL_ADDRESS}>`, 
    to: personalData.email || process.env.EMAIL_ADDRESS, 
    subject: `New Message From ${name}`, 
    text: message, 
    html: generateEmailTemplate(name, email, userMessage), 
    replyTo: email, 
  };
  
  try {
    // verify transporter is ready before sending to get clearer errors
    try {
      await transporter.verify();
    } catch (verifyErr) {
      console.error('SMTP transporter.verify() failed:', verifyErr?.message || verifyErr);
      return false;
    }
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error while sending email:', error);
    return false;
  }
};

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log('Contact form payload received:', payload);
    const { name, email, message: userMessage } = payload;
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat_id = process.env.TELEGRAM_CHAT_ID;

    const message = `New message from ${name}\n\nEmail: ${email}\n\nMessage:\n\n${userMessage}\n\n`;

    // Try to send Telegram message if credentials are provided; otherwise skip
    let telegramSuccess = true;
    if (token && chat_id) {
      try {
        telegramSuccess = await sendTelegramMessage(token, chat_id, message);
      } catch (err) {
        console.error('Telegram send error:', err?.message || err);
        telegramSuccess = false;
      }
    } else {
      console.log('Telegram token/chat_id not provided — skipping Telegram notification.');
    }

    // Always attempt to send email (email is the primary notification)
    const emailSuccess = await sendEmail(payload, message);

    if (emailSuccess) {
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully.' + (telegramSuccess ? ' Telegram sent.' : ' Telegram skipped/failed.'),
      }, { status: 200 });
    }

    // If email failed, return error (even if Telegram worked)
    return NextResponse.json({
      success: false,
      message: 'Failed to send email. Please check SMTP configuration.',
    }, { status: 500 });
  } catch (error) {
    console.error('API Error:', error.message);
    return NextResponse.json({
      success: false,
      message: 'Server error occurred.',
    }, { status: 500 });
  }
};