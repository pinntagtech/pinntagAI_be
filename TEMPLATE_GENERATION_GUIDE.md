# Deal Template Generation System

This guide explains the automated deal template generation and overnight update system.

## Overview

The system automatically generates AI-powered deal templates based on business training data and updates them overnight to keep content fresh and relevant.

## Architecture

### Components

1. **Model Layer** - [`src/models/pinntagBackend/dealTemplate.model.ts`](src/models/pinntagBackend/dealTemplate.model.ts)
   - Defines the database schema for templates
   - Matches your existing database format
   - Includes AI metadata tracking

2. **Service Layer** - [`src/api/services/dealTemplateGenerator.service.ts`](src/api/services/dealTemplateGenerator.service.ts)
   - Generates template content using AI training data
   - Converts to database-compatible format
   - Handles keyword extraction, promotion codes, etc.

3. **Job Scheduler** - [`src/jobs/scheduler.ts`](src/jobs/scheduler.ts)
   - Manages scheduled background jobs using node-cron
   - Runs overnight updates at 2:00 AM daily
   - Supports graceful shutdown

4. **Update Job** - [`src/jobs/templateUpdateJob.ts`](src/jobs/templateUpdateJob.ts)
   - Executes overnight template refresh
   - Processes templates that need updating
   - Generates initial templates for all businesses

5. **API Endpoints** - [`src/api/routes/template.routes.ts`](src/api/routes/template.routes.ts)
   - REST API for template operations
   - Manual job triggering
   - Template retrieval and filtering

## Database Schema

Templates are stored with the following structure:

```typescript
{
  _id: ObjectId,
  creatorType: "Admin" | "Business" | "System",
  type: "offer" | "flashdeal" | "business_event",
  discountValue: "15",
  categories: [ObjectId],
  title: "15% Off All Car Accessories!",
  keywords: ["auto accessories", "car accessories", "discount"],
  description: "Upgrade your ride with premium car accessories...",
  minTargetAge: 18,
  maxTargetAge: 65,
  targetGenders: ["male", "female", "others"],
  promotionCode: "UPGRADE15",
  isFree: false,
  participationCost: "",
  termsApplied: true,
  termsAndConditions: "Valid on selected items only.",
  businessIndustry: ObjectId,
  businessCategories: [ObjectId],
  thumbnail: "https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/...",
  generatedByAI: true,
  aiGenerationData: {
    occasion: "general",
    bestTiming: {
      days: ["Monday", "Tuesday"],
      hours: ["Morning (9-12 PM)"],
      seasonalNote: "Best promoted during spring"
    },
    callToAction: "Book now and save!",
    marketingTips: [...]
  },
  isActive: true,
  lastUpdated: Date,
  nextScheduledUpdate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Generate Single Template

```http
POST /api/templates/generate
Content-Type: application/json

{
  "businessId": "507f1f77bcf86cd799439011",
  "occasion": "holiday",
  "specificHoliday": "Christmas",
  "saveToDatabase": true,
  "businessIndustryId": "507f1f77bcf86cd799439012",
  "categories": ["507f1f77bcf86cd799439013"],
  "thumbnailUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Christmas Special - Save 15%!",
    "description": "Celebrate Christmas with us...",
    ...
  }
}
```

### Generate Multiple Templates

```http
POST /api/templates/generate-multiple
Content-Type: application/json

{
  "businessId": "507f1f77bcf86cd799439011",
  "occasions": [
    { "occasion": "general" },
    { "occasion": "seasonal" },
    { "occasion": "holiday", "specificHoliday": "Christmas" },
    { "occasion": "slow_period" },
    { "occasion": "trending" }
  ]
}
```

### Get All Templates

```http
GET /api/templates
GET /api/templates?type=offer
GET /api/templates?industryId=507f1f77bcf86cd799439012
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### Get Template by ID

```http
GET /api/templates/:id
```

### Trigger Overnight Update (Manual)

```http
POST /api/templates/update-all
```

Manually triggers the overnight template update job. Runs asynchronously.

### Generate Templates for All Businesses

```http
POST /api/templates/generate-for-all-businesses
```

Generates templates for all trained businesses. Useful for initial setup.

## Scheduled Jobs

### Overnight Template Update

**Schedule:** Every day at 2:00 AM (configured in [`src/jobs/scheduler.ts`](src/jobs/scheduler.ts:19))

**What it does:**
1. Finds all templates where `nextScheduledUpdate <= now`
2. For each template, regenerates content with fresh AI data
3. Updates the database with new content
4. Sets `nextScheduledUpdate` to 24 hours later

