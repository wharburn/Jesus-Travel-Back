import 'dotenv/config';
import pkg from 'pg';
const { Client } = pkg;

const testConnection = async () => {
  console.log('Testing database connection...');
  console.log('Connection string:', process.env.POSTGRES_CONNECTION_STRING.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
  });

  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    console.log('Running test query...');
    const result = await client.query('SELECT NOW()');
    console.log('✅ Query successful:', result.rows[0]);
    
    await client.end();
    console.log('✅ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
};

testConnection();

