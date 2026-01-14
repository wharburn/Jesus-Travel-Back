import express from 'express';
import analyticsRoutes from './analytics.js';
import authRoutes from './auth.js';
import bookingRoutes from './bookings.js';
import driverRoutes from './drivers.js';
import enquiryRoutes from './enquiries.js';
import healthRoutes from './health.js';
import quotesRoutes from './quotes.js';
import searchRoutes from './search.js';
import settingsRoutes from './settings.js';
import vehicleRoutes from './vehicles.js';
import webhookRoutes from './webhooks.js';

const router = express.Router();

// Public routes
router.use('/health', healthRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/auth', authRoutes);

// API routes
router.use('/enquiries', enquiryRoutes);
router.use('/bookings', bookingRoutes);
router.use('/quotes', quotesRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/search', searchRoutes);
router.use('/settings', settingsRoutes);

export default router;
