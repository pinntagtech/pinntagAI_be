# API Fixes Summary

## Issues Fixed

### 1. Complete Training API Error
**Problem**: Complete training API was validating ALL required questions across all phases, causing errors like:
```
"Training incomplete. Missing required questions: seasonal_relevance"
```
Even when only Basic phase was completed.

**Solution**: Changed validation to only check BASIC phase required questions, since Standard and Advanced phases are optional.

#### Before
```typescript
// Validated ALL required questions from ALL phases
const validation = validateTrainingData(
  responsesMap,
  training.industry as BusinessIndustries,
  training.subCategory as BusinessSubCategory
);
```

#### After
```typescript
// Only validate BASIC phase required questions
const basicQuestions = getQuestionsByPhaseUtil(
  training.industry as BusinessIndustries,
  TrainingPhase.BASIC,
  training.subCategory as BusinessSubCategory
);

const requiredBasicQuestions = basicQuestions.filter((q) => q.required);
const missingBasicRequired = requiredBasicQuestions
  .filter((q) => !responsesMap.hasOwnProperty(q.id))
  .map((q) => q.id);

if (missingBasicRequired.length > 0) {
  throw new Error(
    `Training incomplete. Missing required BASIC phase questions: ${missingBasicRequired.join(", ")}`
  );
}
```

### 2. Query Phase Parameter in State API
**Problem**: No way to view questions from other phases when user is on a different phase. For example, if user is on Advanced phase but wants to review/edit Basic phase answers.

**Solution**: Added optional `phase` query parameter to state API that returns questions from the specified phase in the `currentPhaseData` array.

## Updated APIs

### 1. Complete Training API
```
GET /ai/training/complete/:businessId
```

**New Behavior**:
- ✅ Only validates BASIC phase required questions
- ✅ Standard and Advanced phases are optional
- ✅ User can complete training after finishing Basic phase
- ✅ Clear error message if Basic phase incomplete

**Example**:
```bash
curl --location 'localhost:4001/ai/training/complete/68e4c33ae82970cefe8ff1b7' \
--header 'x-internal-api-key: change-me'
```

**Success Response** (Basic phase completed):
```json
{
  "success": true,
  "data": {
    "message": "Training completed successfully",
    "training": { ... },
    "assistantId": "asst_xyz123"
  }
}
```

**Error Response** (Basic phase incomplete):
```json
{
  "success": false,
  "error": "Training incomplete. Missing required BASIC phase questions: business_name, target_audience. Please complete at least the Basic phase before finishing training."
}
```

### 2. Training State API with Phase Query
```
GET /ai/training/state/:businessId?phase=basic|standard|advanced
```

**Query Parameters**:
- `phase` (optional): `basic` | `standard` | `advanced`

**Behavior**:
- Without `phase` param: Returns current phase questions
- With `phase` param: Returns questions from specified phase

**Example Use Cases**:

#### Use Case 1: Normal Flow (No Query Param)
User is on Standard phase, wants to see Standard questions:
```bash
GET /ai/training/state/68e4c33ae82970cefe8ff1b7
```

Response:
```json
{
  "success": true,
  "data": {
    "currentPhase": "standard",
    "queriedPhase": null,
    "currentPhaseData": {
      "phase": "standard",
      "questions": [/* Standard phase questions */]
    }
  }
}
```

#### Use Case 2: Review Previous Phase
User is on Advanced phase, wants to review/edit Basic phase answers:
```bash
GET /ai/training/state/68e4c33ae82970cefe8ff1b7?phase=basic
```

Response:
```json
{
  "success": true,
  "data": {
    "currentPhase": "advanced",
    "queriedPhase": "basic",
    "currentPhaseData": {
      "phase": "basic",
      "questions": [/* Basic phase questions with isAnswered status */]
    }
  }
}
```

#### Use Case 3: Preview Next Phase
User is on Basic phase, wants to preview Standard phase questions:
```bash
GET /ai/training/state/68e4c33ae82970cefe8ff1b7?phase=standard
```

