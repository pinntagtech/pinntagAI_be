# Facebook OAuth Troubleshooting Guide

## Common Error: "Request failed with status code 400"

### Error Details
```
[ERROR] Error exchanging code for token
error: "Request failed with status code 400"
```

This error occurs when the Facebook API rejects the token exchange request. Here are the most common causes and solutions:

## Root Causes & Solutions

### 1. **Redirect URI Mismatch** (Most Common)

**Problem**: The `redirect_uri` parameter doesn't EXACTLY match what's configured in Facebook App Settings.

**How to Check**:
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Select your app
3. Navigate to: **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs**
4. Compare with your `.env` file's `FACEBOOK_REDIRECT_URI`

**Common Mismatches**:
- ❌ `http://localhost:4001/api/facebook/oauth/callback` (your env)
- ✅ `http://localhost:3000/api/facebook/oauth/callback` (Facebook config)
- ❌ Missing trailing slash
- ❌ Different port number
- ❌ http vs https
- ❌ Different path (e.g., `/oauth/callback` vs `/callback`)

**Solution**:
```bash
# Option 1: Update your .env to match Facebook settings
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook/oauth/callback

# Option 2: Add your current URI to Facebook App Settings
# Add: http://localhost:4001/api/facebook/oauth/callback
```

**IMPORTANT**: The redirect URI must match character-by-character, including:
- Protocol (http/https)
- Domain/subdomain
- Port number
- Path
- NO query parameters or fragments

### 2. **Invalid or Expired Authorization Code**

**Problem**: Authorization codes are single-use and expire quickly (~10 minutes).

**Symptoms**:
- Code works the first time, fails on retry
- Old code from previous OAuth attempt
- Code obtained more than 10 minutes ago

**Solution**:
```bash
# Start a fresh OAuth flow to get a new code
# Don't reuse codes from previous attempts
```

### 3. **Wrong Facebook App Credentials**

**Problem**: `FACEBOOK_CLIENT_ID` or `FACEBOOK_CLIENT_SECRET` don't match your app.

**How to Check**:
1. Go to Facebook App Settings → **Basic**
2. Copy **App ID** → Should match `FACEBOOK_CLIENT_ID`
3. Click **Show** on **App Secret** → Should match `FACEBOOK_CLIENT_SECRET`

**Solution**:
```bash
# Update .env with correct credentials
FACEBOOK_CLIENT_ID=your_actual_app_id
FACEBOOK_CLIENT_SECRET=your_actual_app_secret
```

### 4. **App Not in Development/Live Mode**

**Problem**: App is in a restricted mode that blocks OAuth.

**Solution**:
1. Go to Facebook App Settings → **Basic**
2. Check **App Mode** (should be "Development" or "Live")
3. If in Development mode, ensure your Facebook account is added as a developer/tester

### 5. **Missing Required Permissions**

**Problem**: The scopes requested don't match what's approved for your app.

**Solution**:
1. Check which permissions your app has access to
2. Only request scopes that are approved
3. For basic testing, use: `public_profile,email`

### 6. **URL Encoding Issues**

**Problem**: Special characters in code or redirect URI not properly encoded.

**What Changed**: We now URL-encode both the code and redirect URI:
```typescript
url: `...&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`
```

This handles special characters automatically.

## Debugging Steps

### Step 1: Enable Enhanced Logging

The updated service now logs detailed information:

```typescript
logger.info({
  clientId,
  redirectUri,
  codeLength: code.length,
  url: config.url.replace(clientSecret!, '***SECRET***')
}, "Attempting to exchange code for token");
```

**What to check in logs**:
- ✅ `clientId` matches Facebook App ID
- ✅ `redirectUri` matches Facebook App Settings EXACTLY
- ✅ `codeLength` is reasonable (usually 400-500 characters)

### Step 2: Check Facebook Error Response

The error handler now logs Facebook's response:

```typescript
logger.error({
  error: error.message,
  response: error.response?.data,  // Facebook's error details
  status: error.response?.status,
  clientId,
  redirectUri
}, "Error exchanging code for token");
```

**Common Facebook Error Codes**:

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 100 | Invalid OAuth 2.0 Access Token | Wrong app credentials | Check CLIENT_ID and CLIENT_SECRET |
| 191 | Invalid redirect_uri | URI mismatch | Update Facebook settings or .env |
| 190 | Invalid OAuth access token | Expired/used code | Get fresh code |
| 200 | Permissions error | Missing app permissions | Review app permissions |

### Step 3: Test with cURL

Test the token exchange manually:

```bash
# Replace with your actual values
curl -X GET "https://graph.facebook.com/v24.0/oauth/access_token?client_id=YOUR_APP_ID&redirect_uri=http%3A%2F%2Flocalhost%3A4001%2Fapi%2Ffacebook%2Foauth%2Fcallback&client_secret=YOUR_APP_SECRET&code=YOUR_CODE"
```

**Expected Success Response**:
```json
{
  "access_token": "EAABwz...",
  "token_type": "bearer",
  "expires_in": 5183944
}
```

**Expected Error Response**:
```json
{
  "error": {
    "message": "Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request",
    "type": "OAuthException",
    "code": 100,
    "fbtrace_id": "..."
  }
}
```

### Step 4: Verify Environment Variables

```bash
# Check your .env file
cat .env | grep FACEBOOK

# Should output:
# FACEBOOK_CLIENT_ID=123456789...
# FACEBOOK_CLIENT_SECRET=abc123def...
# FACEBOOK_REDIRECT_URI=http://localhost:4001/api/facebook/oauth/callback
```

### Step 5: Test OAuth Flow End-to-End

1. **Start with clean state**:
   ```javascript
   // Clear any stored codes/tokens
   sessionStorage.clear();
   ```

2. **Generate new authorization URL**:
   ```javascript
   const state = crypto.randomUUID();
   sessionStorage.setItem('facebook_oauth_state', state);

   const params = new URLSearchParams({
     client_id: 'YOUR_APP_ID',
     redirect_uri: 'http://localhost:4001/api/facebook/oauth/callback', // MUST MATCH .env
     state: state,
     scope: 'public_profile,email',
   });

   window.location.href = `https://www.facebook.com/v24.0/dialog/oauth?${params}`;
   ```

3. **Authorize and check callback**:
   - Facebook redirects to your callback URL
   - Check browser URL for code and state parameters
   - Verify no error parameters in URL

4. **Monitor server logs**:
   - Look for "Attempting to exchange code for token" log
   - Check if redirect_uri matches
   - Review Facebook error response if it fails

## Quick Fixes Checklist

- [ ] Restart your server after updating `.env`
- [ ] Clear browser cache/cookies
- [ ] Verify Facebook App is in Development/Live mode
- [ ] Check redirect URI matches EXACTLY (copy-paste from Facebook to .env)
- [ ] Ensure port numbers match (e.g., 4001 vs 3000)
- [ ] Try with a fresh authorization code
- [ ] Verify you're added as app developer/tester (if in Development mode)
- [ ] Check Facebook App is not restricted by country/age settings

## Your Specific Error Analysis

Based on your logs:

```
clientId: <your-app-id>
redirectUri: http://localhost:4001/api/facebook/oauth/callback
codeLength: 472
```

**Most Likely Cause**:
The redirect URI in your `.env` is `http://localhost:4001/api/facebook/oauth/callback`, but Facebook expects a different URI (probably port 3000 or a different path).

**Solution**:
1. Go to Facebook App Settings → Facebook Login → Settings
2. Check the **Valid OAuth Redirect URIs** list
3. Either:
   - **Option A**: Add `http://localhost:4001/api/facebook/oauth/callback` to the list
   - **Option B**: Change your `.env` to match what's already there

## Testing in Production

When deploying to production:

1. **Update Redirect URI**:
   ```bash
   # Production .env
   FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/facebook/oauth/callback
   ```

2. **Add to Facebook App Settings**:
   - Go to Facebook Login → Settings
   - Add: `https://yourdomain.com/api/facebook/oauth/callback`

3. **Use HTTPS**:
   - Facebook requires HTTPS in production
   - Use a valid SSL certificate

4. **Switch App to Live Mode**:
   - Go to App Settings → Basic
   - Toggle to "Live" mode (after app review if required)

## Getting More Help

If you're still stuck:

1. **Check Facebook Error Details**:
   ```bash
   # Look for this in your logs:
   "response": { "error": { "message": "...", "code": 100 } }
   ```

2. **Use Facebook Graph API Explorer**:
   - Visit: https://developers.facebook.com/tools/explorer/
   - Test token generation manually

3. **Review Facebook Login Documentation**:
   - https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow

4. **Check App Review Status**:
   - Some permissions require app review
   - Check App Dashboard for pending reviews

## Summary

The most common fix is ensuring your `FACEBOOK_REDIRECT_URI` in `.env` **exactly matches** what's configured in Facebook App Settings. Even a small difference (port, protocol, path) will cause a 400 error.

**Quick Fix for Your Case**:
```bash
# Add this to Facebook App Settings → Facebook Login → Valid OAuth Redirect URIs
http://localhost:4001/api/facebook/oauth/callback

# OR change your .env to:
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/facebook/oauth/callback
```

Then restart your server and try the OAuth flow again with a fresh authorization code.
