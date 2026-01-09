/**
 * Test script for Facebook OAuth JWT Integration
 *
 * This script demonstrates how the JWT token is decoded to extract businessId
 * Run with: node test_facebook_jwt.cjs
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
console.log('');

// Create a sample JWT token matching Pinntag Backend structure
const pinntagPayload = {
  id: '68a034b88d3f46bfda759207',
  userType: 'BusinessUser',
  role: '68a034b88d3f46bfda759205',
  businessProfile: '6908930ad850b150e12cc795', // This is used as businessId
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
};

console.log('Creating Pinntag-style JWT token with payload:');
console.log(JSON.stringify(pinntagPayload, null, 2));
console.log('');

const token = jwt.sign(pinntagPayload, JWT_SECRET);
console.log('✅ JWT Token Created:');
console.log(token);
console.log('');

// Test: Decode the token to extract businessProfile
console.log('Test 1: Decoding token to extract businessId...');
const decoded = jwt.decode(token);

if (decoded && decoded.businessProfile) {
  console.log('✅ Successfully extracted businessId from token');
  console.log('   User ID:', decoded.id);
  console.log('   User Type:', decoded.userType);
  console.log('   Role:', decoded.role);
  console.log('   Business ID (from businessProfile):', decoded.businessProfile);
  console.log('');
} else {
  console.error('❌ Failed to extract businessProfile');
  process.exit(1);
}

// Test: Verify the token
console.log('Test 2: Verifying token signature...');
try {
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token signature verified');
  console.log('');
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}

// Test: Simulate Authorization header extraction
console.log('Test 3: Simulating Authorization header extraction...');
const authHeader = `Bearer ${token}`;
console.log('Authorization header:', authHeader.substring(0, 50) + '...');

// Extract token from header
const extractedToken = authHeader.startsWith('Bearer ')
  ? authHeader.substring(7)
  : authHeader;

const decodedFromHeader = jwt.decode(extractedToken);

if (decodedFromHeader && decodedFromHeader.businessProfile) {
  console.log('✅ Successfully extracted token from Authorization header');
  console.log('   Business ID:', decodedFromHeader.businessProfile);
  console.log('');
} else {
  console.error('❌ Failed to extract token from header');
  process.exit(1);
}

// Test: Simulate the Facebook OAuth callback flow
console.log('Test 4: Simulating Facebook OAuth callback flow...');
console.log('');

const mockFacebookCode = 'AQBxyz123...'; // Mock Facebook code
const mockState = 'random-state-123';

console.log('Scenario: Frontend receives Facebook OAuth callback');
console.log(`  URL: /api/facebook/oauth/callback?code=${mockFacebookCode}&state=${mockState}`);
console.log(`  Authorization header: Bearer ${token.substring(0, 20)}...`);
console.log('');

console.log('Backend processing:');
console.log('  1. Extract Authorization header ✓');
console.log('  2. Remove "Bearer " prefix ✓');
console.log('  3. Decode JWT token ✓');
console.log(`  4. Extract businessProfile: "${decodedFromHeader.businessProfile}" ✓`);
console.log('  5. Use as businessId in OAuth flow ✓');
console.log('');

console.log('✅ Facebook OAuth callback flow simulation successful!');
console.log('');

console.log('='.repeat(70));
console.log('All tests completed successfully!');
console.log('='.repeat(70));
console.log('');

console.log('💡 How to use this in your Facebook OAuth flow:');
console.log('');
console.log('1. User logs in and receives JWT token from Pinntag Backend');
console.log('2. Frontend initiates Facebook OAuth flow');
console.log('3. Facebook redirects back with code and state');
console.log('4. Frontend calls callback endpoint with JWT token:');
console.log('');
console.log('   fetch(`/api/facebook/oauth/callback?code=${code}&state=${state}`, {');
console.log('     headers: {');
console.log(`       'Authorization': 'Bearer ${token.substring(0, 30)}...'`);
console.log('     }');
console.log('   });');
console.log('');
console.log('5. Backend extracts businessId from JWT token automatically');
console.log('6. No need to pass businessId as query parameter!');
console.log('');

console.log('📚 See FACEBOOK_OAUTH_JWT_INTEGRATION.md for complete documentation');
console.log('');

console.log('🔑 Sample JWT token for testing:');
console.log(token);
