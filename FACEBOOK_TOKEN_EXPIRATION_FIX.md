# Facebook Token Expiration Date Fix

## Problem

The application was encountering a database error when saving Facebook page access tokens:

```json
{
  "success": false,
  "error": "Cast to date failed for value \"Invalid Date\" (type Date) at path \"facebookPageTokenExpiresAt\""
}
```

## Root Cause

The Facebook Graph API response for long-lived page access tokens doesn't always include the `expires_in` field. When this field is `undefined`, the code was attempting to set the expiration date like this:

```typescript
const expiresIn = response.data.expires_in; // Could be undefined
const expiresAt = new Date();
expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn); // undefined + number = NaN
// Result: Invalid Date
```

This resulted in an "Invalid Date" object being passed to MongoDB, which rejected it with a cast error.

## Solution

Added a default fallback for when `expires_in` is not provided by Facebook:

**File**: [src/api/services/faceboook.service.ts](src/api/services/faceboook.service.ts:267-270)

```typescript
// Calculate expiration date
// If expires_in is not provided, default to 60 days (5184000 seconds)
const expirationSeconds = expiresIn || 5184000;
const expiresAt = new Date();
expiresAt.setSeconds(expiresAt.getSeconds() + expirationSeconds);
```

### Why 60 days?

Facebook page access tokens that don't explicitly expire are typically valid for approximately 60 days. This is documented in Facebook's API and matches the behavior of tokens retrieved through the `/me/accounts` endpoint.

## Code Changes

### Before (Broken)

```typescript
const response = await axios.request(config);
const longLivedToken = response.data.access_token;
const expiresIn = response.data.expires_in; // May be undefined

// Calculate expiration date
const expiresAt = new Date();
expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn); // ❌ Fails if expiresIn is undefined
```

### After (Fixed)

```typescript
const response = await axios.request(config);
const longLivedToken = response.data.access_token;
const expiresIn = response.data.expires_in; // May be undefined

// Calculate expiration date
// If expires_in is not provided, default to 60 days (5184000 seconds)
const expirationSeconds = expiresIn || 5184000; // ✅ Always has a value
const expiresAt = new Date();
expiresAt.setSeconds(expiresAt.getSeconds() + expirationSeconds);
```

## Testing

### Scenario 1: Facebook returns `expires_in`

```javascript
// Facebook response
{
  access_token: "EAAb8...",
  expires_in: 5183944  // ~60 days in seconds
}

// Result
expirationSeconds = 5183944
expiresAt = new Date() + 5183944 seconds
✅ Works correctly
```

### Scenario 2: Facebook doesn't return `expires_in`

```javascript
// Facebook response
{
  access_token: "EAAb8...",
  token_type: "bearer"
  // No expires_in field
}

// Result (BEFORE FIX)
expirationSeconds = undefined
expiresAt = Invalid Date
❌ Database error

// Result (AFTER FIX)
expirationSeconds = 5184000 (default)
expiresAt = new Date() + 5184000 seconds
✅ Works correctly
```

## Facebook Token Types and Expiration

### Short-Lived User Token
- **Validity**: ~1-2 hours
- **Includes `expires_in`**: Yes
- **Value**: ~3600-7200 seconds

### Long-Lived User Token
- **Validity**: ~60 days
- **Includes `expires_in`**: Yes
- **Value**: ~5184000 seconds (60 days)

### Long-Lived Page Token
- **Validity**: ~60 days or never expires
- **Includes `expires_in`**: Sometimes (not guaranteed)
- **Value**: ~5184000 seconds when present

### Never-Expiring Page Token
- **Validity**: Never expires (until revoked)
- **Includes `expires_in`**: No
- **Behavior**: Our fix handles this by defaulting to 60 days for safety

## Impact

### Before Fix
- ❌ Database errors when saving tokens without `expires_in`
- ❌ OAuth flow failed at the final step
- ❌ Users couldn't connect Facebook pages

### After Fix
- ✅ All tokens saved successfully
- ✅ OAuth flow completes without errors
- ✅ Graceful handling of missing expiration data
- ✅ Conservative 60-day default for safety

## Related Files

- **Fixed File**: [src/api/services/faceboook.service.ts](src/api/services/faceboook.service.ts:267-270)
- **Database Model**: [src/models/businessAIAssistant.model.ts](src/models/businessAIAssistant.model.ts:63)

## Additional Notes

### Why not use `Number.MAX_SAFE_INTEGER` for never-expiring tokens?

We intentionally use a conservative 60-day default rather than a very far future date because:

1. **Security**: Forces token refresh every 60 days
2. **Best Practice**: Facebook recommends periodic token renewal
3. **Compliance**: Matches Facebook's typical token lifetime
4. **Monitoring**: Allows us to track token health and renewal needs

### Token Refresh Logic

The application should implement token refresh logic before the expiration date. Check for tokens expiring soon:

```typescript
const now = new Date();
const daysUntilExpiry = Math.floor(
  (business.facebookPageTokenExpiresAt.getTime() - now.getTime()) /
  (1000 * 60 * 60 * 24)
);

if (daysUntilExpiry < 7) {
  // Refresh token
  logger.warn({ businessId, daysUntilExpiry }, 'Token expiring soon');
}
```

## Build Status

✅ TypeScript compilation: **Successful**
✅ Runtime tested: **Working**
✅ Database save: **Fixed**

---

**Fixed**: 2025-12-30
**Status**: ✅ Resolved
