# Image Generation Feature Toggle

## Overview
To help manage costs, you can temporarily disable Gemini AI image generation. When disabled, the system will use placeholder images instead of generating new images via the Gemini API.

## How to Toggle Image Generation

### Disable Image Generation (Reduce Costs)
1. Open the `.env` file in the root directory
2. Set `ENABLE_IMAGE_GENERATION=false`
3. Restart the application

```bash
# In .env file
ENABLE_IMAGE_GENERATION=false
```

### Enable Image Generation
1. Open the `.env` file in the root directory
2. Set `ENABLE_IMAGE_GENERATION=true`
3. Restart the application

```bash
# In .env file
ENABLE_IMAGE_GENERATION=true
```

## What Happens When Disabled?

When `ENABLE_IMAGE_GENERATION=false`:

- **API Endpoints**: All image generation endpoints will return placeholder images instead of calling Gemini API
- **Template Generation Job**: The overnight job will use default thumbnails instead of generating AI images
- **No API Calls**: Zero calls to the Gemini image generation API, resulting in zero charges
- **Functionality Preserved**: All endpoints continue to work normally, just with placeholder images

### Affected Endpoints:
- `POST /ai-assist/generate-image` - Returns placeholder
- `POST /ai-assist/edit-image` - Returns original image unchanged
- `POST /ai-assist/content-image` - Returns placeholder
- `POST /ai-assist/image-variations` - Returns single placeholder
- `POST /ai-assist/text-image` - Returns placeholder

### Affected Jobs:
- **Agent Template Generation Job** - Uses default S3 thumbnails instead of AI-generated images

## Placeholder Images

The system uses pre-existing images from S3 as placeholders:

- **Offers**: `Special_Offer.jpg`
- **Broadcasts**: `Announcement.jpg`
- **Rewards**: `Reward_Special.jpg`
- **Events**: `Event_Promotion.jpg`

## Monitoring

When image generation is disabled, you'll see log entries like:
```
Image generation disabled via feature flag, returning placeholder
```

## Re-enabling

When you're ready to re-enable image generation:
1. Set `ENABLE_IMAGE_GENERATION=true` in `.env`
2. Restart the application
3. All new requests will use Gemini AI image generation

## Current Status

**Currently**: Image generation is **DISABLED** (`ENABLE_IMAGE_GENERATION=false`)

This means you are **NOT** incurring any Gemini image generation API costs.
