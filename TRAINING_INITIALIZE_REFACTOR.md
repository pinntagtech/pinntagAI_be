# Training Initialization API Refactor

## Summary

The training initialization APIs have been refactored from **POST** to **GET** requests. Industry and subcategory are now automatically retrieved from the Business AI Assistant model instead of being passed as request body parameters.

## What Changed

### Before (POST)
```bash
POST /ai/training/initialize
Body: {
  "businessId": "68a18c1153c962c7450afed8",
  "industry": "Retail",
  "subCategory": "Clothing & Apparel"
}
```

### After (GET)
```bash
GET /ai/training/initialize/68a18c1153c962c7450afed8
```

## Rationale

During agent creation, the business owner already provides:
- **Category** (mapped to industry)
- **Subcategories** (array of business specializations)
- **Description**
- **Tags**

These fields are stored in the `BusinessAIAssistant` model. Asking for them again during training initialization is redundant and creates a poor user experience.

## API Changes

### 1. Initialize Training (Full Questionnaire)

**Endpoint:**
- **Old:** `POST /ai/training/initialize`
- **New:** `GET /ai/training/initialize/:businessId`

**Request:**
```bash
# Old
curl -X POST https://ai.pinntag.com/ai/training/initialize \
  -H "x-internal-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "68a18c1153c962c7450afed8",
    "industry": "Retail",
    "subCategory": "Clothing & Apparel"
  }'

# New
curl -X GET https://ai.pinntag.com/ai/training/initialize/68a18c1153c962c7450afed8 \
  -H "x-internal-api-key: your-key"
```

**Response:** (Unchanged)
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "businessId": "68a18c1153c962c7450afed8",
    "industry": "Retail",
    "subCategory": "Clothing & Apparel",
    "trainingStatus": "not_started",
    "responses": [],
    "metadata": {
      "totalQuestions": 25,
      "answeredQuestions": 0,
      "requiredQuestions": 10,
      "completionPercentage": 0
    }
  },
  "questions": [...],
  "message": "Training initialized successfully"
}
```

### 2. Initialize Minimal Training

**Endpoint:**
- **Old:** `POST /ai/training/initialize-minimal`
- **New:** `GET /ai/training/initialize-minimal/:businessId`

**Request:**
```bash
# Old
curl -X POST https://ai.pinntag.com/ai/training/initialize-minimal \
  -H "x-internal-api-key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "68a18c1153c962c7450afed8",
    "industry": "Retail",
    "subCategory": "Clothing & Apparel"
  }'

# New
curl -X GET https://ai.pinntag.com/ai/training/initialize-minimal/68a18c1153c962c7450afed8 \
  -H "x-internal-api-key: your-key"
```

**Response:** (Unchanged)
```json
{
  "success": true,
  "data": {
    "training": {...},
    "questionsForUser": [
      // Only 3-5 essential questions
    ],
    "autoFilledCount": 20
  },
  "message": "Minimal onboarding: 5 questions to answer, 20 auto-filled with smart defaults"
}
```

## Implementation Details

### Files Modified

1. **[src/api/routes/aiTraining.routes.ts](src/api/routes/aiTraining.routes.ts)**
   - Changed from `POST /initialize` to `GET /initialize/:businessId`
   - Changed from `POST /initialize-minimal` to `GET /initialize-minimal/:businessId`

2. **[src/api/controllers/aiTrainingController.ts](src/api/controllers/aiTrainingController.ts)**
   - Updated `initializeTraining()` to get `businessId` from `req.params` instead of `req.body`
   - Removed `industry` and `subCategory` parameters
   - Updated `initializeMinimalTraining()` similarly

3. **[src/api/services/aiTraining.service.ts](src/api/services/aiTraining.service.ts)**
   - Updated `initializeTraining()` to accept only `businessId` parameter
   - Added logic to fetch industry/subcategory from `BusinessAIAssistant` model
   - Maps `category` field to `BusinessIndustries` enum
   - Uses first subcategory from `subCategories` array
   - Updated `initializeMinimalTraining()` similarly

### Data Mapping

```typescript
// Fetch from BusinessAIAssistant
const businessAgent = await BusinessAIAssistantModel.findOne({
  businessId: new mongoose.Types.ObjectId(businessId),
});

