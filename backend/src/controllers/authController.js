import jwt from 'jsonwebtoken';
import { errorResponse, successResponse } from '../utils/helpers.js';
import logger from '../utils/logger.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // For now, use environment variables for admin credentials
    // TODO: Implement proper user management with database
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_DEFAULT_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD;

    // Debug logging
    logger.info(
      `Login attempt - ADMIN_EMAIL env: ${process.env.ADMIN_EMAIL}, ADMIN_DEFAULT_EMAIL env: ${process.env.ADMIN_DEFAULT_EMAIL}, Using: ${adminEmail}`
    );

    if (email !== adminEmail) {
      return res.status(401).json(errorResponse('AUTHENTICATION_ERROR', 'Invalid credentials'));
    }

    // Check password
    const isValidPassword = password === adminPassword; // TODO: Use bcrypt for hashed passwords

    if (!isValidPassword) {
      return res.status(401).json(errorResponse('AUTHENTICATION_ERROR', 'Invalid credentials'));
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    logger.info('Login - JWT Secret available:', !!jwtSecret);
    logger.info('Login - JWT Secret length:', jwtSecret?.length);

    const token = jwt.sign(
      {
        id: 'admin-1',
        email: adminEmail,
        role: 'admin',
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    logger.info(`Admin login successful: ${email}`);

    res.json(
      successResponse({
        token,
        user: {
          id: 'admin-1',
          email: adminEmail,
          role: 'admin',
          name: 'Admin User',
        },
      })
    );
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // For JWT, logout is handled client-side by removing the token
    // Optionally, implement token blacklisting here

    res.json(successResponse({ message: 'Logged out successfully' }));
  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};
