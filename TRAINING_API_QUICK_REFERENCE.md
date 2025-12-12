# Training API - Quick Reference

## 🚀 New API Usage (After Refactor)

### Initialize Full Training
```bash
GET /ai/training/initialize/:businessId
```

**Example:**
```bash
curl -X GET https://ai.pinntag.com/ai/training/initialize/68a18c1153c962c7450afed8 \
  -H "x-internal-api-key: change-me"
```

### Initialize Minimal Training (Recommended)
```bash
GET /ai/training/initialize-minimal/:businessId
```

**Example:**
```bash
curl -X GET https://ai.pinntag.com/ai/training/initialize-minimal/68a18c1153c962c7450afed8 \
  -H "x-internal-api-key: change-me"
```

---

## ❌ Old API (Deprecated - Do Not Use)

~~POST /ai/training/initialize~~
~~POST /ai/training/initialize-minimal~~

---

## 📋 Complete Training Flow

### Step 1: Initialize Training
```bash
# Choose one:
GET /ai/training/initialize/:businessId              # Full (25-30 questions)
GET /ai/training/initialize-minimal/:businessId      # Minimal (3-5 questions)
```

### Step 2: Submit Responses
```bash
POST /ai/training/submit
Body: {
  "businessId": "68a18c1153c962c7450afed8",
  "responses": [
    {
      "questionId": "target_audience",
      "answer": ["Young Adults", "Professionals"]
    },
    {
      "questionId": "typical_discount_range",
      "answer": "10-20%"
    }
  ]
}
```

### Step 3: Complete Training
```bash
POST /ai/training/complete
Body: {
  "businessId": "68a18c1153c962c7450afed8"
}
```

---

## 🔍 Query Training Status

### Get Training Status
```bash
GET /ai/training/status/:businessId
```

**Example:**
```bash
curl https://ai.pinntag.com/ai/training/status/68a18c1153c962c7450afed8 \
  -H "x-internal-api-key: change-me"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "status": "in_progress",
    "metadata": {
      "totalQuestions": 25,
      "answeredQuestions": 5,
      "requiredQuestions": 10,
      "completionPercentage": 20
    },
    "totalQuestions": 25,
    "answeredQuestions": 5
  }
}
```

### Get Training Responses
```bash
GET /ai/training/responses/:businessId
```

---

## 📚 Get Questions

### Get All Questions (No Defaults)
```bash
GET /ai/training/questions?industry=Retail&subCategory=Clothing%20%26%20Apparel
```

### Get Questions with Smart Defaults
```bash
GET /ai/training/questions-with-defaults?industry=Retail&subCategory=Clothing%20%26%20Apparel
```

---

## 🔄 Reset Training

```bash
POST /ai/training/reset
Body: {
  "businessId": "68a18c1153c962c7450afed8"
}
```

---

## 🎯 Key Differences: Full vs Minimal

| Feature | Full Training | Minimal Training |
|---------|--------------|------------------|
| **Questions** | 25-30 questions | 3-5 essential questions |
| **Time** | 10-15 minutes | 2-3 minutes |
| **Auto-filled** | None | 20+ questions |
| **Accuracy** | High | Good (smart defaults) |
| **Best For** | Detailed customization | Quick onboarding |
| **Endpoint** | `/initialize/:businessId` | `/initialize-minimal/:businessId` |

---

## ✅ Response Formats

### Successful Initialization
```json
{
  "success": true,
  "data": {
    "_id": "training_id",
    "businessId": "68a18c1153c962c7450afed8",
    "industry": "Retail",
    "subCategory": "Clothing & Apparel",
    "trainingStatus": "not_started",
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

### Minimal Training Response
```json
{
  "success": true,
  "data": {
    "training": {...},
    "questionsForUser": [
      {
        "id": "target_audience",
        "type": "multiselect",
        "question": "Who is your primary target audience?",
        "options": ["Young Adults", "Families", "Seniors", "Professionals"]
      }
    ],
    "autoFilledCount": 20
  },
  "message": "Minimal onboarding: 5 questions to answer, 20 auto-filled with smart defaults"
}
```

### Already Initialized
```json
{
  "success": true,
  "data": {...},
  "questions": [...],
  "message": "Training already initialized"
}
```

---

## ⚠️ Error Responses

### Business Not Found
```json
{
  "success": false,
  "error": "No AI agent found for business ID: 68a18c1153c962c7450afed8"
}
```

### Missing Category
```json
{
  "success": false,
  "error": "Business agent must have a category set"
}
```

### Invalid Business ID
```json
{
  "success": false,
  "error": "Invalid Business ID format"
}
```

### Training Incomplete (on complete)
```json
{
  "success": false,
  "error": "Training incomplete. Missing required questions: target_audience, brand_voice"
}
```

---

## 💡 Best Practices

### 1. Use Minimal Training for Better UX
```javascript
// Recommended for new users
const response = await fetch(
  `https://ai.pinntag.com/ai/training/initialize-minimal/${businessId}`,
  {
    headers: { 'x-internal-api-key': 'your-key' }
  }
);
```

### 2. Check Status Before Initializing
```javascript
// Avoid duplicate initialization
const status = await getTrainingStatus(businessId);
if (!status.exists) {
  await initializeMinimalTraining(businessId);
}
```

### 3. Submit Responses in Batches
```javascript
// Better performance
await submitResponses(businessId, [
  { questionId: 'q1', answer: 'answer1' },
  { questionId: 'q2', answer: 'answer2' },
  { questionId: 'q3', answer: 'answer3' },
]);
```

### 4. Complete Training Only When Ready
```javascript
// Check completion percentage first
const status = await getTrainingStatus(businessId);
if (status.metadata.completionPercentage === 100) {
  await completeTraining(businessId);
}
```

---

## 🔗 Frontend Integration Examples

### React/Next.js
```typescript
// lib/training.ts
export async function initializeTraining(businessId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API}/ai/training/initialize-minimal/${businessId}`,
    {
      headers: {
        'x-internal-api-key': process.env.AI_INTERNAL_API_KEY!
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to initialize training');
  }

  return response.json();
}

export async function submitResponses(
  businessId: string,
  responses: Array<{ questionId: string; answer: any }>
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_AI_API}/ai/training/submit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.AI_INTERNAL_API_KEY!
      },
      body: JSON.stringify({ businessId, responses })
    }
  );

  return response.json();
}
```

### Vue/Nuxt
```typescript
// composables/useTraining.ts
export const useTraining = () => {
  const config = useRuntimeConfig();

  const initializeMinimalTraining = async (businessId: string) => {
    return await $fetch(
      `/ai/training/initialize-minimal/${businessId}`,
      {
        baseURL: config.public.aiApiUrl,
        headers: {
          'x-internal-api-key': config.aiInternalApiKey
        }
      }
    );
  };

  return {
    initializeMinimalTraining,
    // ...other methods
  };
};
```

---

## 📊 Training Status Values

| Status | Description |
|--------|-------------|
| `not_started` | Training initialized but no responses submitted |
| `in_progress` | Some responses submitted, not complete |
| `completed` | All required questions answered, training complete |

---

## 🎨 Training Phases

| Phase | Description | Questions |
|-------|-------------|-----------|
| `minimal` | Quick onboarding with smart defaults | 3-5 essential |
| `progressive` | Gradual expansion of training | Variable |
| `complete` | Full questionnaire answered | 25-30 total |

---

**Need help?** Check [TRAINING_INITIALIZE_REFACTOR.md](TRAINING_INITIALIZE_REFACTOR.md) for detailed documentation.
