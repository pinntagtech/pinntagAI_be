# Update Post API - Validation Changes

## Overview

Updated the `PUT /api/facebook/posts/:postId/type` endpoint to improve validation logic and parameter requirements.

## Changes Made

### Parameter Requirements

**Before:**
- Either `status` OR `type` was required (at least one)
- Both were optional

**After:**
- `status` is **REQUIRED**
- `type` is **OPTIONAL**

### Validation Rules

#### 1. Status Validation (Required)
```typescript
// Must be one of these values
"pending" | "ignored" | "saved" | "imported"
```

**Error if missing:**
```json
{
  "success": false,
  "error": "status is required"
}
```

#### 2. Type Validation (Optional)
```typescript
// If provided, must be one of these values
"event" | "offer" | "spotlight" | "flashlight"
```

#### 3. Conditional: Ignore Reason (Required if status is "ignored")
```typescript
// When status === "ignored", ignoreReason is required
// Must be one of:
"not_relevant" | "personal_casual" | "duplicate" | "other"
```

**Error if missing when status is "ignored":**
```json
{
  "success": false,
  "error": "ignoreReason is required when status is 'ignored'"
}
```

#### 4. Conditional: Ignore Note (Required if ignoreReason is "other")
```typescript
// When ignoreReason === "other", ignoreNote is required
// Free text field explaining the custom reason
```

**Error if missing when ignoreReason is "other":**
```json
{
  "success": false,
  "error": "ignoreNote is required when ignoreReason is 'other'"
}
```

---

## Usage Examples

### 1. Save Post as Event
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "saved",
  "type": "event"
}
```

### 2. Save Post as Offer (without type)
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "saved",
  "type": "offer"
}
```

### 3. Mark Post as Pending (status only)
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "pending"
}
```

### 4. Ignore Post - Standard Reason
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "ignored",
  "ignoreReason": "not_relevant"
}
```

### 5. Ignore Post - Personal/Casual
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "ignored",
  "ignoreReason": "personal_casual"
}
```

### 6. Ignore Post - Duplicate
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "ignored",
  "ignoreReason": "duplicate"
}
```

### 7. Ignore Post - Custom Reason
```http
PUT /api/facebook/posts/POST_ID/type
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "status": "ignored",
  "ignoreReason": "other",
  "ignoreNote": "This is a personal birthday photo, not business-related content"
}
```

---

## Validation Flow

```
┌─────────────────────────────┐
│ Request received            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Check: status present?      │
└──────────┬──────────────────┘
           │
           ├─ No ──► Error: "status is required"
           │
           ▼ Yes
┌─────────────────────────────┐
│ Validate: status value      │
└──────────┬──────────────────┘
           │
           ├─ Invalid ──► Error: "Invalid status"
           │
           ▼ Valid
┌─────────────────────────────┐
│ Check: type provided?       │
└──────────┬──────────────────┘
           │
           ├─ Yes ──► Validate type value
           │
           ▼ No/Valid
┌─────────────────────────────┐
│ Check: status === "ignored"?│
└──────────┬──────────────────┘
           │
           ├─ No ──► Process update ✓
           │
           ▼ Yes
┌─────────────────────────────┐
│ Check: ignoreReason present?│
└──────────┬──────────────────┘
           │
           ├─ No ──► Error: "ignoreReason required"
           │
           ▼ Yes
┌─────────────────────────────┐
│ Validate: ignoreReason value│
└──────────┬──────────────────┘
           │
           ├─ Invalid ──► Error: "Invalid ignoreReason"
           │
           ▼ Valid
┌─────────────────────────────┐
│ Check: ignoreReason="other"?│
└──────────┬──────────────────┘
           │
           ├─ No ──► Process update ✓
           │
           ▼ Yes
┌─────────────────────────────┐
│ Check: ignoreNote present?  │
└──────────┬──────────────────┘
           │
           ├─ No ──► Error: "ignoreNote required"
           │
           ▼ Yes
┌─────────────────────────────┐
│ Process update ✓            │
└─────────────────────────────┘
```

---

## Error Messages

