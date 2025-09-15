
'use server';

import { ai } from '@/app/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase/admin';
import nodemailer from 'nodemailer';
import { getDb } from '@/lib/mongo';

async function sendEmailWithOtp(email: string, otp: string) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("EMAIL_USER or EMAIL_PASS environment variables not set. Falling back to console logging.");
        console.log(`************************************************`);
        console.log(`** VAIKHARI EMAIL OTP (FOR DEVELOPMENT) **`);
        console.log(`** TO: ${email}`);
        console.log(`** OTP: ${otp}`);
        console.log(`** In a production environment, this would be sent via a real email service.`);
        console.log(`************************************************`);
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Or your preferred email service
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: '"Vaikhari Verification" <no-reply@vaikhari.com>',
            to: email,
            subject: 'Your Vaikhari Verification Code',
            text: `Your one-time verification code is: ${otp}`,
            html: `<b>Your one-time verification code is: ${otp}</b><p>This code will expire in 5 minutes.</p>`,
        });
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error("Nodemailer failed to send email:", error);
        throw new Error("Could not send verification email.");
    }
}

const OtpSchema = z.object({
  otpHash: z.string(),
  expiresAt: z.number(),
});

const SendEmailInputSchema = z.object({
  email: z.string().email(),
});

const SendEmailOutputSchema = z.object({
  success: z.boolean(),
});

const VerifyEmailInputSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const VerifyEmailOutputSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

// A simple hashing function for the OTP. In a real production system,
// you would use a more robust cryptographic library like bcrypt.
async function hashOtp(otp: string): Promise<string> {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(otp));
    return Buffer.from(buffer).toString('hex');
}

export const sendEmailOtp = ai.defineFlow(
  {
    name: 'sendEmailOtp',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async ({ email }) => {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await hashOtp(otp);
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry (ms)
      const dbm = await getDb();
      await dbm.collection('email_otps').updateOne({ email }, { $set: { email, otpHash, expiresAt } }, { upsert: true });
      
      await sendEmailWithOtp(email, otp);
      
      return { success: true };
    } catch (e: any) {
      console.error("sendEmailOtp flow failed:", e);
      return { success: false };
    }
  }
);


export const verifyEmailOtp = ai.defineFlow(
  {
    name: 'verifyEmailOtp',
    inputSchema: VerifyEmailInputSchema,
    outputSchema: VerifyEmailOutputSchema,
  },
  async ({ email, otp }) => {
    try {
      const dbm = await getDb();
      const doc = await dbm.collection('email_otps').findOne({ email });
      if (!doc) {
        return { success: false, error: 'Invalid or expired OTP. Please try again.' };
      }

      const { otpHash, expiresAt } = doc as z.infer<typeof OtpSchema> & { email: string };

      if (expiresAt < Date.now()) {
        await dbm.collection('email_otps').deleteOne({ email });
        return { success: false, error: 'OTP has expired. Please request a new one.' };
      }

      const providedOtpHash = await hashOtp(otp);
      if (providedOtpHash !== otpHash) {
        return { success: false, error: 'Invalid OTP. Please check the code and try again.' };
      }
      
      // OTP is correct. Mark email as verified in Firebase Auth.
      const adminAuth = getAuth(adminApp);
      const userRecord = await adminAuth.getUserByEmail(email);
      if (!userRecord.emailVerified) {
          await adminAuth.updateUser(userRecord.uid, { emailVerified: true });
      }

      // Clean up the used OTP.
      await dbm.collection('email_otps').deleteOne({ email });

      return { success: true };
    } catch (e: any) {
      console.error("verifyEmailOtp flow failed:", e);
      if ((e as any).code === 'auth/user-not-found') {
          return { success: false, error: 'User not found.' };
      }
      return { success: false, error: 'An unexpected error occurred during verification.' };
    }
  }
);
