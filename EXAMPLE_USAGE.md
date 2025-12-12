# AI Training System - Example Usage

## Quick Start Example

This guide shows how to train an AI agent for a restaurant business step by step.

## Scenario

**Business**: Joe's Pizza
**Industry**: Food & Drink
**Sub-Category**: Restaurant
**Business ID**: `507f1f77bcf86cd799439011` (example MongoDB ObjectId)

---

## Step 1: Initialize Training

After a business creates their AI agent, initialize the training:

```bash
curl -X POST http://localhost:3000/api/ai/training/initialize \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "industry": "Food & Drink",
    "subCategory": "Restaurant"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "businessId": "507f1f77bcf86cd799439011",
    "assistantId": "asst_abc123",
    "industry": "Food & Drink",
    "subCategory": "Restaurant",
    "responses": [],
    "trainingStatus": "not_started",
    "metadata": {
      "totalQuestions": 35,
      "answeredQuestions": 0,
      "requiredQuestions": 25,
      "completionPercentage": 0
    }
  }
}
```

---

## Step 2: Get Training Questions

Fetch all questions for the restaurant:

```bash
curl -X GET "http://localhost:3000/api/ai/training/questions?industry=Food%20%26%20Drink&subCategory=Restaurant" \
  -H "X-Internal-API-Key: your-internal-api-key"
```

**Response** (abbreviated):
```json
{
  "success": true,
  "data": {
    "allQuestions": [
      {
        "id": "business_name",
        "question": "What is your business name?",
        "type": "text",
        "required": true,
        "category": "business_info"
      },
      {
        "id": "business_description",
        "question": "Provide a brief description of your business...",
        "type": "text",
        "required": true,
        "category": "business_info"
      },
      // ... more questions
    ],
    "totalCount": 35,
    "requiredCount": 25
  }
}
```

---

## Step 3: Submit Core Business Information

```bash
curl -X POST http://localhost:3000/api/ai/training/submit \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "responses": [
      {
        "questionId": "business_name",
        "answer": "Joe'\''s Pizza"
      },
      {
        "questionId": "business_description",
        "answer": "Authentic New York-style pizza made with fresh ingredients daily. Family-owned since 2015, we pride ourselves on quality and community."
      },
      {
        "questionId": "target_audience",
        "answer": ["Young Professionals (25-34)", "Families with children"]
      },
      {
        "questionId": "customer_income_level",
        "answer": "Mid-range"
      },
      {
        "questionId": "operating_hours",
        "answer": "Mon-Thu 11AM-10PM, Fri-Sat 11AM-11PM, Sun 12PM-9PM"
      },
      {
        "questionId": "busiest_days",
        "answer": ["Friday", "Saturday", "Sunday"]
      },
      {
        "questionId": "busiest_hours",
        "answer": ["Lunch time (12-2 PM)", "Evening (5-8 PM)"]
      },
      {
        "questionId": "slow_periods",
        "answer": ["Monday mornings", "Weekday afternoons"]
      },
      {
        "questionId": "typical_discount_range",
        "answer": "10-20%"
      },
      {
        "questionId": "marketing_goals",
        "answer": [
          "Boost sales during slow periods",
          "Build customer loyalty",
          "Increase social media engagement"
        ]
      },
      {
        "questionId": "seasonal_relevance",
        "answer": true
      },
      {
        "questionId": "important_seasons",
        "answer": [
          "Summer",
          "Back to School",
          "Thanksgiving",
          "Christmas/Holiday Season"
        ]
      },
      {
        "questionId": "brand_voice",
        "answer": ["Friendly and casual", "Fun and playful"]
      },
      {
        "questionId": "previous_successful_promotions",
        "answer": "Two-for-Tuesday deal brought in 40% more customers. Family meal bundles work well on Sundays."
      }
    ]
  }'
```

---

## Step 4: Submit Food & Drink Specific Information

```bash
curl -X POST http://localhost:3000/api/ai/training/submit \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "responses": [
      {
        "questionId": "cuisine_type",
        "answer": "Italian, New York-style pizza"
      },
      {
        "questionId": "dining_style",
        "answer": "Fast casual"
      },
      {
        "questionId": "menu_highlights",
        "answer": "Classic Margherita, Pepperoni Deluxe, White Pizza, Buffalo Chicken, BBQ Chicken"
      },
      {
        "questionId": "dietary_options",
        "answer": ["Vegetarian", "Vegan", "Gluten-free"]
      },
      {
        "questionId": "average_check_size",
        "answer": "$20-$35"
      },
      {
        "questionId": "meal_periods",
        "answer": ["Lunch", "Dinner", "Late night"]
      },
      {
        "questionId": "drink_program",
        "answer": "Beer and wine"
      },
      {
        "questionId": "customer_visit_frequency",
        "answer": "Weekly"
      },
      {
        "questionId": "inventory_to_promote",
        "answer": "We often have excess dough on Mondays that needs to be used"
      },
      {
        "questionId": "happy_hour_interest",
        "answer": true
      }
    ]
  }'
```

---

## Step 5: Check Training Status

```bash
curl -X GET http://localhost:3000/api/ai/training/status/507f1f77bcf86cd799439011 \
  -H "X-Internal-API-Key: your-internal-api-key"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "exists": true,
    "status": "in_progress",
    "metadata": {
      "totalQuestions": 35,
      "answeredQuestions": 24,
      "requiredQuestions": 25,
      "completionPercentage": 69
    },
    "totalQuestions": 35,
    "answeredQuestions": 24
  }
}
```

---

## Step 6: Complete Remaining Required Questions

