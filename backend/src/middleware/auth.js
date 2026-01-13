import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get JWT secret
    const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;

    // Debug logging
    logger.info(`Auth - JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
    logger.info(`Auth - ADMIN_JWT_SECRET exists: ${!!process.env.ADMIN_JWT_SECRET}`);
    logger.info(`Auth - Using secret length: ${jwtSecret?.length}`);
    logger.info(`Auth - Secret preview: ${jwtSecret?.substring(0, 5)}...`);
    logger.info(`Auth - Token length: ${token?.length}`);
    logger.info(`Auth - Token preview: ${token?.substring(0, 20)}...`);

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    logger.error('Error name:', error.name);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Token expired',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
      },
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'Not authenticated',
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'AUTHORIZATION_ERROR',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};
