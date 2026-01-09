/**
 * Test Event & Deal Extraction from Facebook Posts and Events
 * Tests both the posts array and the events array
 */

const testData = {
  "id": "891155750750459",
  "name": "Teddy Jack's Hub City Grill",
  "posts": {
    "data": [
      {
        "id": "891155750750459_804347802624433",
        "full_picture": "https://scontent-bom2-3.xx.fbcdn.net/v/t39.30808-6/598836237_122103036231163991_9046407068210675651_n.jpg",
        "message": undefined, // No message
        "note": "Post with no message - image only (likely event flyer)"
      },
      {
        "id": "891155750750459_122102084271163991",
        "full_picture": "https://scontent-bom5-1.xx.fbcdn.net/v/t39.30808-6/598133747_122102084103163991_3883448462504456450_n.jpg",
        "message": "We are absolutely thrilled and incredibly honored to announce that Teddy Jack's has won the prestigious James Beard Award for Best New Restaurant! 🏆✨",
        "note": "James Beard Award announcement with award image"
      },
      {
        "id": "891155750750459_122102075331163991",
        "full_picture": "https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/598244787_122102075265163991_4182734397720814471_n.jpg",
        "message": "This is a useless post",
        "note": "Generic useless post"
      },
      {
        "id": "891155750750459_122101940817163991",
        "full_picture": "https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/601425936_122101940319163991_6885420187816078751_n.jpg",
        "message": "Get ready to indulge! 🍫 It's National Chocolate Covered Anything Day, and we're celebrating at Teddy Jack's!\n\nToday only, enjoy **25% OFF** any of our delicious chocolate-covered treats!",
        "note": "Promotional deal - 25% OFF chocolate treats"
      },
      {
        "id": "891155750750459_832488546325842",
        "full_picture": "https://scontent-bom5-2.xx.fbcdn.net/v/t39.30808-6/597979597_122101911249163991_1378063834324512345_n.jpg",
        "message": undefined, // No message
        "note": "Cover photo update - no message"
      },
      {
        "id": "891155750750459_122101908111163991",
        "full_picture": "https://scontent-bom2-4.xx.fbcdn.net/v/t39.30808-6/600278577_2512422839152363_6579703517260193325_n.jpg",
        "message": undefined, // No message
        "note": "Profile picture update - no message"
      }
    ]
  },
  "events": {
    "data": [
      {
        "id": "804347802624433",
        "name": "Live music 🎶 during happy hour ft. Karan Aujla",
        "description": "Karan Aujla on his It was all a dream tour features at Teddy jack's. Grab your tickets now from the reception.",
        "cover": {
          "source": "https://scontent-bom2-3.xx.fbcdn.net/v/t39.30808-6/598836237_122103036231163991_9046407068210675651_n.jpg",
          "offset_x": 50,
          "offset_y": 100
        },
        "is_canceled": false,
        "is_online": false,
        "is_draft": false,
        "note": "Structured Facebook Event with live music + happy hour"
      }
    ]
  }
};

console.log("═══════════════════════════════════════════════════════════");
console.log("🎯 EVENT & DEAL EXTRACTION TEST");
console.log("═══════════════════════════════════════════════════════════\n");

console.log(`Business: ${testData.name} (ID: ${testData.id})\n`);

// ============================================================================
// FACEBOOK EVENTS ANALYSIS
// ============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📅 FACEBOOK EVENTS (Structured Data)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

