/**
 * Simple test script for JWT Service
 *
 * This script demonstrates the JWT service functionality.
 * Run with: node test_jwt_service.js
 */

const jwt = require('jsonwebtoken');

// Load the secret from .env
require('dotenv').config();

const JWT_SECRET = process.env.PINNTAG_BACKEND_JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ PINNTAG_BACKEND_JWT_SECRET is not set in .env file');
  process.exit(1);
}

console.log('✅ JWT Secret loaded from .env');
console.log('Secret:', JWT_SECRET);
console.log('');

// Create a sample JWT token (simulating Pinntag Backend)
const samplePayload = {
  userId: 'user123',
  email: 'test@pinntag.com',
  role: 'admin',
  businessId: 'business456',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60), // Expires in 1 hour
};

console.log('Creating sample JWT token with payload:');
console.log(JSON.stringify(samplePayload, null, 2));
console.log('');

const token = jwt.sign(samplePayload, JWT_SECRET);
console.log('✅ Sample JWT Token Created:');
console.log(token);
console.log('');

// Test 1: Verify the token
console.log('Test 1: Verifying the token...');
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token verified successfully!');
  console.log('Payload:', JSON.stringify(verified, null, 2));
  console.log('');
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  console.log('');
}

// Test 2: Decode without verification
console.log('Test 2: Decoding without verification...');
const decoded = jwt.decode(token);
console.log('✅ Token decoded:');
console.log('Payload:', JSON.stringify(decoded, null, 2));
console.log('');

// Test 3: Check expiration
console.log('Test 3: Checking token expiration...');
if (decoded && decoded.exp) {
  const expirationDate = new Date(decoded.exp * 1000);
  const isExpired = expirationDate < new Date();
  const timeToExpiration = expirationDate.getTime() - Date.now();
  const minutesToExpiration = Math.floor(timeToExpiration / 1000 / 60);

  console.log('Expiration Date:', expirationDate.toISOString());
  console.log('Is Expired:', isExpired);
  console.log('Time to Expiration:', minutesToExpiration, 'minutes');
  console.log('');
}

// Test 4: Create an expired token
console.log('Test 4: Testing expired token...');
const expiredPayload = {
  userId: 'user789',
  email: 'expired@pinntag.com',
  iat: Math.floor(Date.now() / 1000) - (60 * 60 * 2), // 2 hours ago
  exp: Math.floor(Date.now() / 1000) - (60 * 60), // Expired 1 hour ago
};

const expiredToken = jwt.sign(expiredPayload, JWT_SECRET);
console.log('Expired token created:', expiredToken);

try {
  jwt.verify(expiredToken, JWT_SECRET);
  console.log('❌ Expired token should not verify');
} catch (error) {
  if (error.name === 'TokenExpiredError') {
    console.log('✅ Correctly detected expired token');
    console.log('Error:', error.message);
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
console.log('');

// Test 5: Invalid signature
console.log('Test 5: Testing invalid signature...');
const invalidToken = jwt.sign({ userId: 'test' }, 'wrong-secret');
console.log('Token with wrong signature:', invalidToken);

try {
  jwt.verify(invalidToken, JWT_SECRET);
  console.log('❌ Invalid token should not verify');
} catch (error) {
  if (error.name === 'JsonWebTokenError') {
    console.log('✅ Correctly rejected invalid signature');
    console.log('Error:', error.message);
  } else {
    console.error('❌ Unexpected error:', error.message);
  }
}
console.log('');

// Test 6: Simulating Authorization header
console.log('Test 6: Testing Authorization header extraction...');
const authHeader = `Bearer ${token}`;
console.log('Authorization header:', authHeader);

const extractedToken = authHeader.split(' ')[1];
try {
  const verified = jwt.verify(extractedToken, JWT_SECRET);
  console.log('✅ Token extracted and verified from header');
  console.log('User ID:', verified.userId);
  console.log('');
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.log('');
}

console.log('='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
console.log('');
console.log('💡 You can now use this token in your API requests:');
console.log('');
console.log('curl -H "Authorization: Bearer ' + token + '" \\');
console.log('     http://localhost:4001/api/protected');
console.log('');
console.log('📚 See JWT_SERVICE_README.md for complete documentation');
