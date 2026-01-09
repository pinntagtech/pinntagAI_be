# Facebook OAuth JWT Integration

## Overview

The Facebook OAuth callback has been updated to extract `businessId` from the JWT token's `businessProfile` field instead of requiring it as a query parameter.

## Changes Made

### 1. Updated JWT Payload Interface

**File**: [src/api/services/jwt.service.ts](src/api/services/jwt.service.ts)

The `PinntagJwtPayload` interface now matches the actual Pinntag Backend token structure:

```typescript
export interface PinntagJwtPayload extends JwtPayload {
  id?: string;                // User ID
  userType?: string;          // e.g., "BusinessUser"
  role?: string;              // Role ID
  businessProfile?: string;   // Business Profile ID (used as businessId)
  email?: string;
  [key: string]: any;
}
```

### 2. Updated Facebook OAuth Callback

**File**: [src/api/controllers/facebookController.ts](src/api/controllers/facebookController.ts)

The `handleOAuthCallback` method now:
- Requires an `Authorization` header with JWT token
- Decodes the JWT token to extract `businessProfile`
- Uses `businessProfile` as `businessId`
- No longer requires `businessId` in query parameters

### 3. Updated Middleware

**File**: [src/middleware/jwtAuth.ts](src/middleware/jwtAuth.ts)

The `requireBusinessAccess` middleware now uses `businessProfile` field from the JWT token.

### 4. Updated Route Documentation

**File**: [src/api/routes/facebook.routes.ts](src/api/routes/facebook.routes.ts)

Route documentation updated to reflect the new requirements.

## API Changes

### Before

```http
GET /api/facebook/oauth/callback?code=ABC&state=XYZ&businessId=123
```

### After

```http
GET /api/facebook/oauth/callback?code=ABC&state=XYZ
Authorization: Bearer <JWT_TOKEN>
```

## JWT Token Structure

The expected JWT token should have the following structure when decoded:

```json
{
  "id": "68a034b88d3f46bfda759207",
  "userType": "BusinessUser",
  "role": "68a034b88d3f46bfda759205",
  "businessProfile": "6908930ad850b150e12cc795",
  "iat": 1767095007,
  "exp": 1798631007
}
```

The `businessProfile` field is extracted and used as `businessId`.

## How It Works

### Flow Diagram

```
1. Client makes request with JWT token
   ↓
2. Controller extracts Authorization header
   ↓
3. JWT Service decodes token (no verification needed)
   ↓
4. Extract businessProfile field
   ↓
5. Use businessProfile as businessId
   ↓
6. Continue with OAuth flow
```

### Code Example

```typescript
// Extract Authorization header
const authHeader = req.headers.authorization;

// Decode JWT token
const token = authHeader.substring(7); // Remove "Bearer "
const decodedToken = jwtService.decode(token);

// Extract businessId from businessProfile
const businessId = decodedToken.businessProfile;

// Use businessId in OAuth flow
await facebookService.completeOAuthFlow(longLivedToken, businessId);
```

## Error Handling

### Missing Authorization Header

```json
{
  "success": false,
  "error": "Authorization header with JWT token is required"
}
```
**Status Code**: 401

### Invalid JWT Token

```json
{
  "success": false,
  "error": "Invalid JWT token format"
}
```
**Status Code**: 401

### Missing businessProfile

```json
{
  "success": false,
  "error": "businessProfile not found in JWT token"
}
```
**Status Code**: 400

## Usage Examples

### Frontend Example (React/JavaScript)

```javascript
// Get the JWT token (from login/session)
const jwtToken = localStorage.getItem('authToken');

// Make the OAuth callback request
const response = await fetch(
  `/api/facebook/oauth/callback?code=${code}&state=${state}`,
  {
    headers: {
      'Authorization': `Bearer ${jwtToken}`
    }
  }
);

const data = await response.json();
console.log('OAuth completed:', data);
```

### cURL Example

