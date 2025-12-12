# Unified Training State API

## Overview
A single, comprehensive API endpoint that provides all training information in one call. This replaces the need to call multiple endpoints (initialize, get questions, get status) separately.

## Endpoint

```
GET /ai/training/state/:businessId
```

## Features

✅ **Auto-initialization** - Creates training record if it doesn't exist
✅ **Current phase tracking** - Shows which phase the user is on
✅ **Answered vs Remaining** - Separates questions into answered and remaining
✅ **Progress across all phases** - Complete visibility into all 3 phases
✅ **Pre-filled responses** - Returns business_name and business_description if available

## Request

```bash
GET /ai/training/state/64f1a2b3c4d5e6f7g8h9i0j1
```

## Response Structure

```json
{
  "success": true,
  "data": {
    "trainingStatus": "in_progress",
    "currentPhase": "basic",
    "completedPhases": [],
    "totalPhases": 3,
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
    ],
    "currentPhaseData": {
      "phase": "basic",
      "totalQuestions": 8,
      "answeredCount": 2,
      "remainingCount": 6,
      "questions": [
        {
          "id": "business_name",
          "question": "What is your business name?",
          "type": "text",
          "required": true,
          "category": "business_info",
          "phase": "basic",
          "isAnswered": true,
          "answer": "Joe's Coffee Shop",
          "answeredAt": "2025-01-15T10:30:00.000Z"
        },
        {
          "id": "target_audience",
          "question": "Who is your primary target audience?",
          "type": "multi_select",
          "options": ["Students (18-24)", "Young Professionals (25-34)", ...],
          "required": true,
          "category": "customer_profile",
          "phase": "basic",
          "isAnswered": true,
          "answer": ["Young Professionals (25-34)", "Students (18-24)"],
          "answeredAt": "2025-01-15T10:35:00.000Z"
        },
        {
          "id": "customer_income_level",
          "question": "What is the typical income level of your customers?",
          "type": "multiple_choice",
          "options": ["Budget-conscious", "Mid-range", "Premium", "Luxury", "Mixed"],
          "required": true,
          "category": "customer_profile",
          "phase": "basic",
          "isAnswered": false
        },
        // ... 5 more questions with isAnswered: false
      ]
    },
    "metadata": {
      "totalQuestions": 8,
      "answeredQuestions": 2,
      "requiredQuestions": 7,
      "completionPercentage": 25,
      "phaseProgress": {
        "basic": {
          "total": 8,
          "answered": 2,
          "completed": false
        },
        "standard": {
          "total": 6,
          "answered": 0,
          "completed": false
        },
        "advanced": {
          "total": 4,
          "answered": 0,
          "completed": false
        }
      }
    },
    "completedAt": null
  }
}
```

## Key Response Fields

### Top Level
- `trainingStatus`: "not_started" | "in_progress" | "completed"
- `currentPhase`: "basic" | "standard" | "advanced"
- `completedPhases`: Array of completed phase names
- `totalPhases`: Always 3
- `phaseAdvanced`: Boolean indicating if phase was automatically advanced in this call

### phaseSummary
Overview of all three phases with question counts.

### currentPhaseData
Detailed information about the current phase:
- `phase`: Current phase name
- `totalQuestions`: Total questions in this phase
- `answeredCount`: How many questions answered in this phase
- `remainingCount`: How many questions left in this phase
- `questions`: Array of ALL questions with `isAnswered` boolean status
  - Each question includes:
    - All question properties (id, question, type, options, etc.)
    - `isAnswered`: Boolean flag indicating if question is answered
    - `answer`: The answer value (only present if `isAnswered: true`)
    - `answeredAt`: Timestamp when answered (only present if `isAnswered: true`)

### metadata
Global progress tracking across all phases.

## Phase Advancement Logic

The API automatically advances phases based on completion:

