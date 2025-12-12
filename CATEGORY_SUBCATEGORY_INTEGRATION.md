# Category & Subcategory Integration for Template System

## Overview
The Pinntag template system now fully supports storing and querying templates by **industry (category)** and **subcategory** IDs, which are fetched from the business app's industry and category APIs.

## Business App APIs

### 1. Industry List API (Categories)
```
GET https://beta.api.pinntag.com/v1/business/industryList?page=1&limit=20&search=
```
Returns a list of industries/categories with their `_id` values.

### 2. Business Category List API (Subcategories)
```
GET https://beta.api.pinntag.com/v1/business/businessCategoryList/:industryId?page=1&limit=20
```
Returns subcategories for a specific industry, with their `_id` values.

## Template Schema Fields

Templates store category and subcategory information in two fields:

### `businessIndustry` (ObjectId)
- Stores the industry/category `_id` from the `industryList` API
- References the main category/industry for the template
- Located at: [dealTemplate.model.ts:48](src/models/pinntagBackend/dealTemplate.model.ts#L48)

### `businessCategories` (Array of ObjectIds)
- Stores subcategory `_id` values from the `businessCategoryList` API
- Can contain multiple subcategories
- Located at: [dealTemplate.model.ts:49](src/models/pinntagBackend/dealTemplate.model.ts#L49)

## Creating Templates with Categories

### When Generating Templates

When calling the template generation API, provide the industry and category IDs:

```bash
POST /api/templates/generate
```

**Request Body:**
```json
{
  "businessId": "60d5ec49b84b7f3a8c8e4a1a",
  "occasion": "general",
  "businessIndustryId": "industry_id_from_industryList_api",
  "businessCategoryIds": ["subcategory_id_1", "subcategory_id_2"],
  "categories": ["subcategory_id_1", "subcategory_id_2"],
  "saveToDatabase": true
}
```

**Parameters:**
- `businessIndustryId`: The `_id` from the industryList API
- `businessCategoryIds`: Array of `_id` values from the businessCategoryList API
- `categories`: Additional categories (optional)

## Querying Templates by Category

### New Query Parameters

The `GET /api/templates` endpoint now supports filtering by categories:

#### 1. Filter by Industry Only
```bash
GET /api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a
```
Returns all templates for a specific industry/category.

#### 2. Filter by Subcategory Only
```bash
GET /api/templates?categoryId=60d5ec49b84b7f3a8c8e4a1b
```
Returns all templates that include this specific subcategory.

#### 3. Filter by Industry AND Subcategory
```bash
GET /api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a&categoryId=60d5ec49b84b7f3a8c8e4a1b
```
Returns templates that match both the industry and subcategory.

#### 4. Filter by Industry AND Multiple Subcategories
```bash
GET /api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a&categoryIds=60d5ec49b84b7f3a8c8e4a1b,60d5ec49b84b7f3a8c8e4a1c
```
Returns templates that match the industry and any of the provided subcategories (comma-separated).

### All Available Query Parameters

```
GET /api/templates?type=<type>&scope=<scope>&businessId=<id>&industryId=<id>&categoryId=<id>&categoryIds=<ids>
```

**Parameters:**
- `type`: Template type (offer, business_event, etc.)
- `scope`: "generic" or "business_specific"
- `businessId`: Get all templates for a specific business
- `industryId`: Filter by industry (from industryList API)
- `categoryId`: Filter by single subcategory (from businessCategoryList API)
- `categoryIds`: Filter by multiple subcategories, comma-separated

## Helper Functions

New helper functions have been added to [dealTemplate.model.ts](src/models/pinntagBackend/dealTemplate.model.ts):

### `findTemplatesByCategory(categoryId: string)`
Finds all active templates that include a specific subcategory.

**Location:** [dealTemplate.model.ts:188](src/models/pinntagBackend/dealTemplate.model.ts#L188)

**Usage:**
```typescript
import { findTemplatesByCategory } from './models/pinntagBackend/dealTemplate.model.js';

const templates = await findTemplatesByCategory('60d5ec49b84b7f3a8c8e4a1b');
```

### `findTemplatesByIndustryAndCategories(industryId: string, categoryIds?: string[])`
Finds templates by industry and optionally filters by subcategories.

**Location:** [dealTemplate.model.ts:199](src/models/pinntagBackend/dealTemplate.model.ts#L199)

**Usage:**
```typescript
import { findTemplatesByIndustryAndCategories } from './models/pinntagBackend/dealTemplate.model.js';

// Filter by industry only
const templates1 = await findTemplatesByIndustryAndCategories('industryId');

// Filter by industry and specific subcategories
const templates2 = await findTemplatesByIndustryAndCategories('industryId', ['catId1', 'catId2']);
```

## Implementation Flow

### 1. Business App Flow
```
User selects industry → API call to industryList
  ↓
User selects subcategory → API call to businessCategoryList/:industryId
  ↓
App has industry _id and subcategory _id(s)
  ↓
App requests templates → GET /api/templates?industryId=X&categoryId=Y
  ↓
Backend returns matching templates
```

### 2. Template Generation Flow
```
Business completes AI training
  ↓
System generates templates with businessIndustryId and businessCategoryIds
  ↓
Templates are stored with:
  - businessIndustry: industry _id
  - businessCategories: [subcategory _ids]
  ↓
Templates are queryable by these IDs
```

## Example Integration

### Step 1: Get Industry ID
```javascript
// Business app calls
const industries = await fetch('https://beta.api.pinntag.com/v1/business/industryList?page=1&limit=20');
const industryId = industries.data[0]._id; // e.g., "60d5ec49b84b7f3a8c8e4a1a"
```

### Step 2: Get Subcategory IDs
```javascript
const categories = await fetch(`https://beta.api.pinntag.com/v1/business/businessCategoryList/${industryId}`);
const subcategoryIds = categories.data.map(cat => cat._id); // ["60d5ec49b84b7f3a8c8e4a1b", ...]
```

### Step 3: Generate Template with IDs
```javascript
const template = await fetch('http://localhost:3000/api/templates/generate', {
  method: 'POST',
  body: JSON.stringify({
    businessId: "business_id_here",
    occasion: "general",
    businessIndustryId: industryId,
    businessCategoryIds: subcategoryIds,
    saveToDatabase: true
  })
});
```

### Step 4: Query Templates
```javascript
// Get all templates for this industry and subcategories
const templates = await fetch(
  `http://localhost:3000/api/templates?industryId=${industryId}&categoryIds=${subcategoryIds.join(',')}`
);
```

## Database Schema

### Template Document Example
```json
{
  "_id": "60d5ec49b84b7f3a8c8e4a1d",
  "title": "Special Offer - Save 15%",
  "description": "Discover quality and value...",
  "type": "offer",
  "scope": "business_specific",
  "businessId": "60d5ec49b84b7f3a8c8e4a1a",
  "businessIndustry": "60d5ec49b84b7f3a8c8e4a1a",
  "businessCategories": [
    "60d5ec49b84b7f3a8c8e4a1b",
    "60d5ec49b84b7f3a8c8e4a1c"
  ],
  "discountValue": "15",
  "generatedByAI": true,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Controller Implementation

The `getTemplates` controller has been updated to support category filtering:

**Location:** [templateController.ts:152](src/api/controllers/templateController.ts#L152)

**Key Logic:**
1. Parse `categoryIds` from comma-separated string
2. Priority order for filtering:
   - businessId (all templates for business)
   - industryId + categoryIds (combined filter)
   - categoryId (single subcategory)
   - scope + industryId (generic templates)
   - type or industryId alone
   - All active templates (default)

## API Routes Documentation

Full route documentation: [template.routes.ts:35](src/api/routes/template.routes.ts#L35)

## Testing

### Test Query Examples

```bash
# Get all templates
curl http://localhost:3000/api/templates

# Get templates for specific industry
curl http://localhost:3000/api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a

# Get templates for specific subcategory
curl http://localhost:3000/api/templates?categoryId=60d5ec49b84b7f3a8c8e4a1b

# Get templates for industry + subcategory
curl "http://localhost:3000/api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a&categoryId=60d5ec49b84b7f3a8c8e4a1b"

# Get templates for industry + multiple subcategories
curl "http://localhost:3000/api/templates?industryId=60d5ec49b84b7f3a8c8e4a1a&categoryIds=60d5ec49b84b7f3a8c8e4a1b,60d5ec49b84b7f3a8c8e4a1c"
```

### Test Template Generation

```bash
curl -X POST http://localhost:3000/api/templates/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "60d5ec49b84b7f3a8c8e4a1a",
    "occasion": "general",
    "businessIndustryId": "60d5ec49b84b7f3a8c8e4a1a",
    "businessCategoryIds": ["60d5ec49b84b7f3a8c8e4a1b"],
    "saveToDatabase": true
  }'
```

## Summary

The template system now:
1. ✅ Stores industry ID in `businessIndustry` field
2. ✅ Stores subcategory IDs in `businessCategories` array
3. ✅ Accepts these IDs during template generation
4. ✅ Provides query endpoints to filter by industry and/or subcategories
5. ✅ Includes helper functions for programmatic queries
6. ✅ Supports multiple subcategories per template
7. ✅ Integrates with business app's industryList and businessCategoryList APIs

The integration is complete and ready to use!
