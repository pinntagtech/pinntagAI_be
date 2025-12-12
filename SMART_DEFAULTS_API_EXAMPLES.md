# Smart Defaults API Examples

## Overview

The AI Training system now includes intelligent pre-selection of questionnaire answers based on business category and subcategory. This document provides API examples for using the smart defaults feature.

## New Endpoint

### GET `/ai/training/questions-with-defaults`

Gets training questions with smart defaults pre-selected based on business type.

**Query Parameters:**
- `industry` (required): The business industry
- `subCategory` (optional): The business subcategory for more precise defaults

**Example Request:**
```bash
GET /ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Restaurant
Authorization: Bearer YOUR_API_KEY
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "allQuestions": [
      {
        "id": "busiest_hours",
        "question": "What are your busiest hours during the day?",
        "type": "multi_select",
        "options": [
          "Early morning (6-9 AM)",
          "Morning (9-12 PM)",
          "Lunch time (12-2 PM)",
          "Afternoon (2-5 PM)",
          "Evening (5-8 PM)",
          "Night (8-11 PM)",
          "Late night (11 PM+)"
        ],
        "suggestedAnswers": ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
        "required": true,
        "category": "operations"
      },
      {
        "id": "meal_periods",
        "question": "Which meal periods do you serve?",
        "type": "multi_select",
        "options": [
          "Breakfast",
          "Brunch",
          "Lunch",
          "Afternoon/Tea time",
          "Dinner",
          "Late night"
        ],
        "suggestedAnswers": ["Lunch", "Dinner"],
        "required": true,
        "category": "operations"
      }
    ],
    "smartDefaults": {
      "busiest_hours": ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      "busiest_days": ["Friday", "Saturday"],
      "meal_periods": ["Lunch", "Dinner"],
      "target_audience": ["Families with children", "Young Professionals (25-34)"],
      "marketing_goals": ["Increase foot traffic", "Attract new customers"]
    },
    "totalCount": 45,
    "requiredCount": 25,
    "hasDefaults": true,
    "defaultsInfo": {
      "subcategory": "Restaurant",
      "defaultsApplied": 12,
      "message": "Smart defaults have been pre-selected based on your business type. You can modify any selections."
    }
  }
}
```

## Usage Examples

### 1. Restaurant Offering Breakfast

**Request:**
```bash
GET /ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Restaurant
```

**Smart Defaults Applied:**
- `busiest_hours`: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"]
- `meal_periods`: ["Lunch", "Dinner"]
- If your restaurant serves breakfast, you can add "Early morning (6-9 AM)" and "Breakfast"

### 2. Cafe/Coffee Shop

**Request:**
```bash
GET /ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Cafe/Coffee%20Shop
```

**Smart Defaults Applied:**
- `busiest_hours`: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (2-5 PM)"]
- `meal_periods`: ["Breakfast", "Brunch", "Lunch", "Afternoon/Tea time"]
- `cafe_work_friendly`: true
- `cafe_wifi`: true

### 3. Fitness Center

**Request:**
```bash
GET /ai/training/questions-with-defaults?industry=Fitness%20%26%20Wellness&subCategory=Fitness%20Center
```

**Smart Defaults Applied:**
- `busiest_hours`: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Evening (5-8 PM)"]
- `peak_class_times`: ["Early morning (5-7 AM)", "After work (5-7 PM)"]
- `personal_training`: true
- `trial_classes`: true

### 4. Salon

**Request:**
```bash
GET /ai/training/questions-with-defaults?industry=Health%20%26%20Beauty&subCategory=Salon
```

**Smart Defaults Applied:**
- `busiest_hours`: ["Morning (9-12 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"]
- `busiest_days`: ["Friday", "Saturday"]
- `booking_system`: ["Online booking", "Phone only"]
- `first_time_specials`: true
- `product_sales`: true

## Complete Workflow Example

### Step 1: Get Questions with Smart Defaults

```javascript
// Frontend code
const fetchQuestionsWithDefaults = async (industry, subCategory) => {
  const response = await fetch(
    `/ai/training/questions-with-defaults?industry=${encodeURIComponent(industry)}&subCategory=${encodeURIComponent(subCategory)}`,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    }
  );

  const result = await response.json();
  return result.data;
};

// Example usage
const data = await fetchQuestionsWithDefaults('Food & Drink', 'Restaurant');
console.log(data.defaultsInfo.message); // Shows info about applied defaults
```

