import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred'
    }
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.details = err.details;
  }

  if (err.name === 'UnauthorizedError' || err.code === 'AUTHENTICATION_ERROR') {
    statusCode = 401;
    errorResponse.error.code = 'AUTHENTICATION_ERROR';
  }

  if (err.code === 'AUTHORIZATION_ERROR') {
    statusCode = 403;
  }

  if (err.code === 'NOT_FOUND') {
    statusCode = 404;
  }

  if (err.code === 'CONFLICT') {
    statusCode = 409;
  }

  if (err.code === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;

