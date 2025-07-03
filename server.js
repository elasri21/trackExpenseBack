import express from 'express';
import dotenv from 'dotenv';
import { authenticate } from './middleware/authenticate.js';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import expenseRoutes from './routes/expenses.js';
import authRoutes from './routes/auth.js';// to test
import bcrypt from 'bcryptjs';


dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/expenses', expenseRoutes);

// your secret must be in `.env`
const JWT_SECRET = process.env.JWT_SECRET;
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.customer.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // to test verify
    if (!user.verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    // create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
