import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../controllers/settingsController.js';

const router = express.Router();

// Get all settings (admin only)
router.get('/', authenticate, getSettings);

// Update settings (admin only)
router.put('/', authenticate, updateSettings);

export default router;

