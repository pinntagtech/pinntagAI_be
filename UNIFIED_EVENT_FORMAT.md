# Unified Event Format - Implementation Summary

## Overview
Updated the Facebook integration to transform both Facebook Events and Posts into a unified event-like format with AI-enhanced metadata.

## Key Changes

### 1. **AI Prompt Enhancement** ([faceboook.service.ts:901-995](src/api/services/faceboook.service.ts#L901-L995))

The AI now extracts structured data from posts:
- **Title Generation**: AI creates catchy, descriptive titles for all posts
- **Type Classification**: Categorizes as `event`, `offer`, `spotlight`, or `flashlight`
- **Schedule Extraction**: Extracts dates, times, and recurring patterns from images and text
- **Ticket URL Extraction**: Identifies and extracts booking/ticket URLs

### 2. **New Type System**

Replaced the old category system with a business-focused type classification:

| Type | Description | Examples |
|------|-------------|----------|
| `event` | Time-bound happenings | Concerts, workshops, grand openings, festivals |
| `offer` | Discounts and promotions | Happy hours, combo deals, seasonal sales |
| `spotlight` | Business highlights | Awards, new menu items, achievements |
| `flashlight` | Urgent announcements | Flash sales, last-minute deals, breaking news |

**Backward Compatibility Mapping**:
- `event` → `event`
- `offer` → `promotion`
- `spotlight` → `announcement`
- `flashlight` → `announcement`

### 3. **Updated Database Schema** ([facebookPost.model.ts:46-62](src/models/facebookPost.model.ts#L46-L62))

Added new fields to `aiAnalysis`:
```typescript
aiAnalysis?: {
  suitable: boolean;
  reason: string;
  score: number;
  type?: "event" | "offer" | "spotlight" | "flashlight";
  title?: string;
  schedule?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
  };
  ticketUrl?: string;
  category?: string; // Legacy field for backward compatibility
}
```

### 4. **Unified Response Format**

Both Facebook Events API and Posts now return the same structure:

```json
{
  "id": "string",
  "source": "facebook_events_api" | "facebook_post_ai_extracted",
  "title": "AI-Generated or Extracted Title",
  "description": "Post caption or event description",
  "type": "event" | "offer" | "spotlight" | "flashlight",
  "images": ["url1", "url2"],
  "schedule": {
    "startDate": "2025-01-15",
    "endDate": "2025-01-15",
    "startTime": "19:00:00",
    "endTime": "22:00:00",
    "isRecurring": false
  },
  "ticketUrl": "https://eventbrite.com/...",
  "location": { ... },
  "isOnline": false,
  "metadata": {
    "aiConfidenceScore": 90,
    "aiType": "event",
    ...
  }
}
```

### 5. **Facebook Events API Enhancement** ([faceboook.service.ts:606](src/api/services/faceboook.service.ts#L606))

Added `ticket_uri` field to the Graph API query:
```typescript
url: "https://graph.facebook.com/v20.0/me/events?fields=id,name,description,start_time,end_time,place,cover,is_canceled,is_online,is_draft,ticket_uri"
```

### 6. **Improved Post Processing** ([faceboook.service.ts:677-764](src/api/services/faceboook.service.ts#L677-L764))

- Uses AI-generated title (fallback to manual extraction if not available)
- Extracts all images from posts (not just the first one)
- Includes ticket URLs from AI analysis
- Smart filtering: only filters past dates for `event` type, keeps all other types regardless of date

## API Usage

### Endpoint: `GET /api/facebook/page-data`

**Query Parameters**:
- `businessId` (required): Business ID to fetch data for
- `useAI` (optional): Use AI filtering (default: false)
- `minScore` (optional): Minimum AI confidence score 0-100 (default: 60)

**Example Request**:
```bash
GET /api/facebook/page-data?businessId=123&useAI=true&minScore=70
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id": "...",
        "businessId": "123",
        "postId": "456_789",
        "type": "post",
        "source": "facebook_post_ai_extracted",
        "title": "Happy Hour Special",
        "message": "Join us for 50% off all appetizers...",
        "images": ["https://..."],
        "aiAnalysis": {
          "suitable": true,
          "reason": "Promotional post with clear offer details",
          "score": 90,
          "type": "offer",
          "title": "50% Off All Appetizers",
          "schedule": {
            "startDate": "2025-01-20",
            "endDate": "2025-01-20",
            "startTime": "17:00",
            "endTime": "19:00",
            "isRecurring": true
          },
          "ticketUrl": null
        }
      }
    ],
    "summary": {
      "totalFetched": 50,
      "totalSaved": 15,
      "totalFiltered": 10,
      "skipped": 35
    }
  }
}
```

## Benefits

1. **Unified Data Structure**: Both events and posts return the same format
2. **AI-Enhanced Titles**: Better UX with descriptive, attention-grabbing titles
3. **Smarter Type Classification**: Business-focused categories (event, offer, spotlight, flashlight)
4. **Schedule Intelligence**: AI extracts dates/times from images and text
5. **Ticket URL Discovery**: Automatic extraction of booking links
6. **Backward Compatible**: Legacy `category` field preserved for existing consumers

## Testing Recommendations

1. Test with various post types:
   - Event flyers with clear dates
   - Promotional posts with deals
   - Business announcements (awards, new items)
   - Urgent/flash sales

2. Verify AI extracts:
   - Titles from images with OCR
   - Schedule information from flyers
   - Ticket URLs from post text

3. Check filtering logic:
   - Past events are filtered out
   - Offers/spotlight/flashlight posts are kept regardless of date
   - Minimum score threshold works correctly

## Bug Fixes (Latest)

### Issue 1: Images Array Empty
**Problem**: The `images` field was empty in saved posts even though images existed in `rawData`.

**Root Cause**: Line 484 was using `item.image` (singular) instead of `item.images` (plural array).

**Fix**: Changed to use `item.images` array and set `fullPicture` to first image:
```typescript
fullPicture: item.images?.[0] || null,
images: item.images || [],
```

### Issue 2: Event Data Not Extracted
**Problem**: AI-generated event data (type, title, schedule, ticketUrl) was not being saved to database.

**Root Cause**: Lines 505-512 only saved basic AI analysis (suitable, reason, score, category) but ignored new fields.

**Fix**: Updated AI analysis object to include all new fields:
```typescript
postData.aiAnalysis = {
  suitable: true,
  reason: item.metadata.aiReason || "",
  score: item.metadata.aiConfidenceScore,
  type: item.type || item.metadata.aiType,        // NEW
  title: item.title,                               // NEW
  schedule: item.schedule ? { ... } : undefined,   // NEW
  ticketUrl: item.ticketUrl || null,              // NEW
  category: item.metadata.aiCategory || "event",
};
```

## Future Enhancements

1. Support for recurring event detection beyond boolean flag
2. Location extraction from post images using OCR
3. Price/cost extraction from promotional posts
4. Multi-language support for title generation
