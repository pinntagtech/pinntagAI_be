# 🤖 Multimodal AI Filtering for Facebook Posts

## Overview

The Facebook post filtering system uses **Google Gemini's multimodal AI with OCR capabilities** to analyze **both text AND images** to extract **events and deals** from business Facebook posts.

### Primary Use Case: Event & Deal Extraction
This system is designed to:
- **Extract events from Facebook posts** (including Facebook Events)
- **Identify promotional deals and offers**
- **Read text in images** (event flyers, promotional posters, menu boards)
- **Handle posts without text messages** where all information is in the image

## How It Works

### 1. **Image Extraction**
The system automatically extracts images from:
- `full_picture` field (main post image)
- `attachments[].media.image.src` (attachment images)
- `attachments[].url` (for photo/video attachments)

### 2. **Multimodal Analysis with OCR** (Image-First Approach)
For each post, the AI follows a strict priority:
1. **STEP 1: READ and analyze the images FIRST** (up to 3 images per post)
   - **Reads all text visible in the image** using OCR (event flyers, promotional posters, menu boards)
   - Extracts event details: date, time, location, event name
   - Extracts deal details: discounts, special offers, limited-time promotions
   - Identifies what the image shows (event flyer, promotional poster, food photo, etc.)
   - Detects missing person posters, political content, personal photos
2. **STEP 2: Image content OVERRIDES post message**
   - Event flyer in image (even if post message is empty) → ACCEPT (score 80-95)
   - Promotional poster with deals (even if post message is empty) → ACCEPT (score 85-95)
   - If image shows non-business content → REJECT (regardless of post message)
   - If image contradicts post message → Trust the image
3. **STEP 3: Post message is secondary confirmation**
   - Post message is only used to add context to the image
   - Empty post message is OK if image contains event/deal/promotional content
   - Post message cannot override what the image shows

### 3. **Smart Detection with OCR**
The AI can now detect:
- ✅ **Event flyers** → Highly suitable (extracts date, time, location from image text)
- ✅ **Promotional posters with deals** → Highly suitable (reads discount percentages, offer details)
- ✅ **Food photos** → Suitable (restaurant menu items)
- ✅ **Award certificates** → Suitable (business achievements)
- ✅ **Product photos** → Suitable (business offerings)
- ✅ **Posts with no message but event/deal images** → Suitable (OCR reads the content)
- ❌ **Missing person posters** → Not suitable (even if text seems innocent)
- ❌ **Political imagery** → Not suitable
- ❌ **Personal family photos** → Not suitable
- ❌ **Profile/cover updates without promotional content** → Not suitable

## Example: Missing Child Alert Detection

### Before Multimodal AI ❌
**Text Only Analysis:**
- Message: "We are asking the community to look out for..."
- **Result**: ACCEPTED (has text + engagement)
- **Problem**: Can't see it's a missing person poster

### After Multimodal AI ✅
**Text + Image Analysis:**
- Message: "We are asking the community to look out for..."
- **Image**: Shows a missing child poster with Messi photo
- **Result**: REJECTED (AI sees the poster and identifies it as non-business)
- **Reason**: "Community safety alert with missing person poster, not business content"

## Example: Conflicting Text/Image Detection

### Critical Test Case ⚠️
**Scenario:** Text says "business content" but image is non-business

**Post Data:**
- Message: "We are absolutely thrilled to announce we've been awarded the James Beard Award for Best New Restaurant! 🏆✨"
- **Image URL**: Same as missing child alert poster (intentionally mismatched)

**AI Analysis (Image-First Approach):**
1. **STEP 1 - Analyze Image**: AI sees missing child poster
2. **STEP 2 - Image Overrides**: Despite "James Beard Award" text, image shows non-business content
3. **STEP 3 - Text Ignored**: Text cannot override what the image shows

**Result**: ❌ REJECTED
- **Score**: 0-10
- **Reason**: "Image shows missing person poster despite award announcement text. Image content indicates this is not business promotional content."
- **Category**: "other"

This ensures the AI cannot be fooled by misleading text when the actual visual content is inappropriate.

## Example: Event Extraction with OCR

### Use Case: Post with Event Flyer but No Message ✅
**Scenario:** Business posts an event flyer image without typing any message

