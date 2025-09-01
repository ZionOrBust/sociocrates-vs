// Run this to generate a secure JWT secret for production
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');
console.log('🔐 Your secure JWT_SECRET for production:');
console.log(secret);
console.log('');
console.log('Set this as environment variable in GoDaddy:');
console.log(`JWT_SECRET=${secret}`);
