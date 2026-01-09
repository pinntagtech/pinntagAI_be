# 📅 Event & Deal Extraction from Facebook Posts

## Overview

The Facebook integration system is designed to **extract events and deals** from business Facebook posts using multimodal AI with OCR capabilities. This allows the Pinntag platform to automatically discover and import business events and promotions.

## Primary Use Cases

### 1. **Event Extraction**
Extract events that businesses post on their Facebook pages:
- Live music nights
- Special guest appearances
- Happy hour events
- Trivia nights
- Wine tastings
- Grand openings
- Holiday celebrations

### 2. **Deal Extraction**
Extract promotional deals and offers:
- Limited-time discounts (e.g., "25% OFF this weekend")
- BOGO (Buy One Get One) offers
- Happy hour specials
- Daily deals
- Seasonal promotions
- New menu item launches

### 3. **Posts Without Text Messages**
The system can handle posts where businesses only upload an image (event flyer or promotional poster) without typing any message. The AI uses OCR to read all text in the image.

## How It Works

### Image Analysis with OCR

When a business posts an event flyer or promotional poster, the AI:

1. **Reads all text in the image** using OCR
   - Event names
   - Dates and times
   - Location details
   - Discount percentages
   - Special conditions
   - Contact information

2. **Identifies the content type**
   - Event flyer
   - Promotional poster
   - Deal announcement
   - Menu board
   - Award certificate
   - Product photo

3. **Extracts structured information**
   - Event details (name, date, time, location)
   - Deal details (discount, validity, conditions)
   - Business context

## Example Scenarios

### ✅ Scenario 1: Event Flyer (No Message)

**Facebook Post**:
- Message: (empty)
- Image: Event flyer

**Flyer Content** (read by OCR):
```
🎵 LIVE JAZZ NIGHT 🎵
Every Friday in December
8:00 PM - 11:00 PM

Featuring:
- The Blue Note Trio (Dec 20)
- Sarah's Jazz Quartet (Dec 27)

$10 Cover Charge
Happy Hour 6-8 PM (Half-price drinks!)

Teddy Jack's Hub City Grill
123 Main Street
```

**AI Analysis**:
- ✅ **Accepted** (Score: 92)
- **Category**: Event
- **Reason**: "Event flyer with complete details - Live Jazz Night every Friday, 8-11 PM, $10 cover, with happy hour promotion"
- **Extracted Data**:
  - Event name: "Live Jazz Night"
  - Recurring: Every Friday in December
  - Time: 8:00 PM - 11:00 PM
  - Special: Happy Hour 6-8 PM
  - Cover: $10

### ✅ Scenario 2: Promotional Deal (No Message)

**Facebook Post**:
- Message: (empty)
- Image: Promotional poster

**Poster Content** (read by OCR):
```
🍔 BURGER MADNESS 🍔
THIS WEEK ONLY!

BUY ONE GET ONE FREE
All Gourmet Burgers

December 18-24, 2024
Monday - Thursday
5:00 PM - 9:00 PM

Dine-in only
Not valid with other offers
```

**AI Analysis**:
- ✅ **Accepted** (Score: 95)
- **Category**: Promotion
- **Reason**: "BOGO promotional deal for gourmet burgers, valid Dec 18-24, clear dates and conditions"
- **Extracted Data**:
  - Deal: Buy One Get One Free
  - Product: All Gourmet Burgers
  - Valid: December 18-24, Mon-Thu, 5-9 PM
  - Condition: Dine-in only

### ✅ Scenario 3: Event with Message

**Facebook Post**:
- Message: "Get ready for an amazing night! 🎉"
- Image: Event flyer with details

**Flyer Content** (read by OCR):
```
NEW YEAR'S EVE BASH
December 31, 2024
9:00 PM - 2:00 AM

🎊 Champagne Toast at Midnight
🎶 DJ Entertainment All Night
🍽️ Special Prix Fixe Menu

$75 per person (includes dinner & 2 drinks)
Reservations Required: Call 555-0123
```

