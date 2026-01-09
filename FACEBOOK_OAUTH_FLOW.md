# Facebook OAuth 2.0 Flow Implementation

## Overview
Complete implementation of Facebook OAuth 2.0 flow with authorization code exchange, state verification for CSRF protection, and access token retrieval.

## OAuth Flow Steps

### Step 1: Redirect User to Facebook Login

Generate the Facebook authorization URL and redirect the user:

```javascript
// Frontend code
const state = crypto.randomUUID(); // Generate random state for CSRF protection
sessionStorage.setItem('facebook_oauth_state', state); // Store state

const redirectUri = encodeURIComponent('http://localhost:3000/api/facebook/oauth/callback');
const clientId = 'YOUR_FACEBOOK_APP_ID';
const scope = 'public_profile,email,pages_show_list,pages_read_engagement';

const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

window.location.href = authUrl; // Redirect user to Facebook
```

### Step 2: Facebook Redirects Back with Code

After user authorizes, Facebook redirects to your callback URL with businessId:

```
http://localhost:3000/api/facebook/oauth/callback?code=AQD-HBSjV6yW...&state=363b17ba-3f49-4502-84ce-9fcff18c0d3a&businessId=507f1f77bcf86cd799439011#_=_
```

**Important Notes**:
- ✅ The `#_=_` fragment at the end is a Facebook quirk - ignore it
- ✅ The `code` parameter is the authorization code (single-use, short-lived)
- ✅ The `state` parameter must match what you stored in Step 1 (CSRF protection)
- ✅ The `businessId` parameter links the Facebook page to your business

### Step 3: Complete OAuth Flow (Automatic)

The callback endpoint automatically handles the complete flow:

1. Exchange code → short-lived user token
2. Exchange → long-lived user token
3. Get page access token from `/me/accounts`
4. Fetch page metadata (profile, cover, name, etc.)
5. Save everything to database
6. Return page information

**Endpoint**: `GET /api/facebook/oauth/callback`

**Query Parameters**:
- `code` (required): Authorization code from Facebook
- `state` (required): CSRF protection token
- `businessId` (required): Business ID to link the page

**Example Request**:
```bash
curl "http://localhost:3000/api/facebook/oauth/callback?code=AQD-HBSjV6yW...&state=363b17ba-3f49-4502-84ce-9fcff18c0d3a&businessId=507f1f77bcf86cd799439011"
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Facebook page connected successfully",
  "data": {
    "businessId": "507f1f77bcf86cd799439011",
    "pageId": "123456789",
    "pageAccessToken": "EAABwz...",
    "tokenExpiresAt": "2025-03-01T12:00:00.000Z",
    "pageInfo": {
      "name": "My Awesome Restaurant",
      "category": "Restaurant",
      "about": "Best pizza in town since 1990",
      "followers": 1250,
      "website": "https://myrestaurant.com",
      "phone": "+1-555-0123",
      "email": "info@myrestaurant.com",
      "profilePicture": "https://scontent.xx.fbcdn.net/.../pic.jpg",
      "coverPhoto": "https://scontent.xx.fbcdn.net/.../cover.jpg"
    }
  }
}
```

**Error Responses**:

Missing code (400):
```json
{
  "success": false,
  "error": "Authorization code is required"
}
```

Missing state (400):
```json
{
  "success": false,
  "error": "State parameter is required for CSRF protection"
}
```

Token exchange failed (400):
```json
{
  "success": false,
  "error": "Failed to exchange code for access token"
}
```

## Implementation Details

### Backend Endpoint ([facebookController.ts:13-83](src/api/controllers/facebookController.ts#L13-L83))

The `handleOAuthCallback` method:

1. **Validates Parameters**: Checks for `code` and `state`
2. **Logs State**: Logs state for manual verification (TODO: implement automatic verification)
3. **Gets Redirect URI**: From environment variable `FACEBOOK_REDIRECT_URI`
4. **Calls Service**: Uses `exchangeCodeForToken` to exchange code
5. **Returns Token**: Returns access token with type and expiration

### Service Method ([faceboook.service.ts:87-113](src/api/services/faceboook.service.ts#L87-L113))

The `exchangeCodeForToken` method:

