import jwt from 'jsonwebtoken';

const secret = 'JesusandWaynesittinginacafe';

const token = jwt.sign(
  {
    id: 'admin-1',
    email: 'admin@jesus-travel.com',
    role: 'admin',
  },
  secret,
  {
    expiresIn: '7d',
  }
);

console.log('Test token generated with secret:', secret);
console.log('Secret length:', secret.length);
console.log('\nToken:');
console.log(token);
console.log('\nTo test, run this in browser console:');
console.log(`localStorage.setItem('adminToken', '${token}');`);
console.log('Then try accessing Settings');

