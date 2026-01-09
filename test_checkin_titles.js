/**
 * Test script for Check-In Title Suggestions API
 *
 * This API generates 10 AI-suggested check-in titles (7-8 characters each with emoji)
 * based on the business's metadata (tags, description, category, subcategories)
 *
 * Usage:
 *   node test_checkin_titles.js
 *
 * Environment variables:
 *   - API_BASE_URL (default: http://localhost:3000)
 *   - BUSINESS_ID (required)
 *   - API_KEY (optional, if auth is enabled)
 */

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
const businessId = process.env.BUSINESS_ID || 'YOUR_BUSINESS_ID_HERE';
const apiKey = process.env.API_KEY;

async function testCheckInTitleGeneration() {
  console.log('🧪 Testing Check-In Title Generation API\n');
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Business ID: ${businessId}\n`);
  console.log('=' .repeat(60));
  console.log('\n📝 Generating AI-suggested check-in titles...\n');
  console.log('The API will:');
  console.log('  - Analyze business metadata (name, description, category, tags)');
  console.log('  - Generate 10 unique titles');
  console.log('  - Each title will be 7-8 characters long');
  console.log('  - Each title will include a relevant emoji\n');
  console.log('=' .repeat(60) + '\n');

  await makeRequest({ businessId });

  console.log('\n✅ Test completed!\n');
}

async function makeRequest(body) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    console.log('📤 Request:');
    console.log(JSON.stringify(body, null, 2));
    console.log('\n⏳ Waiting for AI to generate titles...\n');

    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/checkin/suggest-titles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const data = await response.json();

    console.log('📥 Response:');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Duration: ${duration}s\n`);

    if (response.ok) {
      console.log('✅ Success!\n');

      if (data.metadata) {
        console.log('📊 Metadata:');
        console.log(`  Business: ${data.metadata.businessName}`);
        console.log(`  Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}`);
        console.log('');
      }

      if (data.suggestions && data.suggestions.length > 0) {
        console.log(`🎯 Generated ${data.suggestions.length} Check-In Titles:\n`);

        data.suggestions.forEach((suggestion, index) => {
          // Extract title without emoji for length validation
          const titleWithoutEmoji = suggestion.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
          const titleLength = titleWithoutEmoji.replace(/\s/g, '').length;
          const lengthIndicator = titleLength >= 6 && titleLength <= 8 ? '✓' : '✗';
          console.log(`  ${index + 1}.  ${suggestion}`);
          console.log(`      └─ Length: ${titleLength} chars ${lengthIndicator}`);
        });

        console.log('\n📈 Validation:');
        const validTitles = data.suggestions.filter(s => {
          const titleWithoutEmoji = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
          const len = titleWithoutEmoji.replace(/\s/g, '').length;
          const hasEmoji = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(s);
          return len >= 6 && len <= 8 && hasEmoji;
        });
        console.log(`  Valid titles (7-8 chars + emoji): ${validTitles.length}/${data.suggestions.length}`);

        if (validTitles.length === data.suggestions.length) {
          console.log('  ✅ All titles meet requirements!');
        } else {
          console.log('  ⚠️  Some titles do not meet the 7-8 character requirement');
        }
      } else {
        console.log('⚠️  No suggestions returned');
      }
    } else {
      console.log('❌ Error!\n');
      console.log('Error Details:');
      console.log(JSON.stringify(data, null, 2));

      if (data.error && data.error.includes('Business AI assistant not found')) {
        console.log('\n💡 Tip: Make sure to create an AI assistant for this business first:');
        console.log('   POST /ai/create-agent');
      }
    }
  } catch (error) {
    console.log('❌ Request failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('fetch')) {
      console.log('\n💡 Tip: Make sure the API server is running at', baseUrl);
    }
  }
}

// Run test
console.log('\n');
testCheckInTitleGeneration().catch(console.error);
