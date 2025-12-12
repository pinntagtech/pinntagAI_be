# API Migration Guide - Phase-Based Training

## Breaking Changes

### 1. Initialize Training API

#### ❌ Old API (Deprecated)
```javascript
// POST /ai/training/initialize
const response = await fetch('/ai/training/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    businessId: '64f1a2b3c4d5e6f7g8h9i0j1',
    industry: 'Food & Drink',
    subCategory: 'Restaurant'
  })
});

const data = await response.json();
// Returns all questions (30+)
```

#### ✅ New API (Recommended)
```javascript
// GET /ai/training/initialize/:businessId
const response = await fetch(`/ai/training/initialize/${businessId}`);
const data = await response.json();

// Response structure:
{
  success: true,
  data: {
    training: { /* Training record */ },
    questions: [ /* Only Basic phase questions (7-10) */ ],
    phaseSummary: [
      { phase: 'basic', totalQuestions: 8, requiredQuestions: 7 },
      { phase: 'standard', totalQuestions: 6, requiredQuestions: 5 },
      { phase: 'advanced', totalQuestions: 4, requiredQuestions: 0 }
    ]
  },
  message: 'Training initialized successfully'
}
```

**Key Differences:**
1. Changed from POST to GET
2. No need to send `industry` or `subCategory` in body
3. Only `businessId` required as URL parameter
4. Returns only Basic phase questions initially
5. Includes `phaseSummary` for progress tracking

---

## New Endpoints

### 2. Get Questions By Phase

```javascript
// GET /ai/training/questions-by-phase/:businessId?phase=standard
const phase = 'standard'; // or 'basic' or 'advanced'
const response = await fetch(
  `/ai/training/questions-by-phase/${businessId}?phase=${phase}`
);

const data = await response.json();
// {
//   success: true,
//   data: {
//     phase: 'standard',
//     questions: [ /* Questions for this phase */ ],
//     currentPhase: 'basic',
//     completedPhases: ['basic'],
//     phaseSummary: [ /* Summary of all phases */ ],
//     metadata: {
//       phaseProgress: {
//         basic: { total: 8, answered: 8, completed: true },
//         standard: { total: 6, answered: 0, completed: false },
//         advanced: { total: 4, answered: 0, completed: false }
//       }
//     }
//   }
// }
```

---

## Migration Steps

### Step 1: Update Initialize Call

**Before:**
```typescript
const initializeTraining = async (
  businessId: string,
  industry: string,
  subCategory: string
) => {
  const response = await fetch('/ai/training/initialize', {
    method: 'POST',
    body: JSON.stringify({ businessId, industry, subCategory })
  });
  const { data } = await response.json();
  setQuestions(data.questions); // All 30+ questions
};
```

**After:**
```typescript
const initializeTraining = async (businessId: string) => {
  const response = await fetch(`/ai/training/initialize/${businessId}`);
  const { data } = await response.json();

  // Only Basic phase questions (7-10)
  setQuestions(data.questions);
  setPhaseSummary(data.phaseSummary);
  setCurrentPhase('basic');
};
```

### Step 2: Add Phase Navigation

```typescript
const loadNextPhase = async (businessId: string, phase: string) => {
  const response = await fetch(
    `/ai/training/questions-by-phase/${businessId}?phase=${phase}`
  );
  const { data } = await response.json();

  setQuestions(data.questions);
  setCurrentPhase(data.currentPhase);
  setCompletedPhases(data.completedPhases);
  setPhaseProgress(data.metadata.phaseProgress);
};

// User completes Basic phase
await submitResponses(businessId, basicAnswers);

// Show option to continue or finish
if (userWantsToContinue) {
  await loadNextPhase(businessId, 'standard');
} else {
  await completeTraining(businessId);
}
```

### Step 3: Update Progress Tracking

```typescript
interface PhaseProgress {
  basic: { total: number; answered: number; completed: boolean };
  standard: { total: number; answered: number; completed: boolean };
  advanced: { total: number; answered: number; completed: boolean };
}

const PhaseProgressBar = ({ progress }: { progress: PhaseProgress }) => {
  const phases = ['basic', 'standard', 'advanced'];

  return (
    <div className="phase-progress">
      {phases.map(phase => (
        <div key={phase} className="phase-indicator">
          <div className="phase-name">{phase}</div>
          <div className="phase-stats">
            {progress[phase].answered} / {progress[phase].total}
          </div>
          {progress[phase].completed && <CheckIcon />}
        </div>
      ))}
    </div>
  );
};
```

---

## Complete Example Flow

```typescript
// 1. Initialize Training
const initTraining = async () => {
  const response = await fetch(`/ai/training/initialize/${businessId}`);
  const { data } = await response.json();

  console.log('Starting with:', data.questions.length, 'questions');
  console.log('Phase breakdown:', data.phaseSummary);

  return data;
};

// 2. Submit Basic Phase Responses
const submitBasicPhase = async (responses) => {
  await fetch('/ai/training/submit', {
    method: 'POST',
    body: JSON.stringify({ businessId, responses })
  });

  // Show completion dialog
  showPhaseCompletionDialog('basic');
};

// 3. User decides to continue to Standard phase
const continueToStandard = async () => {
  const response = await fetch(
    `/ai/training/questions-by-phase/${businessId}?phase=standard`
  );
  const { data } = await response.json();

  console.log('Standard phase:', data.questions.length, 'questions');
  console.log('Progress:', data.metadata.phaseProgress);

  return data.questions;
};

// 4. Submit Standard Phase and Complete
const finishTraining = async (responses) => {
  // Submit final responses
  await fetch('/ai/training/submit', {
    method: 'POST',
    body: JSON.stringify({ businessId, responses })
  });

  // Complete training
  const response = await fetch('/ai/training/complete', {
    method: 'POST',
    body: JSON.stringify({ businessId })
  });

  const { data } = await response.json();
  console.log('Training completed!', data);
};
```

