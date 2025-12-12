# Scheduler Testing Guide

## New Testing Endpoints

Two new endpoints have been added to test and monitor the scheduled job system on demand.

---

## 1. Trigger Scheduled Job (On Demand)

**Endpoint**: `POST /api/templates/trigger-scheduled-job`

**Purpose**: Manually trigger the overnight template update job without waiting for 2:00 AM.

**Request Body**:
```json
{
  "jobName": "template-update"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}'
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Scheduled job 'template-update' triggered successfully",
  "note": "Job is running asynchronously. Check logs for completion status."
}
```

**Available Job Names**:
- `template-update` - The overnight template refresh job

**Notes**:
- Job runs **asynchronously** (returns immediately)
- Check server logs for job completion status
- Same behavior as the scheduled 2:00 AM run

---

## 2. Get Scheduler Status

**Endpoint**: `GET /api/templates/scheduler-status`

**Purpose**: Check the status of all registered scheduled jobs.

**Example**:
```bash
curl http://localhost:3000/api/templates/scheduler-status
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "template-update",
      "isRunning": true
    }
  ],
  "count": 1
}
```

**Fields**:
- `name` - Job identifier
- `isRunning` - Whether the job scheduler is active (not whether it's currently executing)

---

## Testing Workflow

### Test the Full Template Generation Flow

```bash
# 1. Check scheduler status
curl http://localhost:3000/api/templates/scheduler-status

# 2. Trigger the overnight job manually
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}'

# 3. Monitor logs
tail -f logs/app.log
# Or if using pm2: pm2 logs

# 4. Wait for completion (check logs for success message)

# 5. Verify templates were updated
curl "http://localhost:3000/api/templates?scope=generic"
curl "http://localhost:3000/api/templates?scope=business_specific&businessId=YOUR_ID"
```

### Test Specific Template Types

#### Test Business-Specific Template Update
```bash
# 1. Note current template data
curl "http://localhost:3000/api/templates?businessId=YOUR_BUSINESS_ID" > before.json

# 2. Trigger update
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}'

# 3. Wait for completion (check logs)

# 4. Compare updated templates
curl "http://localhost:3000/api/templates?businessId=YOUR_BUSINESS_ID" > after.json
diff before.json after.json
```

#### Test Generic Template Update
```bash
# 1. Get current generic templates
curl "http://localhost:3000/api/templates?scope=generic&industryId=YOUR_INDUSTRY_ID"

# 2. Trigger update
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}'

# 3. Check updated templates
curl "http://localhost:3000/api/templates?scope=generic&industryId=YOUR_INDUSTRY_ID"
```

---

## What the Scheduled Job Does

When triggered (either manually or at 2:00 AM), the job:

1. **Finds templates needing update**
   - Templates where `nextScheduledUpdate <= now`

2. **Updates business-specific templates**
   - For each trained business
   - Regenerates 4 templates (general, seasonal, slow_period, trending)
   - Uses latest training data

3. **Updates generic templates**
   - For each industry with trained businesses
   - Regenerates 4 templates (general, seasonal, holiday, trending)
   - Removes business-specific references

4. **Logs results**
   - Success/failure counts
   - Duration
   - Any errors

---

## Monitoring Job Execution

### Real-time Logs

```bash
# Watch logs as job runs
tail -f logs/app.log | grep -i template

# Or with pm2
pm2 logs --lines 100 | grep -i template
```

### Log Messages to Look For

**Job Started**:
```
[INFO] Starting overnight template update job
[INFO] Found templates to update { count: 15 }
```

**Job Progress**:
```
[INFO] Template updated successfully { templateId: '...', businessId: '...' }
[INFO] Generated generic templates for industry { industryId: '...' }
```

**Job Completed**:
```
[INFO] Overnight template update job completed { total: 15, success: 15, failed: 0, durationMs: 5432 }
```

**Errors**:
```
[ERROR] Failed to update template { templateId: '...', error: '...' }
[ERROR] Error in overnight template update job { error: '...' }
```

---

## Testing Scenarios

### Scenario 1: First-Time Setup

```bash
# Generate all templates (both generic and business-specific)
curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses

# Check what was created
curl "http://localhost:3000/api/templates" | jq '.count'
```

### Scenario 2: Update Existing Templates

```bash
# Trigger update for all templates
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}'

# Monitor via logs
tail -f logs/app.log
```

### Scenario 3: Test Specific Industry

```bash
# Generate generic templates for one industry
curl -X POST http://localhost:3000/api/templates/generate-generic-for-industry \
  -H "Content-Type: application/json" \
  -d '{
    "industryId": "YOUR_INDUSTRY_ID",
    "occasions": [
      {"occasion": "general"},
      {"occasion": "seasonal"}
    ]
  }'

# Verify they were created
curl "http://localhost:3000/api/templates?scope=generic&industryId=YOUR_INDUSTRY_ID"
```

### Scenario 4: Test Specific Business

```bash
# Generate business-specific template
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "occasion": "general",
    "scope": "business_specific",
    "saveToDatabase": true
  }'

# Verify it was created
curl "http://localhost:3000/api/templates?scope=business_specific&businessId=YOUR_BUSINESS_ID"
```

---

## Troubleshooting

### Job Not Running

**Check scheduler status**:
```bash
curl http://localhost:3000/api/templates/scheduler-status
```

Expected: `isRunning: true`

If false, restart the server.

### Job Fails

**Check error logs**:
```bash
tail -100 logs/app.log | grep ERROR
```

**Common issues**:
1. No trained businesses: Job needs at least one business with completed training
2. Database connection: Check `BACKEND_MONGODB_URI` is set correctly
3. Missing industry data: Verify businesses have industry field populated

### Templates Not Updating

**Check `nextScheduledUpdate` field**:
```javascript
// In MongoDB
db.templates.find({
  generatedByAI: true,
  nextScheduledUpdate: { $lte: new Date() }
})
```

If empty, templates don't need updating yet. Wait 24 hours or manually set:
```javascript
db.templates.updateMany(
  { generatedByAI: true },
  { $set: { nextScheduledUpdate: new Date() } }
)
```

---

## Production Considerations

### Security

**Protect these endpoints**:
```typescript
// Add authentication middleware
router.post("/trigger-scheduled-job", authMiddleware, triggerScheduledJob);
router.get("/scheduler-status", authMiddleware, getSchedulerStatus);
```

### Rate Limiting

**Prevent abuse**:
```typescript
import rateLimit from 'express-rate-limit';

const schedulerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});

router.post("/trigger-scheduled-job", schedulerLimiter, triggerScheduledJob);
```

### Monitoring

**Set up alerts**:
- Job failures
- Execution duration > threshold
- Consecutive failures

**Metrics to track**:
- Job success rate
- Average execution time
- Templates updated per run
- Error types

---

## Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/templates/trigger-scheduled-job` | POST | Run overnight job on demand |
| `/api/templates/scheduler-status` | GET | Check scheduler status |
| `/api/templates/update-all` | POST | Same as trigger-scheduled-job (legacy) |
| `/api/templates/generate-for-all-businesses` | POST | Initial setup - generate all templates |

**Test the scheduler**:
```bash
# Quick test
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "template-update"}' && tail -f logs/app.log
```

---

**Happy Testing! 🧪**