**AI Analysis**:
- ✅ **Accepted** (Score: 93)
- **Category**: Event
- **Reason**: "New Year's Eve event with prix fixe menu, DJ entertainment, champagne toast. Complete details including price and reservation info"
- **Extracted Data**:
  - Event: New Year's Eve Bash
  - Date: December 31, 2024
  - Time: 9:00 PM - 2:00 AM
  - Price: $75 per person
  - Includes: Dinner, 2 drinks, champagne toast, DJ

### ❌ Scenario 4: Profile Update (No Promotional Content)

**Facebook Post**:
- Message: (empty)
- Image: New restaurant exterior photo

**AI Analysis**:
- ❌ **Rejected** (Score: 15)
- **Category**: Other
- **Reason**: "Profile/cover photo update without event or promotional content"

### ❌ Scenario 5: Non-Business Content

**Facebook Post**:
- Message: "Happy Thanksgiving to all our customers! 🦃"
- Image: Generic Thanksgiving graphic

**AI Analysis**:
- ❌ **Rejected** (Score: 25)
- **Category**: Other
- **Reason**: "Generic holiday greeting without promotional value or event details"

## Scoring System

### 90-100 (Highly Suitable)
- Event flyers with clear date/time/location
- Promotional deals with specific discounts
- New menu items with attractive photos
- Grand opening announcements

### 80-89 (Very Suitable)
- Events mentioned in text with supporting images
- Special announcements with some promotional value
- Recurring events (weekly specials)

### 70-79 (Suitable)
- Business announcements (awards, achievements)
- Menu updates with photos
- Staff spotlights with business context

### 50-69 (Borderline)
- General business updates
- Behind-the-scenes content
- Customer appreciation posts

### 0-49 (Not Suitable)
- Missing person alerts
- Political content
- Personal family updates
- Generic greetings without promotional value
- Profile/cover updates without promotional content

## API Usage for Event Extraction

### Fetch Events and Deals

```typescript
// Get all suitable posts (events and deals)
const result = await facebookService.getAllPostsForPinntag(
  token,
  true,   // useAI = true (enables OCR and multimodal analysis)
  80      // minScore = 80 (only get high-quality events/deals)
);

// Filter by category
const events = result.posts.filter(post => post.category === 'event');
const promotions = result.posts.filter(post => post.category === 'promotion');
```

### Response Format

```json
{
  "success": true,
  "posts": [
    {
      "id": "891155750750459_122101940817163991",
      "message": "",
      "full_picture": "https://...",
      "created_time": "2024-12-17T10:30:00+0000",
      "aiAnalysis": {
        "suitable": true,
        "score": 92,
        "category": "event",
        "reason": "Event flyer with complete details - Live Jazz Night every Friday, 8-11 PM, $10 cover"
      },
      "reactions": { "summary": { "total_count": 45 } },
      "comments": { "summary": { "total_count": 12 } }
    }
  ],
  "totalPosts": 25,
  "filteredPosts": 8,
  "acceptedPosts": 3
}
```

## Integration with Pinntag Platform

### Step 1: Fetch Facebook Posts
```typescript
const facebookPosts = await facebookService.getAllPostsForPinntag(
  userToken,
  true,
  80
);
```

### Step 2: Extract Events
```typescript
const events = facebookPosts.posts
  .filter(post => post.aiAnalysis.category === 'event')
  .map(post => ({
    source: 'facebook',
    sourceId: post.id,
    name: extractEventName(post.aiAnalysis.reason),
    description: post.message,
    imageUrl: post.full_picture,
    confidence: post.aiAnalysis.score,
    createdAt: post.created_time
  }));
```

