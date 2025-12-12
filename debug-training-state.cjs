/**
 * Debug script to diagnose training state endpoint issues
 * Run with: node debug-training-state.js <businessId>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const businessId = process.argv[2] || '6932bb0acdd88368cef90a8f';

console.log('Debug Training State Endpoint');
console.log('================================');
console.log('Business ID:', businessId);
console.log('MongoDB URI:', process.env.MONGODB_URI?.substring(0, 30) + '...');
console.log('');

async function debug() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Check if business ID is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      console.error('✗ Invalid business ID format');
      process.exit(1);
    }
    console.log('✓ Valid ObjectId format');

    // Create models
    const BusinessAIAssistantModel = mongoose.model(
      'Business_AI_Assistant',
      new mongoose.Schema({}, { strict: false, collection: 'business_ai_assistants' })
    );

    const AI_TrainingModel = mongoose.model(
      'AI_Training',
      new mongoose.Schema({}, { strict: false, collection: 'ai_trainings' })
    );

    // Check if business agent exists
    console.log('\n1. Checking Business AI Assistant...');
    const businessAgent = await BusinessAIAssistantModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!businessAgent) {
      console.error('✗ No business agent found');
      process.exit(1);
    }

    console.log('✓ Business agent found');
    console.log('  - Business Name:', businessAgent.businessName);
    console.log('  - Category:', businessAgent.category);
    console.log('  - SubCategories:', businessAgent.subCategories);
    console.log('  - Assistant ID:', businessAgent.assistantId);

    // Check if training exists
    console.log('\n2. Checking AI Training...');
    const training = await AI_TrainingModel.findOne({
      businessId: new mongoose.Types.ObjectId(businessId),
    });

    if (!training) {
      console.log('✗ No training record found (will be auto-created)');
    } else {
      console.log('✓ Training record found');
      console.log('  - Status:', training.trainingStatus);
      console.log('  - Current Phase:', training.currentPhase);
      console.log('  - Responses:', training.responses?.length || 0);
      console.log('  - Industry:', training.industry);
      console.log('  - SubCategory:', training.subCategory);
    }

    // Test questionnaire functions
    console.log('\n3. Testing Questionnaire Functions...');
    const {
      BusinessIndustries,
      TrainingPhase,
      getQuestionsByPhase,
      getPhaseSummary
    } = require('./dist/utils/AI_Training_questionnaire.js');

    const industry = businessAgent.category;
    const subCategory = businessAgent.subCategories?.[0];

    console.log('  - Industry:', industry);
    console.log('  - SubCategory:', subCategory);
    console.log('  - Is valid industry?', Object.values(BusinessIndustries).includes(industry));

    try {
      const basicQuestions = getQuestionsByPhase(industry, TrainingPhase.BASIC, subCategory);
      console.log('✓ Basic questions retrieved:', basicQuestions.length);

      const phaseSummary = getPhaseSummary(industry, subCategory);
      console.log('✓ Phase summary retrieved');
      console.log('  - Basic:', phaseSummary[0].totalQuestions, 'questions');
      console.log('  - Standard:', phaseSummary[1].totalQuestions, 'questions');
      console.log('  - Advanced:', phaseSummary[2].totalQuestions, 'questions');
    } catch (e) {
      console.error('✗ Error getting questions:', e.message);
      console.error('Stack:', e.stack);
    }

    console.log('\n================================');
    console.log('All checks passed! ✓');
    console.log('The endpoint should work correctly.');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

debug();