**Post Data:**
- Message: (empty)
- **Image**: Event flyer with text:
  ```
  LIVE MUSIC NIGHT
  Friday, December 20th
  8:00 PM - 11:00 PM
  Featuring: The Jazz Trio
  $10 Cover | Happy Hour 6-8 PM
  ```

**AI Analysis (OCR + Image-First Approach):**
1. **STEP 1 - Read Image**: AI uses OCR to read all text in the flyer
   - Event name: "Live Music Night"
   - Date: "Friday, December 20th"
   - Time: "8:00 PM - 11:00 PM"
   - Special: "Happy Hour 6-8 PM"
   - Cover charge: "$10"
2. **STEP 2 - Image Content**: Event flyer detected with complete details
3. **STEP 3 - Post Message**: Empty, but image contains all necessary information

**Result**: ✅ ACCEPTED
- **Score**: 90-95
- **Reason**: "Event flyer with clear details: Live Music Night on December 20th at 8:00 PM. Includes happy hour promotion. Highly suitable for event extraction."
- **Category**: "event"

### Use Case: Promotional Deal in Image Only ✅
**Scenario:** Business posts a deal poster without text message

**Post Data:**
- Message: (empty)
- **Image**: Promotional poster with text:
  ```
  🍔 BURGER WEEK SPECIAL 🍔
  BUY ONE GET ONE FREE
  December 18-24
  Valid Mon-Thu only
  Dine-in only
  ```

**AI Analysis (OCR + Image-First Approach):**
1. **STEP 1 - Read Image**: AI extracts deal details
   - Promotion: "Burger Week Special - BOGO"
   - Valid dates: "December 18-24"
   - Conditions: "Mon-Thu, Dine-in only"
2. **STEP 2 - Image Content**: Promotional poster with clear deal
3. **STEP 3 - Post Message**: Empty, but image is self-contained

**Result**: ✅ ACCEPTED
- **Score**: 92-98
- **Reason**: "Promotional deal poster with BOGO offer for Burger Week. Clear dates and conditions. Perfect for deal extraction."
- **Category**: "promotion"

This ensures businesses can post event flyers and deal posters as images without needing to type everything in the message.

## Implementation Details

### Code Changes

#### 1. Updated FacebookPost Interface
```typescript
interface FacebookPost {
  id: string;
  message?: string;
  story?: string;
  full_picture?: string;  // NEW: Main image URL
  attachments?: {
    data: {
      type: string;
      media?: {
        image?: {
          src?: string;  // NEW: Attachment image URL
        };
      };
      url?: string;
    }[];
  };
  // ... engagement fields
}
```

#### 2. Enhanced analyzePostWithAI Method
```typescript
async analyzePostWithAI(post: FacebookPost): Promise<AIAnalysisResult> {
  // 1. Extract image URLs
  const imageUrls: string[] = [];
  if (post.full_picture) {
    imageUrls.push(post.full_picture);
  }

  // 2. Fetch images from Facebook
  const contentParts: any[] = [{ text: prompt }];
  for (const imageUrl of imageUrls.slice(0, 3)) {
    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 5000
    });

    const base64Image = Buffer.from(imageResponse.data).toString("base64");
    contentParts.push({
      inlineData: {
        data: base64Image,
        mimeType: imageResponse.headers["content-type"] || "image/jpeg"
      }
    });
  }

  // 3. Send to Gemini with both text and images
  const result = await model.generateContent(contentParts);
  return JSON.parse(result.response.text());
}
```