if (testData.events?.data?.length > 0) {
  testData.events.data.forEach((event, index) => {
    console.log(`Event ${index + 1}: ${event.name}`);
    console.log("─".repeat(60));
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Name: ${event.name}`);
    console.log(`   Description: ${event.description}`);
    console.log(`   Cover Image: ${event.cover.source.substring(0, 60)}...`);
    console.log(`   Status: Canceled=${event.is_canceled}, Online=${event.is_online}, Draft=${event.is_draft}`);
    console.log(`   \n   ✅ Expected Result:`);
    console.log(`      - Source: Facebook Events API (structured data)`);
    console.log(`      - Suitable: YES (high confidence)`);
    console.log(`      - Category: Event`);
    console.log(`      - Extraction: Name, description, cover image already structured`);
    console.log(`      - Note: ${event.note}\n`);
  });
} else {
  console.log("   No Facebook Events found\n");
}

// ============================================================================
// POSTS ANALYSIS (AI + OCR Required)
// ============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📰 FACEBOOK POSTS (Require AI + OCR Analysis)");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

testData.posts.data.forEach((post, index) => {
  console.log(`Post ${index + 1}:`);
  console.log("─".repeat(60));
  console.log(`   Post ID: ${post.id}`);
  console.log(`   Message: ${post.message ? post.message.substring(0, 60) + "..." : "(no message)"}`);
  console.log(`   Image URL: ${post.full_picture.substring(0, 60)}...`);
  console.log(`   Note: ${post.note}`);

  // Determine expected result
  let expected = {};

  if (post.id === "891155750750459_804347802624433") {
    // Post 1: No message, but image likely contains event flyer
    expected = {
      suitable: true,
      scoreRange: "80-95",
      category: "event",
      reason: "Image-only post with event flyer (AI will read text from image using OCR). Likely matches Facebook Event #804347802624433."
    };
  } else if (post.id === "891155750750459_122102084271163991") {
    // Post 2: James Beard Award with different image (not missing child poster)
    expected = {
      suitable: true,
      scoreRange: "75-85",
      category: "announcement",
      reason: "Business achievement announcement with award certificate image. Text and image are aligned."
    };
  } else if (post.id === "891155750750459_122102075331163991") {
    // Post 3: Useless post
    expected = {
      suitable: false,
      scoreRange: "5-20",
      category: "other",
      reason: "Generic post with no business value or promotional content"
    };
  } else if (post.id === "891155750750459_122101940817163991") {
    // Post 4: 25% OFF chocolate promotion
    expected = {
      suitable: true,
      scoreRange: "90-98",
      category: "promotion",
      reason: "Clear promotional deal with 25% discount on chocolate treats. Highly suitable for deal extraction."
    };
  } else if (post.id === "891155750750459_832488546325842") {
    // Post 5: Cover photo update, no message
    expected = {
      suitable: false,
      scoreRange: "10-30",
      category: "other",
      reason: "Cover photo update without message or promotional content in image"
    };
  } else if (post.id === "891155750750459_122101908111163991") {
    // Post 6: Profile picture update, no message
    expected = {
      suitable: false,
      scoreRange: "10-30",
      category: "other",
      reason: "Profile picture update without message or promotional content in image"
    };
  }

  console.log(`   \n   ${expected.suitable ? '✅' : '❌'} Expected Result:`);
  console.log(`      - Suitable: ${expected.suitable ? 'YES' : 'NO'}`);
  console.log(`      - Score Range: ${expected.scoreRange}`);
  console.log(`      - Category: ${expected.category}`);
  console.log(`      - Reason: ${expected.reason}\n`);
});

// ============================================================================
// CRITICAL TEST: Post vs Event Correlation
// ============================================================================
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔗 POST vs EVENT CORRELATION");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("⚠️  IMPORTANT OBSERVATION:");
console.log("Post ID: 891155750750459_804347802624433");
console.log("Event ID: 804347802624433");
console.log("");
console.log("The post ID ENDS WITH the event ID!");
console.log("This suggests Post #1 (no message, image only) is the AUTO-GENERATED");
console.log("post that Facebook creates when you create a Facebook Event.\n");

console.log("✅ Expected Behavior:");
console.log("   1. Facebook Event API provides STRUCTURED data:");
console.log("      - Event name: 'Live music 🎶 during happy hour ft. Karan Aujla'");
console.log("      - Description: Full text about Karan Aujla tour");
console.log("      - Cover image: Event flyer");
console.log("      - Status flags: is_canceled, is_online, is_draft");
console.log("");
console.log("   2. Post #1 (auto-generated) provides VISUAL data:");
console.log("      - Image: Event flyer (same as event cover)");
console.log("      - Message: Empty (Facebook doesn't auto-generate message)");
console.log("      - AI will use OCR to read text from the flyer image");
console.log("");
console.log("   3. BEST PRACTICE:");
console.log("      - PREFER Facebook Events API for structured event data");
console.log("      - Use Post analysis with OCR as FALLBACK for events posted as images");
console.log("      - If post ID ends with event ID, skip OCR and use Event API data");

// ============================================================================
// SUMMARY
// ============================================================================
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📊 EXTRACTION SUMMARY");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("Expected Extraction Results:");
console.log("  📅 Events: 1 (from Facebook Events API - structured)");
console.log("     - Live music during happy hour ft. Karan Aujla");
console.log("");
console.log("  🎁 Deals: 1 (from Posts with AI analysis)");
console.log("     - 25% OFF chocolate treats");
console.log("");
console.log("  ✅ Suitable Posts: 2/6");
console.log("     - Post #1: Event flyer (correlates with Event API)");
console.log("     - Post #2: James Beard Award announcement");
console.log("     - Post #4: 25% OFF chocolate promotion");
console.log("");
console.log("  ❌ Rejected Posts: 4/6");
console.log("     - Post #3: Useless post");
console.log("     - Post #5: Cover photo update (no promotional content)");
console.log("     - Post #6: Profile picture update (no promotional content)");
console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🎯 KEY INSIGHTS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("1. 📅 Facebook Events API (Structured):");
console.log("   - Best source for events with structured data");
console.log("   - Already has name, description, dates, location");
console.log("   - No OCR needed");
console.log("");

console.log("2. 📰 Posts with OCR (Unstructured):");
console.log("   - Fallback for events posted as images");
console.log("   - AI reads text from event flyers/posters");
console.log("   - Can handle posts without messages");
console.log("");

console.log("3. 🔗 Post-Event Correlation:");
console.log("   - When post ID ends with event ID → same event");
console.log("   - Avoid duplicate extraction");
console.log("   - Prefer structured Event API data over OCR");
console.log("");

console.log("4. 🎁 Deal Extraction:");
console.log("   - Deals are usually in posts (not Events API)");
console.log("   - AI identifies promotional content (discounts, BOGO, etc.)");
console.log("   - Can extract from images with OCR");
console.log("");

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
