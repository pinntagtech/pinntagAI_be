# Check-In Titles API Documentation

## Overview

The Check-In Titles API provides AI-generated suggestions for check-in titles when users check in at a business location. The API analyzes the business's metadata (name, description, category, subcategories, and tags) to generate 10 creative, contextually relevant titles that are 7-8 characters long with emojis.

## Key Features

- **AI-Powered**: Uses OpenAI GPT-4o through business AI assistants
- **Metadata-Based**: Analyzes business category, tags, description, and subcategories
- **Consistent Format**: All titles are 7-8 characters long
- **Emoji-Enhanced**: Each title includes a relevant emoji
- **10 Suggestions**: Returns 10 unique title options per request

## Endpoint

### Generate Check-In Title Suggestions

**POST** `/checkin/suggest-titles`

Generate 10 AI-suggested check-in titles based on business metadata.

#### Request Body

```json
{
  "businessId": "string (required)"
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `businessId` | string | Yes | The unique identifier for the business |

#### Response

**Success Response (200 OK)**

```json
{
  "success": true,
  "suggestions": [
    "Awesome ✨",
    "Vibing 🎵",
    "Loving ❤️",
    "Chillin 😎",
    "Perfect 👌",
    "Amazing 🌟",
    "Great 👍",
    "Stellar ⭐",
    "Epic 🔥",
    "Blessed 🙏"
  ],
  "metadata": {
    "businessName": "Curry Pizza House",
    "generatedAt": "2025-12-29T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request)**

```json
{
  "error": "businessId is required"
}
```

**Error Response (500 Internal Server Error)**

```json
{
  "success": false,
  "error": "Business AI assistant not found. Please create an agent first."
}
```

## How It Works

The API follows these steps:

1. **Fetches Business Metadata**: Retrieves the business's AI assistant data including:
   - Business name
   - Description
   - Category (e.g., "Restaurant", "Cafe", "Gym")
   - Sub-categories (e.g., "Italian", "Pizza", "Fast Food")
   - Tags (e.g., "family-friendly", "outdoor-seating", "vegan-options")

2. **Generates AI Prompt**: Creates a detailed prompt that instructs the AI to:
   - Generate exactly 10 titles
   - Make each title 7-8 characters long
   - Include a relevant emoji for each
   - Reflect the business type and atmosphere
   - Use casual, social media-friendly language

3. **AI Processing**: The business's OpenAI assistant processes the prompt and generates contextually relevant titles

4. **Validation**: The system validates that titles meet requirements:
   - 7-8 character length (excluding spaces)
   - Has an emoji
   - If validation fails, supplements with default titles

5. **Returns Response**: Returns 10 title suggestions with metadata

## Business Metadata Examples

### Restaurant Example
```
Name: "Curry Pizza House"
Category: "Restaurant"
Sub-categories: ["Pizza", "Indian Fusion"]
Tags: ["family-friendly", "dine-in", "takeout"]
Description: "Unique VW-themed restaurant serving fusion pizzas"

Generated Titles:
- Yummy 🍕
- Tasty 😋
- Spicy 🌶️
- Fusion 🔥
```

### Gym Example
```
Name: "FitZone Gym"
Category: "Fitness"
Sub-categories: ["Gym", "Personal Training"]
Tags: ["weights", "cardio", "group-classes"]
Description: "Modern fitness center with state-of-the-art equipment"

Generated Titles:
- Pumped 💪
- Strong 🏋️
- Gains 📈
- Lifting 🔥
```

### Cafe Example
```
Name: "Bean & Brew"
Category: "Cafe"
Sub-categories: ["Coffee Shop", "Bakery"]
Tags: ["artisan-coffee", "pastries", "wifi"]
Description: "Cozy neighborhood cafe with artisan coffee"

Generated Titles:
- Cozy ☕
- Buzzin ☕
- Chillin 😌
- Brewing ☕
```

## Authentication

The API can be configured to use authentication. Check your environment configuration:

- If `AUTH_REQUIRE_API_KEY=true`, include the API key header:
  ```
  x-api-key: YOUR_API_KEY
  ```

- If `AUTH_REQUIRE_BEARER=true`, include the bearer token:
  ```
  Authorization: Bearer YOUR_TOKEN
  ```

## Prerequisites

Before using this API, ensure:

1. **Business AI Assistant Exists**: The business must have an AI assistant created via `POST /ai/create-agent`
2. **OpenAI API Key**: `OPENAI_API_KEY` must be set in environment variables
3. **Business Metadata**: The business should have metadata configured:
   - Business name
   - Category
   - Description (recommended)
   - Tags (recommended)
   - Sub-categories (recommended)

## Usage Examples

### Example 1: Basic Request

```bash
curl -X POST http://localhost:3000/checkin/suggest-titles \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz_123456"
  }'
```

### Example 2: With Authentication

```bash
curl -X POST http://localhost:3000/checkin/suggest-titles \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "businessId": "biz_123456"
  }'
```

### Example 3: JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:3000/checkin/suggest-titles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    businessId: 'biz_123456',
  }),
});

