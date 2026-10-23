// server.js - Dual OTP Dispatch and Verification Engine

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(cors()); // Configure origin in production e.g., cors({ origin: 'https://malviganomac.live' })

// In-memory cache for pending OTPs (Replace with Redis in high-scale multi-instance setups)
const otpStore = new Map();

// Initialize Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Initialize Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Endpoint 1: Dispatch Dual OTPs
app.post('/api/send-otp', async (req, res) => {
  const { email, phone, name } = req.body;

  if (!email || !phone) {
    return res.status(400).json({ success: false, message: 'Email and phone are both required.' });
  }

  // Normalize phone (ensure leading '+')
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/[^0-9]/g, '')}`;
  const cleanEmail = email.trim().toLowerCase();

  const emailOtp = generate6DigitOtp();
  const phoneOtp = generate6DigitOtp();

  const storeKey = `${cleanEmail}:${formattedPhone}`;
  otpStore.set(storeKey, {
    emailOtp,
    phoneOtp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 Minutes
  });

  const errors = [];

  // 1. Dispatch Email OTP via Nodemailer
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: cleanEmail,
      subject: `${emailOtp} is your MalviganoMac Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #003366; margin-top: 0;">MalviganoMac Customer Verification</h2>
          <p>Hello ${name || 'Valued Client'},</p>
          <p>Your one-time authentication code for Email verification is:</p>
          <div style="font-size: 26px; font-weight: bold; letter-spacing: 5px; color: #003366; padding: 12px 0;">${emailOtp}</div>
          <p style="font-size: 12px; color: #64748b;">This OTP expires in 5 minutes. If you did not request this code, please ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    console.error('Nodemailer Error:', err);
    errors.push(`Email error: ${err.message}`);
  }

  // 2. Dispatch SMS OTP via Twilio
  try {
    await twilioClient.messages.create({
      body: `Your MalviganoMac verification code is: ${phoneOtp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
  } catch (err) {
    console.error('Twilio SMS Error:', err);
    errors.push(`SMS error: ${err.message}`);
  }

  if (errors.length > 0) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deliver one or more OTPs.',
      details: errors
    });
  }

  res.json({ success: true, message: 'Both OTPs dispatched successfully.' });
});

// Endpoint 2: Validate Dual OTPs
app.post('/api/verify-otp', (req, res) => {
  const { email, phone, emailOtp, mobileOtp } = req.body;

  if (!email || !phone || !emailOtp || !mobileOtp) {
    return res.status(400).json({ success: false, message: 'All parameters are required.' });
  }

  const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/[^0-9]/g, '')}`;
  const cleanEmail = email.trim().toLowerCase();
  const storeKey = `${cleanEmail}:${formattedPhone}`;

  const record = otpStore.get(storeKey);

  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP request found or code has expired. Please request again.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(storeKey);
    return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
  }

  const isEmailMatch = record.emailOtp === emailOtp.trim();
  const isMobileMatch = record.phoneOtp === mobileOtp.trim();

  if (!isEmailMatch || !isMobileMatch) {
    return res.status(400).json({
      success: false,
      message: !isEmailMatch && !isMobileMatch ? 'Both codes are incorrect.' : (!isEmailMatch ? 'Invalid Email OTP.' : 'Invalid Mobile SMS OTP.')
    });
  }

  // Verification passed; destroy token
  otpStore.delete(storeKey);
  res.json({ success: true, message: 'Verification successful.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MalviganoMac Auth Engine active on port ${PORT}`));
