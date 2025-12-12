# AI Training System Guide

## Overview

The AI Training System allows businesses to train their AI agents with industry-specific information to provide personalized marketing recommendations, deal suggestions, and content strategies. The system collects comprehensive data about the business operations, customer demographics, and marketing goals to create a highly tailored AI assistant.

## Key Features

- **Industry-Specific Questionnaires**: Different questions for each of the 10 business industries
- **Progressive Training**: Submit responses incrementally or all at once
- **AI Enhancement**: Automatically updates the AI assistant with enhanced instructions based on training data
- **Training Status Tracking**: Monitor completion progress and see which questions remain
- **Re-training Support**: Reset and re-train the AI agent as business needs evolve

## Supported Industries

1. **Food & Drink** - Restaurants, Cafes, Bakeries, Bars, etc.
2. **Retail** - Clothing, Electronics, Gift Shops, etc.
3. **Health & Beauty** - Salons, Spas, Skincare, etc.
4. **Fitness & Wellness** - Gyms, Yoga Studios, Personal Training, etc.
5. **Entertainment** - Event Planning, Amusement Centers, Photography, etc.
6. **Automotive Services** - Garages, Detailing, Auto Accessories, etc.
7. **Home Services** - Cleaning, Electrical, Plumbing, etc.
8. **Pet Services** - Grooming, Veterinary, Pet Boarding, etc.
9. **Hospitality** - Hotels, B&Bs, Vacation Rentals, etc.
10. **Professional Services** - Accounting, Legal, Consulting, etc.

## API Endpoints

### 1. Initialize Training

**Endpoint**: `POST /api/ai/training/initialize`

**Purpose**: Create a new training record for a business

**Request Body**:
```json
{
  "businessId": "507f1f77bcf86cd799439011",
  "industry": "Food & Drink",
  "subCategory": "Restaurant"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "businessId": "507f1f77bcf86cd799439011",
    "assistantId": "asst_...",
    "industry": "Food & Drink",
    "subCategory": "Restaurant",
    "responses": [],
    "trainingStatus": "not_started",
    "metadata": {
      "totalQuestions": 45,
      "answeredQuestions": 0,
      "requiredQuestions": 30,
      "completionPercentage": 0
    }
  },
  "message": "Training initialized successfully"
}
```

### 2. Get Training Questions

**Endpoint**: `GET /api/ai/training/questions?industry=Food & Drink&subCategory=Restaurant`

**Purpose**: Retrieve all training questions for a specific industry

