# Dual Template System - Implementation Summary

## What's New

The template system now supports **two distinct types of templates**:

### 1. **Generic Templates** 🌐
Available to all businesses in an industry. Think of these as "industry-standard" templates.

### 2. **Business-Specific Templates** 🎯
Customized for individual businesses based on their training questionnaire responses.

---

## Key Changes Made

### Files Modified

1. **[`src/models/pinntagBackend/dealTemplate.model.ts`](src/models/pinntagBackend/dealTemplate.model.ts)**
   - ✅ Added `scope` field (generic | business_specific)
   - ✅ Added `businessId` field (only for business-specific)
   - ✅ New helper functions: `findGenericTemplates()`, `findBusinessSpecificTemplates()`, `findTemplatesForBusiness()`
   - ✅ New indexes for efficient querying

2. **[`src/api/services/dealTemplateGenerator.service.ts`](src/api/services/dealTemplateGenerator.service.ts)**
   - ✅ Added `scope` option to `TemplateGenerationOptions`
   - ✅ New method: `generateGenericTemplatesForIndustry()`
   - ✅ Helper methods: `makeGenericTitle()`, `makeGenericDescription()`
   - ✅ Updated `convertToDatabaseFormat()` to handle both scopes

3. **[`src/jobs/templateUpdateJob.ts`](src/jobs/templateUpdateJob.ts)**
   - ✅ Updated `generateTemplatesForAllBusinesses()` to generate both types
   - ✅ New method: `generateGenericTemplatesForIndustries()`
   - ✅ Overnight job now updates both generic and business-specific templates

4. **[`src/api/controllers/templateController.ts`](src/api/controllers/templateController.ts)**
   - ✅ Updated `getTemplates()` to support scope filtering
   - ✅ New endpoint handler: `generateGenericForIndustry()`
   - ✅ Enhanced query capabilities (scope, businessId, industryId)

5. **[`src/api/routes/template.routes.ts`](src/api/routes/template.routes.ts)**
   - ✅ New route: `POST /api/templates/generate-generic-for-industry`
   - ✅ Updated documentation with scope examples

### New Documentation

- **[`TEMPLATE_SCOPE_GUIDE.md`](TEMPLATE_SCOPE_GUIDE.md)** - Complete guide to generic vs business-specific templates

---

## How It Works

### Generic Template Generation

```
1. Admin/System identifies industry needing templates
        ↓
2. Finds a sample trained business in that industry
        ↓
3. Generates template content from sample business
        ↓
4. Removes business-specific references:
   - Strips business names
   - Generalizes descriptions
   - Adds "GEN" suffix to promo codes
        ↓
5. Saves with scope="generic", businessId=null
        ↓
6. Template available to ALL businesses in industry
```

### Business-Specific Template Generation

```
1. Business completes training questionnaire
        ↓
2. System generates templates using their data:
   - Their target audience
   - Their slow periods
   - Their discount preferences
   - Their brand voice
        ↓
3. Saves with scope="business_specific", businessId=<their_id>
        ↓
4. Templates personalized for that business only
```

---

## API Quick Reference

### Generate Templates

```bash
# Business-specific template
POST /api/templates/generate
{
  "businessId": "123",
  "occasion": "general",
  "scope": "business_specific"
}

# Generic templates for industry
POST /api/templates/generate-generic-for-industry
{
  "industryId": "456",
  "occasions": [{ "occasion": "general" }, { "occasion": "seasonal" }]
}

# Generate all templates (generic + business-specific)
POST /api/templates/generate-for-all-businesses
```

### Query Templates

```bash
# Get only generic templates
GET /api/templates?scope=generic

# Get generic templates for specific industry
GET /api/templates?scope=generic&industryId=456

# Get only business-specific templates for a business
GET /api/templates?scope=business_specific&businessId=123

# Get ALL templates for a business (generic + business-specific)
GET /api/templates?businessId=123&industryId=456
```

---

## Real-World Example

### Scenario: Car Accessories Store

**Business**: AutoParts Plus (completed training)
**Industry**: Automotive Retail