1. **Basic Phase** (Starting point)
   - User answers all basic questions
   - On next `GET /state` call → Automatically advances to Standard
   - `completedPhases: ["basic"]`, `currentPhase: "standard"`

2. **Standard Phase**
   - User answers all standard questions
   - On next `GET /state` call → Automatically advances to Advanced
   - `completedPhases: ["basic", "standard"]`, `currentPhase: "advanced"`

3. **Advanced Phase** (Final phase)
   - User answers all advanced questions
   - Phase remains as "advanced"
   - `completedPhases: ["basic", "standard", "advanced"]`, `currentPhase: "advanced"`

### When Does Phase Advancement Happen?

Phase advancement occurs when:
1. User calls `GET /ai/training/state/:businessId`
2. API detects all questions in current phase are answered
3. There's a next phase available (basic → standard → advanced)
4. Current phase hasn't already been marked as completed

### Response Indicators

When phase advances, the response includes:
- `phaseAdvanced: true` - Flag indicating advancement happened
- `currentPhase` - Updated to the new phase
- `completedPhases` - Includes the phase that was just completed
- `currentPhaseData.questions` - Questions from the NEW phase

## Usage Flow

### 1. Initial Load (First Visit)
```javascript
const response = await fetch(`/ai/training/state/${businessId}`);
const { data } = await response.json();

// Training auto-initialized with Basic phase
console.log(data.currentPhase); // "basic"
console.log(data.currentPhaseData.totalQuestions); // 8
console.log(data.currentPhaseData.answeredCount); // 2 (pre-filled)
console.log(data.currentPhaseData.remainingCount); // 6

// Show all questions with their status
data.currentPhaseData.questions.forEach(q => {
  if (q.isAnswered) {
    console.log(`✓ ${q.question}: ${q.answer}`);
  } else {
    console.log(`○ ${q.question}: (not answered)`);
  }
});

// Or filter for display
const unansweredQuestions = data.currentPhaseData.questions.filter(q => !q.isAnswered);
const answeredQuestions = data.currentPhaseData.questions.filter(q => q.isAnswered);
```

### 2. After User Submits Answers
```javascript
// Submit responses
await fetch('/ai/training/submit', {
  method: 'POST',
  body: JSON.stringify({
    businessId,
    responses: [
      { questionId: 'target_audience', answer: ['Young Professionals'] },
      { questionId: 'marketing_goals', answer: ['Increase foot traffic'] }
    ]
  })
});

// Refresh training state
const response = await fetch(`/ai/training/state/${businessId}`);
const { data } = await response.json();

// Updated counts
console.log(data.currentPhaseData.answeredCount); // 4
console.log(data.currentPhaseData.remainingCount); // 4
```

### 3. Automatic Phase Advancement
```javascript
// After user submits the last answer in Basic phase
await fetch('/ai/training/submit', {
  method: 'POST',
  body: JSON.stringify({
    businessId,
    responses: [
      { questionId: 'last_basic_question', answer: 'Answer' }
    ]
  })
});

// Get updated state - phase automatically advances
const response = await fetch(`/ai/training/state/${businessId}`);
const { data } = await response.json();

// Phase has automatically advanced!
console.log(data.currentPhase); // "standard" (was "basic")
console.log(data.completedPhases); // ["basic"]
console.log(data.phaseAdvanced); // true
console.log(data.currentPhaseData.questions); // Standard phase questions

// Show notification to user
if (data.phaseAdvanced) {
  showNotification(`Congratulations! You've completed the ${data.completedPhases[data.completedPhases.length - 1]} phase. Now moving to ${data.currentPhase} phase.`);
}
```

### 4. Checking Overall Progress
```javascript
const response = await fetch(`/ai/training/state/${businessId}`);
const { data } = await response.json();

// Progress across all phases
console.log(data.metadata.phaseProgress);
// {
//   basic: { total: 8, answered: 8, completed: true },
//   standard: { total: 6, answered: 3, completed: false },
//   advanced: { total: 4, answered: 0, completed: false }
// }