| Condition | Error Message | Status Code |
|-----------|--------------|-------------|
| Missing `status` | "status is required" | 400 |
| Invalid `status` value | "Invalid status. Must be one of: pending, ignored, saved, imported" | 400 |
| Invalid `type` value | "Invalid type. Must be one of: event, offer, spotlight, flashlight" | 400 |
| Missing `ignoreReason` when status is "ignored" | "ignoreReason is required when status is 'ignored'" | 400 |
| Invalid `ignoreReason` value | "Invalid ignoreReason. Must be one of: not_relevant, personal_casual, duplicate, other" | 400 |
| Missing `ignoreNote` when ignoreReason is "other" | "ignoreNote is required when ignoreReason is 'other'" | 400 |

---

## Frontend Implementation

### React Example with Error Handling

```javascript
const updatePostStatus = async (postId, status, type = null, ignoreReason = null, ignoreNote = null) => {
  const token = getAuthToken();

  // Build request body
  const body = { status };

  if (type) {
    body.type = type;
  }

  if (status === 'ignored') {
    if (!ignoreReason) {
      throw new Error('ignoreReason is required when ignoring a post');
    }
    body.ignoreReason = ignoreReason;

    if (ignoreReason === 'other') {
      if (!ignoreNote) {
        throw new Error('ignoreNote is required for custom ignore reason');
      }
      body.ignoreNote = ignoreNote;
    }
  }

  try {
    const response = await fetch(`/api/facebook/posts/${postId}/type`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Failed to update post:', error);
    throw error;
  }
};

// Usage examples:
await updatePostStatus('post123', 'saved', 'event');
await updatePostStatus('post456', 'ignored', null, 'not_relevant');
await updatePostStatus('post789', 'ignored', null, 'other', 'Personal photo');
```

---

## Testing

### Test Case 1: Valid - Save with Type
```bash
curl -X PUT "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "saved",
    "type": "event"
  }'
```
**Expected**: ✅ Success

### Test Case 2: Invalid - Missing Status
```bash
curl -X PUT "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "event"
  }'
```
**Expected**: ❌ 400 - "status is required"

### Test Case 3: Invalid - Ignored Without Reason
```bash
curl -X PUT "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ignored"
  }'
```
**Expected**: ❌ 400 - "ignoreReason is required when status is 'ignored'"

### Test Case 4: Invalid - Other Reason Without Note
```bash
curl -X PUT "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ignored",
    "ignoreReason": "other"
  }'
```
**Expected**: ❌ 400 - "ignoreNote is required when ignoreReason is 'other'"

### Test Case 5: Valid - Ignore with Other Reason and Note
```bash
curl -X PUT "http://localhost:4001/api/facebook/posts/POST_ID/type" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ignored",
    "ignoreReason": "other",
    "ignoreNote": "This is a personal photo"
  }'
```
**Expected**: ✅ Success

---

## Files Modified

1. **[src/api/controllers/facebookController.ts](src/api/controllers/facebookController.ts:584-680)**
   - Updated `updateFacebookPostType` method
   - Added conditional validation logic

2. **[src/api/routes/facebook.routes.ts](src/api/routes/facebook.routes.ts:90-99)**
   - Updated route documentation

3. **[FACEBOOK_POSTS_JWT_INTEGRATION.md](FACEBOOK_POSTS_JWT_INTEGRATION.md)**
   - Added validation rules section
   - Updated examples
   - Added error response documentation

---

## Breaking Changes

⚠️ **Frontend must now always provide `status` parameter**

**Before (both optional):**
```javascript
// This was valid
{ type: "event" }
```

**After (status required):**
```javascript
// This is now INVALID - will return 400 error
{ type: "event" }

// Must be:
{ status: "saved", type: "event" }
```

---

## Benefits

✅ **Better Data Quality**: All posts must have a status
✅ **Clear Intent**: Required status makes the purpose explicit
✅ **Audit Trail**: Ignore reasons help understand why posts were rejected
✅ **Flexibility**: Custom ignore reasons via "other" + note
✅ **Validation**: Strong validation prevents invalid state

---

**Updated**: December 30, 2025
**Status**: ✅ Complete
**Build Status**: ✅ Passing
