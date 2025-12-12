# AI Agent Template Generation System

## Overview

This system automatically generates templates for ALL AI agents (both trained and untrained) overnight. Templates are generated with AI-generated images that have **GENERIC content** (no specific business names or details on the images).

## How It Works

### For Trained Agents
- **Uses Training Data**: Leverages completed training data to generate business-specific templates
- **Occasions**: Generates templates for general, seasonal, slow_period, and trending occasions
- **Content**: Highly personalized based on training responses

### For Untrained Agents
- **Uses Agent Metadata**: Generates templates based on:
  - Category
  - Subcategories
  - Tags
  - Description
  - Business name
- **Occasions**: Generates templates for general, seasonal, and trending occasions
- **Content**: Generic but relevant to the business category

## Image Generation

All templates include AI-generated images with the following characteristics:

- **Generic Content**: No specific business names or text on images
- **Professional Design**: Suitable for marketing and social media
- **Occasion-Based**: Visuals match the template occasion (festive for holidays, modern for trending, etc.)
- **Category-Relevant**: Incorporates industry/category elements visually
- **No Text**: Images don't include any text, logos, or specific business information

This ensures images are broadly applicable and can be customized by businesses later.

## Scheduling

### Automatic Overnight Job
- **Schedule**: Runs every night at **3:00 AM**
- **Job Name**: `agent-template-generation`
- **Process**: Iterates through all AI agents and generates templates based on their status

### Manual Trigger Options

#### Option 1: Direct Endpoint
```bash
POST /api/templates/generate-for-all-agents
```

**Response:**
```json
{
  "success": true,
  "message": "Template generation for all AI agents triggered successfully",
  "note": "Job is running asynchronously. Check logs for completion status. This will generate templates with AI images for all agents based on their training status."
}
```

#### Option 2: Scheduled Job Trigger
```bash
POST /api/templates/trigger-scheduled-job
Body: {
  "jobName": "agent-template-generation"
}
```

## File Structure

### New Files Created

1. **[src/jobs/agentTemplateGenerationJob.ts](src/jobs/agentTemplateGenerationJob.ts)**
   - Main job that handles template generation for all agents
   - Differentiates between trained and untrained agents
   - Generates AI images with generic content

### Modified Files

1. **[src/jobs/scheduler.ts](src/jobs/scheduler.ts)**
   - Added `agent-template-generation` job scheduled for 3:00 AM
   - Added trigger support for manual execution

2. **[src/api/controllers/templateController.ts](src/api/controllers/templateController.ts)**
   - Added `generateForAllAgents` controller function
   - Triggers the agent template generation job asynchronously

3. **[src/api/routes/template.routes.ts](src/api/routes/template.routes.ts)**
   - Added `POST /api/templates/generate-for-all-agents` route
   - Updated documentation for `trigger-scheduled-job` to include new job name

## Implementation Details

### Trained Agent Template Generation

```typescript
// Generates 4 templates per trained agent:
- General offer (business-specific)
- Seasonal offer (business-specific)
- Slow period offer (business-specific)
- Trending offer (business-specific)

// Each template includes:
- AI-generated content based on training data
- AI-generated image with generic visuals
- 24-hour update schedule
```

### Untrained Agent Template Generation

```typescript
// Generates 3 templates per untrained agent:
- General offer
- Seasonal special
- Trending now

// Template description built from:
- Category: "Perfect for {category} enthusiasts"
- Subcategories: "Specializing in {subcategory1} and {subcategory2}"
- Tags: "Featuring {tag1}, {tag2}, {tag3}"
- Description: First sentence if available

// Each template includes:
- AI-generated image with generic, category-relevant visuals
- Basic template structure
- 24-hour update schedule
```

### Generic Image Generation

The system generates images with careful prompts to ensure generic content:

```typescript
// Image prompt structure:
1. Occasion-specific guidance (festive, modern, professional, etc.)
2. Generic category context (e.g., "Related to retail industry")
3. Generic subcategory elements (e.g., "Featuring elements of fashion and accessories")
4. Visual instructions: vibrant colors, professional design
5. Generic content requirement: NO text, NO logos, NO business names
6. Abstract shapes/patterns only
```

## Monitoring and Logs

### Log Messages to Watch For

**Success Indicators:**
- `"Starting overnight agent template generation job"`
- `"Generated training-based templates for trained agent"`
- `"Generated metadata-based templates for untrained agent"`
- `"Generating generic AI image for template"`
- `"Overnight agent template generation job completed"`

**Error Indicators:**
- `"Failed to generate templates for agent"`
- `"Failed to generate template with image for trained agent"`
- `"Failed to generate metadata-based template with image"`
- `"Failed to generate generic AI image, using default thumbnail"`

### Summary Statistics

After each run, the job logs a summary:
```json
{
  "total": 50,        // Total AI agents processed
  "success": 48,      // Successfully generated templates
  "failed": 2,        // Failed to generate
  "trained": 30,      // Trained agents processed
  "untrained": 18,    // Untrained agents processed
  "durationMs": 45000 // Total time taken
}
```

## Testing

### Manual Test
```bash
# Trigger template generation for all agents
curl -X POST http://localhost:3000/api/templates/generate-for-all-agents

# Check scheduler status
curl http://localhost:3000/api/templates/scheduler-status

# Trigger via scheduled job endpoint
curl -X POST http://localhost:3000/api/templates/trigger-scheduled-job \
  -H "Content-Type: application/json" \
  -d '{"jobName": "agent-template-generation"}'
```

### Expected Behavior
1. Job starts and finds all AI agents
2. For each agent:
   - Checks training status
   - Generates appropriate templates (3-4 depending on status)
   - Creates AI images with generic content
   - Saves to database with 24-hour update schedule
3. Returns summary statistics

## Benefits

### For Trained Agents
- Leverages investment in training data
- Highly personalized templates
- Better targeting and conversion

### For Untrained Agents
- Immediate value without training
- Generic but relevant templates
- Encourages businesses to complete training

### For All
- Automated overnight generation
- AI-generated images save time
- Generic images are customizable
- Regular updates keep templates fresh
- Consistent template availability

## Next Steps

1. **Production Deployment**: Protect endpoints with authentication
2. **Monitoring**: Set up alerts for job failures
3. **Image Customization**: Allow businesses to edit/replace images
4. **Template Analytics**: Track which templates perform best
5. **A/B Testing**: Test different image styles and content approaches

## API Reference

### Generate Templates for All Agents

**Endpoint:** `POST /api/templates/generate-for-all-agents`

**Description:** Triggers template generation for all AI agents (trained and untrained) with AI-generated images.

**Response:**
```json
{
  "success": true,
  "message": "Template generation for all AI agents triggered successfully",
  "note": "Job is running asynchronously. Check logs for completion status..."
}
```

**Status Code:** 202 Accepted (job runs asynchronously)

---

## Troubleshooting

### Issue: No templates generated for some agents

**Check:**
1. Agent exists in database
2. Logs for specific error messages
3. Image generation quota/limits
4. Database connection

### Issue: Images not generating

**Check:**
1. Gemini API key is valid
2. Image generation quota
3. Backblaze B2 credentials
4. Network connectivity

**Fallback:** System uses default thumbnails if image generation fails

### Issue: Job takes too long

**Optimize:**
1. Run fewer templates per agent initially
2. Batch image generation
3. Increase timeout limits
4. Consider parallel processing

---

## Conclusion

This system ensures every AI agent has fresh, relevant templates available, regardless of training status. With AI-generated generic images, templates are ready to use immediately while remaining customizable for specific business needs.