Response:
```json
{
  "success": true,
  "data": {
    "currentPhase": "basic",
    "queriedPhase": "standard",
    "currentPhaseData": {
      "phase": "standard",
      "questions": [/* Standard phase questions (all unanswered) */]
    }
  }
}
```

## Response Fields

### New Fields Added

#### `queriedPhase`
- Type: `"basic" | "standard" | "advanced" | null`
- Indicates if a specific phase was queried
- `null` when no phase query parameter provided
- Frontend can use this to show "You're viewing: Basic phase" banner

#### `currentPhaseData.phase`
- Now reflects the queried phase OR current phase
- Use `currentPhase` (top level) to know the actual current phase
- Use `currentPhaseData.phase` to know which phase questions are being shown

## Frontend Integration

### Example: Phase Navigation
```javascript
// User is on Advanced phase, clicks "Review Basic Answers"
const reviewBasicPhase = async () => {
  const { data } = await fetch(
    `/ai/training/state/${businessId}?phase=basic`
  ).then(r => r.json());

  // data.currentPhase = "advanced" (actual phase)
  // data.queriedPhase = "basic" (viewing basic)
  // data.currentPhaseData.phase = "basic"
  // data.currentPhaseData.questions = [/* basic questions */]

  if (data.queriedPhase !== data.currentPhase) {
    showBanner(`You are viewing ${data.queriedPhase} phase (Current: ${data.currentPhase})`);
  }

  renderQuestions(data.currentPhaseData.questions);
};
```

### Example: Edit Previous Phase Answer
```javascript
// User on Advanced phase, edits a Basic phase question
const editBasicAnswer = async (questionId, newAnswer) => {
  // 1. Submit the edited answer
  await fetch('/ai/training/submit', {
    method: 'POST',
    body: JSON.stringify({
      businessId,
      responses: [{ questionId, answer: newAnswer }]
    })
  });

  // 2. Refresh basic phase view
  const { data } = await fetch(
    `/ai/training/state/${businessId}?phase=basic`
  ).then(r => r.json());

  // Show updated basic phase with edited answer
  renderQuestions(data.currentPhaseData.questions);
};
```

### Example: Phase Tabs UI
```javascript
const PhaseTabs = ({ businessId, currentPhase }) => {
  const [selectedPhase, setSelectedPhase] = useState(currentPhase);
  const [questions, setQuestions] = useState([]);

  const loadPhase = async (phase) => {
    const url = phase === currentPhase
      ? `/ai/training/state/${businessId}`
      : `/ai/training/state/${businessId}?phase=${phase}`;

    const { data } = await fetch(url).then(r => r.json());
    setQuestions(data.currentPhaseData.questions);
    setSelectedPhase(phase);
  };

  return (
    <div>
      <div className="tabs">
        <button
          onClick={() => loadPhase('basic')}
          className={selectedPhase === 'basic' ? 'active' : ''}
        >
          Basic {currentPhase !== 'basic' && '✓'}
        </button>
        <button
          onClick={() => loadPhase('standard')}
          className={selectedPhase === 'standard' ? 'active' : ''}
        >
          Standard {currentPhase === 'advanced' && '✓'}
        </button>
        <button
          onClick={() => loadPhase('advanced')}
          className={selectedPhase === 'advanced' ? 'active' : ''}
        >
          Advanced
        </button>
      </div>

      <QuestionList questions={questions} />
    </div>
  );
};
```

## Validation Rules

### Complete Training API
- ✅ All BASIC phase required questions must be answered
- ⚠️ Standard phase questions are optional
- ⚠️ Advanced phase questions are optional
- ✅ User can complete training with only Basic phase done

### Phase Query Parameter
- ✅ Must be one of: `basic`, `standard`, `advanced`
- ✅ Case-sensitive
- ⚠️ Invalid phase returns 400 error

## Error Responses