**Response**:
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
        "category": "business_info",
        "helpText": "..."
      }
      // ... more questions
    ],
    "requiredQuestions": [...],
    "totalCount": 45,
    "requiredCount": 30
  }
}
```

### 3. Submit Training Responses

**Endpoint**: `POST /api/ai/training/submit`

**Purpose**: Submit answers to training questions

**Request Body**:
```json
{
  "businessId": "507f1f77bcf86cd799439011",
  "responses": [
    {
      "questionId": "business_name",
      "answer": "Joe's Pizza"
    },
    {
      "questionId": "target_audience",
      "answer": ["Young Professionals (25-34)", "Families with children"]
    },
    {
      "questionId": "typical_discount_range",
      "answer": "10-20%"
    },
    {
      "questionId": "busiest_days",
      "answer": ["Friday", "Saturday", "Sunday"]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "businessId": "507f1f77bcf86cd799439011",
    "responses": [...],
    "trainingStatus": "in_progress",
    "metadata": {
      "totalQuestions": 45,
      "answeredQuestions": 4,
      "requiredQuestions": 30,
      "completionPercentage": 9
    }
  },
  "message": "Responses submitted successfully"
}
```

### 4. Get Training Status

**Endpoint**: `GET /api/ai/training/status/:businessId`

**Purpose**: Check the current training status and progress

**Response**:
```json
{
  "success": true,
  "data": {
    "exists": true,
    "status": "in_progress",
    "metadata": {
      "totalQuestions": 45,
      "answeredQuestions": 25,
      "requiredQuestions": 30,
      "completionPercentage": 56
    },
    "completedAt": null,
    "totalQuestions": 45,
    "answeredQuestions": 25
  }
}
```

### 5. Get Training Responses

**Endpoint**: `GET /api/ai/training/responses/:businessId`

**Purpose**: Retrieve all submitted responses for a business

**Response**:
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "questionId": "business_name",
        "answer": "Joe's Pizza",
        "answeredAt": "2025-11-10T10:30:00.000Z"
      }
      // ... more responses
    ],
    "metadata": {...},
    "status": "in_progress"
  }
}
```

### 6. Complete Training

**Endpoint**: `POST /api/ai/training/complete`

**Purpose**: Finalize training and update the AI assistant with enhanced instructions

**Request Body**:
```json
{
  "businessId": "507f1f77bcf86cd799439011"
}
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
      "completedAt": "2025-11-10T15:45:00.000Z"
    },
    "assistantId": "asst_..."
  },
  "message": "Training completed successfully"
}
```

**Note**: This endpoint validates that all required questions are answered before completing the training.

### 7. Reset Training

**Endpoint**: `POST /api/ai/training/reset`

**Purpose**: Clear all responses and reset training to start over

**Request Body**:
```json
{
  "businessId": "507f1f77bcf86cd799439011"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "responses": [],
    "trainingStatus": "not_started",
    "metadata": {
      "totalQuestions": 45,
      "answeredQuestions": 0,
      "completionPercentage": 0
    }
  },
  "message": "Training reset successfully"
}
```

## Question Types

The training system supports multiple question types:

- **text**: Free-form text input
- **multiple_choice**: Single selection from options
- **multi_select**: Multiple selections from options
- **number**: Numeric input
- **boolean**: Yes/No questions
- **time**: Time-based input

## Question Categories

Questions are organized into 5 categories:

1. **business_info**: Basic business information and positioning
2. **customer_profile**: Target audience and demographics
3. **operations**: Operating hours, capacity, and logistics
4. **marketing**: Goals, strategies, and past performance
5. **goals**: Primary objectives and focus areas

## How the AI Uses Training Data

Once training is complete, the AI assistant uses the collected data to:

1. **Deal & Offer Recommendations**
   - Suggest optimal timing based on slow periods
   - Recommend discount amounts within comfort range
   - Create compelling descriptions matching brand voice
   - Consider target audience demographics

2. **Content Suggestions**
   - Proactive holiday/seasonal post ideas
   - Optimal posting times based on peak hours
   - Templates that resonate with target audience
   - Trending topics relevant to the business

3. **Customer Engagement Strategy**
   - Focus on specified marketing goals
   - Boost traffic during identified slow periods
   - Suggest loyalty programs and retention tactics
   - Recommend social media engagement strategies

4. **Business Growth Insights**
   - Analyze trends and provide actionable insights
   - Optimize pricing and promotional strategies
   - Build on past successful promotions
   - Maximize profitability opportunities

## Example Training Flow

### Step 1: Initialize Training
```bash
POST /api/ai/training/initialize
{
  "businessId": "507f1f77bcf86cd799439011",
  "industry": "Food & Drink",
  "subCategory": "Restaurant"
}
```

### Step 2: Get Questions
```bash
GET /api/ai/training/questions?industry=Food & Drink
```

### Step 3: Submit Core Responses
```bash
POST /api/ai/training/submit
{
  "businessId": "507f1f77bcf86cd799439011",
  "responses": [
    { "questionId": "business_name", "answer": "Joe's Pizza" },
    { "questionId": "business_description", "answer": "Authentic NY-style pizza..." },
    { "questionId": "target_audience", "answer": ["Young Professionals (25-34)", "Families with children"] },
    { "questionId": "operating_hours", "answer": "Mon-Sun 11AM-11PM" },
    { "questionId": "busiest_days", "answer": ["Friday", "Saturday", "Sunday"] },
    { "questionId": "slow_periods", "answer": ["Monday mornings", "Weekday afternoons"] },
    { "questionId": "typical_discount_range", "answer": "10-20%" },
    { "questionId": "marketing_goals", "answer": ["Boost sales during slow periods", "Build customer loyalty"] }
  ]
}
```

### Step 4: Submit Industry-Specific Responses
```bash
POST /api/ai/training/submit
{
  "businessId": "507f1f77bcf86cd799439011",
  "responses": [
    { "questionId": "cuisine_type", "answer": "Italian, New York-style pizza" },
    { "questionId": "dining_style", "answer": "Fast casual" },
    { "questionId": "menu_highlights", "answer": "Classic Margherita, Pepperoni, White Pizza" },
    { "questionId": "dietary_options", "answer": ["Vegetarian", "Vegan", "Gluten-free"] },
    { "questionId": "average_check_size", "answer": "$20-$35" },
    { "questionId": "meal_periods", "answer": ["Lunch", "Dinner", "Late night"] }
  ]
}
```

### Step 5: Check Status
```bash
GET /api/ai/training/status/507f1f77bcf86cd799439011
```

### Step 6: Complete Training
```bash
POST /api/ai/training/complete
{
  "businessId": "507f1f77bcf86cd799439011"
}
```

## Best Practices

1. **Progressive Submission**: Submit responses in batches by category for better user experience
2. **Validation**: Always validate responses on the frontend before submission
3. **Status Checking**: Check training status to show progress to users
4. **Required Questions**: Ensure all required questions are answered before attempting to complete
5. **Re-training**: Allow businesses to reset and update their training as they evolve

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400`: Bad request (invalid data, missing required fields)
- `404`: Resource not found (business or training not found)
- `500`: Server error

Example error response:
```json
{
  "success": false,
  "error": "Training incomplete. Missing required questions: business_description, target_audience"
}
```

## Frontend Integration Tips

1. **Multi-Step Form**: Break questions into steps by category
2. **Progress Bar**: Use metadata.completionPercentage for progress indicator
3. **Save Progress**: Submit responses incrementally as users complete sections
4. **Validation**: Validate required questions before allowing completion
5. **Help Text**: Display helpText for questions to guide users

## Database Schema

### AI_Training Collection

```typescript
{
  businessId: ObjectId (indexed, unique)
  assistantId: string
  industry: string (enum)
  subCategory: string (optional)
  responses: [
    {
      questionId: string
      answer: mixed (string | string[] | number | boolean)
      answeredAt: Date
    }
  ]
  trainingStatus: "not_started" | "in_progress" | "completed"
  completedAt: Date (optional)
  lastUpdated: Date
  metadata: {
    totalQuestions: number
    answeredQuestions: number
    requiredQuestions: number
    completionPercentage: number
  }
  createdAt: Date
  updatedAt: Date
}
```

## Support

For questions or issues with the AI Training System, please contact the development team or refer to the main Pinntag documentation.