---

## UI/UX Recommendations

### 1. Phase Introduction Screen

```typescript
const PhaseIntro = ({ phase, summary }) => (
  <div className="phase-intro">
    <h2>{phase.toUpperCase()} Phase</h2>
    <p>
      {phase === 'basic' && 'Let\'s start with the essentials (2-3 minutes)'}
      {phase === 'standard' && 'Add operational details for better results (3-4 minutes)'}
      {phase === 'advanced' && 'Fine-tune your AI for optimal performance (4-5 minutes)'}
    </p>
    <div className="question-count">
      {summary.totalQuestions} questions
      {summary.requiredQuestions > 0 &&
        ` (${summary.requiredQuestions} required)`}
    </div>
  </div>
);
```

### 2. Phase Completion Dialog

```typescript
const PhaseCompletionDialog = ({ completedPhase, nextPhase }) => (
  <Dialog>
    <h3>✅ {completedPhase} Phase Complete!</h3>
    <p>
      Your AI assistant is ready to use with the basic information.
      Want to make it even better?
    </p>
    <div className="actions">
      <Button onClick={completeNow}>
        Start Using AI Now
      </Button>
      <Button variant="primary" onClick={continueToNext}>
        Continue to {nextPhase} Phase
      </Button>
    </div>
    <small>You can always add more details later</small>
  </Dialog>
);
```

### 3. Progress Indicator

```typescript
const TrainingProgress = ({ phaseSummary, currentPhase }) => {
  const phases = ['basic', 'standard', 'advanced'];
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="training-progress">
      {phases.map((phase, index) => (
        <div
          key={phase}
          className={`
            phase-step
            ${index < currentIndex ? 'completed' : ''}
            ${index === currentIndex ? 'active' : ''}
          `}
        >
          <div className="phase-circle">
            {index < currentIndex ? '✓' : index + 1}
          </div>
          <span>{phase}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## Testing Your Integration

### Test Case 1: Basic Flow
```bash
# 1. Initialize
curl -X GET http://localhost:3000/ai/training/initialize/64f1a2b3c4d5e6f7g8h9i0j1

# 2. Submit Basic Responses
curl -X POST http://localhost:3000/ai/training/submit \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "responses": [
      {"questionId": "target_audience", "answer": ["Young Professionals (25-34)"]},
      {"questionId": "marketing_goals", "answer": ["Increase foot traffic"]}
    ]
  }'

# 3. Complete with just Basic phase
curl -X POST http://localhost:3000/ai/training/complete \
  -H "Content-Type: application/json" \
  -d '{"businessId": "64f1a2b3c4d5e6f7g8h9i0j1"}'
```

### Test Case 2: Full Flow
```bash
# 1. Initialize (Basic)
curl -X GET http://localhost:3000/ai/training/initialize/64f1a2b3c4d5e6f7g8h9i0j1

# 2. Submit Basic
curl -X POST http://localhost:3000/ai/training/submit ...

# 3. Load Standard Phase
curl -X GET "http://localhost:3000/ai/training/questions-by-phase/64f1a2b3c4d5e6f7g8h9i0j1?phase=standard"

# 4. Submit Standard
curl -X POST http://localhost:3000/ai/training/submit ...

# 5. Load Advanced Phase
curl -X GET "http://localhost:3000/ai/training/questions-by-phase/64f1a2b3c4d5e6f7g8h9i0j1?phase=advanced"

# 6. Submit Advanced and Complete
curl -X POST http://localhost:3000/ai/training/submit ...
curl -X POST http://localhost:3000/ai/training/complete ...
```

---

## FAQs

**Q: Can users skip phases?**
A: Yes, users can complete just the Basic phase and finish training. Standard and Advanced phases are optional enhancements.

**Q: What happens to existing training records?**
A: They continue to work. The system automatically assigns phases to questions when needed.

**Q: Can users go back to previous phases?**
A: Yes, use the `questions-by-phase` endpoint to fetch any phase's questions at any time.

**Q: How do I know which phase a user is on?**
A: Check the `currentPhase` and `completedPhases` fields in the training status response.

**Q: Are all questions in each phase required?**
A: No. Each phase has a mix of required and optional questions. See `phaseSummary` for counts.

---

## Support

For issues or questions:
1. Check [PHASE_BASED_TRAINING_SUMMARY.md](./PHASE_BASED_TRAINING_SUMMARY.md) for detailed implementation info
2. Review [AI_TRAINING_3_PHASE_IMPLEMENTATION.md](./AI_TRAINING_3_PHASE_IMPLEMENTATION.md) for technical details
3. Contact backend team for API-specific questions
