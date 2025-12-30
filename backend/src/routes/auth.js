import express from 'express';
import { body } from 'express-validator';
import { login, logout } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);

export default router;