#### 3. Enhanced AI Prompt (OCR + Image-First Priority)
The prompt enforces strict image priority with OCR:
```
PRIMARY USE CASE: Extract EVENTS and DEALS from business Facebook posts.
Posts with event flyers, promotional images, or deal announcements (even without text messages) are highly valuable.

⚠️ CRITICAL: IMAGE ANALYSIS WITH OCR ⚠️
This post has X image(s) attached. You MUST analyze the images FIRST and READ ANY TEXT IN THE IMAGES.

STEP 1 - READ AND ANALYZE THE IMAGE(S):
- READ all text visible in the image (event flyers, promotional posters, menu boards, deal announcements)
- Identify what the image shows: event flyer, promotional poster, food photo, missing person poster
- Check for event details: date, time, location, event name, special offers
- Check for deal/promotion details: discounts, special offers, limited-time deals
- Is it a missing person/child alert poster? (NEVER suitable, even if text says otherwise)

STEP 2 - IMAGE CONTENT OVERRIDES POST MESSAGE:
- If image shows EVENT FLYER with details (even if post message is empty) → ACCEPT (score 80-95)
- If image shows PROMOTIONAL POSTER/DEAL (even if post message is empty) → ACCEPT (score 85-95)
- If image shows missing person poster → NOT suitable (score 0-10), REGARDLESS of post message
- If image shows personal/family content → NOT suitable (score 0-20), REGARDLESS of post message
- If post message contradicts image → IMAGE WINS

STEP 3 - POST MESSAGE IS SECONDARY:
- Post message is only used to ADD CONTEXT to what you see in the image
- Empty post message is OK if image contains event/deal/promotional content
- Text like "James Beard Award" with missing child poster = NOT SUITABLE (score 0)

SPECIAL CASE - POSTS WITHOUT MESSAGES:
- If post has NO message but image contains event flyer/promotional content → ACCEPT (score 80-95)
- If post has NO message and image is just a profile/cover photo → REJECT (score 0-20)

HIGHLY SUITABLE (PRIORITIZE THESE):
- EVENT FLYERS in images - look for date, time, location, event name
- PROMOTIONAL POSTERS with deals/discounts
- Special offers, limited-time deals, happy hour announcements
- New menu items with photos
```

## Performance Considerations

### Image Fetching
- **Max 3 images per post** to optimize API costs and speed
- **5 second timeout per image** to prevent slow responses
- **Graceful fallback**: If image fetch fails, analysis continues with text only

### Batch Processing
- Posts are still processed in batches of 5
- Image fetching happens concurrently within each batch
- Total processing time: ~2-3 seconds per post with images

## API Usage

### Default (AI with Multimodal)
```typescript
// Uses AI filtering with image analysis by default
const result = await facebookService.getAllPostsForPinntag(token);
```

### Explicit Configuration
```typescript
// AI filtering with custom score threshold
const result = await facebookService.getAllPostsForPinntag(
  token,
  true,   // useAI = true
  70      // minScore = 70 (higher threshold)
);
```

### Rule-Based Only (No AI)
```typescript
// Fallback to rule-based filtering (no image analysis)
const result = await facebookService.getAllPostsForPinntag(
  token,
  false   // useAI = false
);
```

## Logging

The system logs detailed information about multimodal analysis:

```json
{
  "postId": "891155750750459_122102099991163991",
  "imageCount": 1,
  "imagesAnalyzed": 1,
  "hadImages": true,
  "aiResponse": "{\"suitable\": false, \"reason\": \"Missing child alert with poster image\", \"score\": 0}"
}
```

## Benefits

### 1. **Better Accuracy**
- Catches non-business content that looks innocent in text
- Identifies promotional content even with minimal text

### 2. **Context Understanding**
- Food photo + generic text = Suitable ✅
- Missing person poster + community message = Not suitable ❌

### 3. **Professional Quality Detection**
- Identifies professional product photography
- Filters out low-quality personal photos

### 4. **Future-Proof**
- Can adapt to new types of content
- Learns from image context, not just keywords

## Cost Estimation

### Gemini 1.5 Flash Pricing
- Text tokens: $0.075 / 1M tokens
- Image tokens: $0.0001875 / image

### Example:
- 100 posts with images
- Average 1 image per post
- Total cost: ~$0.02 (very affordable!)

## Troubleshooting

### Images Not Being Analyzed
**Check:**
1. Post has `full_picture` field or `attachments[].media.image.src`
2. Image URLs are accessible (not private/expired)
3. Logs show "Fetching images for multimodal AI analysis"

### Slow Response Times
**Solutions:**
1. Reduce `minScore` to filter fewer posts
2. Use rule-based filtering for initial filter, then AI for final pass
3. Increase timeout or reduce max images per post

## Future Enhancements

- [ ] Video frame analysis (extract key frames from videos)
- [ ] OCR for text in images (read menu boards, signs)
- [ ] Brand logo detection
- [ ] Quality scoring for images (blur detection, composition)
- [ ] Sentiment analysis from facial expressions in images

---

**Last Updated**: December 2025
**Gemini Model**: gemini-1.5-flash
**Status**: ✅ Production Ready