```typescript
async exchangeCodeForToken(code: string, redirectUri: string) {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  const config = {
    method: "get",
    url: `https://graph.facebook.com/v24.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`,
  };

  const response = await axios.request(config);
  return { success: true, data: response.data };
}
```

**Facebook API Request**:
```
GET https://graph.facebook.com/v24.0/oauth/access_token
  ?client_id=YOUR_APP_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &client_secret=YOUR_APP_SECRET
  &code=THE_CODE_YOU_RECEIVED
```

**Facebook API Response**:
```json
{
  "access_token": "EAABwz...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

## CSRF Protection with State Parameter

### What is the State Parameter?

The `state` parameter is a security measure to prevent CSRF (Cross-Site Request Forgery) attacks in OAuth flows.

### How it Works:

1. **Generate Random State**: Before redirecting to Facebook
   ```javascript
   const state = crypto.randomUUID(); // e.g., "363b17ba-3f49-4502-84ce-9fcff18c0d3a"
   ```

2. **Store State**: Save in session/localStorage before redirect
   ```javascript
   sessionStorage.setItem('facebook_oauth_state', state);
   ```

3. **Send State to Facebook**: Include in authorization URL
   ```
   https://www.facebook.com/dialog/oauth?...&state=363b17ba-3f49-4502-84ce-9fcff18c0d3a
   ```

4. **Facebook Returns State**: In callback URL unchanged
   ```
   /oauth/callback?code=...&state=363b17ba-3f49-4502-84ce-9fcff18c0d3a
   ```

5. **Verify State Matches**: Compare returned state with stored state
   ```javascript
   const storedState = sessionStorage.getItem('facebook_oauth_state');
   if (receivedState !== storedState) {
     throw new Error('State mismatch - possible CSRF attack');
   }
   ```

### Current Implementation

⚠️ **TODO**: The current implementation logs the state but doesn't automatically verify it:

```typescript
// TODO: Verify state parameter against stored session value
logger.info({ state }, "IMPORTANT: Verify this state matches your stored session value");
```

**To implement full CSRF protection**, you should:

1. Store state in a session/database before redirect
2. Verify state in callback matches stored value
3. Reject requests with mismatched states

## Environment Configuration

Add these variables to your `.env` file:

```bash
# Facebook OAuth Configuration
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook/oauth/callback
```

**Important**:
- ✅ `FACEBOOK_REDIRECT_URI` must EXACTLY match the redirect URI registered in Facebook App Settings
- ✅ Protocol (http/https), domain, port, and path must all match
- ✅ Facebook performs strict validation on redirect URIs

## Complete Flow Example

### Frontend Implementation

```javascript
// Step 1: Initiate OAuth flow
function startFacebookLogin(businessId) {
  // Generate and store state for CSRF protection
  const state = crypto.randomUUID();
  sessionStorage.setItem('facebook_oauth_state', state);
  sessionStorage.setItem('facebook_business_id', businessId);

  // Build authorization URL with businessId in redirect_uri
  const redirectUri = `http://localhost:3000/api/facebook/oauth/callback?businessId=${businessId}`;

  const params = new URLSearchParams({
    client_id: 'YOUR_FACEBOOK_APP_ID',
    redirect_uri: redirectUri,
    state: state,
    scope: 'public_profile,email,pages_show_list,pages_read_engagement',
    response_type: 'code',
  });

  const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?${params.toString()}`;
  window.location.href = authUrl;
}

// Step 2: Handle callback (if implementing frontend verification)
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');

  // Verify state
  const storedState = sessionStorage.getItem('facebook_oauth_state');
  if (state !== storedState) {
    console.error('State mismatch - possible CSRF attack!');
    return;
  }

  // Exchange code for token (backend handles this)
  const response = await fetch(`/api/facebook/oauth/callback?code=${code}&state=${state}`);
  const data = await response.json();

  if (data.success) {
    console.log('Access token:', data.data.accessToken);
    // Store token securely and proceed with API calls
  }
}
```

### Backend Routes

```typescript
// GET /api/facebook/oauth/callback
router.get("/oauth/callback", facebookController.handleOAuthCallback.bind(facebookController));
```

## Token Types and Lifespans

### Short-Lived User Access Token
- **Obtained from**: OAuth code exchange
- **Lifespan**: ~1-2 hours
- **Use**: Immediate API calls, exchange for long-lived token

### Long-Lived User Access Token
- **Obtained from**: Exchanging short-lived token
- **Lifespan**: ~60 days
- **Use**: Extended API access, exchange for page tokens

### Long-Lived Page Access Token
- **Obtained from**: User token + page ID
- **Lifespan**: ~60 days or never expires
- **Use**: Post on behalf of page, read page data

## Next Steps After Getting Access Token

### 1. Exchange for Long-Lived User Token

```bash
POST /api/facebook/token/long-lived
Content-Type: application/json

{
  "shortLivedToken": "EAABwz..."
}
```

### 2. Get Page Access Token

```bash
POST /api/facebook/token/page-access
Content-Type: application/json

{
  "pageAccessToken": "page-token-from-step-1",
  "businessId": "your-business-id"
}
```

This will:
- Generate long-lived page token
- Fetch page metadata (name, category, profile picture, etc.)
- Save everything to `business_ai_assistant` collection

### 3. Fetch Page Data

```bash
GET /api/facebook/page-data?businessId=your-business-id&useAI=true&minScore=70
```

This will:
- Use saved page token from database
- Fetch posts and events
- Analyze with AI
- Save to database
- Return filtered results

## Security Best Practices

1. ✅ **Use HTTPS in Production**: Always use HTTPS for redirect URIs in production
2. ✅ **Validate State Parameter**: Implement server-side state verification
3. ✅ **Store Tokens Securely**: Encrypt tokens at rest in database
4. ✅ **Use Minimal Scopes**: Only request permissions you need
5. ✅ **Handle Token Expiration**: Implement token refresh logic
6. ✅ **Validate Redirect URI**: Facebook validates, but double-check on your end
7. ✅ **Log Security Events**: Log OAuth attempts for audit trail

## Troubleshooting

### Error: "redirect_uri doesn't match"

**Cause**: The `redirect_uri` parameter doesn't exactly match what's configured in Facebook App Settings.

**Solution**:
- Check Facebook App Settings → Facebook Login → Valid OAuth Redirect URIs
- Ensure exact match (protocol, domain, port, path)
- URL encode special characters

### Error: "Invalid authorization code"

**Cause**: Authorization code already used, expired, or invalid.

**Solution**:
- Authorization codes are single-use only
- Codes expire after ~10 minutes
- Start OAuth flow again to get new code

### Error: "State parameter is required"

**Cause**: Missing `state` parameter in callback URL.

**Solution**:
- Ensure state is passed to Facebook in initial authorization URL
- Facebook will return it in callback URL

### The `#_=_` Fragment

**Question**: Why does Facebook add `#_=_` to the callback URL?

**Answer**: This is a workaround Facebook uses to prevent issues with certain browsers that cache the URL fragment. It's safe to ignore - most URL parsers automatically strip URL fragments when extracting query parameters.

## Testing

### Test OAuth Flow Locally

1. Start your server:
   ```bash
   npm run dev
   ```

2. Configure Facebook App:
   - Go to developers.facebook.com
   - Add `http://localhost:3000/api/facebook/oauth/callback` to Valid OAuth Redirect URIs

3. Initiate login:
   ```javascript
   window.location.href = 'https://www.facebook.com/v24.0/dialog/oauth?client_id=YOUR_ID&redirect_uri=http://localhost:3000/api/facebook/oauth/callback&state=test123&scope=public_profile';
   ```

4. Check logs for token exchange result

### Test with cURL

```bash
# After getting code from Facebook callback URL
curl "http://localhost:3000/api/facebook/oauth/callback?code=YOUR_CODE&state=YOUR_STATE"
```

## API Reference

### GET /api/facebook/oauth/callback

Exchange Facebook authorization code for access token.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | Authorization code from Facebook |
| `state` | string | Yes | CSRF protection token |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "EAABwz...",
    "tokenType": "bearer",
    "expiresIn": 5183944
  }
}
```

**Error Codes**:
- `400`: Missing or invalid parameters
- `500`: Server error during token exchange

## Related Documentation

- [Facebook Page Metadata Integration](FACEBOOK_PAGE_METADATA.md)
- [Unified Event Format](UNIFIED_EVENT_FORMAT.md)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow)
