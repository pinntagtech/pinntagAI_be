# Event API Response Format

## Overview

The `getAllPosts()` function now returns structured event data extracted from both **Facebook Events API** and **Facebook Posts** (with AI + OCR).

## API Endpoint

```typescript
GET /api/facebook/all-posts
Authorization: Bearer {facebook_token}
```

## Response Structure

```typescript
{
  success: boolean;
  data: {
    events: Event[];
    summary: {
      totalEvents: number;
      fromEventsApi: number;
      fromPosts: number;
    };
  };
  error?: string;
}
```

## Event Object Structure

Each event in the `events` array has the following structure:

```typescript
{
  id: string;                    // Facebook Event ID or Post ID
  source: string;                // "facebook_events_api" | "facebook_post_ai_extracted"
  title: string;                 // Event name/title
  description: string;           // Event description
  image: string | null;          // Event cover image URL
  schedule: {
    startDate: string | null;    // Format: "YYYY-MM-DD"
    endDate: string | null;      // Format: "YYYY-MM-DD"
    startTime: string | null;    // Format: "HH:MM:SS"
    endTime: string | null;      // Format: "HH:MM:SS"
  };
  location: {
    name: string | null;         // Location/venue name
    address1: string | null;     // Street address
    address2: string | null;     // Apartment/suite (not provided by Facebook)
    city: string | null;         // City
    state: string | null;        // State/province
    country: string | null;      // Country
    zipcode: string | null;      // ZIP/postal code
    latitude: number | null;     // Latitude coordinate
    longitude: number | null;    // Longitude coordinate
  };
  isOnline: boolean;             // Is this an online event?
  metadata: {
    // For Events API events:
    facebookEventId?: string;
    extractedFromEventsApi?: boolean;
    coverImageOffsetX?: number;
    coverImageOffsetY?: number;

    // For Post-extracted events:
    facebookPostId?: string;
    extractedFromImage?: boolean;
    aiConfidenceScore?: number;
    aiReason?: string;
    extractedFromPost?: boolean;
  };
}
```

## Example Response

### Example 1: Event from Events API

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "804347802624433",
        "source": "facebook_events_api",
        "title": "Live music 🎶 during happy hour ft. Karan Aujla",
        "description": "Karan Aujla on his It was all a dream tour features at Teddy jack's. Grab your tickets now from the reception.",
        "image": "https://scontent-bom2-3.xx.fbcdn.net/v/t39.30808-6/598836237_122103036231163991_9046407068210675651_n.jpg",
        "schedule": {
          "startDate": "2024-12-20",
          "endDate": "2024-12-20",
          "startTime": "18:00:00",
          "endTime": "23:00:00"
        },
        "location": {
          "name": "Teddy Jack's Hub City Grill",
          "address1": "123 Main Street",
          "address2": null,
          "city": "Miami",
          "state": "Florida",
          "country": "United States",
          "zipcode": "33101",
          "latitude": 25.7617,
          "longitude": -80.1918
        },
        "isOnline": false,
        "metadata": {
          "facebookEventId": "804347802624433",
          "extractedFromEventsApi": true
        }
      }
    ],
    "summary": {
      "totalEvents": 1,
      "fromEventsApi": 1,
      "fromPosts": 0
    }
  }
}
```

### Example 2: Event from Post (AI Extracted with OCR)

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "891155750750459_122101940817163991",
        "source": "facebook_post_ai_extracted",
        "title": "Live Jazz Night every Friday",
        "description": "Join us every Friday for Live Jazz Night! Featuring The Blue Note Trio. $10 cover charge. Happy Hour 6-8 PM with half-price drinks!",
        "image": "https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/601425936_122101940319163991_6885420187816078751_n.jpg",
        "schedule": {
          "startDate": "2024-12-20",
          "endDate": "2024-12-20",
          "startTime": "20:00",
          "endTime": null
        },
        "location": {
          "name": null,
          "address1": null,
          "address2": null,
          "city": null,
          "state": null,
          "country": null,
          "zipcode": null,
          "latitude": null,
          "longitude": null
        },
        "isOnline": false,
        "metadata": {
          "facebookPostId": "891155750750459_122101940817163991",
          "extractedFromImage": true,
          "aiConfidenceScore": 92,
          "aiReason": "Event flyer with clear details: Live Jazz Night every Friday at 8:00 PM. Includes happy hour promotion and cover charge information.",
          "extractedFromPost": true
        }
      }
    ],
    "summary": {
      "totalEvents": 1,
      "fromEventsApi": 0,
      "fromPosts": 1
    }
  }
}
```

## Key Features

