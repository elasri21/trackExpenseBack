import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import jwt from 'jsonwebtoken';
const router = express.Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


// router.post('/api/login', async (req, res) => {
//   const { email, password } = req.body;

//   const user = await prisma.customer.findUnique({ where: { email } });

//   if (!user || user.password !== password) {
//     return res.status(401).json({ error: 'Invalid credentials' });
//   }

//   const token = jwt.sign(
//     { id: user.id, email: user.email },
//     process.env.JWT_SECRET,
//     { expiresIn: '1h' }
//   );

//   res.json({
//     token: token,
//     customer: {
//       id: user.id,
//       email: user.email,
//       name: user.name
//     }
//   });
// });

router.get('/', authenticate, async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.customer.id },
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

router.post('/', authenticate, async (req, res) => {
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
