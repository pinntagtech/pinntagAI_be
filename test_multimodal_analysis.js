/**
 * Test script for multimodal AI analysis with image-first priority
 * Tests the critical case: James Beard Award text + Missing Child image
 */

const testPosts = [
  {
    id: "891155750750459_122102099991163991",
    name: "Post 1: Missing Child Alert",
    full_picture: "https://scontent-bom5-1.xx.fbcdn.net/v/t39.30808-6/598752097_122102099865163991_2053151929774550737_n.jpg",
    message: "HEADLINE: 🚨 URGENT MISSING CHILD ALERT — PLEASE SHARE 🚨\nWe are asking the community to immediately look out for a missing 12-year-old boy...",
    expected: {
      suitable: false,
      scoreRange: "0-10",
      reason: "Missing child alert with poster image"
    }
  },
  {
    id: "891155750750459_122102084271163991",
    name: "Post 2: James Beard Award (CRITICAL TEST - Same image as Post 1)",
    full_picture: "https://scontent-bom5-1.xx.fbcdn.net/v/t39.30808-6/598752097_122102099865163991_2053151929774550737_n.jpg", // SAME URL as Post 1
    message: "We are absolutely thrilled and incredibly honored to announce that Teddy Jack's has won the prestigious James Beard Award for Best New Restaurant! 🏆✨",
    expected: {
      suitable: false,
      scoreRange: "0-10",
      reason: "Image shows missing person poster despite award text - IMAGE OVERRIDES TEXT"
    }
  },
  {
    id: "891155750750459_122102075331163991",
    name: "Post 3: Useless Post",
    full_picture: "https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/598244787_122102075265163991_4182734397720814471_n.jpg",
    message: "This is a useless post",
    expected: {
      suitable: false,
      scoreRange: "0-30",
      reason: "No business value, generic content"
    }
  },
  {
    id: "891155750750459_122101940817163991",
    name: "Post 4: Chocolate Sale (25% OFF)",
    full_picture: "https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/601425936_122101940319163991_6885420187816078751_n.jpg",
    message: "Get ready to indulge! 🍫 It's National Chocolate Covered Anything Day, and we're celebrating at Teddy Jack's!\n\nToday only, enjoy **25% OFF**...",
    expected: {
      suitable: true,
      scoreRange: "85-95",
      reason: "Clear promotion with discount offer and food imagery"
    }
  },
  {
    id: "891155750750459_832488546325842",
    name: "Post 5: Cover Photo Update (No Message)",
    full_picture: "https://scontent-bom5-2.xx.fbcdn.net/v/t39.30808-6/597979597_122101911249163991_1378063834324512345_n.jpg",
    message: undefined,
    expected: {
      suitable: false,
      scoreRange: "0-40",
      reason: "Profile/cover update without business message"
    }
  },
  {
    id: "891155750750459_122101908111163991",
    name: "Post 6: Profile Picture Update (No Message)",
    full_picture: "https://scontent-bom2-4.xx.fbcdn.net/v/t39.30808-6/600278577_2512422839152363_6579703517260193325_n.jpg",
    message: undefined,
    expected: {
      suitable: false,
      scoreRange: "0-40",
      reason: "Profile/cover update without business message"
    }
  }
];

console.log("═══════════════════════════════════════════════════════════");
console.log("🧪 MULTIMODAL AI TEST - Image-First Priority");
console.log("═══════════════════════════════════════════════════════════\n");

console.log("⚠️  CRITICAL TEST CASE:");
console.log("Post 2 has 'James Beard Award' text BUT same image URL as Post 1 (missing child poster)");
console.log("Expected: AI should REJECT Post 2 because IMAGE OVERRIDES TEXT\n");

testPosts.forEach((post, index) => {
  console.log(`\n${index + 1}. ${post.name}`);
  console.log("─".repeat(60));
  console.log(`   Post ID: ${post.id}`);
  console.log(`   Image URL: ${post.full_picture?.substring(0, 80)}...`);
  console.log(`   Message: ${post.message?.substring(0, 80)}...`);
  console.log(`   \n   ✅ Expected Result:`);
  console.log(`      - Suitable: ${post.expected.suitable}`);
  console.log(`      - Score Range: ${post.expected.scoreRange}`);
  console.log(`      - Reason: ${post.expected.reason}`);
});

console.log("\n\n═══════════════════════════════════════════════════════════");
console.log("📋 TEST SUMMARY");
console.log("═══════════════════════════════════════════════════════════");
console.log("Total Posts: 6");
console.log("Expected REJECTED: 5 posts (Posts 1, 2, 3, 5, 6)");
console.log("Expected ACCEPTED: 1 post (Post 4 - Chocolate sale)");
console.log("\n🎯 KEY TEST: Post 2 must be REJECTED despite 'James Beard Award' text");
console.log("   because the image shows a missing child poster (same URL as Post 1)");
console.log("═══════════════════════════════════════════════════════════\n");
