# AI Training - 3 Phase Structure

## Overview

The AI training questionnaire has been refactored into **3 progressive phases** to optimize user experience and training quality:

1. **Basic Phase** - Quick onboarding (3-5 minutes)
2. **Standard Phase** - Detailed insights (8-12 minutes)
3. **Advanced Phase** - Comprehensive optimization (15-20 minutes)

---

## Phase Breakdown

### **Phase 1: Basic**
**5 Essential Questions | 3-5 minutes | Minimum for AI to function**

This phase captures the absolute essentials to get the AI agent operational quickly.

#### Questions:
1. **business_name** - What is your business name?
2. **business_description** - Brief description of business and what makes it unique
3. **target_audience** - Primary target audience (multi-select)
4. **marketing_goals** - Primary marketing goals (multi-select)
5. **typical_discount_range** - Comfortable discount range (multiple choice)

#### Purpose:
- Ultra-fast onboarding for impatient users
- Minimum viable training data
- AI can generate basic promotions
- All other questions auto-filled with smart defaults

#### API Endpoint:
```bash
GET /ai/training/initialize-minimal/:businessId
```

---

### **Phase 2: Standard**
**~25 Core Questions | 8-12 minutes | Recommended for most businesses**

This phase adds crucial operational and customer insight questions that significantly improve AI performance.

#### Question Categories:
- **Brand & Identity** (2 questions)
  - brand_voice
  - customer_income_level

- **Operations & Timing** (6 questions)
  - operating_hours
  - busiest_days
  - busiest_hours
  - slow_periods
  - seasonal_relevance
  - important_seasons

- **Marketing History** (2 questions)
  - previous_successful_promotions
  - competitor_awareness

- **Industry-Specific Core** (~15 questions, varies by industry)
  - Food & Drink: cuisine_type, dining_style, menu_highlights, dietary_options, meal_periods, etc.
  - Retail: product_categories, price_range, bestsellers, seasonal_products, loyalty_program
  - Health & Beauty: services_offered, service_duration, booking_system, first_time_specials
  - Fitness: membership_structure, class_schedule
  - And more...

#### Purpose:
- Balanced approach: quality vs. time investment
- Significant improvement in AI promotion quality
- Captures business patterns and preferences
- Industry-specific customization begins

#### API Endpoint:
```bash
GET /ai/training/initialize/:businessId
```

---

### **Phase 3: Advanced**
**~99 Total Questions | 15-20 minutes | For maximum AI optimization**

This phase includes ALL questions for businesses that want the most accurate and customized AI behavior.

#### Question Categories:
- **Subcategory-Specific Details**
  - Restaurant: seating, reservations
  - Cafe: work-friendly, WiFi
  - Bakery: specialties, custom orders
  - Bar: type, entertainment options
  - Electronics: warranty, repairs
  - Apparel: style, demographics
  - Salon: specialties
  - Spa: massage types
  - And all other subcategories...

- **Advanced Operations**
  - Inventory management
  - Capacity and utilization rates
  - Booking lead times
  - Cancellation policies
  - Scheduling flexibility

- **Deep Customer Insights**
  - Customer visit frequency
  - Group sizes served
  - Event types catered to
  - Special occasions focus
  - Experience levels

- **Advanced Marketing**
  - Package deals and bundles
  - Loyalty/referral programs
  - Membership structures
  - Trial offers
  - Referral sources

#### Purpose:
- Maximum AI customization
- Handles edge cases and nuances
- Optimal promotion timing and targeting
- Comprehensive business understanding
- Best results for complex businesses

#### API Endpoint:
```bash
GET /ai/training/questions?industry=...&subCategory=...&phase=advanced
```

---

## Progressive Training Flow

### Recommended User Journey

```
Start → Phase 1 (Basic) → AI Starts Working
           ↓
        User tests AI
           ↓
     Prompted to upgrade
           ↓
   Phase 2 (Standard) → Improved AI Performance
           ↓
     (Optional) Phase 3 (Advanced) → Maximum Optimization
```

