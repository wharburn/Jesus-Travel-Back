import dns from 'dns';
import 'dotenv/config';
import { healthCheck, initializeDatabase } from '../src/config/postgres.js';
import logger from '../src/utils/logger.js';

// Force IPv4 first for DNS resolution
dns.setDefaultResultOrder('ipv4first');

/**
 * Initialize the PostgreSQL database with schema and seed data
 */
const main = async () => {
  try {
    logger.info('🚀 Starting database initialization...');

    // Check database connection
    logger.info('📡 Checking database connection...');
    const health = await healthCheck();

    if (health.status !== 'healthy') {
      throw new Error(`Database is not healthy: ${health.error}`);
    }

    logger.info('✅ Database connection successful');
    logger.info(`📊 Pool stats: ${JSON.stringify(health.pool)}`);

    // Initialize database
    await initializeDatabase();

    logger.info('🎉 Database initialization complete!');
    logger.info('');
    logger.info('✅ Schema created');
    logger.info('✅ Pricing rules inserted');
    logger.info('✅ Time multipliers configured');
    logger.info('✅ Zone charges set up');
    logger.info('');
    logger.info('🚀 Your MCP Automated Quoting System is ready!');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

main();