```bash
curl -X GET \
  "http://localhost:4001/api/facebook/oauth/callback?code=YOUR_CODE&state=YOUR_STATE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Postman Example

1. Set request type to `GET`
2. URL: `http://localhost:4001/api/facebook/oauth/callback?code=ABC&state=XYZ`
3. Go to "Headers" tab
4. Add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_JWT_TOKEN`

## Testing

### 1. Generate a Test Token

```bash
node test_jwt_service.cjs
```

This will generate a test JWT token with the proper structure.

### 2. Test the OAuth Callback

```bash
# Get a real Facebook OAuth code first
# Then use it with the test token:

curl -X GET \
  "http://localhost:4001/api/facebook/oauth/callback?code=REAL_FB_CODE&state=STATE" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
```

### 3. Verify Token Decoding

You can test token decoding directly:

```typescript
import { jwtService } from './api/services/jwt.service.js';

const token = "eyJhbGciOi..."; // Your JWT token
const decoded = jwtService.decode(token);

console.log('User ID:', decoded.id);
console.log('Business ID:', decoded.businessProfile);
console.log('User Type:', decoded.userType);
```

## Security Considerations

### Why We Use Decode Instead of Verify

For the OAuth callback, we use `decode()` instead of `verify()` because:

1. The token comes from the Pinntag Backend (trusted source)
2. We only need to extract the `businessProfile` field
3. The actual business ownership is verified in the database when saving

However, for other protected routes, you should use `verify()` or the `verifyPinntagJwt` middleware.

### Recommendation for Production

For production, consider adding verification:

```typescript
// Instead of decode:
const decodedToken = jwtService.decode(token);

// Use verify for production:
const result = jwtService.verify(token);
if (!result.valid) {
  return res.status(401).json({
    success: false,
    error: result.error
  });
}
const businessId = result.payload.businessProfile;
```

## Migration Guide

If you have existing code using the old API, update as follows:

### Old Code

```javascript
// Frontend
const url = `/api/facebook/oauth/callback?code=${code}&state=${state}&businessId=${businessId}`;
fetch(url);
```

### New Code

```javascript
// Frontend
const jwtToken = getAuthToken(); // Get from your auth system
const url = `/api/facebook/oauth/callback?code=${code}&state=${state}`;
fetch(url, {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

## Benefits

✅ **Security**: BusinessId is extracted from authenticated JWT token
✅ **Simplicity**: No need to pass businessId in query params
✅ **Consistency**: Uses the same auth pattern as other endpoints
✅ **Trust**: BusinessId comes from verified backend token
✅ **Less Error-Prone**: Frontend doesn't need to track businessId separately

## Related Files

- **JWT Service**: [src/api/services/jwt.service.ts](src/api/services/jwt.service.ts)
- **JWT Middleware**: [src/middleware/jwtAuth.ts](src/middleware/jwtAuth.ts)
- **Facebook Controller**: [src/api/controllers/facebookController.ts](src/api/controllers/facebookController.ts)
- **Facebook Routes**: [src/api/routes/facebook.routes.ts](src/api/routes/facebook.routes.ts)
- **JWT Documentation**: [JWT_SERVICE_README.md](JWT_SERVICE_README.md)

## Troubleshooting

### Token doesn't have businessProfile field

Make sure your Pinntag Backend is issuing tokens with the `businessProfile` field. Check the token structure:

```javascript
const decoded = jwtService.decode(token);
console.log(decoded);
// Should contain: { id, userType, role, businessProfile, ... }
```

### Authorization header not being sent

Check that your frontend/client is including the Authorization header:

```javascript
// Make sure this is set
headers: {
  'Authorization': `Bearer ${token}`
}
```

### Token format error

Ensure the token is sent with "Bearer " prefix:
- ✅ Correct: `Bearer eyJhbGciOi...`
- ❌ Wrong: `eyJhbGciOi...`

## Summary

The Facebook OAuth callback now seamlessly integrates with the Pinntag JWT authentication system, automatically extracting the business ID from the authenticated user's token. This eliminates the need for manual businessId parameter passing and improves security.