### 1. **Dual Source Extraction**

Events are extracted from:
- **Facebook Events API**: Structured data with complete location and schedule information
- **Facebook Posts with AI**: OCR reads event flyers/posters in images

### 2. **Automatic Deduplication**

When Facebook creates an event, it auto-generates a post. The system:
- Detects when `post.id` ends with `event.id`
- Skips the auto-generated post to avoid duplicates
- Prefers structured Events API data over post extraction

### 3. **Future Events Only**

All returned events have `startDate` after the current date:
```typescript
const now = new Date();
// Only returns events where eventStartTime > now
```

### 4. **Sorted by Date**

Events are sorted by start date (earliest first):
```typescript
events.sort((a, b) => {
  const dateA = new Date(a.schedule.startDate).getTime();
  const dateB = new Date(b.schedule.startDate).getTime();
  return dateA - dateB;
});
```

## Data Source Comparison

| Field | Events API | Posts (AI + OCR) |
|-------|------------|------------------|
| **Title** | ✅ Accurate | ✅ Extracted from image/text |
| **Description** | ✅ Full text | ✅ Post message or AI reason |
| **Image** | ✅ Event cover | ✅ Post image |
| **Start Date/Time** | ✅ Structured | ⚠️ Parsed from text (may be incomplete) |
| **End Date/Time** | ✅ Structured | ❌ Usually not available |
| **Location** | ✅ Complete with coordinates | ❌ Not extracted (requires advanced NLP) |
| **Is Online** | ✅ Flag available | ❌ Not detected |
| **Reliability** | ✅ High (structured) | ⚠️ Medium (depends on AI accuracy) |

## Usage Example

### TypeScript/JavaScript

```typescript
import { facebookService } from './services/facebook.service';

async function getUpcomingEvents(token: string) {
  const response = await facebookService.getAllPosts(token);

  if (!response.success) {
    console.error('Failed to fetch events:', response.error);
    return;
  }

  const { events, summary } = response.data;

  console.log(`Found ${summary.totalEvents} upcoming events:`);
  console.log(`- ${summary.fromEventsApi} from Events API`);
  console.log(`- ${summary.fromPosts} from Posts (AI extracted)`);

  events.forEach(event => {
    console.log(`\n${event.title}`);
    console.log(`Date: ${event.schedule.startDate} at ${event.schedule.startTime}`);
    console.log(`Location: ${event.location.name || 'TBD'}`);
    console.log(`Source: ${event.source}`);
  });
}
```

### API Integration

```typescript
// GET /api/facebook/all-posts
app.get('/api/facebook/all-posts', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  const result = await facebookService.getAllPosts(token);
  res.json(result);
});
```

## Filtering and Processing

### Filter by Date Range

```typescript
const today = new Date();
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

const eventsThisWeek = events.filter(event => {
  const eventDate = new Date(event.schedule.startDate);
  return eventDate >= today && eventDate <= nextWeek;
});
```

### Filter by Source

```typescript
// Only events from Events API (most reliable)
const apiEvents = events.filter(e => e.source === 'facebook_events_api');

// Only AI-extracted events from posts
const postEvents = events.filter(e => e.source === 'facebook_post_ai_extracted');
```

### Filter by Location Availability

```typescript
// Events with complete location data
const eventsWithLocation = events.filter(e =>
  e.location.name && e.location.city
);

// Online events
const onlineEvents = events.filter(e => e.isOnline);
```

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": "Error message or Facebook API error object"
}
```

### Common Errors

1. **Invalid Token**: 401 Unauthorized
2. **Token Expired**: Facebook returns error about invalid token
3. **Insufficient Permissions**: Missing `events` or `user_posts` permissions
4. **Rate Limit**: Facebook API rate limit exceeded

## Notes

### Location Data Limitations

- **Events API**: Provides structured location data when venue is added
- **Posts (AI)**: Location extraction not implemented (would require advanced NLP)
- **Recommendation**: For post-extracted events, use business page location as fallback

### Date/Time Parsing

- **Events API**: Returns ISO 8601 format (reliable)
- **Posts (AI)**: Uses regex to extract dates from text (less reliable)
- **Formats detected**:
  - "December 20th, 2024"
  - "12/20/2024"
  - "Friday, December 20"
  - Times: "8:00 PM", "20:00"

### AI Confidence Scoring

Posts are analyzed with AI and include confidence scores:
- **80-95**: Event flyers with clear details
- **70-79**: Events mentioned in text with supporting images
- **Below 60**: Filtered out (not returned)

---

**Last Updated**: December 17, 2024
**Status**: ✅ Production Ready
**API Version**: v20.0
