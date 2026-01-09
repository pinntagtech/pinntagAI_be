# JWT Service - Quick Reference

## Import Statements

```typescript
// Service
import { jwtService, verifyPinntagToken, decodePinntagToken } from './api/services/jwt.service.js';

// Middleware
import { verifyPinntagJwt, optionalPinntagJwt, requireRole, requireBusinessAccess } from './middleware/jwtAuth.js';
```

## Common Use Cases

### 1. Protect a Route (Most Common)

```typescript
router.get('/api/protected', verifyPinntagJwt, (req, res) => {
  res.json({ userId: req.user?.userId });
});
```

### 2. Verify Token Manually

```typescript
const result = verifyPinntagToken(token);
if (result.valid) {
  console.log(result.payload.userId);
}
```

### 3. Optional Authentication

```typescript
router.get('/api/content', optionalPinntagJwt, (req, res) => {
  const isAuth = !!req.user;
  res.json({ authenticated: isAuth });
});
```

### 4. Role-Based Access

```typescript
router.delete('/api/admin', verifyPinntagJwt, requireRole('admin'), handler);
```

### 5. Business Access Control

```typescript
router.get('/api/business/:businessId', verifyPinntagJwt, requireBusinessAccess, handler);
```

## Request Object Extensions

After using `verifyPinntagJwt`:

```typescript
req.user = {
  userId: 'user123',
  email: 'user@example.com',
  role: 'admin',
  businessId: 'business456',
  // ... other JWT claims
}

req.jwtToken = 'eyJhbGciOi...' // Raw token string
```

## Error Responses

### Missing Token (401)
```json
{
  "success": false,
  "error": "Authorization header is required"
}
```

### Invalid Token (401)
```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Expired Token (401)
```json
{
  "success": false,
  "error": "Token has expired",
  "expired": true
}
```

### Insufficient Permissions (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

## Environment Variables

Required in `.env`:

```env
PINNTAG_BACKEND_JWT_SECRET='Pinntag@!@#$%^&*()_+'
```

## Testing

Generate a test token:

```bash
node test_jwt_service.cjs
```

Use the token in curl:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:4001/api/protected
```

## Common Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| `verify()` | Verify token | Authentication |
| `decode()` | Decode without verify | Debugging only |
| `verifyFromHeader()` | Verify from auth header | Manual auth |
| `isExpired()` | Check if expired | Token validation |
| `getExpirationDate()` | Get expiry date | Show user expiry info |
| `getTimeToExpiration()` | Time until expiry (ms) | Refresh logic |

## File Locations

- **Service**: `src/api/services/jwt.service.ts`
- **Middleware**: `src/middleware/jwtAuth.ts`
- **Examples**: `src/api/services/jwt.service.example.ts`
- **Full Docs**: `JWT_SERVICE_README.md`

## Tips

✅ **Do:**
- Use `verifyPinntagJwt` for protected routes
- Check `result.expired` for better error messages
- Use HTTPS in production
- Combine middlewares for granular access control

❌ **Don't:**
- Use `decode()` for authentication (unverified!)
- Commit JWT_SECRET to git
- Send tokens in URL query parameters
- Store tokens in localStorage without encryption
