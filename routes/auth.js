import express from 'express';
import { signup, verifyEmail } from '../controllers/authController.js';

const router = express.Router();

router.post('/users', signup);
router.get('/verify', verifyEmail);
// router.post('/verify', verifyEmail);


export default router;
