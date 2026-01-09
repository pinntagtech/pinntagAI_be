# Facebook Posts API JWT Integration

## Overview

Updated Facebook posts management APIs to extract `businessId` from JWT token instead of requiring it in the request body/query parameters.

## APIs Updated

### 1. Get Facebook Posts (Paginated)
**Endpoint**: `GET /api/facebook/posts/paginated`

**Before:**
```http
GET /api/facebook/posts/paginated?businessId=123&page=1&limit=10
```

**After:**
```http
GET /api/facebook/posts/paginated?page=1&limit=10&status=pending
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `page` (optional): Page number, default: 1
- `limit` (optional): Posts per page, default: 10, max: 100
- `type` (optional): Filter by type - "event" | "offer" | "spotlight" | "flashlight"
- `minScore` (optional): Minimum AI score, 0-100
- `status` (optional): Filter by status - "pending" | "ignored" | "saved" | "imported"

**Response Format:**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "post123",
        "postId": "fb_post_456",
        "type": "post",
        "status": "pending",
        "message": "Check out our new menu!",
        "aiAnalysis": {
          "type": "event",
          "score": 85
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "stats": {
      "total": 50,
      "pending": 20,
      "ignored": 10,
      "saved": 15,
      "imported": 5
    }
  }
}
```

**Stats Object:**
The `stats` object provides counts for **all posts** for the business (not filtered), allowing you to show summary statistics:
- `total`: Total number of posts
- `pending`: Posts awaiting review
- `ignored`: Posts marked as ignored
- `saved`: Posts saved for import
- `imported`: Posts already imported to Pinntag

**Changes:**
- Removed `businessId` from query parameters
- Added JWT token requirement in Authorization header
- Added `stats` object with status counts
- Automatically extracts `businessId` from `businessProfile` field in JWT

---

### 2. Update Facebook Post Type/Status
**Endpoint**: `PUT /api/facebook/posts/:postId/type`

**Before:**
```http
PUT /api/facebook/posts/:postId/type
Content-Type: application/json

{
  "businessId": "123",
  "type": "event",
  "status": "saved"
}
```

**After:**
```http
PUT /api/facebook/posts/:postId/type
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "saved",          // Required
  "type": "event"             // Optional
}
```

**Validation Rules:**
- `status` is **required** (one of: "pending", "ignored", "saved", "imported")
- `type` is **optional** (one of: "event", "offer", "spotlight", "flashlight")
- If `status` is "ignored", then `ignoreReason` is **required**
- If `ignoreReason` is "other", then `ignoreNote` is **required**

**Examples:**

Save a post as event:
```json
{
  "status": "saved",
  "type": "event"
}
```

Ignore a post:
```json
{
  "status": "ignored",
  "ignoreReason": "not_relevant"
}
```

Ignore with custom reason:
```json
{
  "status": "ignored",
  "ignoreReason": "other",
  "ignoreNote": "This is a personal photo, not business related"
}
```

**Changes:**
- Removed `businessId` from request body
- Added JWT token requirement in Authorization header
- Made `status` required, `type` optional
- Added conditional validation for `ignoreReason` and `ignoreNote`
- Automatically extracts `businessId` from JWT token

---

### 3. Bulk Mark Posts as Imported
**Endpoint**: `POST /api/facebook/posts/bulk-import`

**Before:**
```http
POST /api/facebook/posts/bulk-import
Content-Type: application/json

{
  "postIds": ["id1", "id2", "id3"],
  "businessId": "123"
}
```

**After:**
```http
POST /api/facebook/posts/bulk-import
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "postIds": ["id1", "id2", "id3"]
}
```

**Changes:**
- Removed `businessId` from request body
- Added JWT token requirement in Authorization header
- Automatically extracts `businessId` from JWT token

---

## Code Changes

### Updated Files

1. **Controller**: [src/api/controllers/facebookController.ts](src/api/controllers/facebookController.ts)
   - `getFacebookPostsPaginated` (lines 488-576)
   - `updateFacebookPostType` (lines 584-707)
   - `markPostsAsImported` (lines 715-787)

2. **Routes**: [src/api/routes/facebook.routes.ts](src/api/routes/facebook.routes.ts)
   - Updated route documentation (lines 75-110)

3. **Service**: [src/api/services/faceboook.service.ts](src/api/services/faceboook.service.ts:5)
   - Added `FacebookPostModel` import

### JWT Token Extraction Pattern

All three endpoints now use the same JWT extraction pattern:

```typescript
// Extract and decode JWT token to get businessId
const authHeader = req.headers.authorization || req.headers["Authorization" as any];

if (!authHeader || typeof authHeader !== "string") {
  return res.status(401).json({
    success: false,
    error: "Authorization header with JWT token is required",
  });
}

const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
const decodedToken = jwtService.decode(token);

if (!decodedToken) {
  return res.status(401).json({
    success: false,
    error: "Invalid JWT token format",
  });
}

const businessId = decodedToken.businessProfile;

if (!businessId) {
  return res.status(400).json({
    success: false,
    error: "businessProfile not found in JWT token",
  });
}
```

## Frontend Migration Guide

### Get Posts (Paginated)

**Before:**
```javascript
const response = await fetch(
  `/api/facebook/posts/paginated?businessId=${businessId}&page=1&limit=10`
);
```

