# 🧪 Minimal Onboarding Testing Guide

## Quick Test Script

Use this to test the minimal onboarding flow end-to-end.

---

## Prerequisites

1. Server running on `http://localhost:3000` (or your configured port)
2. Valid API key in `X-API-Key` header
3. A valid `businessId` and `assistantId` in the database

---

## Test 1: Initialize Minimal Training (Cafe Example)

### Request
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "industry": "Food & Drink",
    "subCategory": "Cafe/Coffee Shop"
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "training": {
      "trainingPhase": "minimal",
      "learningFromUsage": true,
      "metadata": {
        "totalQuestions": 28,
        "answeredQuestions": 23,
        "completionPercentage": 82
      }
    },
    "questionsForUser": [
      {
        "id": "target_audience",
        "question": "Who is your primary target audience?",
        "type": "multi_select"
      },
      {
        "id": "marketing_goals",
        "question": "What are your primary marketing goals?",
        "type": "multi_select"
      },
      {
        "id": "typical_discount_range",
        "question": "What discount range are you comfortable offering?",
        "type": "multiple_choice"
      }
    ],
    "autoFilledCount": 23
  },
  "message": "Minimal onboarding: 3 questions to answer, 23 auto-filled with smart defaults"
}
```

### Validation
- ✅ `questionsForUser` should have **3-5 questions** (not 25+)
- ✅ `autoFilledCount` should be **20-25**
- ✅ `trainingPhase` should be `"minimal"`
- ✅ `completionPercentage` should be **70-85%** already

---

## Test 2: Submit Essential Answers

### Request
```bash
curl -X POST http://localhost:3000/api/ai/training/submit \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "responses": [
      {
        "questionId": "target_audience",
        "answer": ["Students (18-24)", "Young Professionals (25-34)"]
      },
      {
        "questionId": "marketing_goals",
        "answer": ["Build customer loyalty", "Increase foot traffic"]
      },
      {
        "questionId": "typical_discount_range",
        "answer": "10-20%"
      }
    ]
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "trainingStatus": "completed",
    "metadata": {
      "answeredQuestions": 26,
      "completionPercentage": 93
    }
  },
  "message": "Responses submitted successfully"
}
```

### Validation
- ✅ `completionPercentage` should be **90-100%**
- ✅ Responses added to training record

---

## Test 3: View All Responses (Verify Auto-Fill)

### Request
```bash
curl -X GET http://localhost:3000/api/ai/training/responses/YOUR_BUSINESS_ID \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "questionId": "busiest_hours",
        "answer": ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (2-5 PM)"],
        "isAutoFilled": true,
        "source": "smart_default",
        "answeredAt": "2025-12-01T10:00:00.000Z"
      },
      {
        "questionId": "target_audience",
        "answer": ["Students (18-24)", "Young Professionals (25-34)"],
        "isAutoFilled": false,
        "source": "user",
        "answeredAt": "2025-12-01T10:05:00.000Z"
      },
      {
        "questionId": "business_name",
        "answer": "Joe's Coffee Shop",
        "isAutoFilled": false,
        "source": "user",
        "answeredAt": "2025-12-01T10:00:00.000Z"
      }
    ],
    "metadata": {
      "answeredQuestions": 26,
      "completionPercentage": 93
    },
    "status": "completed"
  }
}
```

### Validation
- ✅ Responses include both `source: "user"` and `source: "smart_default"`
- ✅ Auto-filled responses have `isAutoFilled: true`
- ✅ business_name and business_description pre-filled from registration
- ✅ All cafe-specific defaults applied (busiest_hours, meal_periods, etc.)

---

## Test 4: Complete Training

### Request
```bash
curl -X POST http://localhost:3000/api/ai/training/complete \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID"
  }'
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "message": "Training completed successfully",
    "training": {
      "trainingStatus": "completed",
      "completedAt": "2025-12-01T10:10:00.000Z"
    },
    "assistantId": "asst_abc123"
  },
  "message": "Training completed successfully"
}
```

### Validation
- ✅ `trainingStatus` is `"completed"`
- ✅ `completedAt` timestamp set
- ✅ OpenAI assistant updated with enhanced instructions

---

## Test 5: Compare with Full Onboarding

### Full Onboarding Request
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "DIFFERENT_BUSINESS_ID",
    "industry": "Food & Drink",
    "subCategory": "Cafe/Coffee Shop"
  }'
```

### Expected Comparison