### Implementation Options

#### Option A: Sequential Phases
Users complete Phase 1, then later prompted to complete Phase 2, then Phase 3.

```typescript
// Phase 1 - Immediate
await initializeMinimalTraining(businessId);
// 5 questions, user answers, AI is operational

// Phase 2 - After 1-2 days
showUpgradePrompt("Improve your AI with 20 more questions");
await upgradeToStandardTraining(businessId);

// Phase 3 - After 1-2 weeks
showUpgradePrompt("Unlock advanced AI features");
await upgradeToAdvancedTraining(businessId);
```

#### Option B: User Choice Upfront
Users choose their commitment level at the start.

```typescript
const trainingLevel = await askUserPreference();
// "Quick Start" → Phase 1
// "Standard Setup" → Phase 1 + 2
// "Complete Setup" → All phases
```

#### Option C: Adaptive/Smart
AI determines when to prompt for more information based on usage patterns.

```typescript
if (aiUsageCount > 50 && trainingPhase === 1) {
  promptPhase2Upgrade("You're using the AI a lot! Improve results with more training.");
}
```

---

## Database Schema

### Training Document Structure

```typescript
{
  businessId: ObjectId,
  industry: string,
  subCategory: string,
  trainingPhase: 1 | 2 | 3,  // NEW FIELD
  trainingStatus: "not_started" | "in_progress" | "completed",
  responses: [
    {
      questionId: string,
      answer: any,
      phase: 1 | 2 | 3,  // NEW FIELD - which phase this question belongs to
      answeredAt: Date
    }
  ],
  metadata: {
    phase1Complete: boolean,  // NEW
    phase2Complete: boolean,  // NEW
    phase3Complete: boolean,  // NEW
    totalQuestions: number,
    answeredQuestions: number,
    completionPercentage: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

### New Endpoints Needed

```bash
# Initialize specific phase
GET /ai/training/initialize/:businessId?phase=1|2|3

# Upgrade to next phase
POST /ai/training/upgrade-phase
Body: { businessId: string, targetPhase: 2 | 3 }

# Get questions for specific phase only
GET /ai/training/questions/:phase?industry=...&subCategory=...