### Step 2: Initialize Form with Defaults

```javascript
// React example
const [responses, setResponses] = useState({});

useEffect(() => {
  // Pre-fill form with smart defaults
  const initialResponses = {};

  data.allQuestions.forEach(question => {
    if (question.suggestedAnswers && question.suggestedAnswers.length > 0) {
      if (question.type === 'multi_select') {
        initialResponses[question.id] = question.suggestedAnswers;
      } else if (question.type === 'multiple_choice') {
        initialResponses[question.id] = question.suggestedAnswers[0];
      } else if (question.type === 'boolean') {
        initialResponses[question.id] = question.suggestedAnswers[0] === 'true';
      }
    }
  });

  setResponses(initialResponses);
}, [data]);
```

### Step 3: Display with Visual Indicators

```javascript
// React component example
const QuestionItem = ({ question, value, onChange }) => {
  if (question.type === 'multi_select') {
    return (
      <div className="question">
        <h3>{question.question}</h3>
        {question.helpText && <p className="help-text">{question.helpText}</p>}

        <div className="options">
          {question.options.map(option => {
            const isChecked = value?.includes(option);
            const isSuggested = question.suggestedAnswers?.includes(option);

            return (
              <label
                key={option}
                className={`option ${isSuggested ? 'suggested' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onChange(option)}
                />
                <span>{option}</span>
                {isSuggested && (
                  <span className="badge">✓ Suggested</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    );
  }
  // ... handle other question types
};
```

### Step 4: Submit Responses

```javascript
const submitResponses = async (businessId, responses) => {
  const formattedResponses = Object.entries(responses).map(([questionId, answer]) => ({
    questionId,
    answer
  }));

  const response = await fetch('/ai/training/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      businessId,
      responses: formattedResponses
    })
  });

  return response.json();
};
```

## Supported Business Types

### Food & Drink
- **Restaurant**: Lunch/dinner focus, family-friendly
- **Cafe/Coffee Shop**: Morning operations, work-friendly
- **Bakery**: Early morning, special orders
- **Bar**: Evening/night operations, happy hour
- **Food Truck**: Lunch/dinner mobility
- **Catering**: Event-focused, weekends

### Retail
- **Clothing & Apparel**: Seasonal products, weekend traffic
- **Convenience Store**: All-day operations, quick service

### Health & Beauty
- **Salon**: Weekend appointments, product sales
- **Spa & Massage**: Relaxation focus, premium services

### Fitness & Wellness
- **Fitness Center**: Early/evening peaks, trial classes
- **Yoga Studio**: Flexible hours, all levels

### Other Industries
- Entertainment (Event Planning)
- Automotive (Garage)
- Home Services (Cleaning)
- Pet Services (Grooming)
- Hospitality (Hotel)
- Professional Services (Accounting)

## Benefits

1. **Faster Completion**: Pre-selected relevant options reduce time to complete questionnaire
2. **Better Accuracy**: Industry-specific defaults guide users to appropriate answers
3. **User-Friendly**: All options remain visible and modifiable
4. **Smart Predictions**: Based on industry best practices and typical patterns
5. **Progressive Enhancement**: Falls back gracefully if no defaults available

## Fallback Behavior

If no subcategory is provided, or if the subcategory doesn't have specific defaults:
- Industry-level defaults are applied
- Core questions still receive general defaults
- Users can still complete questionnaire normally

**Example with Industry Only:**
```bash
GET /ai/training/questions-with-defaults?industry=Food%20%26%20Drink
# Returns general Food & Drink defaults without subcategory specifics
```

## Testing with cURL

```bash
# Test Restaurant defaults
curl -X GET "http://localhost:3000/ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Restaurant" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test Cafe defaults
curl -X GET "http://localhost:3000/ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Cafe/Coffee%20Shop" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test with industry only (fallback)
curl -X GET "http://localhost:3000/ai/training/questions-with-defaults?industry=Health%20%26%20Beauty" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Notes

- Smart defaults only apply to `multi_select`, `multiple_choice`, and `boolean` questions
- Text and number questions require manual input
- Users can always override or modify suggested answers
- The `suggestedAnswers` field indicates which options should be pre-selected in the UI
