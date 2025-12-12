# Template System Implementation Summary

## What Was Built

A complete automated deal template generation and overnight update system that:

1. **Generates AI-powered templates** based on business training data
2. **Stores templates** in your existing database format
3. **Updates templates automatically** every night at 2:00 AM
4. **Provides REST API** for manual template management

## Files Created/Modified

### New Files Created

1. **[`src/models/pinntagBackend/dealTemplate.model.ts`](src/models/pinntagBackend/dealTemplate.model.ts)**
   - Database model matching your template schema
   - Helper functions for querying templates
   - Indexes for performance

2. **[`src/jobs/templateUpdateJob.ts`](src/jobs/templateUpdateJob.ts)**
   - Overnight template refresh logic
   - Bulk template generation for all businesses
   - Error handling and logging

3. **[`src/jobs/scheduler.ts`](src/jobs/scheduler.ts)**
   - Cron-based job scheduler
   - Configurable job timing
   - Graceful shutdown handling

4. **[`src/api/controllers/templateController.ts`](src/api/controllers/templateController.ts)**
   - REST API endpoint handlers
   - Request validation
   - Response formatting

5. **[`src/api/routes/template.routes.ts`](src/api/routes/template.routes.ts)**
   - Route definitions
   - API documentation

6. **[`TEMPLATE_GENERATION_GUIDE.md`](TEMPLATE_GENERATION_GUIDE.md)**
   - Complete documentation
   - API examples
   - Troubleshooting guide

### Modified Files

1. **[`src/api/services/dealTemplateGenerator.service.ts`](src/api/services/dealTemplateGenerator.service.ts)**
   - Added database format conversion
   - New methods for saving templates
   - Helper functions for keywords, promotion codes, etc.

2. **[`src/index.ts`](src/index.ts)**
   - Integrated job scheduler startup
   - Added graceful shutdown handling

3. **[`src/api/routes/index.routes.ts`](src/api/routes/index.routes.ts)**
   - Registered template routes

4. **[`package.json`](package.json)**
   - Added `node-cron` and `@types/node-cron` dependencies

## Key Features

### 1. Database Format Mapping

Templates are generated and saved in your exact database format:

```json
{
  "_id": "...",
  "creatorType": "System",
  "type": "offer",
  "discountValue": "15",
  "categories": [...],
  "title": "15% Off All Car Accessories!",
  "keywords": ["auto", "accessories", "discount"],
  "description": "...",
  "targetGenders": ["male", "female", "others"],
  "promotionCode": "SAVEUPGRAD",
  "businessIndustry": "...",
  "thumbnail": "https://...",
  "generatedByAI": true,
  "aiGenerationData": { ... },
  "nextScheduledUpdate": "2025-11-15T02:00:00.000Z"
}
```

### 2. Overnight Updates

- **Schedule**: Every day at 2:00 AM
- **Process**: Finds templates where `nextScheduledUpdate <= now` and regenerates them
- **Smart Updates**: Only updates templates that need refreshing

### 3. API Endpoints

All available at `/api/templates`:

- `POST /generate` - Generate single template
- `POST /generate-multiple` - Generate multiple templates
- `GET /` - Get all templates (with filters)
- `GET /:id` - Get template by ID
- `POST /update-all` - Manually trigger overnight update
- `POST /generate-for-all-businesses` - Initial setup helper

### 4. Auto-Generated Content

For each template, the system automatically generates:

- ✅ **Title** - Based on occasion and business
- ✅ **Description** - AI-crafted marketing copy
- ✅ **Keywords** - Extracted from title/description
- ✅ **Promotion Code** - Auto-generated (e.g., "SAVEUPGRAD")
- ✅ **Target Audience** - Mapped from training data
- ✅ **Best Timing** - Days/hours based on business patterns
- ✅ **Marketing Tips** - Actionable suggestions
- ✅ **Call to Action** - Compelling CTAs

## Quick Start

### 1. Start the Application

```bash
npm run dev
```

You'll see:
```
[INFO] Pinntag AI listening on :3000
[INFO] Job scheduler started successfully { jobCount: 1 }
```

### 2. Generate Initial Templates

```bash
curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses
```

This creates templates for all trained businesses.

### 3. View Templates

```bash
curl http://localhost:3000/api/templates
```

### 4. Generate Custom Template

```bash
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "occasion": "holiday",
    "specificHoliday": "Christmas"
  }'
```

## How It Works

### Template Generation Flow

```
1. User/Cron triggers generation
        ↓
2. Fetch business training data
   (target audience, discounts, timing, etc.)
        ↓
3. Generate AI content
   (title, description, tips, timing)
        ↓
4. Convert to database format
   (keywords, promo codes, genders)
        ↓
5. Save to templates collection
   (set nextScheduledUpdate = now + 24h)
        ↓
6. Return template to caller
```

### Overnight Update Flow

```
2:00 AM Daily
        ↓
1. Find templates where nextScheduledUpdate <= now
        ↓
2. For each template:
   - Get business ID
   - Regenerate with fresh AI data
   - Update database
   - Set nextScheduledUpdate = now + 24h
        ↓
3. Log results (success/failure counts)
```

## Template Types Supported

1. **General** - Standard promotional offers
2. **Holiday** - Holiday-specific (Christmas, Thanksgiving, etc.)
3. **Seasonal** - Season-based (Spring Sale, Summer Special)
4. **Slow Period** - Off-peak traffic drivers
5. **Trending** - Capitalize on trends

## Configuration

### Change Update Schedule

Edit [`src/jobs/scheduler.ts`](src/jobs/scheduler.ts:19):

```typescript
// Current: 2:00 AM daily
"0 2 * * *"

// Options:
"0 0 * * *"     // Midnight
"0 */12 * * *"  // Every 12 hours
"0 3 * * 0"     // 3 AM Sundays only
```

### Change Timezone

Edit [`src/jobs/scheduler.ts`](src/jobs/scheduler.ts) (removed from code, defaults to system timezone)

## Monitoring

Check logs for job execution:

```bash
# Watch logs
tail -f logs/app.log

# Or if using pm2
pm2 logs pinntag-ai
```

Look for:
- ✅ "Job scheduler started successfully"
- ✅ "Starting overnight template update job"
- ✅ "Template updated successfully"
- ✅ "Overnight template update job completed"

## Production Checklist

- [ ] Add authentication to template endpoints
- [ ] Set up monitoring/alerts for failed jobs
- [ ] Configure proper timezone
- [ ] Add rate limiting
- [ ] Set up error notifications
- [ ] Review and adjust cron schedule
- [ ] Test with production data

## Dependencies Added

```json
{
  "node-cron": "^3.x",
  "@types/node-cron": "^3.x"
}
```

## Next Steps

1. **Test the system**:
   - Generate templates for a test business
   - Verify database format matches
   - Check overnight updates work

2. **Customize templates**:
   - Adjust default thumbnails
   - Modify discount extraction logic
   - Customize keywords generation

3. **Add authentication**:
   - Protect sensitive endpoints
   - Add API keys or JWT

4. **Monitor performance**:
   - Track generation times
   - Monitor job success rates
   - Set up alerts

## Support

- Full documentation: [`TEMPLATE_GENERATION_GUIDE.md`](TEMPLATE_GENERATION_GUIDE.md)
- API examples included in guide
- Troubleshooting section available

---

**Built with TypeScript, Express, Mongoose, and node-cron**
