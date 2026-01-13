import express from 'express';
import { body } from 'express-validator';
import { login, logout } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/login', loginValidation, validate, login);
router.post('/logout', logout);

// Debug endpoint to check JWT secret configuration
router.get('/debug/jwt-config', (req, res) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;

  // Check for hidden characters
  const secretBytes = jwtSecret ? Buffer.from(jwtSecret).toString('hex') : 'NONE';

  res.json({
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasAdminJwtSecret: !!process.env.ADMIN_JWT_SECRET,
    secretLength: jwtSecret?.length || 0,
    secretPreview: jwtSecret ? jwtSecret.substring(0, 5) + '...' : 'NONE',
    secretHex: secretBytes.substring(0, 20) + '...', // First 10 chars in hex
    expectedHex:
      Buffer.from('JesusandWaynesittinginacafe').toString('hex').substring(0, 20) + '...',
    secretsMatch: jwtSecret === 'JesusandWaynesittinginacafe',
  });
});

export default router;