console.log(data.completedPhases); // ["basic"]
console.log(data.currentPhase); // "standard"
```

## Benefits

### 1. Single API Call
No need to call multiple endpoints. One call gives you everything.

### 2. Auto-Initialization
Don't worry about calling initialize separately. First call to state API creates the training record.

### 3. Automatic Phase Advancement
When all questions in a phase are answered:
- Automatically advances to the next phase
- Marks previous phase as completed
- Returns new phase questions immediately
- Sets `phaseAdvanced: true` flag for UI notification

### 4. Boolean Status for Easy Filtering
Each question has an `isAnswered` boolean:
- Easy to filter: `questions.filter(q => !q.isAnswered)`
- Simple conditional rendering
- Single source of truth for all questions

### 5. Progress Tracking
Clear visibility into:
- What phase user is on
- What phases are completed
- How many questions in each phase
- Overall completion percentage

### 6. Simplified Frontend Logic
```javascript
// One call to rule them all
const { data } = await getTrainingState(businessId);

// Everything you need
const allQuestions = data.currentPhaseData.questions;
const unanswered = allQuestions.filter(q => !q.isAnswered);
const answered = allQuestions.filter(q => q.isAnswered);
const progress = data.currentPhaseData.answeredCount / data.currentPhaseData.totalQuestions;
const phaseName = data.currentPhase;
const allPhases = data.phaseSummary;
```

## Comparison with Old Flow

### Old Way (Multiple API Calls)
```javascript
// 1. Initialize
const init = await fetch(`/ai/training/initialize/${businessId}`);
const initData = await init.json();

// 2. Get status
const status = await fetch(`/ai/training/status/${businessId}`);
const statusData = await status.json();

// 3. Get questions by phase
const questions = await fetch(`/ai/training/questions-by-phase/${businessId}?phase=basic`);
const questionsData = await questions.json();

// 4. Combine data manually
const state = {
  questions: questionsData.questions,
  status: statusData.status,
  metadata: statusData.metadata
};
```

### New Way (Single API Call)
```javascript
// One call
const response = await fetch(`/ai/training/state/${businessId}`);
const { data } = await response.json();

// Everything is ready in one place
const questions = data.currentPhaseData.questions; // All questions with isAnswered status
const answered = questions.filter(q => q.isAnswered);
const unanswered = questions.filter(q => !q.isAnswered);

// Plus:
// - data.phaseSummary
// - data.metadata
// - data.currentPhase
// - data.completedPhases
```

## Complete Phase Advancement Example

```javascript
// 1. User starts training - gets Basic phase
const { data: initialState } = await fetch(`/ai/training/state/${businessId}`).then(r => r.json());
console.log(initialState.currentPhase); // "basic"
console.log(initialState.currentPhaseData.totalQuestions); // 8
console.log(initialState.completedPhases); // []

// 2. User answers all 8 basic questions
await fetch('/ai/training/submit', {
  method: 'POST',
  body: JSON.stringify({
    businessId,
    responses: [
      { questionId: 'business_name', answer: 'Coffee Shop' },
      { questionId: 'target_audience', answer: ['Young Professionals'] },
      // ... 6 more answers
    ]
  })
});

// 3. User clicks "Continue" or page refreshes - call state API
const { data: afterBasic } = await fetch(`/ai/training/state/${businessId}`).then(r => r.json());

console.log(afterBasic.phaseAdvanced); // true ✅
console.log(afterBasic.currentPhase); // "standard" (changed!)
console.log(afterBasic.completedPhases); // ["basic"]
console.log(afterBasic.currentPhaseData.totalQuestions); // 6 (Standard questions)
console.log(afterBasic.currentPhaseData.answeredCount); // 0

// Show notification
if (afterBasic.phaseAdvanced) {
  showToast('Great job! You completed the Basic phase. Now moving to Standard phase.');
}

