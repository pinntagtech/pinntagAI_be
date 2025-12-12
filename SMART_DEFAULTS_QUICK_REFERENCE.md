# Smart Defaults Quick Reference

## What It Does

Pre-selects relevant questionnaire options based on business type. For example:
- **Restaurant offering breakfast** → "Early morning (6-9 AM)" is pre-selected in busiest hours
- **Cafe** → Morning hours + work-friendly options pre-selected
- **Bar** → Evening/night hours + happy hour interest pre-selected

## Quick Start

### API Endpoint
```
GET /ai/training/questions-with-defaults
```

### Parameters
- `industry` (required): e.g., "Food & Drink", "Retail", "Health & Beauty"
- `subCategory` (optional): e.g., "Restaurant", "Cafe/Coffee Shop", "Salon"

### Example Usage

```javascript
// Fetch questions with smart defaults
const response = await fetch(
  '/ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Restaurant'
);
const { data } = await response.json();

// Each question has:
// - options: all available choices
// - suggestedAnswers: pre-selected values based on business type
```

## Key Features

| Feature | Description |
|---------|-------------|
| **Pre-selection** | Relevant options automatically checked based on business type |
| **All Options Visible** | Users can see and select any option, not just suggestions |
| **Modifiable** | Users can change any pre-selected option |
| **Visual Indicators** | Frontend can show which options are suggested |
| **Fallback** | Works with or without subcategory |

## Response Structure

```typescript
{
  allQuestions: [
    {
      id: "busiest_hours",
      question: "What are your busiest hours?",
      type: "multi_select",
      options: ["Early morning", "Morning", "Lunch", "Afternoon", "Evening"],
      suggestedAnswers: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"], // ← Pre-selected
      required: true,
      category: "operations"
    }
  ],
  smartDefaults: {
    busiest_hours: ["Lunch time", "Evening"],
    meal_periods: ["Lunch", "Dinner"]
    // ... more defaults
  },
  defaultsInfo: {
    subcategory: "Restaurant",
    defaultsApplied: 12,
    message: "Smart defaults pre-selected"
  }
}
```

## Common Business Types & Their Defaults

### Restaurant
- **Busiest hours**: Lunch, Evening
- **Meal periods**: Lunch, Dinner
- **Target audience**: Families, Professionals

### Cafe/Coffee Shop
- **Busiest hours**: Early morning, Morning
- **Meal periods**: Breakfast, Brunch, Lunch
- **Features**: Work-friendly, WiFi

### Bakery
- **Busiest hours**: Early morning, Morning
- **Meal periods**: Breakfast, Brunch
- **Special**: Custom orders enabled

### Bar
- **Busiest hours**: Evening, Night, Late night
- **Days**: Thursday, Friday, Saturday
- **Features**: Happy hour interest

### Fitness Center
- **Busiest hours**: Early morning, Evening
- **Days**: Mon-Thu
- **Features**: Trial classes, Personal training

### Salon
- **Busiest hours**: Morning, Afternoon, Evening
- **Days**: Friday, Saturday
- **Features**: First-time specials, Product sales

## Implementation Tips

### 1. Initialize Form State
```javascript
const initializeWithDefaults = (questions) => {
  const initial = {};
  questions.forEach(q => {
    if (q.suggestedAnswers?.length > 0) {
      initial[q.id] = q.type === 'multi_select'
        ? q.suggestedAnswers
        : q.suggestedAnswers[0];
    }
  });
  return initial;
};
```

### 2. Visual Feedback
```jsx
{isSuggested && <span className="badge">✓ Suggested for your business type</span>}
```

### 3. Allow Override
```javascript
// User can uncheck suggested items or add new ones
const handleToggle = (option) => {
  const updated = value.includes(option)
    ? value.filter(v => v !== option)  // Remove
    : [...value, option];              // Add
  onChange(updated);
};
```

## Code Functions Available

| Function | Purpose |
|----------|---------|
| `getQuestionsWithSmartDefaults()` | Get questions enriched with `suggestedAnswers` |
| `getSmartDefaults()` | Get raw defaults as key-value pairs |
| `getInitialResponsesWithDefaults()` | Get initial form state with defaults |

## When to Use

✅ **Use smart defaults when:**
- Initializing new questionnaire
- Business category/subcategory is known
- Want to speed up form completion

❌ **Don't use when:**
- Editing existing responses (use actual saved responses)
- Business type is unknown or generic
- Testing full questionnaire flow

## Customization

To add new business types or modify defaults, edit the `smartDefaultsMapping` array in:
```
src/utils/AI_Training_questionnaire.ts
```

Example:
```typescript
{
  subcategory: BusinessSubCategory.YOUR_TYPE,
  defaults: {
    busiest_hours: ["Your", "Peak", "Times"],
    busiest_days: ["Your", "Peak", "Days"],
    // ... more defaults
  }
}
```

## Testing

```bash
# Test with subcategory (best results)
curl "http://localhost:3000/ai/training/questions-with-defaults?industry=Food%20%26%20Drink&subCategory=Restaurant"

# Test without subcategory (industry defaults)
curl "http://localhost:3000/ai/training/questions-with-defaults?industry=Food%20%26%20Drink"
```

## Support

- 📄 Detailed Guide: [SMART_DEFAULTS_USAGE.md](./SMART_DEFAULTS_USAGE.md)
- 📝 API Examples: [SMART_DEFAULTS_API_EXAMPLES.md](./SMART_DEFAULTS_API_EXAMPLES.md)
- 💻 Code: [AI_Training_questionnaire.ts](./src/utils/AI_Training_questionnaire.ts)
