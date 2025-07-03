import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import sendEmail from '../utils/sendEmail.js';

const prisma = new PrismaClient();

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Create user
    const newUser = await prisma.customer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        token,
        tokenExpiry,
        verified: false,
      },
    });

    // Send verification email
    try {
      // const verifyURL = `http://localhost:5000/api/verify?token=${token}`;
      const verifyURL = `http://localhost:5173/verify?token=${token}`;
      const htmlContent = `
        <h3>Welcome, ${name}!</h3>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyURL}">${verifyURL}</a>
      `;
      await sendEmail(email, 'Verify Your Email', htmlContent);
    } catch (emailErr) {
      console.error('Email Error', emailErr);
    }

    res.status(201).json({ message: 'Signup successful. Check your email to verify your account.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong during signup' });
  }
};

export const verifyEmail = async (req, res) => {
// const { token } = req.body;
const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Verification token is missing' });
  }

  try {
    const user = await prisma.customer.findFirst({
      where: {
        token,
        tokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user || user.tokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    } 

    await prisma.customer.update({
      where: { id: user.id },
      data: {
        verified: true,
        token: null,
        tokenExpiry: null,
      },
    });

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email verification failed' });
  }
};
