# Pinntag JWT Service Documentation

A plug-and-play JWT token decoding and verification service for Pinntag Backend tokens.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Middleware Usage](#middleware-usage)
- [Examples](#examples)

## Installation

The required dependencies are already installed:
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

## Configuration

Add the following to your `.env` file:

```env
PINNTAG_BACKEND_JWT_SECRET='Pinntag@!@#$%^&*()_+'
```

**Important:** This secret must match the secret used by Pinntag Backend to sign JWT tokens.

## Quick Start

### 1. Basic Token Verification

```typescript
import { verifyPinntagToken } from './api/services/jwt.service.js';

// Verify a JWT token
const result = verifyPinntagToken(token);

if (result.valid) {
  console.log('User ID:', result.payload?.userId);
  console.log('Email:', result.payload?.email);
} else {
  console.log('Error:', result.error);
  console.log('Expired:', result.expired);
}
```

### 2. Using Middleware in Routes

```typescript
import { verifyPinntagJwt } from './middleware/jwtAuth.js';

// Protect a route
app.get('/api/protected', verifyPinntagJwt, (req, res) => {
  // req.user now contains the JWT payload
  res.json({
    userId: req.user?.userId,
    email: req.user?.email
  });
});
```

## API Reference

### JwtService Class

#### `verify(token: string, options?: VerifyOptions): JwtVerificationResult`

Verifies and decodes a JWT token.

**Parameters:**
- `token`: The JWT token string
- `options`: Optional verification options (see jsonwebtoken docs)

**Returns:**
```typescript
{
  valid: boolean;
  payload?: PinntagJwtPayload;
  error?: string;
  expired?: boolean;
}
```

**Example:**
```typescript
import { jwtService } from './api/services/jwt.service.js';

const result = jwtService.verify(token);
if (result.valid) {
  console.log(result.payload);
}
```

#### `decode(token: string): PinntagJwtPayload | null`

Decodes a JWT token without verification. **Use with caution** - only for debugging or inspection.

**Example:**
```typescript
const payload = jwtService.decode(token);
console.log('Token contents:', payload);
```

#### `verifyFromHeader(authHeader: string | undefined, options?: VerifyOptions): JwtVerificationResult`

Extracts and verifies a JWT token from an Authorization header.

**Example:**
```typescript
const authHeader = req.headers.authorization;
const result = jwtService.verifyFromHeader(authHeader);
```

#### `getExpirationDate(token: string): Date | null`

Returns the expiration date of a token.

**Example:**
```typescript
const expDate = jwtService.getExpirationDate(token);
console.log('Expires at:', expDate);
```

#### `isExpired(token: string): boolean`

Checks if a token is expired.

**Example:**
```typescript
if (jwtService.isExpired(token)) {
  console.log('Token has expired');
}
```

#### `getTimeToExpiration(token: string): number | null`

Returns milliseconds until token expires.

**Example:**
```typescript
const msToExpiry = jwtService.getTimeToExpiration(token);
const minutesToExpiry = msToExpiry ? msToExpiry / 1000 / 60 : 0;
```

### Helper Functions

#### `verifyPinntagToken(token: string): JwtVerificationResult`

Shorthand for `jwtService.verify()`.

#### `decodePinntagToken(token: string): PinntagJwtPayload | null`

Shorthand for `jwtService.decode()`.

#### `verifyPinntagAuthHeader(authHeader: string | undefined): JwtVerificationResult`

Shorthand for `jwtService.verifyFromHeader()`.

## Middleware Usage

### `verifyPinntagJwt`

Requires valid JWT token. Returns 401 if missing or invalid.

```typescript
import { verifyPinntagJwt } from './middleware/jwtAuth.js';

router.get('/api/protected', verifyPinntagJwt, (req, res) => {
  // req.user is populated with JWT payload
  // req.jwtToken contains the raw token string
  res.json({ userId: req.user?.userId });
});
```

### `optionalPinntagJwt`

Verifies JWT if present, but continues without auth if missing.

```typescript
import { optionalPinntagJwt } from './middleware/jwtAuth.js';

router.get('/api/content', optionalPinntagJwt, (req, res) => {
  if (req.user) {
    // Authenticated user
    res.json({ personalized: true, userId: req.user.userId });
  } else {
    // Anonymous user
    res.json({ personalized: false });
  }
});
```

### `requireRole(...roles: string[])`

Requires specific user roles. Must be used after `verifyPinntagJwt`.

```typescript
import { verifyPinntagJwt, requireRole } from './middleware/jwtAuth.js';

router.delete(
  '/api/admin/users/:id',
  verifyPinntagJwt,
  requireRole('admin', 'super-admin'),
  (req, res) => {
    // Only admin or super-admin can access
    res.json({ success: true });
  }
);
```

### `requireBusinessAccess`

Ensures user has access to the business specified in the request. Must be used after `verifyPinntagJwt`.

```typescript
import { verifyPinntagJwt, requireBusinessAccess } from './middleware/jwtAuth.js';

router.get(
  '/api/business/:businessId/data',
  verifyPinntagJwt,
  requireBusinessAccess,
  (req, res) => {
    // User must have access to this business
    res.json({ businessId: req.params.businessId });
  }
);
```

## Examples

### Example 1: Verify Token from Request Body

```typescript
router.post('/api/verify', (req, res) => {
  const result = verifyPinntagToken(req.body.token);

  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  res.json({ success: true, payload: result.payload });
});
```

### Example 2: Custom Service Using JWT

```typescript
import { verifyPinntagAuthHeader } from './api/services/jwt.service.js';

class AuthService {
  async authenticateUser(authHeader: string) {
    const result = verifyPinntagAuthHeader(authHeader);

    if (!result.valid) {
      throw new Error(result.error || 'Authentication failed');
    }

    // Fetch user from database using result.payload.userId
    return result.payload;
  }
}
```

### Example 3: Token Expiration Check

```typescript
router.post('/api/token/check', (req, res) => {
  const { token } = req.body;

  const expirationDate = jwtService.getExpirationDate(token);
  const timeToExpiration = jwtService.getTimeToExpiration(token);

  res.json({
    expiresAt: expirationDate,
    isExpired: jwtService.isExpired(token),
    minutesRemaining: timeToExpiration ? timeToExpiration / 1000 / 60 : 0
  });
});
```

### Example 4: Combining Multiple Middlewares

```typescript
router.put(
  '/api/business/:businessId/settings',
  verifyPinntagJwt,           // 1. Verify JWT
  requireRole('admin'),        // 2. Check role
  requireBusinessAccess,       // 3. Check business access
  (req, res) => {
    // All checks passed
    res.json({ success: true });
  }
);
```

### Example 5: Using in Express Error Handler

```typescript
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    const authHeader = req.headers.authorization;
    const result = jwtService.verifyFromHeader(authHeader);

    return res.status(401).json({
      error: 'Invalid token',
      expired: result.expired,
      details: result.error
    });
  }

  next(err);
});
```

## JWT Payload Interface

The default JWT payload interface is:

```typescript
interface PinntagJwtPayload extends JwtPayload {
  userId?: string;
  email?: string;
  role?: string;
  businessId?: string;
  [key: string]: any;
}
```

**To extend with custom fields**, modify the interface in [src/api/services/jwt.service.ts](src/api/services/jwt.service.ts:11).

## Security Best Practices

1. **Always verify tokens in production** - Never use `decode()` for authentication, only for debugging
2. **Use HTTPS** - JWT tokens should only be transmitted over secure connections
3. **Keep secrets secure** - Never commit `PINNTAG_BACKEND_JWT_SECRET` to version control
4. **Handle expired tokens** - Check `result.expired` to provide better UX
5. **Use role-based access control** - Combine `verifyPinntagJwt` with `requireRole` for authorization
6. **Validate token expiration** - Set appropriate `exp` claims when creating tokens

## Troubleshooting

### "JWT secret is not configured"
Ensure `PINNTAG_BACKEND_JWT_SECRET` is set in your `.env` file.

### "Invalid signature" error
The secret in your `.env` doesn't match the secret used by Pinntag Backend to sign tokens.

### "Token expired" error
The token has exceeded its expiration time. Check with `jwtService.isExpired(token)`.

### req.user is undefined
Make sure you're using `verifyPinntagJwt` middleware before accessing `req.user`.

## Files

- **Service**: [src/api/services/jwt.service.ts](src/api/services/jwt.service.ts)
- **Middleware**: [src/middleware/jwtAuth.ts](src/middleware/jwtAuth.ts)
- **Examples**: [src/api/services/jwt.service.example.ts](src/api/services/jwt.service.example.ts)

## Support

For issues or questions, refer to the example file or check the inline documentation in the source code.
