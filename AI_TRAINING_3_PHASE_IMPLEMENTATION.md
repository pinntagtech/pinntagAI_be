# AI Training 3-Phase System Implementation

## Overview
The AI training questionnaire has been restructured into 3 phases (Basic, Standard, Advanced) to reduce user friction and improve the onboarding experience.

## Key Changes

### 1. Phased Questionnaire Structure

Questions are now divided into three phases:
- **Basic**: Essential questions needed to get started (7-10 questions)
- **Standard**: Important operational details (5-8 questions)
- **Advanced**: Optional questions for optimization (3-5 questions)

### 2. API Changes

#### Initialize Training API (Changed from POST to GET)
**Old**: `POST /ai/training/initialize`
- Required: `businessId`, `industry`, `subCategory` in request body

**New**: `GET /ai/training/initialize/:businessId`
- Only requires `businessId` as URL parameter
- Automatically fetches `industry` and `subCategory` from `business_AI_assistant` collection
- Returns:
  ```json
  {
    "success": true,
    "data": {
      "training": { ... },
      "questions": [ /* Only Basic phase questions */ ],
      "phaseSummary": [
        {
          "phase": "basic",
          "totalQuestions": 8,
          "requiredQuestions": 7
        },
        {
          "phase": "standard",
          "totalQuestions": 6,
          "requiredQuestions": 5
        },
        {
          "phase": "advanced",
          "totalQuestions": 4,
          "requiredQuestions": 0
        }
      ]
    }
  }
  ```

#### New API: Get Questions By Phase
**Endpoint**: `GET /ai/training/questions-by-phase/:businessId?phase=basic|standard|advanced`
- Fetches questions for a specific phase
- Returns current phase status and progress
- Response:
  ```json
  {
    "success": true,
    "data": {
      "phase": "basic",
      "questions": [ /* Phase-specific questions */ ],
      "currentPhase": "basic",
      "completedPhases": [],
      "phaseSummary": [ ... ],
      "metadata": {
        "phaseProgress": {
          "basic": { "total": 8, "answered": 2, "completed": false },
          "standard": { "total": 6, "answered": 0, "completed": false },
          "advanced": { "total": 4, "answered": 0, "completed": false }
        }
      }
    }
  }
  ```

### 3. Model Changes

The `AI_Training` model now includes:
```typescript
{
  currentPhase: "basic" | "standard" | "advanced",
  completedPhases: ("basic" | "standard" | "advanced")[],
  metadata: {
    phaseProgress: {
      basic: { total: number, answered: number, completed: boolean },
      standard: { total: number, answered: number, completed: boolean },
      advanced: { total: number, answered: number, completed: boolean }
    }
  }
}
```

### 4. Questionnaire Structure

#### Phase Assignment Logic
Questions are automatically assigned phases based on:
- **Basic Phase**:
  - Required questions from `business_info`, `customer_profile`, `goals`, `marketing` categories
  - Core questions like: business name, description, target audience, marketing goals
- **Standard Phase**:
  - Required questions from `operations` category
  - Questions like: busiest days/hours, slow periods, seasonal information
- **Advanced Phase**:
  - All non-required questions
  - Questions like: competitor awareness, previous promotions, detailed insights

#### New Helper Functions
```typescript
// Get questions for a specific phase
getQuestionsByPhase(industry, phase, subCategory)

// Get all questions up to a phase (e.g., BASIC + STANDARD)
getQuestionsUpToPhase(industry, phase, subCategory)

// Get questions grouped by all phases
getQuestionsGroupedByPhase(industry, subCategory)

// Get summary of all phases
getPhaseSummary(industry, subCategory)
```

## Usage Flow

### 1. Initialize Training
```bash
GET /ai/training/initialize/64f1a2b3c4d5e6f7g8h9i0j1
```
- System fetches business details from `business_AI_assistant`
- Returns only **Basic phase** questions
- Pre-fills `business_name` and `business_description` if available

### 2. Submit Basic Phase Responses
```bash
POST /ai/training/submit
{
  "businessId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "responses": [
    { "questionId": "target_audience", "answer": ["Young Professionals (25-34)"] },
    { "questionId": "marketing_goals", "answer": ["Increase foot traffic"] }
  ]
}
```

### 3. Get Next Phase Questions
```bash
GET /ai/training/questions-by-phase/64f1a2b3c4d5e6f7g8h9i0j1?phase=standard
```
- User can optionally continue to Standard phase
- Or skip directly to completing training with just Basic phase

### 4. Complete Training
```bash
POST /ai/training/complete
{
  "businessId": "64f1a2b3c4d5e6f7g8h9i0j1"
}
```
- Validates all required questions are answered
- Updates AI assistant with enhanced instructions

## Benefits

1. **Reduced Friction**: Users only see 7-10 essential questions initially instead of 30+ questions
2. **Progressive Disclosure**: Users can add more details later if they want better AI performance
3. **Flexible Onboarding**: Businesses can complete Basic phase and come back later for Standard/Advanced
4. **Better UX**: Clear progress indicators showing completion of each phase
5. **Simplified API**: No need to manually specify industry/subCategory during initialization

## Backward Compatibility

- Existing training records will continue to work
- Old API endpoint structure still exists but is updated
- Phase information is automatically calculated for questions without explicit phase assignment

## Testing Recommendations

1. Test initialization with only businessId
2. Verify Basic phase questions are returned first
3. Test phase progression (Basic → Standard → Advanced)
4. Verify phase completion tracking
5. Test training completion with only Basic phase answered
6. Test training completion with all phases answered
