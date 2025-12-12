# Template Scope System: Generic vs Business-Specific Templates

## Overview

The template system now supports **two types of templates**:

1. **Generic Templates** - Industry-wide templates available to all businesses in a specific industry
2. **Business-Specific Templates** - Customized templates tailored to individual business training data

## Template Scopes

### 1. Generic Templates (`scope: "generic"`)

**Purpose**: Provide ready-to-use templates for businesses that haven't completed training or want industry-standard options.

**Characteristics**:
- ✅ Available to **all businesses** in the same industry
- ✅ Based on industry best practices
- ✅ Business names removed/genericized
- ✅ General promotional language
- ✅ Promotion codes end with "GEN" suffix
- ✅ No `businessId` field

**Example**:
```json
{
  "_id": "...",
  "scope": "generic",
  "businessId": null,
  "businessIndustry": "68a176fb2af9ecd23a057029",
  "title": "15% Off All Car Accessories!",
  "description": "Upgrade your ride with premium car accessories, now at 15% off!",
  "promotionCode": "SAVEUPGRAD GEN",
  "generatedByAI": true
}
```

### 2. Business-Specific Templates (`scope: "business_specific"`)

**Purpose**: Provide highly customized templates based on the business's unique training data (questionnaire responses).

**Characteristics**:
- ✅ Tailored to specific business
- ✅ Uses business name in copy
- ✅ Based on business's target audience, slow periods, discount ranges
- ✅ Reflects brand voice and marketing goals
- ✅ Has `businessId` field
- ✅ Unique promotion codes

**Example**:
```json
{
  "_id": "...",
  "scope": "business_specific",
  "businessId": "68a176fb15ee3362d03f4537",
  "businessIndustry": "68a176fb2af9ecd23a057029",
  "title": "Special Offer - Save 15% at AutoParts Plus",
  "description": "Discover quality and value at AutoParts Plus! Enjoy 15% off your visit...",
  "promotionCode": "SAVESPECIAL",
  "generatedByAI": true,
  "aiGenerationData": {
    "bestTiming": {
      "days": ["Tuesday", "Wednesday"],
      "hours": ["Morning (9-12 PM)"]
    }
  }
}
```

## API Usage

### Generate Business-Specific Template

```bash
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "68a176fb15ee3362d03f4537",
    "occasion": "general",
    "scope": "business_specific",
    "saveToDatabase": true
  }'
```

### Generate Generic Templates for Industry

```bash
curl -X POST http://localhost:3000/api/templates/generate-generic-for-industry \
  -H "Content-Type: application/json" \
  -d '{
    "industryId": "68a176fb2af9ecd23a057029",
    "occasions": [
      { "occasion": "general" },
      { "occasion": "seasonal" },
      { "occasion": "holiday", "specificHoliday": "Christmas" }
    ]
  }'
```

### Query Templates

#### Get All Generic Templates
```bash
curl "http://localhost:3000/api/templates?scope=generic"
```

#### Get Generic Templates for Industry
```bash
curl "http://localhost:3000/api/templates?scope=generic&industryId=68a176fb2af9ecd23a057029"
```

#### Get Business-Specific Templates
```bash
curl "http://localhost:3000/api/templates?scope=business_specific&businessId=68a176fb15ee3362d03f4537"
```

#### Get All Templates for a Business (Generic + Business-Specific)
```bash
# Returns both generic templates for the business's industry AND business-specific templates
curl "http://localhost:3000/api/templates?businessId=68a176fb15ee3362d03f4537&industryId=68a176fb2af9ecd23a057029"
```

## Database Schema

The `scope` field has been added to distinguish template types:

```typescript
{
  scope: {
    type: String,
    required: true,
    enum: ["generic", "business_specific"],
    default: "generic"
  },
  businessId: {
    type: Schema.Types.ObjectId,
    ref: "Business"
    // Only populated for business-specific templates
  }
}
```

## Overnight Update Behavior

The overnight job (runs at 2:00 AM) now:

1. **Updates Business-Specific Templates**
   - For each trained business, regenerates their custom templates
   - Updates based on latest training data

2. **Updates Generic Templates**
   - For each industry, regenerates generic templates
   - Uses a sample business from the industry to generate content
   - Removes business-specific references

## Generation Process

### Business-Specific Template Flow

```
1. Get business training data
   ↓
2. Generate AI content (with business name, specific timing, etc.)
   ↓
3. Save with:
   - scope: "business_specific"
   - businessId: <business_id>
   - Personalized copy
```

### Generic Template Flow