**Timezone:** Configured as "America/New_York" (adjust in scheduler.ts line 88)

### Changing the Schedule

Edit [`src/jobs/scheduler.ts`](src/jobs/scheduler.ts:19):

```typescript
// Current: Runs at 2:00 AM daily
"0 2 * * *"

// Examples:
"0 0 * * *"     // Midnight every day
"0 */12 * * *"  // Every 12 hours
"0 3 * * 0"     // 3 AM every Sunday
```

## Template Generation Process

1. **Fetch Training Data**
   - Retrieves business AI training responses
   - Extracts target audience, discount preferences, slow periods, etc.

2. **Generate Content**
   - Creates title, description based on occasion
   - Suggests optimal timing based on business patterns
   - Generates marketing tips and call-to-action

3. **Convert to Database Format**
   - Extracts keywords from content
   - Maps target audience to genders
   - Generates promotion code
   - Assigns default thumbnail
   - Stores AI metadata for future updates

4. **Save to Database**
   - Upserts template (updates if exists, creates if new)
   - Sets `nextScheduledUpdate` to 24 hours from now
   - Marks as `generatedByAI: true`

## Template Types

### 1. General Templates
Standard promotional offers for any time.

### 2. Holiday Templates
Special occasions (Christmas, Thanksgiving, etc.).

### 3. Seasonal Templates
Season-specific offers (Spring Sale, Summer Special, etc.).

### 4. Slow Period Templates
Targeted for off-peak hours/days to drive traffic.

### 5. Trending Templates
Capitalize on current trends and viral moments.

## Environment Variables

No new environment variables required. Uses existing:
- `MONGODB_URI` - Primary AI database
- `BACKEND_MONGODB_URI` - PinntagBackend database for templates

## Initial Setup

### 1. Install Dependencies

Already installed: `node-cron` and `@types/node-cron`

### 2. Start the Application

```bash
npm run dev
```

The scheduler starts automatically when the app launches.

### 3. Generate Initial Templates

```bash
curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses
```

This creates templates for all businesses with completed training.

## Monitoring

Check logs for scheduled job execution:

```
[INFO] Initializing job scheduler
[INFO] Scheduled job registered { jobName: 'template-update', cronExpression: '0 2 * * *' }
[INFO] Job scheduler started successfully { jobCount: 1 }

# At 2:00 AM daily:
[INFO] Starting scheduled job { jobName: 'template-update' }
[INFO] Starting overnight template update job
[INFO] Found templates to update { count: 15 }
[INFO] Template updated successfully { templateId: '...', businessId: '...' }
[INFO] Overnight template update job completed { total: 15, success: 15, failed: 0, durationMs: 5432 }
```

## Testing

### Test Template Generation

```bash
# Generate a single template
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "occasion": "general",
    "saveToDatabase": true
  }'
```

### Manually Trigger Update

```bash
curl -X POST http://localhost:3000/api/templates/update-all
```

### View All Templates

```bash
curl http://localhost:3000/api/templates
```

## Production Considerations

1. **Authentication**
   - Add authentication middleware to template endpoints
   - Protect `/update-all` and `/generate-for-all-businesses`

2. **Rate Limiting**
   - Implement rate limits for template generation
   - Prevent abuse of generation endpoints

3. **Error Handling**
   - Set up alerts for failed overnight jobs
   - Monitor job execution duration

4. **Scaling**
   - For large numbers of templates, consider batching updates
   - Use job queues (Bull, BullMQ) for better control

5. **Monitoring**
   - Track template generation metrics
   - Monitor job execution times
   - Alert on consecutive failures

## Troubleshooting

### Templates Not Updating

1. Check scheduler is running:
   - Look for "Job scheduler started successfully" in logs

2. Verify cron expression:
   - Use [crontab.guru](https://crontab.guru) to validate

3. Check `nextScheduledUpdate` field:
   - Query database to see when templates are scheduled

### Generation Failures

1. Ensure businesses have completed training:
   ```javascript
   db.ai_trainings.find({ trainingStatus: "completed" })
   ```

2. Check business has valid training data:
   - Required fields: target_audience, typical_discount_range, etc.

3. Verify database connections:
   - Both AI and Backend MongoDB must be accessible

## Future Enhancements

- [ ] A/B testing for template variations
- [ ] Performance analytics tracking
- [ ] Multi-language template generation
- [ ] Dynamic thumbnail generation
- [ ] Template recommendation engine
- [ ] Seasonal template auto-scheduling
