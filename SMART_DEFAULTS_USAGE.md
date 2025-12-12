# Smart Defaults for AI Training Questionnaire

## Overview

The AI Training Questionnaire now includes intelligent pre-selection of answers based on business category and subcategory. This feature helps businesses complete the questionnaire faster by suggesting relevant answers that match their business type.

## How It Works

### 1. **Multi-Level Defaults**
- **Subcategory-specific defaults**: Precise predictions based on exact business type (e.g., Restaurant, Cafe, Bakery)
- **Industry-level defaults**: Fallback predictions when subcategory isn't specified or found

### 2. **Example: Restaurant with Breakfast Service**

For a restaurant that offers breakfast, the system will automatically suggest:
- **Busiest hours**: "Early morning (6-9 AM)" (pre-selected among other options)
- **Meal periods**: "Breakfast", "Brunch", "Lunch", "Dinner" (pre-selected)
- **All options remain visible**: Users can still see and select other options

## Usage in Your Application

### **Method 1: Get Questions with Smart Defaults (Recommended)**

Use this method to get questions enriched with `suggestedAnswers`:

```typescript
import {
  getQuestionsWithSmartDefaults,
  BusinessIndustries,
  BusinessSubCategory
} from './utils/AI_Training_questionnaire';

// Get questions with smart defaults
const questions = getQuestionsWithSmartDefaults(
  BusinessIndustries.FOOD_DRINK,
  BusinessSubCategory.RESTAURANT
);

// Each question now has a 'suggestedAnswers' field for applicable questions
questions.forEach(question => {
  console.log(question.question);
  console.log('Options:', question.options);
  console.log('Suggested:', question.suggestedAnswers); // Pre-selected values
});
```

**Response Example:**
```typescript
{
  id: "busiest_hours",
  question: "What are your busiest hours during the day?",
  type: "multi_select",
  options: [
    "Early morning (6-9 AM)",
    "Morning (9-12 PM)",
    "Lunch time (12-2 PM)",
    "Afternoon (2-5 PM)",
    "Evening (5-8 PM)",
    "Night (8-11 PM)",
    "Late night (11 PM+)"
  ],
  suggestedAnswers: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"], // ← Pre-selected
  required: true,
  category: "operations"
}
```

### **Method 2: Get Raw Defaults Object**

Use this if you need the defaults in a simple key-value format:

```typescript
import {
  getSmartDefaults,
  BusinessIndustries,
  BusinessSubCategory
} from './utils/AI_Training_questionnaire';

const defaults = getSmartDefaults(
  BusinessIndustries.FOOD_DRINK,
  BusinessSubCategory.CAFE_COFFEE_SHOP
);

console.log(defaults);
```

**Response Example:**
```typescript
{
  busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (2-5 PM)"],
  busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  meal_periods: ["Breakfast", "Brunch", "Lunch", "Afternoon/Tea time"],
  target_audience: ["Students (18-24)", "Young Professionals (25-34)", "All ages"],
  cafe_work_friendly: true,
  cafe_wifi: true,
  // ... more defaults
}
```

### **Method 3: Initialize Responses with Defaults**

Use this to create an initial response object for a new questionnaire:

```typescript
import {
  getInitialResponsesWithDefaults,
  BusinessIndustries,
  BusinessSubCategory
} from './utils/AI_Training_questionnaire';

const initialResponses = getInitialResponsesWithDefaults(
  BusinessIndustries.HEALTH_BEAUTY,
  BusinessSubCategory.SALON
);

// Use this as the initial state for your form
// Users can then modify these pre-filled values
```

## Frontend Integration Examples

### **React Example with Pre-selected Checkboxes**

