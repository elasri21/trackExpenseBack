import express from 'express';
import dotenv from 'dotenv';
import { authenticate } from './middleware/authenticate.js';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import expenseRoutes from './routes/expenses.js';


dotenv.config();
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api/expenses', expenseRoutes);

// your secret must be in `.env`
const JWT_SECRET = process.env.JWT_SECRET;
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.customer.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
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

// Example route
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.customer.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  const {name, email, password} = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const existingUser = await prisma.customer.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
    const newUser = await prisma.customer.create({
      data: {
        name,
        email,
        password,
      }
    });
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/expenses', authenticate, async (req, res) => {
  const { title, amount } = req.body;
  if (!title || !amount) {
    return res.status(400).json({ error: 'Title and amount are required' });
  }

  try {
    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        userId: req.customer.id,
      },
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/expenses', authenticate, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.customer.id },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