```
1. Find sample business in industry
   ↓
2. Generate AI content from sample
   ↓
3. Remove business-specific references:
   - Strip business names from title/description
   - Replace "at BusinessName" with generic text
   - Add "GEN" suffix to promo codes
   ↓
4. Save with:
   - scope: "generic"
   - businessId: null
   - Generic copy
```

## Use Cases

### For Businesses Without Training

```javascript
// Get generic templates for their industry
GET /api/templates?scope=generic&industryId=THEIR_INDUSTRY_ID

// They can use these templates immediately
// When they complete training, generate business-specific templates
```

### For Trained Businesses

```javascript
// Get all templates (generic + business-specific)
GET /api/templates?businessId=BUSINESS_ID&industryId=INDUSTRY_ID

// Returns:
// - 4+ business-specific templates (personalized)
// - 4+ generic templates (fallback options)
```

### For Admin Dashboard

```javascript
// View all generic templates
GET /api/templates?scope=generic

// Generate generic templates for new industry
POST /api/templates/generate-generic-for-industry
{
  "industryId": "NEW_INDUSTRY_ID",
  "occasions": [...]
}
```

## Helper Functions

### Model Layer

```typescript
// Find generic templates
findGenericTemplates({ type?, industryId? })

// Find business-specific templates
findBusinessSpecificTemplates(businessId)

// Find all templates for a business
findTemplatesForBusiness(businessId, industryId?)
```

### Service Layer

```typescript
// Generate business-specific template
generateAndSaveDealTemplate(businessId, {
  occasion: "general",
  scope: "business_specific"
})

// Generate generic templates for industry
generateGenericTemplatesForIndustry(industryId, occasions)
```

## Initial Setup

### Generate Templates for All Businesses

```bash
# Generates both generic and business-specific templates
curl -X POST http://localhost:3000/api/templates/generate-for-all-businesses
```

This will:
1. Generate 4 business-specific templates for each trained business
2. Generate 4 generic templates for each industry

## Best Practices

### When to Use Generic Templates

- ✅ New businesses without training
- ✅ Businesses want industry-standard options
- ✅ Quick campaigns without customization
- ✅ A/B testing against business-specific

### When to Use Business-Specific Templates

- ✅ After business completes training
- ✅ Want personalized copy
- ✅ Need optimal timing based on business data
- ✅ Reflect brand voice and goals

### Promotion Code Strategy

**Generic**: `SAVEUPGRADGEN`, `HOLISPECIA LGEN`
- "GEN" suffix prevents conflicts
- Reusable across businesses in industry

**Business-Specific**: `SAVESPECIAL`, `HOLISPECIA L`
- Unique to business
- No suffix needed

## Indexes

The following indexes optimize queries:

```typescript
{ scope: 1, isActive: 1 }          // Get by scope
{ businessId: 1, isActive: 1 }     // Get by business
{ businessIndustry: 1, scope: 1 }  // Get generic by industry
```

## Migration from Old System

If you have existing templates without `scope`:

```javascript
// Update existing templates
db.templates.updateMany(
  { scope: { $exists: false } },
  { $set: { scope: "business_specific" } }
)
```

## Examples

### Frontend Integration

```typescript
// In your business dashboard
async function loadTemplates(businessId: string, industryId: string) {
  // Get all available templates
  const response = await fetch(
    `/api/templates?businessId=${businessId}&industryId=${industryId}`
  );
  const { data } = await response.json();

  // Separate by scope
  const businessSpecific = data.filter(t => t.scope === "business_specific");
  const generic = data.filter(t => t.scope === "generic");

  return {
    recommended: businessSpecific, // Show these first
    industryStandard: generic       // Show as alternatives
  };
}
```

### Admin Panel

```typescript
// Generate generic templates for a new industry
async function setupNewIndustry(industryId: string) {
  await fetch("/api/templates/generate-generic-for-industry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      industryId,
      occasions: [
        { occasion: "general" },
        { occasion: "seasonal" },
        { occasion: "holiday", specificHoliday: "Holiday Season" },
        { occasion: "trending" }
      ]
    })
  });
}
```

## Summary

| Feature | Generic | Business-Specific |
|---------|---------|-------------------|
| **Audience** | All businesses in industry | Single business |
| **Personalization** | Low | High |
| **businessId** | null | Set |
| **Copy** | Generic industry language | Business name, voice, goals |
| **Timing** | General | Based on slow periods, busy days |
| **Promo Code** | Ends with "GEN" | Unique |
| **Updates** | By industry | By business |
| **Use Case** | Quick start, fallback | Primary, personalized |

---

**The dual-template system gives businesses the best of both worlds**: ready-to-use industry templates and personalized options based on their unique business data.