```bash
curl -X POST http://localhost:3000/api/ai/training/submit \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "responses": [
      {
        "questionId": "competitor_awareness",
        "answer": "Local competitors offer 25% off deals regularly. Domino'\''s runs frequent promotions."
      }
    ]
  }'
```

---

## Step 7: Complete Training

Once all required questions are answered:

```bash
curl -X POST http://localhost:3000/api/ai/training/complete \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Training completed successfully",
    "training": {
      "_id": "...",
      "businessId": "507f1f77bcf86cd799439011",
      "trainingStatus": "completed",
      "completedAt": "2025-11-10T15:30:00.000Z"
    },
    "assistantId": "asst_abc123"
  },
  "message": "Training completed successfully"
}
```

---

## Step 8: Use the Trained AI Agent

Now when you ask the AI for suggestions, it provides personalized recommendations:

```bash
curl -X POST http://localhost:3000/api/ai/ask-business \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "message": "What deal should I run this Monday to boost traffic?"
  }'
```

**AI Response** (example):
```
Based on your business data, Monday is one of your slowest days. Here's my recommendation:

**"Monday Madness Deal"**
- **Offer**: 15% off all orders or BOGO on medium pizzas
- **Target Time**: 12PM-3PM and 5PM-8PM
- **Reason**: This targets your slow afternoon and early evening periods
- **Additional Benefit**: You mentioned having excess dough on Mondays - this helps move inventory

**Marketing Tips**:
1. Promote on social media Sunday evening with a fun, casual tone
2. Use hashtags like #MondayMotivation #PizzaMonday
3. Emphasize "Beat the Rush" - no wait times on Mondays
4. Consider email blast to your loyalty customers Sunday night

**Expected Impact**: Based on your past "Two-for-Tuesday" success (40% increase), a Monday deal could bring 30-35% more traffic during typically slow hours.

Would you like me to draft social media posts for this promotion?
```

---

## Example: Ask for Holiday Deal Suggestions

```bash
curl -X POST http://localhost:3000/api/ai/ask-business \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011",
    "message": "Thanksgiving is coming up. What should I do?"
  }'
```

**AI Response** (example):
```
Thanksgiving is one of your key seasons! Here are my recommendations:

**1. "Thanksgiving Eve Special" (Wed, Nov 22)**
- Offer: Family meal bundles at 15% off
- Why: People want easy dinner before cooking marathon
- Bundle: 2 large pizzas + wings + salad = $45 (usually $52)

**2. "Pre-Game Pizza Deal" (Thanksgiving Day, 12-4PM)**
- Offer: "Fuel the Cooks" - 20% off for families cooking at home
- Why: Target your lunch period, people want something quick

**3. "Black Friday Late Night" (11PM-close)**
- Offer: "Shopping Survivor Special" - $5 off orders over $30
- Why: Capture the post-shopping crowd, fills your late-night slot

**Marketing Strategy**:
- Start promoting 2 weeks out (Nov 8)
- Highlight your family-friendly vibe and casual tone
- Use Instagram stories showing family meal setups
- Partner with local food bloggers for exposure

**Target Audience**: Perfect for your young professional and family demographics who want convenience during the holiday rush.

Would you like me to create social media content for these promotions?
```

---

## Additional Capabilities

### View All Responses
```bash
curl -X GET http://localhost:3000/api/ai/training/responses/507f1f77bcf86cd799439011 \
  -H "X-Internal-API-Key: your-internal-api-key"
```

### Reset Training (if needed)
```bash
curl -X POST http://localhost:3000/api/ai/training/reset \
  -H "Content-Type: application/json" \
  -H "X-Internal-API-Key: your-internal-api-key" \
  -d '{
    "businessId": "507f1f77bcf86cd799439011"
  }'
```

---

## Frontend Integration Example (React)

```typescript
import { useState } from 'react';

function TrainingWizard({ businessId, industry, subCategory }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [questions, setQuestions] = useState([]);

  // Initialize training
  useEffect(() => {
    fetch('/api/ai/training/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': API_KEY
      },
      body: JSON.stringify({ businessId, industry, subCategory })
    }).then(res => res.json())
      .then(data => {
        // Fetch questions
        return fetch(`/api/ai/training/questions?industry=${industry}`);
      }).then(res => res.json())
      .then(data => setQuestions(data.data.allQuestions));
  }, []);

  // Submit responses
  const submitResponses = async () => {
    const responseArray = Object.entries(responses).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    await fetch('/api/ai/training/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': API_KEY
      },
      body: JSON.stringify({
        businessId,
        responses: responseArray
      })
    });
  };

  // Complete training
  const completeTraining = async () => {
    await fetch('/api/ai/training/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': API_KEY
      },
      body: JSON.stringify({ businessId })
    });
  };

  // Render questions...
}
```

---

## Benefits of Trained AI

After training, the AI agent can:

1. ✅ **Suggest deals** optimized for slow periods
2. ✅ **Recommend discounts** within your comfort range
3. ✅ **Create holiday promotions** for your key seasons
4. ✅ **Target specific audiences** based on demographics
5. ✅ **Match your brand voice** in all communications
6. ✅ **Build on past successes** from your promotion history
7. ✅ **Provide timing recommendations** based on busy/slow hours
8. ✅ **Offer industry-specific advice** (e.g., menu highlights for restaurants)

---

## Next Steps

1. Integrate the training wizard into your business onboarding flow
2. Track which AI recommendations drive the most revenue
3. Encourage businesses to update their training as they grow
4. Analyze training completion rates to optimize the question set

For more information, see [AI_TRAINING_GUIDE.md](./AI_TRAINING_GUIDE.md)
