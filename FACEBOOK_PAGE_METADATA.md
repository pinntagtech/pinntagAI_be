# Facebook Page Metadata Integration

## Overview
Enhanced the `generateLongLivedPageToken` API to automatically fetch and save comprehensive Facebook page metadata to the `business_ai_assistant` collection when generating a long-lived access token.

## What's New

### Database Schema Updates ([businessAIAssistant.model.ts](src/models/businessAIAssistant.model.ts#L24-L33))

Added new fields to store Facebook page information:

```typescript
interface IBusiness_AI_Assistant {
  // Existing fields...

  // Facebook Integration
  facebookPageAccessToken?: string;          // Long-lived token (~60 days)
  facebookPageId?: string;                   // Page ID
  facebookPageTokenExpiresAt?: Date;         // Token expiration

  // NEW: Page Metadata
  facebookPageName?: string;                 // Page name
  facebookPageCategory?: string;             // Page category (e.g., "Restaurant")
  facebookPageProfilePicture?: string;       // Profile picture URL
  facebookPageCoverPhoto?: string;           // Cover photo URL
  facebookPageAbout?: string;                // About/description
  facebookPageFollowers?: number;            // Follower count
  facebookPageWebsite?: string;              // Website URL
  facebookPagePhone?: string;                // Phone number
  facebookPageEmail?: string;                // Email address
  facebookPageMetadata?: Record<string, any>; // Raw Facebook data
}
```

### Service Enhancement ([faceboook.service.ts](src/api/services/faceboook.service.ts#L174-L210))

The `generateLongLivedPageToken` method now:

1. **Fetches Comprehensive Page Data** using Graph API:
   ```
   GET /me?fields=id,name,category,about,description,followers_count,
                  website,phone,emails,picture{url},cover{source}
   ```

2. **Extracts and Stores**:
   - Basic Info: Name, Category, About
   - Contact: Website, Phone, Email
   - Media: Profile Picture, Cover Photo
   - Metrics: Follower Count
   - Raw Data: Complete Facebook response

3. **Saves Everything** to `business_ai_assistant` collection in one operation

## API Usage

### Endpoint: `POST /api/facebook/token/page-access`

**Request Body**:
```json
{
  "pageAccessToken": "short-lived-token-from-frontend",
  "businessId": "your-business-id",
  "pageId": "optional-page-id"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:3000/api/facebook/token/page-access \
  -H "Content-Type: application/json" \
  -d '{
    "pageAccessToken": "EAABwz...",
    "businessId": "507f1f77bcf86cd799439011"
  }'
```

**Enhanced Response** (now includes page metadata):
```json
{
  "success": true,
  "data": {
    "accessToken": "long-lived-token",
    "tokenType": "bearer",
    "expiresIn": 5183944,
    "expiresAt": "2025-03-01T12:00:00.000Z",
    "savedToDatabase": true,
    "businessId": "507f1f77bcf86cd799439011",
    "pageId": "123456789",
    "pageMetadata": {
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

## Database Storage

All metadata is automatically saved when a `businessId` is provided:

```javascript
// Example database query
const business = await BusinessAIAssistantModel.findOne({ businessId });

