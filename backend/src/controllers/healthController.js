import redisClient from '../config/redis.js';
import vectorClient from '../config/vector.js';
import logger from '../utils/logger.js';

export const checkHealth = async (req, res) => {
  try {
    const services = {
      redis: 'unknown',
      search: 'unknown',
      vector: 'unknown',
    };

    // Check Redis connection
    try {
      await redisClient.ping();
      services.redis = 'connected';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      services.redis = 'disconnected';
    }

    // Search feature disabled
    services.search = 'disabled';

    // Check Vector DB connection
    try {
      // Simple check - vector client is initialized
      if (vectorClient) {
        services.vector = 'connected';
      } else {
        services.vector = 'not_configured';
      }
    } catch (error) {
      logger.error('Vector DB health check failed:', error);
      services.vector = 'disconnected';
    }

    const allHealthy = Object.values(services).every(
      (status) => status === 'connected' || status === 'not_configured'
    );

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
};