```typescript
import React, { useState, useEffect } from 'react';
import { getQuestionsWithSmartDefaults, BusinessIndustries, BusinessSubCategory } from './utils/AI_Training_questionnaire';

function QuestionnaireForm({ industry, subCategory }) {
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    const questionsWithDefaults = getQuestionsWithSmartDefaults(industry, subCategory);
    setQuestions(questionsWithDefaults);

    // Initialize responses with suggested answers
    const initialResponses = {};
    questionsWithDefaults.forEach(q => {
      if (q.suggestedAnswers && q.suggestedAnswers.length > 0) {
        initialResponses[q.id] = q.type === 'multi_select'
          ? q.suggestedAnswers
          : q.suggestedAnswers[0];
      }
    });
    setResponses(initialResponses);
  }, [industry, subCategory]);

  const handleMultiSelectChange = (questionId, option) => {
    setResponses(prev => {
      const current = prev[questionId] || [];
      const updated = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  };

  return (
    <div>
      {questions.map(question => {
        if (question.type === 'multi_select') {
          return (
            <div key={question.id}>
              <h3>{question.question}</h3>
              <p className="help-text">
                {question.suggestedAnswers?.length > 0
                  ? '✓ Smart suggestions pre-selected based on your business type'
                  : ''}
              </p>
              {question.options.map(option => {
                const isChecked = responses[question.id]?.includes(option);
                const isSuggested = question.suggestedAnswers?.includes(option);

                return (
                  <label key={option} className={isSuggested ? 'suggested' : ''}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleMultiSelectChange(question.id, option)}
                    />
                    {option}
                    {isSuggested && <span className="badge">Suggested</span>}
                  </label>
                );
              })}
            </div>
          );
        }
        // Handle other question types...
      })}
    </div>
  );
}
```

### **Backend API Integration Example**

```typescript
import { Router } from 'express';
import {
  getQuestionsWithSmartDefaults,
  BusinessIndustries,
  BusinessSubCategory
} from '../utils/AI_Training_questionnaire';

const router = Router();

router.get('/questionnaire/:businessId', async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);

    // Get questions with smart defaults based on business profile
    const questions = getQuestionsWithSmartDefaults(
      business.industry as BusinessIndustries,
      business.subCategory as BusinessSubCategory
    );

    res.json({
      success: true,
      data: {
        questions,
        businessInfo: {
          name: business.name,
          industry: business.industry,
          subCategory: business.subCategory
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
```

## Supported Business Types with Smart Defaults

### Food & Drink
- ✅ Restaurant (breakfast focus → "Early morning" pre-selected)
- ✅ Cafe/Coffee Shop (morning-focused operations)
- ✅ Bakery (early morning peak times)
- ✅ Bar (evening/night focus)
- ✅ Food Truck (lunch & dinner mobility)
- ✅ Catering Services (event-focused)

### Retail
- ✅ Clothing & Apparel (seasonal products)
- ✅ Convenience Store (all-day operations)

### Health & Beauty
- ✅ Salon (appointment-based, weekend-heavy)
- ✅ Spa & Massage (relaxation focus)

### Fitness & Wellness
- ✅ Fitness Center (early morning & evening peaks)
- ✅ Yoga Studio (flexible class times)

### Entertainment
- ✅ Event Planning (weekend-focused)

### Automotive Services
- ✅ Garage (weekday maintenance focus)

### Home Services
- ✅ Home Cleaning (weekday operations)

### Pet Services
- ✅ Pet Grooming (weekend appointments)

### Hospitality
- ✅ Hotel (traveler-focused amenities)

### Professional Services
- ✅ Accounting Consultant (business hours focus)

## Key Benefits

1. **Faster Onboarding**: Pre-selected relevant options reduce form completion time
2. **Better Data Quality**: Intelligent suggestions guide users to accurate answers
3. **User-Friendly**: All options remain visible and editable
4. **Scalable**: Easy to add more business types and refine defaults
5. **Fallback Support**: Industry-level defaults when subcategory is unknown

## Customizing Defaults

To add or modify smart defaults, edit the `smartDefaultsMapping` array in [AI_Training_questionnaire.ts](./src/utils/AI_Training_questionnaire.ts):

```typescript
{
  subcategory: BusinessSubCategory.YOUR_NEW_CATEGORY,
  defaults: {
    busiest_hours: ["Your", "Suggested", "Times"],
    busiest_days: ["Your", "Suggested", "Days"],
    // ... more defaults
  }
}
```

## Notes

- Smart defaults only apply to `multi_select`, `multiple_choice`, and `boolean` question types
- Text and number questions don't receive defaults (require manual input)
- Users can always override suggested answers
- Defaults are based on industry best practices and typical business patterns