| Metric | Minimal (`/initialize-minimal`) | Full (`/initialize`) |
|--------|--------------------------------|----------------------|
| Questions to answer | 3-5 | 28+ |
| Auto-filled | 23-25 | 0 |
| Initial completion % | 75-85% | 0% |
| trainingPhase | "minimal" | undefined |
| Time to complete | ~2 min | ~15 min |

---

## Test 6: Different Industries

Test minimal onboarding for each industry to verify smart defaults:

### Fitness Center
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "FITNESS_BUSINESS_ID",
    "industry": "Fitness & Wellness",
    "subCategory": "Fitness Center"
  }'
```

**Expected auto-fills:**
- busiest_hours: Early morning, Morning, Evening
- peak_class_times: Early morning (5-7 AM), After work (5-7 PM)
- personal_training: true
- trial_classes: true

### Salon
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "SALON_BUSINESS_ID",
    "industry": "Health & Beauty",
    "subCategory": "Salon"
  }'
```

**Expected auto-fills:**
- busiest_hours: Morning, Afternoon, Evening
- busiest_days: Friday, Saturday
- first_time_specials: true
- product_sales: true

### Restaurant
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "RESTAURANT_BUSINESS_ID",
    "industry": "Food & Drink",
    "subCategory": "Restaurant"
  }'
```

**Expected auto-fills:**
- busiest_hours: Lunch time, Evening
- busiest_days: Friday, Saturday
- meal_periods: Lunch, Dinner
- important_seasons: Valentine's Day, Mother's Day, Christmas

---

## Test 7: Edge Cases

### Test without subcategory
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "industry": "Retail"
  }'
```

**Expected:** Should use industry-level defaults only

### Test with existing training
```bash
# Initialize twice with same businessId
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "EXISTING_BUSINESS_ID",
    "industry": "Food & Drink"
  }'
```

**Expected:** Should return existing training, not create duplicate

### Test invalid industry
```bash
curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "businessId": "YOUR_BUSINESS_ID",
    "industry": "Invalid Industry"
  }'
```

**Expected:** 400 error with validation message

---

## Test 8: Database Verification

Connect to MongoDB and verify the training record:

```javascript
db.ai_trainings.findOne({ businessId: ObjectId("YOUR_BUSINESS_ID") })
```

**Expected fields:**
```json
{
  "trainingPhase": "minimal",
  "learningFromUsage": true,
  "responses": [
    {
      "questionId": "busiest_hours",
      "answer": ["Early morning (6-9 AM)", ...],
      "isAutoFilled": true,
      "source": "smart_default",
      "answeredAt": ISODate("...")
    },
    {
      "questionId": "target_audience",
      "answer": ["Students (18-24)", ...],
      "isAutoFilled": false,
      "source": "user",
      "answeredAt": ISODate("...")
    }
  ],
  "metadata": {
    "totalQuestions": 28,
    "answeredQuestions": 26,
    "completionPercentage": 93
  }
}
```

---

## Performance Tests

### Test 1: Response Time
```bash
time curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{"businessId": "...", "industry": "Food & Drink", "subCategory": "Cafe/Coffee Shop"}'
```

**Target:** < 500ms

### Test 2: Concurrent Requests
```bash
# Run 10 concurrent initializations
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/ai/training/initialize-minimal \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
    -d "{\"businessId\": \"business_$i\", \"industry\": \"Food & Drink\"}" &
done
wait
```

**Target:** All complete successfully without errors

---

## Success Criteria

✅ All tests pass
✅ Question count reduced from 25+ to 3-5
✅ Auto-fill working for all industries
✅ Data source tracking working (user vs smart_default)
✅ Training completes successfully
✅ AI assistant gets updated with enhanced instructions
✅ No regression on full onboarding flow

---

## Debugging Tips

### Enable Verbose Logging
Check server logs for:
```
"Minimal training initialized"
"essentialQuestions": 3
"autoFilled": 23
```

### Check Question IDs
Verify essential question IDs match:
```typescript
['business_name', 'business_description', 'target_audience', 'marketing_goals', 'typical_discount_range']
```

### Verify Smart Defaults Loading
Check that `getSmartDefaults()` returns data:
```bash
# In your backend console
const { getSmartDefaults } = require('./utils/AI_Training_questionnaire.js');
console.log(getSmartDefaults('Food & Drink', 'Cafe/Coffee Shop'));
```

---

**Last Updated:** 2025-12-01