// 4. User answers all standard questions
await fetch('/ai/training/submit', {
  method: 'POST',
  body: JSON.stringify({
    businessId,
    responses: [
      { questionId: 'busiest_times', answer: 'Mornings' },
      // ... more standard answers
    ]
  })
});

// 5. Call state API again
const { data: afterStandard } = await fetch(`/ai/training/state/${businessId}`).then(r => r.json());

console.log(afterStandard.phaseAdvanced); // true ✅
console.log(afterStandard.currentPhase); // "advanced" (changed again!)
console.log(afterStandard.completedPhases); // ["basic", "standard"]
console.log(afterStandard.currentPhaseData.totalQuestions); // 4 (Advanced questions)

// 6. User can skip advanced phase or answer them
// Once all 3 phases completed, call complete API
if (afterStandard.completedPhases.length === 3) {
  await fetch(`/ai/training/complete/${businessId}`);
}
```

## Example UI Components

### Progress Bar
```javascript
const PhaseProgressBar = ({ phaseProgress }) => {
  const phases = ['basic', 'standard', 'advanced'];

  return (
    <div className="progress-bar">
      {phases.map(phase => (
        <div key={phase}>
          <span>{phase}</span>
          <span>{phaseProgress[phase].answered} / {phaseProgress[phase].total}</span>
          {phaseProgress[phase].completed && <CheckIcon />}
        </div>
      ))}
    </div>
  );
};
```

### Question List
```javascript
const QuestionList = ({ currentPhaseData }) => {
  const { questions, answeredCount, remainingCount } = currentPhaseData;

  return (
    <div>
      <h3>Progress: {answeredCount} / {questions.length} answered</h3>

      {questions.map(q => (
        <div key={q.id} className={q.isAnswered ? 'answered' : 'unanswered'}>
          {q.isAnswered ? (
            <>
              <p>✓ {q.question}</p>
              <p>Answer: {JSON.stringify(q.answer)}</p>
              <button>Edit</button>
            </>
          ) : (
            <>
              <p>○ {q.question}</p>
              <QuestionInput question={q} />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

// Or separate into sections
const QuestionListSeparated = ({ currentPhaseData }) => {
  const answered = currentPhaseData.questions.filter(q => q.isAnswered);
  const unanswered = currentPhaseData.questions.filter(q => !q.isAnswered);

  return (
    <div>
      <section>
        <h3>Answered ({answered.length})</h3>
        {answered.map(q => (
          <AnsweredQuestion key={q.id} question={q} />
        ))}
      </section>

      <section>
        <h3>Remaining ({unanswered.length})</h3>
        {unanswered.map(q => (
          <QuestionInput key={q.id} question={q} />
        ))}
      </section>
    </div>
  );
};
```

## Error Handling

```javascript
try {
  const response = await fetch(`/ai/training/state/${businessId}`);

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 404) {
      // No AI agent found for business
      console.error(error.error);
    } else if (response.status === 400) {
      // Invalid businessId format
      console.error(error.error);
    } else {
      // Server error
      console.error(error.error);
    }
  }

  const { data } = await response.json();
  // Use data
} catch (error) {
  console.error('Network error:', error);
}
```

## Migration from Old APIs

If you were using:
- `GET /ai/training/initialize/:businessId` → Use `GET /ai/training/state/:businessId`
- `GET /ai/training/status/:businessId` → Use `GET /ai/training/state/:businessId`
- `GET /ai/training/questions-by-phase/:businessId?phase=X` → Use `GET /ai/training/state/:businessId`

The old endpoints still exist for backward compatibility but are no longer needed.

## Testing

```bash
# Test the unified state API
curl -X GET "http://localhost:3000/ai/training/state/64f1a2b3c4d5e6f7g8h9i0j1" \
  -H "x-internal-api-key: your-key"

# Should return comprehensive training state
```
