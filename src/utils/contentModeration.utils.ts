/**
 * Content Moderation Utilities
 * Filters inappropriate content from AI-generated text
 */

// Common profanity and inappropriate words/phrases to filter
const PROFANITY_LIST = [
  // Explicit profanity
  "fuck",
  "shit",
  "ass",
  "damn",
  "bitch",
  "bastard",
  "crap",
  "piss",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "fag",
  "nigger",
  "nigga",
  // Variations and common misspellings
  "f*ck",
  "f**k",
  "sh*t",
  "sh!t",
  "a$$",
  "b!tch",
  "d!ck",
  // Drug references (inappropriate for business tags)
  "weed",
  "cocaine",
  "heroin",
  "meth",
  // Violence
  "kill",
  "murder",
  "rape",
  // Other inappropriate
  "xxx",
  "porn",
  "nude",
  "naked",
  "sex",
  "sexy",
];

// Patterns that indicate conversational AI responses (not actual content)
const CONVERSATIONAL_PATTERNS = [
  /^i'm sorry/i,
  /^i apologize/i,
  /^sorry,?\s/i,
  /^unfortunately/i,
  /i need more (specific|details|information)/i,
  /could you (please )?provide/i,
  /please provide/i,
  /i cannot generate/i,
  /i'm unable to/i,
  /i don't have enough/i,
  /more context/i,
  /additional (details|information|context)/i,
  /to generate (accurate|relevant|appropriate)/i,
  /what (type|kind) of/i,
  /can you (tell|provide|give)/i,
  /would you like me to/i,
  /let me know/i,
];

/**
 * Check if a string contains profanity
 */
export function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some((word) => {
    // Check for whole word match or word boundaries
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return regex.test(lowerText);
  });
}

/**
 * Check if text is a conversational AI response (not actual content)
 */
export function isConversationalResponse(text: string): boolean {
  return CONVERSATIONAL_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Filter out inappropriate tags from an array
 * Also enforces tag length limit (20 chars max) and max count (5 tags)
 */
export function filterInappropriateTags(tags: string[]): string[] {
  return tags
    .filter((tag) => {
      // Filter out profanity
      if (containsProfanity(tag)) {
        return false;
      }

      // Filter out single character tags (like "e", "a" from the screenshot)
      if (tag.trim().length <= 1) {
        return false;
      }

      // Filter out conversational responses
      if (isConversationalResponse(tag)) {
        return false;
      }

      // Filter out tags longer than 20 characters
      if (tag.trim().length > 20) {
        return false;
      }

      return true;
    })
    .slice(0, 5); // Enforce max 5 tags
}

/**
 * Filter out inappropriate or conversational titles from an array
 */
export function filterInappropriateTitles(titles: string[]): string[] {
  return titles.filter((title) => {
    // Filter out profanity
    if (containsProfanity(title)) {
      return false;
    }

    // Filter out conversational AI responses
    if (isConversationalResponse(title)) {
      return false;
    }

    // Filter out very short titles (less than 3 words or 10 chars)
    const wordCount = title.trim().split(/\s+/).length;
    if (wordCount < 2 || title.trim().length < 10) {
      return false;
    }

    return true;
  });
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