const data = await response.json();

// Use the titles
data.suggestions.forEach((title) => {
  console.log(title);
});
```

### Example 4: Python

```python
import requests

url = 'http://localhost:3000/checkin/suggest-titles'
payload = {
    'businessId': 'biz_123456'
}

response = requests.post(url, json=payload)
data = response.json()

if data['success']:
    for title in data['suggestions']:
        print(title)
```

## Testing

A test script is provided at `test_checkin_titles.js`. To use it:

```bash
# Set environment variables
export BUSINESS_ID="your_business_id"
export API_BASE_URL="http://localhost:3000"  # Optional
export API_KEY="your_api_key"  # Optional

# Run test
node test_checkin_titles.js
```

The test script will:
- Make a request to the API
- Display the generated titles
- Validate that each title is 7-8 characters long
- Show timing and metadata information

## AI Usage Tracking

Each API call is tracked in the usage system with the following details:

- **Type**: `CONTENT_GENERATION`
- **Sub-type**: `check_in_titles`
- **Model**: `gpt-4o`
- **Tokens**: Prompt, completion, and total tokens used
- **Metadata**: Thread ID, run ID, and number of suggestions generated

Monitor usage through the `/ai-assist/usage/*` endpoints.

## Title Generation Characteristics

The AI generates titles that are:

- **Length**: Exactly 7-8 alphabetic characters (excluding emojis)
- **Positive**: Upbeat and enthusiastic
- **Contextual**: Reflect the business category and vibe
- **Social**: Casual, social media-friendly language
- **Emoji-enhanced**: Each includes a relevant emoji
- **Unique**: Business-specific, not generic
- **Diverse**: Varied vocabulary and emojis across the 10 suggestions

## Error Handling

Common errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "businessId is required" | Missing businessId in request | Include businessId in request body |
| "Business AI assistant not found" | No AI assistant created for business | Create AI assistant via `POST /ai/create-agent` |
| "Run failed" | OpenAI API error | Check OpenAI API key and service status |
| "Run timed out" | Request took too long | Retry the request |

## Rate Limits and Performance

- **Response Time**: Typically 3-8 seconds depending on OpenAI API response time
- **Token Usage**: Approximately 300-600 tokens per request
- **Concurrent Requests**: Can handle multiple concurrent requests
- **Timeout**: 30 seconds maximum
- **Default Count**: Always returns 10 titles

## Implementation Details

### File Structure

The implementation consists of:

- **Service**: `src/api/services/checkIn.service.ts` - Business logic and OpenAI integration
- **Controller**: `src/api/controllers/checkInController.ts` - Request handling and validation
- **Routes**: `src/api/routes/checkIn.routes.ts` - API endpoint definitions
- **Test Script**: `test_checkin_titles.js` - Testing and validation

### Title Validation

Titles are validated using the following criteria:

```typescript
const titleLength = title.replace(/\s/g, "").length;
const isValid = titleLength >= 7 && titleLength <= 8 && hasEmoji;
```

If AI-generated titles don't meet requirements, the system supplements with defaults:

```typescript
const defaults = [
  "Awesome ✨",
  "Vibing 🎵",
  "Loving ❤️",
  "Chillin 😎",
  "Perfect 👌",
  "Amazing 🌟",
  "Great 👍",
  "Stellar ⭐",
  "Epic 🔥",
  "Blessed 🙏",
];
```

## Integration Tips

1. **Cache Results**: Consider caching generated titles for the same business to reduce API calls
2. **Fallback Options**: Always have default title options in case the API fails
3. **User Experience**: Show a loading indicator while titles are being generated
4. **Refresh Option**: Allow users to request new suggestions if they don't like the initial ones
5. **Analytics**: Track which suggested titles users actually select
6. **Pre-generation**: Consider pre-generating titles during business onboarding
7. **Display**: Show titles with emojis for better visual appeal

## Best Practices

1. **Business Metadata Quality**: Ensure businesses have detailed metadata (description, tags) for better title suggestions
2. **Error Handling**: Always handle errors gracefully and provide fallback titles
3. **Response Caching**: Cache responses for a short period (e.g., 5 minutes) to reduce API costs
4. **User Feedback**: Collect data on which titles users select to improve the AI prompt over time
5. **Rate Limiting**: Implement rate limiting on the client side to prevent excessive API calls

## Related Endpoints

- `POST /ai/create-agent` - Create a business AI assistant (prerequisite)
- `PUT /ai/update-agent/:businessId` - Update business metadata
- `POST /ai-assist/broadcast` - Generate broadcast content
- `POST /ai-assist/offer` - Generate offer content
- `GET /ai-assist/usage/:businessId/summary` - View usage statistics

## Support

For issues or questions:
- Check the test script for working examples
- Review error messages for specific guidance
- Ensure prerequisites are met (AI assistant exists, metadata configured)
- Check OpenAI API status if experiencing timeouts