console.log(business.facebookPageName);           // "My Awesome Restaurant"
console.log(business.facebookPageCategory);       // "Restaurant"
console.log(business.facebookPageProfilePicture); // Profile pic URL
console.log(business.facebookPageCoverPhoto);     // Cover photo URL
console.log(business.facebookPageFollowers);      // 1250
console.log(business.facebookPageWebsite);        // "https://..."
console.log(business.facebookPageMetadata);       // Full raw data
```

## Benefits

### 1. **One-Step Integration**
- Single API call fetches token AND page metadata
- No need for separate calls to get page info

### 2. **Rich Business Context**
- Store complete page information for AI context
- Use page description for better content generation
- Display follower count and other metrics

### 3. **Contact Information**
- Automatically capture business contact details
- Sync with existing business records
- Keep website and phone up-to-date

### 4. **Media Assets**
- Store profile picture and cover photo URLs
- Use for display in UI
- No need to fetch separately

### 5. **Future-Proof**
- Raw metadata stored for advanced use cases
- Easy to add new fields without breaking changes

## Use Cases

### 1. **AI Content Generation**
Use page metadata to personalize AI-generated content:
```javascript
const context = `
  Business: ${business.facebookPageName}
  Category: ${business.facebookPageCategory}
  About: ${business.facebookPageAbout}
  Followers: ${business.facebookPageFollowers}
`;
// Feed to AI for better context
```

### 2. **Business Profile Enrichment**
Auto-populate business fields from Facebook:
```javascript
if (!business.website && business.facebookPageWebsite) {
  business.website = business.facebookPageWebsite;
}
if (!business.contactEmail && business.facebookPageEmail) {
  business.contactEmail = business.facebookPageEmail;
}
```

### 3. **Dashboard Display**
Show Facebook page info in admin dashboard:
```jsx
<BusinessCard
  name={business.facebookPageName}
  category={business.facebookPageCategory}
  followers={business.facebookPageFollowers}
  profilePic={business.facebookPageProfilePicture}
  coverPhoto={business.facebookPageCoverPhoto}
/>
```

### 4. **Metrics Tracking**
Track follower growth over time:
```javascript
// Store historical data
await MetricsModel.create({
  businessId,
  followers: business.facebookPageFollowers,
  date: new Date()
});
```

## Error Handling

The service gracefully handles errors:

- **Page Info Fetch Fails**: Token exchange continues, metadata is `null`
- **Token Exchange Fails**: Returns error, nothing saved
- **Database Save Fails**: Returns detailed error message

```javascript
// Example error response
{
  "success": false,
  "data": "Business with ID 123 not found"
}
```

## Security Considerations

1. **Access Token Storage**: Long-lived tokens are encrypted at rest
2. **Email Privacy**: Only first email from page is stored
3. **Raw Metadata**: Contains complete Facebook response (consider filtering sensitive fields)

## Facebook Graph API Fields

The following fields are requested from Facebook:

| Field | Description | Stored As |
|-------|-------------|-----------|
| `id` | Page ID | `facebookPageId` |
| `name` | Page name | `facebookPageName` |
| `category` | Page category | `facebookPageCategory` |
| `about` / `description` | About section | `facebookPageAbout` |
| `followers_count` | Follower count | `facebookPageFollowers` |
| `website` | Website URL | `facebookPageWebsite` |
| `phone` | Phone number | `facebookPagePhone` |
| `emails[0]` | Primary email | `facebookPageEmail` |
| `picture{url}` | Profile picture | `facebookPageProfilePicture` |
| `cover{source}` | Cover photo | `facebookPageCoverPhoto` |
| *all fields* | Raw response | `facebookPageMetadata` |

## Testing

Test the enhanced API:

```bash
# 1. Generate token with metadata
curl -X POST http://localhost:3000/api/facebook/token/page-access \
  -H "Content-Type: application/json" \
  -d '{
    "pageAccessToken": "YOUR_SHORT_LIVED_TOKEN",
    "businessId": "YOUR_BUSINESS_ID"
  }'

# 2. Verify metadata was saved
# Check MongoDB or query the business record
```

Expected results:
- ✅ Token saved with 60-day expiration
- ✅ Page ID captured
- ✅ All metadata fields populated
- ✅ Profile picture and cover photo URLs stored

## Future Enhancements

1. **Periodic Refresh**: Automatically update page metadata on token refresh
2. **Change Detection**: Notify when page info changes (name, category, etc.)
3. **Follower Tracking**: Store historical follower counts for analytics
4. **Multi-Page Support**: Handle businesses with multiple Facebook pages
5. **Field Customization**: Allow choosing which metadata fields to store
