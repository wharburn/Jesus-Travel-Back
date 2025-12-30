import { validationResult } from 'express-validator';
import logger from '../utils/logger.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    // Log validation errors for debugging
    logger.error('Validation failed:', JSON.stringify(errorDetails));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errorDetails,
      },
    });
  }

  next();
};
