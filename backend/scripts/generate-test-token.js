import jwt from 'jsonwebtoken';

const secret = 'JesusandWaynesittinginacafe';

// Token from the user's browser
const userToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLTEiLCJlbWFpbCI6ImFkbWluQGplc3VzLXRyYXZlbC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjgzMTUwNjIsImV4cCI6MTc2ODkxOTg2Mn0.HY-ubmGaxKYVdday79yn3zaGzf6WaZQ-04mWWSa08fs';

console.log('Testing user token with secret:', secret);
console.log('Secret length:', secret.length);
console.log('\nAttempting to verify user token...');

try {
  const decoded = jwt.verify(userToken, secret);
  console.log('✅ Token is VALID!');
  console.log('Decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token is INVALID!');
  console.log('Error:', error.message);
  console.log('Error name:', error.name);

  // Try with different secrets to see what works
  console.log('\nTrying with local .env secret...');
  try {
    const decoded2 = jwt.verify(userToken, 'your-super-secret-jwt-key-change-this');
    console.log('✅ Token works with local secret!');
    console.log('Decoded:', decoded2);
  } catch (e2) {
    console.log('❌ Also fails with local secret');
  }
}
