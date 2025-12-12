# AI Agent Template Generation - Quick Start

## What Was Implemented

✅ **Overnight automatic template generation for ALL AI agents**
- Trained agents: Uses training data
- Untrained agents: Uses metadata (category, subcategories, tags, description)

✅ **AI-generated images with GENERIC content**
- No business names or specific text on images
- Professional, category-relevant visuals
- Suitable for marketing and social media

✅ **Automated scheduling**
- Runs every night at 3:00 AM
- Generates fresh templates for all agents

## Quick Commands

### Test Template Generation Now
```bash
# Generate templates for all agents immediately
POST http://localhost:3000/api/templates/generate-for-all-agents
```

### Alternative: Use Scheduler Trigger
```bash
POST http://localhost:3000/api/templates/trigger-scheduled-job
Content-Type: application/json

{
  "jobName": "agent-template-generation"
}
```

### Check Scheduler Status
```bash
GET http://localhost:3000/api/templates/scheduler-status
```

## What Gets Generated

### For Trained Agents (4 templates each)
1. **General** - Business-specific offer based on training
2. **Seasonal** - Current season offer based on training
3. **Slow Period** - Off-peak offer based on training data
4. **Trending** - Viral/trending offer based on training

### For Untrained Agents (3 templates each)
1. **General** - "Special Offer - Exclusive Deal"
2. **Seasonal** - "Seasonal Special - Limited Time"
3. **Trending** - "Trending Now - Don't Miss Out"

**All templates include:**
- AI-generated title and description
- AI-generated image (GENERIC content)
- Discount information
- Target audience
- Terms and conditions
- Marketing tips

## Image Generation Details

**Prompt ensures:**
- ✅ Generic, professional visuals
- ✅ Category/industry-relevant elements
- ✅ Vibrant colors and eye-catching design
- ❌ NO specific business names
- ❌ NO text or logos
- ❌ NO specific contact information

**Example prompts:**
- "Create a professional promotional image. Related to retail industry. Featuring elements of fashion and accessories. Use vibrant colors and professional design. NO text, NO logos, NO business names."

## Files Modified/Created

### Created:
- `src/jobs/agentTemplateGenerationJob.ts` - Main job logic

### Modified:
- `src/jobs/scheduler.ts` - Added 3AM scheduled job
- `src/api/controllers/templateController.ts` - Added `generateForAllAgents` endpoint
- `src/api/routes/template.routes.ts` - Added `/generate-for-all-agents` route

## Monitoring

**Check logs for:**
```
✅ "Starting overnight agent template generation job"
✅ "Generated training-based templates for trained agent"
✅ "Generated metadata-based templates for untrained agent"
✅ "Generating generic AI image for template"
✅ "Overnight agent template generation job completed"
```

**Summary output example:**
```json
{
  "total": 50,
  "success": 48,
  "failed": 2,
  "trained": 30,
  "untrained": 18,
  "durationMs": 45000
}
```

## How It Differentiates

### Trained Agents
```typescript
if (training && training.trainingStatus === "completed") {
  // Use training data for:
  // - Target audience
  // - Discount ranges
  // - Business hours
  // - Marketing goals
  // - Brand voice
  // Generate 4 templates with rich, personalized content
}
```

### Untrained Agents
```typescript
else {
  // Use agent metadata:
  // - category: "Perfect for {category} enthusiasts"
  // - subCategories: "Specializing in {sub1} and {sub2}"
  // - tags: "Featuring {tag1}, {tag2}, {tag3}"
  // - description: First sentence if available
  // Generate 3 templates with generic but relevant content
}
```

## Production Checklist

Before deploying to production:

- [ ] Add authentication to template endpoints
- [ ] Set up error monitoring/alerts
- [ ] Configure image generation quotas
- [ ] Test with production data
- [ ] Monitor Gemini API usage
- [ ] Check Backblaze B2 storage limits
- [ ] Review generated templates quality
- [ ] Set up database backups

## Testing Workflow

1. **Run generation manually:**
   ```bash
   POST /api/templates/generate-for-all-agents
   ```

2. **Check logs** for success messages

3. **Query database** for new templates:
   ```bash
   GET /api/templates?scope=business_specific
   ```

4. **Verify images** are uploaded to B2 and accessible

5. **Check template content** is appropriate

## Troubleshooting

**No templates generated?**
- Check if agents exist in database
- Verify Gemini API key
- Check B2 credentials
- Review logs for errors

**Images not generating?**
- Check Gemini API quota
- Verify network connectivity
- System falls back to default thumbnails

**Job running slowly?**
- Normal for many agents
- Each agent generates 3-4 templates with images
- Consider running during off-peak hours

## Success Metrics

After running, you should see:
- ✅ Templates in database for all agents
- ✅ Images uploaded to Backblaze B2
- ✅ Generic, professional image content
- ✅ Appropriate template content for each agent
- ✅ 24-hour update schedule set

---

**Ready to test?** Run: `POST /api/templates/generate-for-all-agents`