#### Business-Specific Template
```json
{
  "scope": "business_specific",
  "businessId": "autop arts_plus_123",
  "title": "Special Offer - Save 15% at AutoParts Plus",
  "description": "Visit AutoParts Plus and enjoy 15% off your visit. Perfect for car enthusiasts and daily commuters.",
  "promotionCode": "SAVESPECIAL",
  "aiGenerationData": {
    "bestTiming": {
      "days": ["Tuesday", "Wednesday"],
      "hours": ["Morning (9-12 PM)"],
      "seasonalNote": "Best during weekday mornings when traffic is lower"
    }
  }
}
```

#### Generic Template (for all automotive retail)
```json
{
  "scope": "generic",
  "businessId": null,
  "businessIndustry": "automotive_retail",
  "title": "15% Off All Car Accessories!",
  "description": "Upgrade your ride with premium car accessories, now at 15% off!",
  "promotionCode": "SAVEUPGRADGEN",
  "aiGenerationData": {
    "bestTiming": {
      "days": ["All days"],
      "hours": ["All hours"]
    }
  }
}
```

---

## Benefits

### For Businesses

| Without Training | With Training |
|-----------------|---------------|
| ✅ Can use **generic templates** immediately | ✅ Get **personalized templates** |
| ✅ Industry-standard copy | ✅ Tailored to their audience |
| ✅ No setup required | ✅ Optimal timing based on their data |
| ✅ Generic promotion codes | ✅ Unique promotion codes |

### For Your Platform

1. **Faster Onboarding** - New businesses can launch campaigns immediately with generic templates
2. **Better Engagement** - Trained businesses get highly personalized templates
3. **Scalability** - Generic templates reduce need to generate for every business
4. **Flexibility** - Businesses can choose between quick (generic) or custom (business-specific)

---

## Overnight Job Behavior

The scheduled job (2:00 AM daily) now generates/updates:

1. **Business-Specific Templates** (4 per trained business)
   - General offer
   - Seasonal promotion
   - Slow period deal
   - Trending campaign

2. **Generic Templates** (4 per industry)
   - General offer
   - Seasonal promotion
   - Holiday special
   - Trending campaign

---

## Testing

### 1. Generate Generic Templates

```bash
curl -X POST http://localhost:3000/api/templates/generate-generic-for-industry \
  -H "Content-Type: application/json" \
  -d '{"industryId": "YOUR_INDUSTRY_ID"}'
```

### 2. Generate Business-Specific Templates

```bash
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "occasion": "general",
    "scope": "business_specific",
    "saveToDatabase": true
  }'
```

### 3. Query Templates for a Business

```bash
# Get all available templates (generic + business-specific)
curl "http://localhost:3000/api/templates?businessId=YOUR_BUSINESS_ID&industryId=YOUR_INDUSTRY_ID"
```

### 4. Initial Setup

```bash
# Generate all templates at once
curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses
```

---

## Database Changes

### New Fields

```typescript
{
  // Existing fields...
  scope: "generic" | "business_specific",  // NEW
  businessId: ObjectId | null,             // NEW (null for generic)
  // ...rest of fields
}
```

### New Indexes

```typescript
{ scope: 1, isActive: 1 }
{ businessId: 1, isActive: 1 }
{ businessIndustry: 1, scope: 1 }
```

---

## Migration

If you have existing templates, update them:

```javascript
// Default existing templates to business_specific
db.templates.updateMany(
  { scope: { $exists: false } },
  { $set: { scope: "business_specific" } }
)
```

---

## Next Steps

1. **Test the system**:
   ```bash
   npm run dev
   curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses
   ```

2. **Verify database**:
   - Check templates have `scope` field
   - Generic templates have `businessId: null`
   - Business-specific have `businessId: <ObjectId>`

3. **Test queries**:
   - Query generic templates
   - Query business-specific templates
   - Query combined results for a business

4. **Monitor overnight job**:
   - Wait for 2:00 AM or manually trigger
   - Check logs for both template types
   - Verify updates work correctly

---

## Summary

You now have a **dual-template system** that provides:

✅ **Generic templates** - Ready-to-use for all businesses in an industry
✅ **Business-specific templates** - Personalized based on training data
✅ **Flexible querying** - Get generic, business-specific, or both
✅ **Automated updates** - Overnight refresh for both types
✅ **Scalable architecture** - Efficient for growing business base

The system gives businesses immediate access to templates while rewarding those who complete training with highly personalized options! 🎯
