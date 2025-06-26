import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import jwt from 'jsonwebtoken';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.customer.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token: token,
    customer: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
});

router.get('/api/expenses', authenticate, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.customer.id },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/api/expenses', authenticate, async (req, res) => {
  const { title, amount, date } = req.body;
  try {
    const newExpense = await prisma.expense.create({
      data: {
        title,
        amount,
        date: date || new Date(),
        userId: req.customer.id,
      },
    });
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const expenseId = parseInt(req.params.id);
  const userId = req.customer.id;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!expense || expense.userId !== userId) {
      return res.status(403).json({ error: 'Not allowed to delete this expense' });
    }
    await prisma.expense.delete({
      where: { id: expenseId },
    });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
