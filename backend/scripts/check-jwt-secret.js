import 'dotenv/config';

console.log('🔍 Checking JWT configuration...\n');

console.log('Environment variables:');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set (length: ' + process.env.JWT_SECRET.length + ')' : '❌ Not set');
console.log('- ADMIN_JWT_SECRET:', process.env.ADMIN_JWT_SECRET ? '✅ Set (length: ' + process.env.ADMIN_JWT_SECRET.length + ')' : '❌ Not set');
console.log('- JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '7d (default)');

const secret = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET;
console.log('\n📝 Secret being used:', secret ? '✅ Available' : '❌ MISSING!');

if (!secret) {
  console.log('\n⚠️  WARNING: No JWT secret found!');
  console.log('Please set JWT_SECRET or ADMIN_JWT_SECRET in your environment variables.');
  process.exit(1);
}

console.log('\n✅ JWT configuration looks good!');