### Step 3: Extract Deals
```typescript
const deals = facebookPosts.posts
  .filter(post => post.aiAnalysis.category === 'promotion')
  .map(post => ({
    source: 'facebook',
    sourceId: post.id,
    title: extractDealTitle(post.aiAnalysis.reason),
    description: post.message,
    imageUrl: post.full_picture,
    confidence: post.aiAnalysis.score,
    createdAt: post.created_time
  }));
```

### Step 4: Store in Database
```typescript
// Create events in Pinntag database
for (const event of events) {
  await eventService.createFromFacebook(event);
}

// Create deals in Pinntag database
for (const deal of deals) {
  await dealService.createFromFacebook(deal);
}
```

## Dual Source Architecture: Events API + Posts

### Two Sources for Event Data

The system uses **two complementary sources** for extracting events:

#### 1. **Facebook Events API** (Structured Data - PREFERRED)
The Events API provides structured event data that doesn't require OCR:

```typescript
// Fetch Facebook Events (requires events permission)
const response = await facebookService.getPageEvents(token);

response.events.data.forEach(event => {
  console.log(event.id);             // Event ID (e.g., "804347802624433")
  console.log(event.name);           // Event name
  console.log(event.description);    // Full description
  console.log(event.start_time);     // ISO 8601 datetime
  console.log(event.end_time);       // ISO 8601 datetime
  console.log(event.place);          // Location object
  console.log(event.cover.source);   // Event cover image URL
  console.log(event.is_canceled);    // Cancellation status
  console.log(event.is_online);      // Online/in-person
  console.log(event.is_draft);       // Published status
});
```

**Benefits:**
- ✅ Already structured (no OCR needed)
- ✅ Complete metadata (dates, location, status)
- ✅ High reliability
- ✅ Best for formal events

#### 2. **Posts with AI + OCR** (Unstructured Data - FALLBACK)
Posts are analyzed with multimodal AI to extract events from images:

```typescript
// Fetch and analyze posts (AI analyzes images with OCR)
const response = await facebookService.getAllPostsForPinntag(token, true, 80);

response.posts.forEach(post => {
  if (post.aiAnalysis.category === 'event') {
    // Event detected in post (possibly from image only)
    console.log(post.full_picture);      // Event flyer image
    console.log(post.aiAnalysis.reason); // AI-extracted details
    console.log(post.aiAnalysis.score);  // Confidence score
  }
});
```

**Benefits:**
- ✅ Catches informal events (not created as Facebook Events)
- ✅ Extracts from event flyers/posters in images
- ✅ Works with posts that have no message text
- ✅ Best for promotional posts and informal events

### Critical Insight: Post-Event Correlation

**When Facebook Events are created, Facebook auto-generates a post:**

```
Event ID:  804347802624433
Post ID:   891155750750459_804347802624433
           └─────────┬─────┘ └────┬────┘
               Page ID      Event ID
```