// Map to training parameters
const industry = businessAgent.category as BusinessIndustries;
const subCategory = businessAgent.subCategories?.[0] as BusinessSubCategory | undefined;
```

**Example:**
- `businessAgent.category = "Retail"` → `industry = "Retail"`
- `businessAgent.subCategories = ["Clothing & Apparel", "Fashion"]` → `subCategory = "Clothing & Apparel"`

## Error Handling

### New Error Cases

**Missing Category:**
```json
{
  "success": false,
  "error": "Business agent must have a category set"
}
```

**Business Agent Not Found:**
```json
{
  "success": false,
  "error": "No AI agent found for business ID: 68a18c1153c962c7450afed8"
}
```

### Existing Error Cases (Unchanged)

**Invalid Business ID:**
```json
{
  "success": false,
  "error": "Invalid Business ID format"
}
```

**Training Already Exists:**
```json
{
  "success": true,
  "data": {...},
  "message": "Training already initialized"
}
```

## Benefits

### 1. **Eliminates Redundancy**
- No need to ask for information already collected during agent creation
- Reduces friction in the onboarding process
- Fewer fields for frontend to manage

### 2. **Data Consistency**
- Single source of truth for business category/industry
- No risk of mismatched data between agent and training
- Automatic synchronization

### 3. **Better UX**
- Simpler API - just provide businessId
- Faster initialization process
- Less chance of user error

### 4. **Cleaner Frontend Code**
```javascript
// Before
const initializeTraining = async (businessId, industry, subCategory) => {
  const response = await fetch('/ai/training/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId, industry, subCategory })
  });
  return response.json();
};

// After
const initializeTraining = async (businessId) => {
  const response = await fetch(`/ai/training/initialize/${businessId}`);
  return response.json();
};
```

## Migration Guide

### For Frontend Developers

**Step 1:** Update API calls from POST to GET
```diff
- POST /ai/training/initialize
- Body: { businessId, industry, subCategory }
+ GET /ai/training/initialize/:businessId
```

**Step 2:** Remove industry/subcategory parameters
```diff
- initializeTraining(businessId, industry, subCategory)
+ initializeTraining(businessId)
```

**Step 3:** Update minimal training similarly
```diff
- POST /ai/training/initialize-minimal
- Body: { businessId, industry, subCategory }
+ GET /ai/training/initialize-minimal/:businessId
```

### For Backend Developers

No changes needed - the service layer handles everything automatically.

## Testing

### Manual Test

```bash
# Get business ID from agent creation
BUSINESS_ID="68a18c1153c962c7450afed8"

# Initialize full training
curl -X GET "https://ai.pinntag.com/ai/training/initialize/${BUSINESS_ID}" \
  -H "x-internal-api-key: change-me"

# Initialize minimal training
curl -X GET "https://ai.pinntag.com/ai/training/initialize-minimal/${BUSINESS_ID}" \
  -H "x-internal-api-key: change-me"
```

### Expected Behavior

1. **Success Case:**
   - Fetches business agent by businessId
   - Extracts category → industry
   - Extracts first subcategory → subCategory
   - Creates training record with appropriate questions
   - Returns training data + questions

2. **Already Initialized:**
   - Returns existing training record
   - Returns stored questions if available
   - Returns message: "Training already initialized"

3. **Missing Category:**
   - Returns 500 error
   - Message: "Business agent must have a category set"

## Backwards Compatibility

**Breaking Change:** This is a breaking change that requires frontend updates.

**Old endpoints** (POST) are no longer supported. Frontends must update to use the new GET endpoints.

### Deprecation Timeline

1. ✅ **Immediate:** New GET endpoints available
2. ⚠️ **Required:** Frontend must update API calls
3. ❌ **Removed:** Old POST endpoints no longer exist

## Additional Notes

### Category vs Industry Mapping

The `BusinessAIAssistant.category` field directly maps to `BusinessIndustries` enum values:
- "Retail" → Retail
- "Food & Drink" → Food & Drink
- "Health & Beauty" → Health & Beauty
- etc.

### Subcategory Handling

If multiple subcategories exist in the array, only the **first one** is used for training initialization. This is intentional to keep the training focused.

Example:
```javascript
subCategories: ["Clothing & Apparel", "Fashion", "Accessories"]
// Only "Clothing & Apparel" is used for training
```

### Future Improvements

Consider:
1. Allowing users to select which subcategory to focus training on
2. Supporting multi-subcategory training
3. Progressive training enhancement based on all subcategories

## Support

If you encounter issues:
1. Verify business agent exists and has category set
2. Check that businessId is a valid MongoDB ObjectId
3. Ensure x-internal-api-key header is present
4. Review error messages for specific guidance

---

**Questions?** Contact the AI team or check the API documentation.