### Invalid Phase Query
```bash
GET /ai/training/state/68e4c33ae82970cefe8ff1b7?phase=invalid
```

Response:
```json
{
  "success": false,
  "error": "Invalid phase. Must be one of: basic, standard, advanced"
}
```

### Complete Training - Basic Phase Incomplete
```bash
GET /ai/training/complete/68e4c33ae82970cefe8ff1b7
```

Response:
```json
{
  "success": false,
  "error": "Training incomplete. Missing required BASIC phase questions: business_name, customer_income_level. Please complete at least the Basic phase before finishing training."
}
```

## Testing

### Test Complete Training (Basic Phase Only)
```bash
# Answer only Basic phase questions
curl -X POST 'localhost:4001/ai/training/submit' \
  -H 'x-internal-api-key: change-me' \
  -H 'Content-Type: application/json' \
  -d '{
    "businessId": "68e4c33ae82970cefe8ff1b7",
    "responses": [
      {"questionId": "business_name", "answer": "Coffee Shop"},
      {"questionId": "target_audience", "answer": ["Young Professionals"]},
      ...all basic required questions
    ]
  }'

# Complete training - should succeed
curl 'localhost:4001/ai/training/complete/68e4c33ae82970cefe8ff1b7' \
  -H 'x-internal-api-key: change-me'

# Expected: Success
```

### Test Phase Query Parameter
```bash
# User on Advanced, view Basic
curl 'localhost:4001/ai/training/state/68e4c33ae82970cefe8ff1b7?phase=basic' \
  -H 'x-internal-api-key: change-me'

# Expected: Returns Basic phase questions

# User on Basic, view Standard (preview)
curl 'localhost:4001/ai/training/state/68e4c33ae82970cefe8ff1b7?phase=standard' \
  -H 'x-internal-api-key: change-me'

# Expected: Returns Standard phase questions (all unanswered)
```

## Migration Guide

### For Frontend Developers

#### If you want to view different phases:
**Before**:
No way to view other phases

**After**:
```javascript
// View basic phase
fetch(`/ai/training/state/${businessId}?phase=basic`)

// View standard phase
fetch(`/ai/training/state/${businessId}?phase=standard`)

// View current phase (no change)
fetch(`/ai/training/state/${businessId}`)
```

#### If you call complete training:
**Before**:
```javascript
// Had to ensure ALL phases completed
if (allPhasesAnswered) {
  await completeTraining(businessId);
}
```

**After**:
```javascript
// Only need Basic phase completed
if (basicPhaseCompleted) {
  await completeTraining(businessId);
}
```

## Benefits

### 1. Flexible Training Completion
- Users can complete training after Basic phase
- Standard and Advanced are truly optional
- Better user experience - no forced lengthy questionnaires

### 2. Phase Review Capability
- Users can review previous phase answers
- Edit answers from any phase
- Preview upcoming phase questions

### 3. Better UX for Multi-Phase Training
- Navigate between phases freely
- Clear indication of which phase being viewed
- Easy to build tabbed interfaces

### 4. Reduced Friction
- Minimum viable training (Basic only)
- Users can add more details later (Standard, Advanced)
- Complete training faster

## Files Modified

1. **[aiTraining.service.ts:844-930](src/api/services/aiTraining.service.ts#L844-L930)**
   - Updated `completeTraining` to only validate Basic phase

2. **[aiTraining.service.ts:1147-1341](src/api/services/aiTraining.service.ts#L1147-L1341)**
   - Added `queryPhase` parameter to `getTrainingState`
   - Return questions from queried phase in `currentPhaseData`
   - Added `queriedPhase` field to response

3. **[aiTrainingController.ts:528-586](src/api/controllers/aiTrainingController.ts#L528-L586)**
   - Added phase query parameter handling
   - Added validation for phase parameter

4. **[aiTraining.routes.ts:10-17](src/api/routes/aiTraining.routes.ts#L10-L17)**
   - Updated route documentation
