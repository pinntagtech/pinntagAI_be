/**
 * Migration script to fix training completion percentage bug
 *
 * Problem: Old training records have totalQuestions set to the filtered count
 * (excluding prefilled questions), causing completion percentage to exceed 100%
 *
 * Solution: Recalculate totalQuestions to include ALL questions in the basic phase
 *
 * Run with: node fix-training-percentage.cjs
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixTrainingPercentages() {
  try {
    console.log('Fixing training completion percentages...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Create models
    const AI_TrainingModel = mongoose.model(
      'AI_Training',
      new mongoose.Schema({}, { strict: false, collection: 'ai_trainings' })
    );

    // Import questionnaire utilities
    const {
      BusinessIndustries,
      TrainingPhase,
      getQuestionsByPhase,
    } = require('./dist/utils/AI_Training_questionnaire.js');

    // Get all training records
    const trainings = await AI_TrainingModel.find({});
    console.log(`Found ${trainings.length} training records\n`);

    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    let errorCount = 0;

    for (const training of trainings) {
      try {
        const businessId = training.businessId.toString();
        const industry = training.industry;
        const subCategory = training.subCategory;

        // Get the correct total questions for basic phase
        const basicQuestions = getQuestionsByPhase(
          industry,
          TrainingPhase.BASIC,
          subCategory
        );
        const correctTotal = basicQuestions.length;
        const currentTotal = training.metadata?.totalQuestions || 0;
        const answeredCount = training.responses?.length || 0;

        // Calculate current and correct percentages
        const currentPercentage = training.metadata?.completionPercentage || 0;
        const correctPercentage = Math.min(
          Math.round((answeredCount / correctTotal) * 100),
          100
        );

        if (currentTotal !== correctTotal || currentPercentage > 100) {
          console.log(`Fixing training for business ${businessId}:`);
          console.log(`  Industry: ${industry}`);
          console.log(`  Old totalQuestions: ${currentTotal} → ${correctTotal}`);
          console.log(`  Answered: ${answeredCount}`);
          console.log(`  Old percentage: ${currentPercentage}% → ${correctPercentage}%`);

          // Update the training record
          training.metadata.totalQuestions = correctTotal;
          training.metadata.completionPercentage = correctPercentage;
          await training.save();

          fixedCount++;
          console.log('  ✓ Fixed\n');
        } else {
          alreadyCorrectCount++;
        }
      } catch (error) {
        console.error(`✗ Error fixing training ${training._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Migration Summary:');
    console.log(`  Total records: ${trainings.length}`);
    console.log(`  Fixed: ${fixedCount}`);
    console.log(`  Already correct: ${alreadyCorrectCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixTrainingPercentages();