# Check phase completion status
GET /ai/training/phase-status/:businessId
Response: {
  phase1: { complete: true, questionsAnswered: 5/5 },
  phase2: { complete: false, questionsAnswered: 10/25 },
  phase3: { complete: false, questionsAnswered: 0/99 }
}
```

---

## Benefits of 3-Phase Structure

### For Users:
✅ **Immediate value** - AI works after just 5 questions
✅ **No commitment pressure** - Start small, expand later
✅ **Clear progression** - Know exactly what each phase offers
✅ **Flexible time investment** - Complete phases when convenient
✅ **Visible improvements** - See AI get better with each phase

### For Business:
✅ **Higher completion rates** - Users don't abandon long forms
✅ **Better data quality** - Users more thoughtful in later phases
✅ **Upsell opportunity** - Natural progression to premium features
✅ **Usage insights** - Track which phase users reach
✅ **Conversion funnel** - Optimize each phase independently

### For AI Performance:
✅ **Minimum viable data** - Phase 1 ensures AI can function
✅ **Incremental improvement** - Each phase adds specific capabilities
✅ **Context accumulation** - Later phases build on earlier answers
✅ **Smart defaults work better** - More data = better auto-fill

---

## Implementation Checklist

### Phase 1: Backend Updates
- [ ] Add `trainingPhase` field to Training model
- [ ] Add `phase` field to each response object
- [ ] Update `getEssentialQuestions()` to return Phase 1 questions
- [ ] Update `getRequiredQuestions()` to return Phase 2 questions
- [ ] Create `getAdvancedQuestions()` for Phase 3
- [ ] Create new endpoint: `GET /ai/training/initialize/:businessId?phase=1|2|3`
- [ ] Create new endpoint: `POST /ai/training/upgrade-phase`
- [ ] Create new endpoint: `GET /ai/training/phase-status/:businessId`
- [ ] Update `validateTrainingData()` to check phase completion
- [ ] Update `getSmartDefaults()` to improve with more data

### Phase 2: Frontend Updates
- [ ] Update training flow UI to show phases
- [ ] Add phase progress indicators (1/3, 2/3, 3/3)
- [ ] Create "Upgrade Training" prompts
- [ ] Add phase benefits explanation modal
- [ ] Create phase selection screen
- [ ] Update question forms to handle phase-specific questions
- [ ] Add "Skip to Phase X" option (if allowed)
- [ ] Show AI improvement preview between phases

### Phase 3: Testing & Migration
- [ ] Test all three phase flows
- [ ] Migrate existing training data to phase structure
- [ ] Test upgrade paths (1→2, 2→3, 1→3)
- [ ] Test smart defaults with partial data
- [ ] Load test API endpoints
- [ ] Document all phase-related APIs
- [ ] Create migration guide for existing businesses

---

## Sample User Flows

### Flow 1: Minimal Commitment User
```
Day 1: Complete Phase 1 (5 questions) → AI activated
Day 3: Sees prompt "Improve AI accuracy" → Dismisses
Day 7: AI suggests "Answer 10 more questions for better deals" → Ignores
Day 14: Happy with basic AI, never upgrades
Result: ✅ User retained, basic AI working
```

### Flow 2: Standard User (Most Common)
```
Day 1: Complete Phase 1 (5 questions) → AI activated
Day 2: Tests AI, likes it, sees upgrade prompt
Day 2: Completes Phase 2 (25 questions) → AI significantly improved
Day 30: Doesn't need Phase 3, satisfied with results
Result: ✅ Optimal balance of effort/quality
```

### Flow 3: Power User
```
Day 1: Sees phase options, chooses "Complete Setup"
Day 1: Completes Phase 1 → sees improvement
Day 1: Completes Phase 2 → sees more improvement
Day 1: Completes Phase 3 → Maximum AI performance
Result: ✅ Best possible AI from day 1
```

---

## Phase Comparison Table

| Metric | Phase 1: Basic | Phase 2: Standard | Phase 3: Advanced |
|--------|---------------|-------------------|-------------------|
| **Questions** | 5 | ~30 (5+25) | ~130 (5+25+99) |
| **Time Required** | 3-5 min | 11-17 min | 26-37 min |
| **AI Accuracy** | 60-70% | 85-90% | 95-99% |
| **Promotion Quality** | Good | Very Good | Excellent |
| **Timing Precision** | Basic | Accurate | Highly Accurate |
| **Customer Targeting** | General | Specific | Highly Specific |
| **Edge Cases** | Not handled | Most handled | All handled |
| **Customization** | Low | Medium | Maximum |
| **Setup Effort** | Minimal | Moderate | Comprehensive |
| **Best For** | Quick start | Most businesses | Complex businesses |
| **Completion Rate** | 95%+ | 70-80% | 40-50% |

---

## Technical Notes

### Question Distribution
- **Phase 1**: 5 questions (all core, all industries)
- **Phase 2**: 25 questions (core + industry common)
- **Phase 3**: 99 questions (industry-specific + subcategory-specific)

### Smart Defaults Behavior
- **Phase 1**: All non-essential questions get defaults
- **Phase 2**: Industry-specific questions get refined defaults
- **Phase 3**: Subcategory-specific questions optionally answered

### Migration Strategy
Existing trainings can be automatically assigned:
- If `answeredQuestions <= 10` → Phase 1
- If `answeredQuestions <= 40` → Phase 2
- If `answeredQuestions > 40` → Phase 3

---

## Next Steps

1. **Review & Approve** this structure
2. **Update TypeScript types** in `AI_Training_questionnaire.ts`
3. **Implement backend** phase logic
4. **Design UI/UX** for phase progression
5. **Test** with real users
6. **Iterate** based on completion rates and AI performance

---

**Questions or feedback?** Review the CSV file: `ai_questionnaire_questions_3_phases.csv`