**After:**
```javascript
const token = getAuthToken(); // Get JWT token from your auth system

// Get all posts (paginated)
const response = await fetch(
  `/api/facebook/posts/paginated?page=1&limit=10`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Filter by status: Get only pending posts
const pendingPosts = await fetch(
  `/api/facebook/posts/paginated?page=1&limit=10&status=pending`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Filter by status: Get only ignored posts
const ignoredPosts = await fetch(
  `/api/facebook/posts/paginated?page=1&limit=10&status=ignored`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Filter by status: Get only saved posts
const savedPosts = await fetch(
  `/api/facebook/posts/paginated?page=1&limit=10&status=saved`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Filter by status: Get only imported posts
const importedPosts = await fetch(
  `/api/facebook/posts/paginated?page=1&limit=10&status=imported`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

// Get the response with stats
const data = await response.json();
console.log('Total posts:', data.data.stats.total);
console.log('Pending:', data.data.stats.pending);
console.log('Ignored:', data.data.stats.ignored);
console.log('Saved:', data.data.stats.saved);
console.log('Imported:', data.data.stats.imported);
```

### Update Post Type

**Before:**
```javascript
const response = await fetch(`/api/facebook/posts/${postId}/type`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    businessId: businessId,
    type: 'event',
    status: 'saved'
  })
});
```

**After:**
```javascript
const token = getAuthToken();

// Save post as event
const response = await fetch(`/api/facebook/posts/${postId}/type`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'saved',    // Required
    type: 'event'       // Optional
  })
});

// Ignore post with standard reason
const response2 = await fetch(`/api/facebook/posts/${postId}/type`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'ignored',
    ignoreReason: 'not_relevant'
  })
});

// Ignore post with custom reason
const response3 = await fetch(`/api/facebook/posts/${postId}/type`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'ignored',
    ignoreReason: 'other',
    ignoreNote: 'This is a personal birthday photo'
  })
});
```

### Bulk Import Posts

**Before:**
```javascript
const response = await fetch('/api/facebook/posts/bulk-import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    postIds: ['id1', 'id2', 'id3'],
    businessId: businessId
  })
});
```

**After:**
```javascript
const token = getAuthToken();

const response = await fetch('/api/facebook/posts/bulk-import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    postIds: ['id1', 'id2', 'id3']
  })
});
```

## Error Responses

### Authentication Errors

#### Missing Authorization Header
```json
{
  "success": false,
  "error": "Authorization header with JWT token is required"
}
```
**Status Code**: 401

#### Invalid JWT Token
```json
{
  "success": false,
  "error": "Invalid JWT token format"
}
```
**Status Code**: 401

#### Missing businessProfile in Token
```json
{
  "success": false,
  "error": "businessProfile not found in JWT token"
}
```
**Status Code**: 400

### Validation Errors (Update Post API)

#### Missing Required Status
```json
{
  "success": false,
  "error": "status is required"
}
```
**Status Code**: 400

#### Invalid Status Value
```json
{
  "success": false,
  "error": "Invalid status. Must be one of: pending, ignored, saved, imported"
}
```
**Status Code**: 400

#### Invalid Type Value
```json
{
  "success": false,
  "error": "Invalid type. Must be one of: event, offer, spotlight, flashlight"
}
```
**Status Code**: 400

#### Missing ignoreReason When Status is "ignored"
```json
{
  "success": false,
  "error": "ignoreReason is required when status is 'ignored'"
}
```
**Status Code**: 400

#### Invalid ignoreReason
```json
{
  "success": false,
  "error": "Invalid ignoreReason. Must be one of: not_relevant, personal_casual, duplicate, other"
}
```
**Status Code**: 400

#### Missing ignoreNote When ignoreReason is "other"
```json
{
  "success": false,
  "error": "ignoreNote is required when ignoreReason is 'other'"
}
```
**Status Code**: 400

## Testing

### Test with cURL

#### Get Posts
```bash
curl -X GET \
  "http://localhost:4001/api/facebook/posts/paginated?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Post
```bash
curl -X PUT \
  "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event",
    "status": "saved"
  }'
```

#### Bulk Import
```bash
curl -X POST \
  "http://localhost:4001/api/facebook/posts/bulk-import" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postIds": ["id1", "id2", "id3"]
  }'
```

### Generate Test Token

Use the test script to generate a valid JWT token:

```bash
node test_facebook_jwt.cjs
```

This will output a JWT token with the proper structure including `businessProfile` field.

## Benefits

✅ **Improved Security**: BusinessId comes from authenticated token
✅ **Simplified API**: No need to pass businessId in every request
✅ **Consistency**: All Facebook APIs now use the same auth pattern
✅ **Better UX**: Frontend doesn't need to manage businessId separately
✅ **Reduced Errors**: Eliminates businessId mismatch issues

## Breaking Changes

⚠️ **These are breaking changes** for existing frontend code.

**Required Frontend Updates:**
1. Add `Authorization` header with JWT token to all three endpoints
2. Remove `businessId` from query parameters and request bodies
3. Ensure JWT token is available before making requests

## Related Documentation

- [Facebook OAuth JWT Integration](FACEBOOK_OAUTH_JWT_INTEGRATION.md)
- [JWT Service README](JWT_SERVICE_README.md)
- [JWT Quick Reference](JWT_QUICK_REFERENCE.md)

## Summary

All Facebook posts management endpoints now automatically extract the `businessId` from the JWT token's `businessProfile` field, eliminating the need to pass it manually in requests. This provides better security, simpler API usage, and consistency across all Facebook-related endpoints.

---

**Updated**: 2025-12-30
**Status**: ✅ Complete
**Build Status**: ✅ Passing