**The post ID ends with the event ID!** This means:
- Post is auto-generated by Facebook when event is created
- Post has **no message** (Facebook doesn't auto-generate text)
- Post image is the **same as event cover**
- **Don't duplicate**: If you already have the Event API data, skip the post

### Best Practice: Deduplication Strategy

```typescript
async function extractEventsAndDeals(token: string) {
  // 1. Fetch structured events from Events API
  const eventsResponse = await facebookService.getPageEvents(token);
  const eventIds = new Set(
    eventsResponse.events.data.map(e => e.id)
  );

  // 2. Fetch and analyze posts
  const postsResponse = await facebookService.getAllPostsForPinntag(
    token,
    true,
    80
  );

  // 3. Filter out auto-generated event posts
  const events = [];
  const deals = [];

  // Add all structured events
  eventsResponse.events.data.forEach(event => {
    if (!event.is_canceled && !event.is_draft) {
      events.push({
        source: 'facebook_events_api',
        sourceId: event.id,
        name: event.name,
        description: event.description,
        startTime: event.start_time,
        endTime: event.end_time,
        coverImage: event.cover.source,
        isOnline: event.is_online
      });
    }
  });

  // Process posts
  postsResponse.posts.forEach(post => {
    // Check if this post is auto-generated from an event
    const postEventId = post.id.split('_')[1];
    const isAutoGeneratedEventPost = eventIds.has(postEventId);

    if (isAutoGeneratedEventPost) {
      // Skip - we already have this event from Events API
      console.log(`Skipping auto-generated event post: ${post.id}`);
      return;
    }

    // Extract events from posts (informal events as images)
    if (post.aiAnalysis.category === 'event') {
      events.push({
        source: 'facebook_post',
        sourceId: post.id,
        extractedFromImage: !post.message,
        imageUrl: post.full_picture,
        confidence: post.aiAnalysis.score,
        aiReason: post.aiAnalysis.reason
      });
    }

    // Extract deals from posts
    if (post.aiAnalysis.category === 'promotion') {
      deals.push({
        source: 'facebook_post',
        sourceId: post.id,
        message: post.message,
        imageUrl: post.full_picture,
        confidence: post.aiAnalysis.score,
        aiReason: post.aiAnalysis.reason
      });
    }
  });

  return { events, deals };
}
```

## Best Practices

### 1. **Use High Score Threshold for Events**
```typescript
// For event extraction, use minScore >= 80
const posts = await facebookService.getAllPostsForPinntag(token, true, 80);
```

### 2. **Handle Posts Without Messages**
```typescript
// Don't filter out posts with empty messages
// The AI can extract events from images alone
if (!post.message && post.full_picture && post.aiAnalysis.suitable) {
  // This is likely an event flyer or promotional poster
  events.push(post);
}
```

### 3. **Prioritize Recent Posts**
```typescript
// Facebook posts are sorted by created_time (newest first)
// Focus on posts from the last 30 days for current events
const recentPosts = posts.filter(post => {
  const daysSincePost = daysBetween(post.created_time, now);
  return daysSincePost <= 30;
});
```

### 4. **Check Engagement for Relevance**
```typescript
// Higher engagement often indicates important events
posts.sort((a, b) => {
  const engagementA = a.reactions.summary.total_count +
                      a.comments.summary.total_count;
  const engagementB = b.reactions.summary.total_count +
                      b.comments.summary.total_count;
  return engagementB - engagementA;
});
```

### 5. **Deduplicate Events**
```typescript
// Some businesses post the same event multiple times
// Use image similarity or text matching to deduplicate
const uniqueEvents = deduplicateByContent(events);
```

## Limitations and Considerations

### 1. **OCR Accuracy**
- OCR works best with clear, high-contrast text
- Handwritten text or fancy fonts may not be read accurately
- Very small text in images may be missed

### 2. **Date Interpretation**
- AI extracts date strings but may need parsing
- Relative dates ("This Friday") require context
- Time zones may need to be inferred from business location

### 3. **Rate Limits**
- Facebook Graph API has rate limits
- Gemini API has rate limits
- Implement caching and batch processing

### 4. **Image Fetching**
- Facebook image URLs may expire
- Large images may timeout (5-second timeout per image)
- Download failures are logged but don't stop processing

### 5. **False Positives**
- Award announcements may be categorized as events
- Some promotional posts may not have extractable deal details
- Review AI confidence scores and reasons

## Future Enhancements

- [ ] **Structured Event Extraction**: Parse dates, times, locations into structured format
- [ ] **Deal Detail Parsing**: Extract discount percentages, validity periods, conditions
- [ ] **Calendar Integration**: Export events to ICS format
- [ ] **Recurring Event Detection**: Identify weekly/monthly recurring events
- [ ] **Image Quality Scoring**: Prioritize posts with high-quality event flyers
- [ ] **Multi-language Support**: OCR for non-English event flyers
- [ ] **Video Frame Analysis**: Extract event details from video posts

---

**Last Updated**: December 17, 2024
**Status**: ✅ Production Ready
**Primary Use Case**: Event & Deal Extraction from Facebook Posts
