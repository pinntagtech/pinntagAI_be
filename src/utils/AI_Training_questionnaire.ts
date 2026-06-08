/*
    AI_Training_questionnaire.ts
    This file contains the structure and types for the AI training questionnaire used to gather information from businesses.
*/

export enum TrainingPhase {
  BASIC = "basic",
  STANDARD = "standard",
  ADVANCED = "advanced",
}

export interface AI_Training_Questionnaire_Type {
  id: string;
  question: string;
  type:
    | "text"
    | "multiple_choice"
    | "multi_select"
    | "multi_select_with_text"
    | "number"
    | "time"
    | "boolean";
  /**
   * For "multi_select_with_text" questions: the exact option string that,
   * when selected, reveals a required free-text input field.
   */
  textTriggerOption?: string;
  options?: string[];
  required: boolean;
  category:
    | "business_info"
    | "customer_profile"
    | "operations"
    | "marketing"
    | "goals";
  phase?: TrainingPhase; // Phase this question belongs to (auto-assigned if not provided)
  helpText?: string;
  suggestedAnswers?: string[]; // Pre-selected options based on business context
}

export interface CategoryQuestions {
  industry: BusinessIndustries;
  subCategories?: BusinessSubCategory[];
  commonQuestions: AI_Training_Questionnaire_Type[];
  specificQuestions: AI_Training_Questionnaire_Type[];
}

// MergedCategories (Business Types)
export enum BusinessIndustries {
  ENTERTAINMENT = "Entertainment",
  CLASSES_WORKSHOPS = "Classes and Workshops",
  FOOD_DRINK = "Food & Drink",
  SPORTS_OUTDOOR = "Sports & Outdoor",
  LOCAL_ATTRACTIONS = "Local Attractions",
  RETAIL_SHOPPING = "Retail & Shopping",
  HEALTH_WELLNESS = "Health & Wellness",
  HOME_PROFESSIONAL_SERVICES = "Home & Professional Services",
  PLACES_TO_STAY = "Places to Stay",
  MOBILE_BUSINESSES = "Mobile Businesses",
}

// EventCategories (Event Types)
export enum EventCategories {
  LIVE_MUSIC = "Live Music",
  NIGHTLIFE_MUSIC = "Nightlife & Music",
  COMEDY = "Comedy",
  FILM_THEATRE = "Film & Theatre",
  WORKSHOPS_CLASSES = "Workshops & Classes",
  FOOD_DRINK_SPECIALS = "Food & Drink Specials",
  TRIVIA_QUIZ_NIGHT = "Trivia & Quiz Night",
  WATCH_PARTY = "Watch Party",
  FITNESS_WELLNESS = "Fitness & Wellness",
  SPORTS_ACTIVE_LIFE = "Sports & Active Life",
  OUTDOOR_EXPERIENCE = "Outdoor Experience",
  ARTS_CULTURE = "Arts & Culture",
  SEASONAL_HOLIDAY_FESTIVAL = "Seasonal / Holiday Festival",
  RETAIL_EVENT = "Retail Event",
  MARKET_POPUP = "Market / Pop-up",
  WELLNESS_WORKSHOP = "Wellness Workshop",
  DIY_SKILL_WORKSHOP = "DIY & Skill Workshop",
  LIVE_MUSIC_ENTERTAINMENT = "Live Music & Entertainment",
  SEASONAL_HOLIDAY_EVENT = "Seasonal / Holiday Event",
  GUEST_SOCIAL = "Guest Social",
  FOOD_TRUCKS = "Food Trucks",
}

export enum BusinessSubCategory {
  // Entertainment
  LIVE_MUSIC = "Live Music",
  NIGHTCLUB_DANCE = "Nightclub & Dance",
  COMEDY_CLUB = "Comedy Club",
  CINEMA_THEATER = "Cinema / Theater",
  CULTURAL_ARTS = "Cultural & Arts",
  GAMES_CHALLENGES = "Games & Challenges",
  BOWLING = "Bowling",
  GOLF_MINI_GOLF = "Golf / Mini Golf",
  VR_GAMING = "VR / Gaming",
  ADVENTURE_ACTIVE_FUN = "Adventure & Active Fun",
  ARCADES_AMUSEMENTS = "Arcades & Amusements",

  // Classes and Workshops
  COOKING = "Cooking",
  ART_CRAFT = "Art & Craft",
  DANCE = "Dance",
  MUSIC_PERFORMING_ARTS = "Music / Performing Arts",
  LANGUAGE_CULTURAL = "Language & Cultural",
  SKILL_TRAINING = "Skill Training",

  // Food & Drink
  RESTAURANT = "Restaurant",
  CAFE_COFFEE = "Café / Coffee",
  BAR_PUB = "Bar / Pub",
  BAKERY_DESSERT = "Bakery / Dessert",
  BREWERY_WINERY = "Brewery / Winery",
  FOOD_TRUCK_POPUP = "Food Truck / Pop-up",

  // Sports & Outdoor
  GYM_FITNESS = "Gym / Fitness",
  YOGA_PILATES = "Yoga / Pilates",
  SPORTS_FACILITY = "Sports Facility",
  ADVENTURE_OUTDOOR = "Adventure / Outdoor",
  PARKS_RECREATION = "Parks / Recreation",

  // Local Attractions
  MUSEUM = "Museum",
  ART_GALLERY = "Art Gallery",
  HISTORICAL_SITE_LANDMARK = "Historical Site / Landmark",
  CULTURAL_ATTRACTION = "Cultural Attraction",
  BOTANICAL_GARDEN_PARK = "Botanical Garden / Park",
  ZOO_AQUARIUM = "Zoo / Aquarium",

  // Retail & Shopping
  FASHION_APPAREL = "Fashion & Apparel",
  SHOES_ACCESSORIES = "Shoes & Accessories",
  SPECIALTY_BOUTIQUE = "Specialty / Boutique",
  GROCERY_MARKET = "Grocery / Market",
  POPUP_SEASONAL = "Pop-up / Seasonal",

  // Health & Wellness
  SPA_MASSAGE = "Spa & Massage",
  BEAUTY = "Beauty",
  AESTHETIC = "Aesthetic",
  WELLNESS = "Wellness",
  NAIL = "Nail",
  HAIR = "Hair",
  MED_SPA = "Med spa",

  // Home & Professional Services
  HOME_REPAIR = "Home Repair",
  CLEANING = "Cleaning",
  LANDSCAPING = "Landscaping",
  AUTO_SERVICES = "Auto Services",
  TUTORING = "Tutoring",
  PET_CARE = "Pet Care",
  BUSINESS_PROFESSIONAL = "Business & Professional",

  // Places to Stay
  HOTEL_RESORT = "Hotel / Resort",
  HOSTEL_GUESTHOUSE = "Hostel / Guesthouse",
  BED_BREAKFAST = "Bed & Breakfast",
  SERVICED_APARTMENT = "Serviced Apartment",
  CAMPING_GLAMPING = "Camping / Glamping",

  // Mobile Businesses
  FOOD_TRUCK = "Food Truck",
}

// Event Subcategories
export enum EventSubCategory {
  // Live Music
  BAND_GIG = "Band Gig",
  ACOUSTIC_NIGHT = "Acoustic Night",
  TOURING_ARTIST = "Touring Artist",
  LOCAL_MUSIC_SHOWCASE = "Local Music Showcase",
  ACOUSTIC_SET = "Acoustic Set",
  LIVE_BAND = "Live Band",

  // Nightlife & Music
  DJ_NIGHT = "DJ Night",
  KARAOKE_NIGHT = "Karaoke Night",
  MUSIC_BINGO = "Music Bingo",
  DANCE_PARTY = "Dance Party",

  // Comedy
  STANDUP = "Stand-up",
  IMPROV = "Improv",
  SKETCH_NIGHT = "Sketch Night",

  // Film & Theatre
  MOVIE_SCREENING = "Movie Screening",
  STAGE_PLAY = "Stage Play",
  DANCE_PERFORMANCE = "Dance Performance",

  // Workshops & Classes
  COOKING_CLASS = "Cooking Class",
  MIXOLOGY = "Mixology",
  DANCE_CLASS = "Dance Class",
  ART_CRAFT = "Art & Craft",
  DIY_SKILL_WORKSHOP = "DIY / Skill Workshop",

  // Food & Drink Specials
  HAPPY_HOUR = "Happy Hour",
  CHEF_SPECIAL = "Chef Special",
  TASTING_MENU = "Tasting Menu",
  LIMITED_TIME_MENU = "Limited-time Menu",
  CHEFS_DINNER = "Chef's Dinner",
  WINE_TASTING = "Wine Tasting",
  THEMED_DINING_NIGHT = "Themed Dining Night",

  // Trivia & Quiz Night
  PUB_QUIZ = "Pub Quiz",
  THEMED_TRIVIA = "Themed Trivia",

  // Watch Party
  SPORTS_VIEWING = "Sports Viewing",
  CHAMPIONSHIP_SCREENING = "Championship Screening",
  LIVE_SPORTS_SCREENING = "Live Sports Screening",

  // Fitness & Wellness
  YOGA_SESSION = "Yoga Session",
  GROUP_FITNESS_CLASS = "Group Fitness Class",
  BOOTCAMP = "Bootcamp",
  MEDITATION = "Meditation",
  YOGA = "Yoga",
  PILATES = "Pilates",
  WELLNESS_RETREAT = "Wellness Retreat",
  SPA_DAY = "Spa Day",
  WELLNESS_WEEKEND = "Wellness Weekend",

  // Sports & Active Life
  LOCAL_MATCH = "Local Match",
  TOURNAMENT = "Tournament",
  RECREATIONAL_LEAGUE = "Recreational League",

  // Outdoor Experience
  GUIDED_HIKE = "Guided Hike",
  CYCLING_TOUR = "Cycling Tour",
  ADVENTURE_ACTIVITY = "Adventure Activity",

  // Arts & Culture
  GALLERY_NIGHT = "Gallery Night",
  CULTURAL_SHOWCASE = "Cultural Showcase",
  EXHIBITION_FAIR = "Exhibition / Fair",
  ART_EXHIBITION = "Art Exhibition",
  CULTURAL_FAIR = "Cultural Fair",
  TEMPORARY_EXHIBIT = "Temporary Exhibit",

  // Guided Tour
  MUSEUM_TOUR = "Museum Tour",
  HERITAGE_WALK = "Heritage Walk",

  // Seasonal / Holiday Festival
  CITY_CELEBRATION = "City Celebration",
  HOLIDAY_EVENT = "Holiday Event",

  // Retail Event
  PRODUCT_LAUNCH = "Product Launch",
  INSTORE_DEMO = "In-store Demo",
  EXCLUSIVE_PREVIEW = "Exclusive Preview",

  // Market / Pop-up
  POPUP_MARKET = "Pop-up Market",
  CRAFT_FAIR = "Craft Fair",

  // Seasonal Sale
  SEASONAL_SALE = "Seasonal Sale",
  HOLIDAY_SALE = "Holiday Sale",
  END_OF_SEASON_SALE = "End-of-Season Sale",

  // Wellness Workshop
  NUTRITION_SESSION = "Nutrition Session",
  MINDFULNESS_WORKSHOP = "Mindfulness Workshop",
  SELF_CARE_CLASS = "Self-care Class",

  // DIY & Skill Workshop
  HOME_REPAIR_BASICS = "Home Repair Basics",
  GARDENING_WORKSHOP = "Gardening Workshop",
  PET_CARE_SESSION = "Pet Care Session",

  // Live Music & Entertainment (Places to Stay)
  ACOUSTIC_EVENING = "Acoustic Evening",
  LOUNGE_MUSIC_NIGHT = "Lounge Music Night",

  // Seasonal / Holiday Event (Places to Stay)
  HOLIDAY_DINNER = "Holiday Dinner",
  NEW_YEAR_PARTY = "New Year Party",

  // Guest Social
  TRIVIA_NIGHT = "Trivia Night",
  GAME_NIGHT = "Game Night",
  GUEST_MIXER = "Guest Mixer",
}

// ============================================
// CORE QUESTIONS (Asked to ALL businesses)
// ============================================

export const coreAI_Training_Questionnaire_Types: AI_Training_Questionnaire_Type[] =
  [
    {
      id: "business_name",
      question: "What is your business name?",
      type: "text",
      required: true,
      category: "business_info",
      phase: TrainingPhase.BASIC,
    },
    {
      id: "business_description",
      question:
        "Provide a brief description of your business and what makes it unique",
      type: "text",
      required: true,
      category: "business_info",
      phase: TrainingPhase.BASIC,
      helpText: "This helps the AI understand your brand voice and positioning",
    },
    {
      id: "target_audience",
      question: "Who is your primary target audience?",
      type: "multi_select",
      options: [
        "Students (18-24)",
        "Young Professionals (25-34)",
        "Established Professionals (35-50)",
        "Seniors (50+)",
        "Families with children",
        "Teenagers",
        "All ages",
      ],
      required: true,
      category: "customer_profile",
      phase: TrainingPhase.BASIC,
    },
    {
      id: "customer_income_level",
      question: "What is the typical income level of your customers?",
      type: "multiple_choice",
      options: ["Budget-conscious", "Mid-range", "Premium", "Luxury", "Mixed"],
      required: true,
      category: "customer_profile",
      phase: TrainingPhase.BASIC,
    },
    {
      id: "busiest_days",
      question: "Which days are typically your busiest?",
      type: "multi_select",
      options: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
      category: "operations",
      phase: TrainingPhase.STANDARD,
    },
    {
      id: "busiest_hours",
      question: "What are your busiest hours during the day?",
      type: "multi_select",
      options: [
        "Early morning (6-9 AM)",
        "Morning (9-12 PM)",
        "Lunch time (12-2 PM)",
        "Afternoon (2-5 PM)",
        "Evening (5-8 PM)",
        "Night (8-11 PM)",
        "Late night (11 PM+)",
      ],
      required: true,
      category: "operations",
      phase: TrainingPhase.STANDARD,
    },
    {
      id: "slow_periods",
      question: "When do you typically experience slow periods?",
      type: "multi_select_with_text",
      options: [
        "Monday mornings",
        "Weekday afternoons",
        "Mid-week",
        "Sunday evenings",
        "Early mornings",
        "Late nights",
        "Specific months (specify in comments)",
      ],
      textTriggerOption: "Specific months (specify in comments)",
      required: true,
      category: "operations",
      phase: TrainingPhase.STANDARD,
    },
    {
      id: "typical_discount_range",
      question: "What discount range are you comfortable offering?",
      type: "multiple_choice",
      options: [
        "5-10%",
        "10-20%",
        "20-30%",
        "30-50%",
        "50%+",
        "BOGO/Bundle deals only",
      ],
      required: true,
      category: "marketing",
      phase: TrainingPhase.BASIC,
    },
    {
      id: "marketing_goals",
      question:
        "What are your primary marketing goals? (Select all that apply)",
      type: "multi_select",
      options: [
        "Increase foot traffic",
        "Boost sales during slow periods",
        "Attract new customers",
        "Build customer loyalty",
        "Increase average transaction value",
        "Promote specific products/services",
        "Build brand awareness",
        "Increase social media engagement",
      ],
      required: true,
      category: "goals",
      phase: TrainingPhase.BASIC,
    },
    {
      id: "previous_successful_promotions",
      question: "Describe any promotions that worked well for you in the past",
      type: "text",
      required: false,
      category: "marketing",
      phase: TrainingPhase.ADVANCED,
      helpText: "This helps the AI learn what resonates with your customers",
    },
    {
      id: "seasonal_relevance",
      question: "Is your business affected by seasons or holidays?",
      type: "boolean",
      required: true,
      category: "operations",
      phase: TrainingPhase.STANDARD,
    },
    {
      id: "important_seasons",
      question: "Which seasons/holidays are most important for your business?",
      type: "multi_select",
      options: [
        "New Year",
        "Valentine's Day",
        "Spring Break",
        "Easter",
        "Mother's Day",
        "Father's Day",
        "Summer",
        "Back to School",
        "Halloween",
        "Thanksgiving",
        "Black Friday/Cyber Monday",
        "Christmas/Holiday Season",
        "Local festivals/events",
      ],
      required: false,
      category: "operations",
      phase: TrainingPhase.ADVANCED,
    },
    {
      id: "competitor_awareness",
      question: "What do your competitors typically offer in terms of deals?",
      type: "text",
      required: false,
      category: "marketing",
      phase: TrainingPhase.ADVANCED,
    },
    {
      id: "brand_voice",
      question: "How would you describe your brand voice?",
      type: "multi_select",
      options: [
        "Professional",
        "Friendly and casual",
        "Fun and playful",
        "Sophisticated",
        "Trendy",
        "Traditional",
        "Humorous",
        "Inspirational",
      ],
      required: true,
      category: "business_info",
      phase: TrainingPhase.BASIC,
    },
  ];

// ============================================
// ENTERTAINMENT SPECIFIC QUESTIONS
// ============================================

export const entertainmentQuestions: CategoryQuestions = {
  industry: BusinessIndustries.ENTERTAINMENT,
  commonQuestions: [
    {
      id: "venue_type",
      question: "What type of entertainment venue are you?",
      type: "multiple_choice",
      options: [
        "Live Music Venue",
        "Nightclub / Dance Venue",
        "Comedy Club",
        "Cinema",
        "Theatre / Performing Arts",
        "Arcade / Gaming Venue",
        "Cultural Centre",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "event_frequency",
      question: "How often do you host events?",
      type: "multiple_choice",
      options: [
        "Daily",
        "Multiple times per week",
        "Weekly",
        "Bi-weekly",
        "Monthly",
        "Seasonally",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "venue_capacity",
      question: "What is your venue capacity?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "ticket_pricing",
      question: "What is your typical ticket price range?",
      type: "multiple_choice",
      options: [
        "Free entry",
        "Under $10",
        "$10-$25",
        "$25-$50",
        "$50-$100",
        "$100+",
        "Varies by event",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "entertainment_types",
      question: "What types of entertainment do you offer?",
      type: "multi_select",
      options: [
        "Live bands",
        "DJ sets",
        "Stand-up comedy",
        "Improv shows",
        "Movies/Film screenings",
        "Theatre productions",
        "Dance performances",
        "Gaming tournaments",
        "Trivia nights",
        "Karaoke",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "booking_advance",
      question: "How far in advance do customers typically book?",
      type: "multiple_choice",
      options: [
        "Same day/Walk-in",
        "1-3 days",
        "1 week",
        "2-4 weeks",
        "1+ months",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "has_bar_food",
      question: "Do you serve food and/or drinks?",
      type: "multiple_choice",
      options: [
        "Full bar and food",
        "Bar only",
        "Food only",
        "Snacks/Light fare",
        "No food or drinks",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "age_restriction",
      question: "Do you have age restrictions?",
      type: "multiple_choice",
      options: [
        "All ages",
        "18+",
        "21+",
        "Varies by event",
        "Family-friendly",
      ],
      required: true,
      category: "operations",
    },
  ],
  specificQuestions: [],
};

// ============================================
// CLASSES AND WORKSHOPS SPECIFIC QUESTIONS
// ============================================

export const classesWorkshopsQuestions: CategoryQuestions = {
  industry: BusinessIndustries.CLASSES_WORKSHOPS,
  commonQuestions: [
    {
      id: "class_type",
      question: "What type of classes or workshops do you offer?",
      type: "multiple_choice",
      options: [
        "Cooking Studio",
        "Art & Craft Studio",
        "Dance School",
        "Music / Performing Arts School",
        "Language & Cultural School",
        "Skill Training Studio",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "class_duration",
      question: "What is the typical duration of your classes?",
      type: "multiple_choice",
      options: [
        "30-60 minutes",
        "1-2 hours",
        "2-3 hours",
        "Half day",
        "Full day",
        "Multiple sessions/weeks",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "class_size",
      question: "What is your typical class size?",
      type: "multiple_choice",
      options: [
        "Private (1-on-1)",
        "Small group (2-5)",
        "Medium group (6-10)",
        "Large group (11-20)",
        "Large class (20+)",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "skill_levels",
      question: "What skill levels do you cater to?",
      type: "multi_select",
      options: [
        "Complete beginners",
        "Beginners",
        "Intermediate",
        "Advanced",
        "All levels",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "class_pricing",
      question: "What is your pricing model?",
      type: "multi_select",
      options: [
        "Per class/session",
        "Class packages",
        "Monthly membership",
        "Annual membership",
        "Drop-in rates",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "materials_included",
      question: "Are materials/supplies included in the class fee?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "trial_classes",
      question: "Do you offer trial classes or introductory sessions?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "private_events",
      question: "Do you host private events or corporate workshops?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// FOOD & DRINK SPECIFIC QUESTIONS
// ============================================

export const foodDrinkQuestions: CategoryQuestions = {
  industry: BusinessIndustries.FOOD_DRINK,
  commonQuestions: [
    {
      id: "cuisine_type",
      question: "What type of cuisine do you offer?",
      type: "text",
      required: true,
      category: "business_info",
    },
    {
      id: "dining_style",
      question: "What is your dining style?",
      type: "multiple_choice",
      options: [
        "Fast casual",
        "Fine dining",
        "Quick service",
        "Take-out focused",
        "Delivery focused",
        "Dine-in focused",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "menu_highlights",
      question: "What are your signature/best-selling items?",
      type: "text",
      required: true,
      category: "business_info",
      helpText: "List 3-5 items you want to promote",
    },
    {
      id: "dietary_options",
      question: "What dietary options do you offer?",
      type: "multi_select",
      options: [
        "Vegetarian",
        "Vegan",
        "Gluten-free",
        "Halal",
        "Kosher",
        "Keto",
        "Low-carb",
        "Organic",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "average_check_size",
      question: "What is your average check size per customer?",
      type: "multiple_choice",
      options: [
        "Under $10",
        "$10-$20",
        "$20-$35",
        "$35-$50",
        "$50-$75",
        "$75+",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "meal_periods",
      question: "Which meal periods do you serve?",
      type: "multi_select",
      options: [
        "Breakfast",
        "Brunch",
        "Lunch",
        "Afternoon/Tea time",
        "Dinner",
        "Late night",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "drink_program",
      question: "Do you have a notable drink/beverage program?",
      type: "multiple_choice",
      options: [
        "Full bar",
        "Beer and wine",
        "Specialty coffee",
        "Specialty tea",
        "Fresh juices/smoothies",
        "Craft cocktails",
        "Brewery/Winery tasting",
        "No special program",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "customer_visit_frequency",
      question: "How often do customers typically visit?",
      type: "multiple_choice",
      options: [
        "Multiple times per week",
        "Weekly",
        "Bi-weekly",
        "Monthly",
        "Occasionally/Special occasions",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "happy_hour_interest",
      question:
        "Are you interested in promoting happy hour or off-peak specials?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
  ],
  specificQuestions: [
    {
      id: "restaurant_seating",
      question: "What is your seating capacity?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "restaurant_reservation",
      question: "Do you accept reservations?",
      type: "boolean",
      required: true,
      category: "operations",
    },
    {
      id: "cafe_work_friendly",
      question: "Is your venue work/study-friendly?",
      type: "boolean",
      required: false,
      category: "business_info",
    },
    {
      id: "brewery_tours",
      question: "Do you offer tours or tastings?",
      type: "boolean",
      required: false,
      category: "business_info",
    },
  ],
};

// ============================================
// SPORTS & OUTDOOR SPECIFIC QUESTIONS
// ============================================

export const sportsOutdoorQuestions: CategoryQuestions = {
  industry: BusinessIndustries.SPORTS_OUTDOOR,
  commonQuestions: [
    {
      id: "facility_type",
      question: "What type of sports/outdoor facility are you?",
      type: "multiple_choice",
      options: [
        "Gym / Fitness Studio",
        "Yoga / Pilates Studio",
        "Sports Facility",
        "Adventure & Activity Operator",
        "Park / Recreation Centre",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "membership_structure",
      question: "What membership or pricing structure do you use?",
      type: "multi_select",
      options: [
        "Monthly membership",
        "Annual membership",
        "Class packages",
        "Drop-in rates",
        "Unlimited plans",
        "Tiered memberships",
        "Day passes",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "class_schedule",
      question: "How many classes/sessions do you offer per week?",
      type: "multiple_choice",
      options: [
        "1-5 classes",
        "6-10 classes",
        "11-20 classes",
        "20-30 classes",
        "30+ classes",
        "Open gym/No classes",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "experience_levels",
      question: "What experience levels do you cater to?",
      type: "multi_select",
      options: [
        "Beginners",
        "Intermediate",
        "Advanced",
        "All levels",
        "Kids",
        "Seniors",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "personal_training",
      question: "Do you offer personal training or one-on-one sessions?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "trial_sessions",
      question: "Do you offer trial classes or free sessions?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "peak_times",
      question: "When are your classes/facilities most popular?",
      type: "multi_select",
      options: [
        "Early morning (5-7 AM)",
        "Morning (7-10 AM)",
        "Mid-day (10 AM-2 PM)",
        "After work (5-7 PM)",
        "Evening (7-9 PM)",
        "Weekends",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "amenities",
      question: "What amenities do you offer?",
      type: "multi_select",
      options: [
        "Showers",
        "Lockers",
        "Parking",
        "Towel service",
        "Equipment rental",
        "Pro shop",
        "Childcare",
        "WiFi lounge",
        "Café/Juice bar",
      ],
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// LOCAL ATTRACTIONS SPECIFIC QUESTIONS
// ============================================

export const localAttractionsQuestions: CategoryQuestions = {
  industry: BusinessIndustries.LOCAL_ATTRACTIONS,
  commonQuestions: [
    {
      id: "attraction_type",
      question: "What type of attraction are you?",
      type: "multiple_choice",
      options: [
        "Museum",
        "Art Gallery",
        "Historical Site / Landmark",
        "Cultural Attraction",
        "Botanical Garden / Park",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "admission_pricing",
      question: "What is your admission pricing?",
      type: "multiple_choice",
      options: [
        "Free admission",
        "Under $10",
        "$10-$20",
        "$20-$35",
        "$35-$50",
        "$50+",
        "Donation-based",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "visit_duration",
      question: "What is the typical visit duration?",
      type: "multiple_choice",
      options: [
        "Under 1 hour",
        "1-2 hours",
        "2-3 hours",
        "Half day",
        "Full day",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "guided_tours",
      question: "Do you offer guided tours?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "special_exhibitions",
      question: "Do you have rotating/temporary exhibitions?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "group_discounts",
      question: "Do you offer group discounts?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "educational_programs",
      question: "Do you offer educational programs?",
      type: "multi_select",
      options: [
        "School tours",
        "Workshops",
        "Lectures/Talks",
        "Kids programs",
        "Adult education",
        "None",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "accessibility",
      question: "What accessibility features do you have?",
      type: "multi_select",
      options: [
        "Wheelchair accessible",
        "Audio guides",
        "Sign language tours",
        "Large print materials",
        "Sensory-friendly hours",
        "All accessible",
      ],
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// RETAIL & SHOPPING SPECIFIC QUESTIONS
// ============================================

export const retailShoppingQuestions: CategoryQuestions = {
  industry: BusinessIndustries.RETAIL_SHOPPING,
  commonQuestions: [
    {
      id: "store_type",
      question: "What type of retail store are you?",
      type: "multiple_choice",
      options: [
        "Fashion & Apparel",
        "Shoes & Accessories",
        "Specialty / Boutique Store",
        "Grocery / Market",
        "Pop-up / Seasonal Retail",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "product_categories",
      question: "What are your main product categories?",
      type: "text",
      required: true,
      category: "business_info",
      helpText: "List 3-5 main categories",
    },
    {
      id: "price_range",
      question: "What is your typical product price range?",
      type: "multiple_choice",
      options: [
        "Under $25",
        "$25-$50",
        "$50-$100",
        "$100-$250",
        "$250-$500",
        "$500+",
        "Wide range",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "inventory_turnover",
      question: "How often do you introduce new products or refresh inventory?",
      type: "multiple_choice",
      options: [
        "Weekly",
        "Bi-weekly",
        "Monthly",
        "Seasonally",
        "A few times a year",
        "Rarely",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "bestsellers",
      question: "What are your top-selling products?",
      type: "text",
      required: true,
      category: "business_info",
    },
    {
      id: "seasonal_products",
      question: "Do you carry seasonal products?",
      type: "boolean",
      required: true,
      category: "operations",
    },
    {
      id: "loyalty_program",
      question: "Do you have a loyalty or rewards program?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "online_presence",
      question: "Do you sell online as well?",
      type: "multiple_choice",
      options: [
        "Yes, with full e-commerce",
        "Yes, through social media",
        "Planning to",
        "No, in-store only",
      ],
      required: true,
      category: "operations",
    },
  ],
  specificQuestions: [],
};

// ============================================
// HEALTH & WELLNESS SPECIFIC QUESTIONS
// ============================================

export const healthWellnessQuestions: CategoryQuestions = {
  industry: BusinessIndustries.HEALTH_WELLNESS,
  commonQuestions: [
    {
      id: "wellness_type",
      question: "What type of health & wellness business are you?",
      type: "multiple_choice",
      options: [
        "Spa & Massage Centre",
        "Beauty Salon",
        "Aesthetic Clinic",
        "Mental Wellness Centre",
        "Wellness Studio",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "services_offered",
      question: "What services do you offer?",
      type: "text",
      required: true,
      category: "business_info",
      helpText: "List all your main services",
    },
    {
      id: "service_duration",
      question: "What is the typical duration of your services?",
      type: "multiple_choice",
      options: [
        "15-30 minutes",
        "30-60 minutes",
        "1-2 hours",
        "2-3 hours",
        "3+ hours",
        "Varies widely",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "booking_system",
      question: "How do clients book appointments?",
      type: "multi_select",
      options: [
        "Walk-ins welcome",
        "Online booking",
        "Phone only",
        "App",
        "Social media DMs",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "practitioner_count",
      question: "How many practitioners/specialists work at your location?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "premium_services",
      question: "Do you offer premium or luxury service tiers?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "membership_packages",
      question: "Do you offer memberships or package deals?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "first_time_specials",
      question: "Do you offer first-time client specials?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
  ],
  specificQuestions: [],
};

// ============================================
// HOME & PROFESSIONAL SERVICES SPECIFIC QUESTIONS
// ============================================

export const homeProfessionalServicesQuestions: CategoryQuestions = {
  industry: BusinessIndustries.HOME_PROFESSIONAL_SERVICES,
  commonQuestions: [
    {
      id: "service_category",
      question: "What type of service do you provide?",
      type: "multiple_choice",
      options: [
        "Home Repair & Maintenance",
        "Cleaning & Housekeeping",
        "Gardening & Landscaping",
        "Automotive Services",
        "Education & Tutoring",
        "Pet Care & Grooming",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "service_area",
      question: "What is your service radius?",
      type: "multiple_choice",
      options: [
        "5 miles",
        "10 miles",
        "15 miles",
        "20 miles",
        "25+ miles",
        "Entire region",
        "On-site only",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "emergency_services",
      question: "Do you offer emergency or same-day services?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "scheduling_flexibility",
      question: "How far in advance do customers need to book?",
      type: "multiple_choice",
      options: [
        "Same day available",
        "1-2 days",
        "3-7 days",
        "1-2 weeks",
        "2+ weeks",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "service_guarantees",
      question: "Do you offer warranties or service guarantees?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "free_estimates",
      question: "Do you provide free estimates or consultations?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "customer_type",
      question: "Who are your primary customers?",
      type: "multi_select",
      options: [
        "Homeowners",
        "Renters",
        "Property managers",
        "Businesses",
        "Pet owners",
        "Students",
        "Parents",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "pricing_model",
      question: "What is your pricing model?",
      type: "multi_select",
      options: [
        "Hourly rate",
        "Flat fee per service",
        "Package pricing",
        "Subscription/Recurring",
        "Quote-based",
      ],
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// PLACES TO STAY SPECIFIC QUESTIONS
// ============================================

export const placesToStayQuestions: CategoryQuestions = {
  industry: BusinessIndustries.PLACES_TO_STAY,
  commonQuestions: [
    {
      id: "accommodation_type",
      question: "What type of accommodation are you?",
      type: "multiple_choice",
      options: [
        "Hotel / Resort",
        "Hostel / Guesthouse",
        "Bed & Breakfast",
        "Vacation Rental / Serviced Apartment",
        "Camping / Glamping Site",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "room_count",
      question: "How many rooms/units do you have?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "booking_window",
      question: "How far in advance do guests typically book?",
      type: "multiple_choice",
      options: [
        "Same day",
        "1-3 days",
        "1 week",
        "2-4 weeks",
        "1-3 months",
        "3+ months",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "occupancy_rate",
      question: "What is your average occupancy rate?",
      type: "multiple_choice",
      options: ["90-100%", "70-90%", "50-70%", "30-50%", "Under 30%"],
      required: true,
      category: "operations",
    },
    {
      id: "low_season",
      question: "When is your low season?",
      type: "multi_select",
      options: [
        "January-February",
        "March-April",
        "May-June",
        "July-August",
        "September-October",
        "November-December",
        "No clear low season",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "guest_type",
      question: "What type of guests do you primarily serve?",
      type: "multi_select",
      options: [
        "Business travelers",
        "Leisure travelers",
        "Families",
        "Couples",
        "Solo travelers",
        "Groups",
        "Long-term stays",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "amenities_hospitality",
      question: "What amenities do you offer?",
      type: "multi_select",
      options: [
        "Breakfast",
        "WiFi",
        "Parking",
        "Pool",
        "Gym",
        "Restaurant",
        "Bar",
        "Spa",
        "Pet-friendly",
        "Kitchen facilities",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "special_packages",
      question: "Do you offer special packages (romance, adventure, etc.)?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
  ],
  specificQuestions: [],
};

// ============================================
// MOBILE BUSINESSES SPECIFIC QUESTIONS
// ============================================

export const mobileBusinessesQuestions: CategoryQuestions = {
  industry: BusinessIndustries.MOBILE_BUSINESSES,
  commonQuestions: [
    {
      id: "service_area",
      question: "What areas/neighborhoods do you typically serve?",
      type: "text",
      required: true,
      category: "business_info",
    },
    {
      id: "operating_schedule",
      question: "How do you determine your daily location/schedule?",
      type: "multiple_choice",
      options: [
        "Fixed weekly schedule",
        "Event-based",
        "Social media announcements",
        "App/website updates",
        "Mix of fixed and flexible",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "popular_locations",
      question: "What types of locations do you operate from most often?",
      type: "multi_select",
      options: [
        "Business districts",
        "Residential neighborhoods",
        "Events & festivals",
        "Markets & fairs",
        "Near nightlife areas",
        "Parks & public spaces",
        "University/college campuses",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "menu_highlights",
      question: "What are your signature or most popular items?",
      type: "text",
      required: true,
      category: "business_info",
    },
    {
      id: "serving_capacity",
      question: "How many customers can you serve per hour on average?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "event_catering",
      question: "Do you offer catering or private event bookings?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "social_media_presence",
      question: "Do you use social media to announce your daily location?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "seasonal_menu",
      question: "Do you have rotating or seasonal menu items?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// MAIN MAPPING FUNCTION
// ============================================

export function getTrainingQuestions(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  let categoryQuestions: CategoryQuestions;

  // Select appropriate category questions based on industry
  switch (industry) {
    case BusinessIndustries.ENTERTAINMENT:
      categoryQuestions = entertainmentQuestions;
      break;
    case BusinessIndustries.CLASSES_WORKSHOPS:
      categoryQuestions = classesWorkshopsQuestions;
      break;
    case BusinessIndustries.FOOD_DRINK:
      categoryQuestions = foodDrinkQuestions;
      break;
    case BusinessIndustries.SPORTS_OUTDOOR:
      categoryQuestions = sportsOutdoorQuestions;
      break;
    case BusinessIndustries.LOCAL_ATTRACTIONS:
      categoryQuestions = localAttractionsQuestions;
      break;
    case BusinessIndustries.RETAIL_SHOPPING:
      categoryQuestions = retailShoppingQuestions;
      break;
    case BusinessIndustries.HEALTH_WELLNESS:
      categoryQuestions = healthWellnessQuestions;
      break;
    case BusinessIndustries.HOME_PROFESSIONAL_SERVICES:
      categoryQuestions = homeProfessionalServicesQuestions;
      break;
    case BusinessIndustries.PLACES_TO_STAY:
      categoryQuestions = placesToStayQuestions;
      break;
    case BusinessIndustries.MOBILE_BUSINESSES:
      categoryQuestions = mobileBusinessesQuestions;
      break;
    default:
      // Return only core questions if industry not found
      return coreAI_Training_Questionnaire_Types;
  }

  // Combine core questions with industry-specific questions
  const allQuestions = [
    ...coreAI_Training_Questionnaire_Types,
    ...categoryQuestions.commonQuestions,
    ...categoryQuestions.specificQuestions,
  ];

  return allQuestions;
}

// ============================================
// MAIN MAPPING FUNCTION
// ============================================

export function getAI_Training_Questionnaire_Types(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  let categoryQuestions: CategoryQuestions;

  // Select appropriate category questions based on industry
  switch (industry) {
    case BusinessIndustries.ENTERTAINMENT:
      categoryQuestions = entertainmentQuestions;
      break;
    case BusinessIndustries.CLASSES_WORKSHOPS:
      categoryQuestions = classesWorkshopsQuestions;
      break;
    case BusinessIndustries.FOOD_DRINK:
      categoryQuestions = foodDrinkQuestions;
      break;
    case BusinessIndustries.SPORTS_OUTDOOR:
      categoryQuestions = sportsOutdoorQuestions;
      break;
    case BusinessIndustries.LOCAL_ATTRACTIONS:
      categoryQuestions = localAttractionsQuestions;
      break;
    case BusinessIndustries.RETAIL_SHOPPING:
      categoryQuestions = retailShoppingQuestions;
      break;
    case BusinessIndustries.HEALTH_WELLNESS:
      categoryQuestions = healthWellnessQuestions;
      break;
    case BusinessIndustries.HOME_PROFESSIONAL_SERVICES:
      categoryQuestions = homeProfessionalServicesQuestions;
      break;
    case BusinessIndustries.PLACES_TO_STAY:
      categoryQuestions = placesToStayQuestions;
      break;
    case BusinessIndustries.MOBILE_BUSINESSES:
      categoryQuestions = mobileBusinessesQuestions;
      break;
    default:
      // Return only core questions if industry not found
      return coreAI_Training_Questionnaire_Types;
  }

  // Combine core questions with industry-specific questions
  const allQuestions = [
    ...coreAI_Training_Questionnaire_Types,
    ...categoryQuestions.commonQuestions,
    ...categoryQuestions.specificQuestions,
  ];

  return allQuestions;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get questions by category for progressive disclosure in UI
 */
export function getQuestionsByCategory(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): Record<string, AI_Training_Questionnaire_Type[]> {
  const allQuestions = getAI_Training_Questionnaire_Types(
    industry,
    subCategory
  );

  const categorized: Record<string, AI_Training_Questionnaire_Type[]> = {
    business_info: [],
    customer_profile: [],
    operations: [],
    marketing: [],
    goals: [],
  };

  allQuestions.forEach((question) => {
    categorized[question.category].push(question);
  });

  return categorized;
}

/**
 * Get only required questions for quick onboarding
 */
export function getRequiredQuestions(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  return getAI_Training_Questionnaire_Types(industry, subCategory).filter(
    (q) => q.required
  );
}

/**
 * Validate training data completeness
 */
export function validateTrainingData(
  responses: Record<string, any>,
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): { isValid: boolean; missingRequired: string[] } {
  const requiredQuestions = getRequiredQuestions(industry, subCategory);
  const missingRequired: string[] = [];

  requiredQuestions.forEach((question) => {
    if (!responses[question.id] || responses[question.id] === "") {
      missingRequired.push(question.id);
    }
  });

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
  };
}

// ============================================
// SMART DEFAULTS MAPPING SYSTEM
// ============================================

/**
 * Smart defaults configuration for each subcategory
 * Maps subcategories to suggested answers for various question types
 */
export interface SmartDefaults {
  subcategory: BusinessSubCategory;
  defaults: {
    [questionId: string]: string | string[] | boolean | number;
  };
}

const smartDefaultsMapping: SmartDefaults[] = [
  // FOOD & DRINK - Restaurant
  {
    subcategory: BusinessSubCategory.RESTAURANT,
    defaults: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      meal_periods: ["Lunch", "Dinner"],
      target_audience: ["Families with children", "Young Professionals (25-34)", "Established Professionals (35-50)"],
      marketing_goals: ["Increase foot traffic", "Attract new customers", "Build customer loyalty"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Father's Day", "Thanksgiving", "Christmas/Holiday Season"],
    },
  },
  // FOOD & DRINK - Cafe/Coffee
  {
    subcategory: BusinessSubCategory.CAFE_COFFEE,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      meal_periods: ["Breakfast", "Brunch", "Lunch", "Afternoon/Tea time"],
      target_audience: ["Students (18-24)", "Young Professionals (25-34)", "All ages"],
      marketing_goals: ["Increase foot traffic", "Build customer loyalty", "Increase average transaction value"],
      slow_periods: ["Weekday afternoons", "Sunday evenings"],
      cafe_work_friendly: true,
    },
  },
  // FOOD & DRINK - Bar/Pub
  {
    subcategory: BusinessSubCategory.BAR_PUB,
    defaults: {
      busiest_hours: ["Evening (5-8 PM)", "Night (8-11 PM)", "Late night (11 PM+)"],
      busiest_days: ["Thursday", "Friday", "Saturday"],
      meal_periods: ["Dinner", "Late night"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)"],
      marketing_goals: ["Increase foot traffic", "Attract new customers", "Build brand awareness"],
      slow_periods: ["Monday mornings", "Weekday afternoons", "Sunday evenings"],
      happy_hour_interest: true,
    },
  },
  // FOOD & DRINK - Bakery / Dessert
  {
    subcategory: BusinessSubCategory.BAKERY_DESSERT,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      meal_periods: ["Breakfast", "Brunch"],
      target_audience: ["Families with children", "All ages"],
      marketing_goals: ["Increase foot traffic", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Easter", "Thanksgiving", "Christmas/Holiday Season"],
    },
  },
  // FOOD & DRINK - Food Truck / Pop-up
  {
    subcategory: BusinessSubCategory.FOOD_TRUCK_POPUP,
    defaults: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      meal_periods: ["Lunch", "Dinner"],
      target_audience: ["Young Professionals (25-34)", "Students (18-24)"],
      marketing_goals: ["Increase foot traffic", "Build brand awareness", "Increase social media engagement"],
      dining_style: "Take-out focused",
    },
  },
  // SPORTS & OUTDOOR - Gym / Fitness
  {
    subcategory: BusinessSubCategory.GYM_FITNESS,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)"],
      marketing_goals: ["Attract new customers", "Build customer loyalty", "Promote specific products/services"],
      important_seasons: ["New Year", "Summer"],
      peak_times: ["Early morning (5-7 AM)", "After work (5-7 PM)"],
      personal_training: true,
      trial_sessions: true,
    },
  },
  // SPORTS & OUTDOOR - Yoga / Pilates
  {
    subcategory: BusinessSubCategory.YOGA_PILATES,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Wednesday", "Thursday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)", "Seniors (50+)"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Build brand awareness"],
      important_seasons: ["New Year", "Spring Break", "Summer"],
      peak_times: ["Early morning (5-7 AM)", "Evening (7-9 PM)", "Weekends"],
      experience_levels: ["Beginners", "Intermediate", "Advanced", "All levels"],
      trial_sessions: true,
    },
  },
  // HEALTH & WELLNESS - Beauty
  {
    subcategory: BusinessSubCategory.BEAUTY,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)", "All ages"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Christmas/Holiday Season"],
      booking_system: ["Online booking", "Phone only"],
      first_time_specials: true,
    },
  },
  // HEALTH & WELLNESS - Spa & Massage
  {
    subcategory: BusinessSubCategory.SPA_MASSAGE,
    defaults: {
      busiest_hours: ["Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      target_audience: ["Established Professionals (35-50)", "Young Professionals (25-34)"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Build brand awareness"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Christmas/Holiday Season"],
      booking_system: ["Online booking", "Phone only"],
      first_time_specials: true,
      premium_services: true,
    },
  },
  // RETAIL & SHOPPING - Fashion & Apparel
  {
    subcategory: BusinessSubCategory.FASHION_APPAREL,
    defaults: {
      busiest_hours: ["Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      target_audience: ["Young Professionals (25-34)", "Teenagers", "Students (18-24)"],
      marketing_goals: ["Increase foot traffic", "Attract new customers", "Increase average transaction value"],
      important_seasons: ["Back to School", "Black Friday/Cyber Monday", "Christmas/Holiday Season", "Summer"],
      seasonal_products: true,
      loyalty_program: true,
    },
  },
  // HOME & PROFESSIONAL SERVICES - Home Repair
  {
    subcategory: BusinessSubCategory.HOME_REPAIR,
    defaults: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      target_audience: ["Families with children", "Established Professionals (35-50)", "Seniors (50+)"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      important_seasons: ["Spring", "Fall"],
      emergency_services: true,
      free_estimates: true,
      service_guarantees: true,
    },
  },
  // HOME & PROFESSIONAL SERVICES - Pet Care
  {
    subcategory: BusinessSubCategory.PET_CARE,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Friday", "Saturday"],
      target_audience: ["Families with children", "Young Professionals (25-34)", "All ages"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Summer", "Christmas/Holiday Season"],
    },
  },
  // PLACES TO STAY - Hotel / Resort
  {
    subcategory: BusinessSubCategory.HOTEL_RESORT,
    defaults: {
      busiest_days: ["Friday", "Saturday"],
      target_audience: ["Families with children", "Couples", "Business travelers"],
      marketing_goals: ["Attract new customers", "Build brand awareness", "Increase average transaction value"],
      important_seasons: ["Summer", "Spring Break", "Christmas/Holiday Season", "Local festivals/events"],
      guest_type: ["Business travelers", "Leisure travelers", "Families"],
      amenities_hospitality: ["Breakfast", "WiFi", "Parking"],
      special_packages: true,
    },
  },
  // ENTERTAINMENT - Live Music
  {
    subcategory: BusinessSubCategory.LIVE_MUSIC,
    defaults: {
      busiest_hours: ["Evening (5-8 PM)", "Night (8-11 PM)"],
      busiest_days: ["Thursday", "Friday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Students (18-24)"],
      marketing_goals: ["Build brand awareness", "Increase foot traffic", "Increase social media engagement"],
      entertainment_types: ["Live bands", "DJ sets", "Acoustic sets"],
    },
  },
  // LOCAL ATTRACTIONS - Museum
  {
    subcategory: BusinessSubCategory.MUSEUM,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Saturday", "Sunday"],
      target_audience: ["Families with children", "Students (18-24)", "All ages"],
      marketing_goals: ["Attract new customers", "Build brand awareness"],
      important_seasons: ["Summer", "Back to School", "Christmas/Holiday Season"],
      guided_tours: true,
      group_discounts: true,
    },
  },
  // MOBILE BUSINESSES - Food Truck
  {
    subcategory: BusinessSubCategory.FOOD_TRUCK,
    defaults: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Wednesday", "Thursday", "Friday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Students (18-24)", "Families with children"],
      marketing_goals: ["Build brand awareness", "Increase social media engagement", "Increase foot traffic"],
      operating_schedule: "Mix of fixed and flexible",
      event_catering: true,
      social_media_presence: true,
      seasonal_menu: true,
    },
  },
];

/**
 * Get smart default answers for questions based on business category and subcategory
 */
export function getSmartDefaults(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): Record<string, string | string[] | boolean | number> {
  if (!subCategory) {
    return getIndustryDefaults(industry);
  }

  // Find specific subcategory defaults
  const subcategoryDefaults = smartDefaultsMapping.find(
    (mapping) => mapping.subcategory === subCategory
  );

  if (subcategoryDefaults) {
    return {
      ...getIndustryDefaults(industry),
      ...subcategoryDefaults.defaults,
    };
  }

  return getIndustryDefaults(industry);
}

/**
 * Get general industry-level defaults (fallback)
 */
function getIndustryDefaults(
  industry: BusinessIndustries
): Record<string, string | string[] | boolean | number> {
  const industryDefaultsMap: Record<
    BusinessIndustries,
    Record<string, string | string[] | boolean | number>
  > = {
    [BusinessIndustries.ENTERTAINMENT]: {
      busiest_hours: ["Evening (5-8 PM)", "Night (8-11 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Build brand awareness", "Increase foot traffic"],
    },
    [BusinessIndustries.CLASSES_WORKSHOPS]: {
      busiest_hours: ["Morning (9-12 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Saturday", "Sunday"],
      marketing_goals: ["Attract new customers", "Build customer loyalty"],
      trial_classes: true,
    },
    [BusinessIndustries.FOOD_DRINK]: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Increase foot traffic", "Attract new customers"],
      seasonal_relevance: true,
    },
    [BusinessIndustries.SPORTS_OUTDOOR]: {
      busiest_hours: ["Early morning (6-9 AM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      trial_sessions: true,
    },
    [BusinessIndustries.LOCAL_ATTRACTIONS]: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Saturday", "Sunday"],
      marketing_goals: ["Attract new customers", "Build brand awareness"],
      guided_tours: true,
    },
    [BusinessIndustries.RETAIL_SHOPPING]: {
      busiest_hours: ["Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      marketing_goals: ["Increase foot traffic", "Attract new customers"],
      seasonal_relevance: true,
      seasonal_products: true,
    },
    [BusinessIndustries.HEALTH_WELLNESS]: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      first_time_specials: true,
    },
    [BusinessIndustries.HOME_PROFESSIONAL_SERVICES]: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      free_estimates: true,
    },
    [BusinessIndustries.PLACES_TO_STAY]: {
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Attract new customers", "Build brand awareness"],
      guest_type: ["Leisure travelers", "Families"],
    },
    [BusinessIndustries.MOBILE_BUSINESSES]: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Wednesday", "Thursday", "Friday", "Saturday"],
      marketing_goals: ["Build brand awareness", "Increase social media engagement", "Increase foot traffic"],
      event_catering: true,
      social_media_presence: true,
    },
  };

  return industryDefaultsMap[industry] || {};
}

/**
 * Apply smart defaults to questionnaire questions
 * This enriches questions with suggestedAnswers based on business context
 */
export function getQuestionsWithSmartDefaults(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  const questions = getAI_Training_Questionnaire_Types(industry, subCategory);
  const smartDefaults = getSmartDefaults(industry, subCategory);

  return questions.map((question) => {
    const defaultValue = smartDefaults[question.id];

    if (!defaultValue) {
      return question;
    }

    // Only apply defaults to multi_select and multiple_choice questions
    if (question.type === "multi_select" && Array.isArray(defaultValue)) {
      return {
        ...question,
        suggestedAnswers: defaultValue,
      };
    }

    if (question.type === "multiple_choice" && typeof defaultValue === "string") {
      return {
        ...question,
        suggestedAnswers: [defaultValue],
      };
    }

    if (question.type === "boolean" && typeof defaultValue === "boolean") {
      return {
        ...question,
        suggestedAnswers: [defaultValue.toString()],
      };
    }

    return question;
  });
}

/**
 * Get initial response object with smart defaults pre-filled
 * This can be used to initialize the questionnaire with suggested values
 */
export function getInitialResponsesWithDefaults(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): Record<string, string | string[] | boolean | number> {
  return getSmartDefaults(industry, subCategory);
}

// ============================================
// PHASE-BASED QUESTIONNAIRE FUNCTIONS
// ============================================

/**
 * Automatically assign phases to questions that don't have them
 * Basic: Most critical questions (business_info, most required questions)
 * Standard: Important operational questions
 * Advanced: Optional questions and detailed insights
 */
function assignPhaseToQuestion(question: AI_Training_Questionnaire_Type): AI_Training_Questionnaire_Type {
  // If phase is already assigned, return as is
  if (question.phase) {
    return question;
  }

  // Assign phase based on category and required status
  let phase: TrainingPhase;

  if (question.required) {
    // Required questions from basic categories
    if (question.category === "business_info" || question.category === "customer_profile" || question.category === "goals") {
      phase = TrainingPhase.BASIC;
    }
    // Required operational questions
    else if (question.category === "operations") {
      phase = TrainingPhase.STANDARD;
    }
    // Required marketing questions
    else if (question.category === "marketing") {
      phase = TrainingPhase.BASIC;
    }
    else {
      phase = TrainingPhase.STANDARD;
    }
  } else {
    // Non-required questions go to advanced
    phase = TrainingPhase.ADVANCED;
  }

  return {
    ...question,
    phase,
  };
}

/**
 * Get questions filtered by phase
 */
export function getQuestionsByPhase(
  industry: BusinessIndustries,
  phase: TrainingPhase,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  const allQuestions = getAI_Training_Questionnaire_Types(industry, subCategory);

  // Assign phases to questions that don't have them
  const questionsWithPhases = allQuestions.map(assignPhaseToQuestion);

  return questionsWithPhases.filter((q) => q.phase === phase);
}

/**
 * Get all questions up to a certain phase (inclusive)
 * e.g., if phase is STANDARD, returns BASIC + STANDARD questions
 */
export function getQuestionsUpToPhase(
  industry: BusinessIndustries,
  phase: TrainingPhase,
  subCategory?: BusinessSubCategory
): AI_Training_Questionnaire_Type[] {
  const allQuestions = getAI_Training_Questionnaire_Types(industry, subCategory);
  const questionsWithPhases = allQuestions.map(assignPhaseToQuestion);

  const phaseOrder = [TrainingPhase.BASIC, TrainingPhase.STANDARD, TrainingPhase.ADVANCED];
  const phaseIndex = phaseOrder.indexOf(phase);

  if (phaseIndex === -1) {
    return [];
  }

  const includedPhases = phaseOrder.slice(0, phaseIndex + 1);

  return questionsWithPhases.filter((q) => q.phase && includedPhases.includes(q.phase));
}

/**
 * Get questions grouped by phase
 */
export function getQuestionsGroupedByPhase(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): Record<TrainingPhase, AI_Training_Questionnaire_Type[]> {
  const allQuestions = getAI_Training_Questionnaire_Types(industry, subCategory);
  const questionsWithPhases = allQuestions.map(assignPhaseToQuestion);

  return {
    [TrainingPhase.BASIC]: questionsWithPhases.filter((q) => q.phase === TrainingPhase.BASIC),
    [TrainingPhase.STANDARD]: questionsWithPhases.filter((q) => q.phase === TrainingPhase.STANDARD),
    [TrainingPhase.ADVANCED]: questionsWithPhases.filter((q) => q.phase === TrainingPhase.ADVANCED),
  };
}

/**
 * Get phase summary with question counts
 */
export function getPhaseSummary(
  industry: BusinessIndustries,
  subCategory?: BusinessSubCategory
): {
  phase: TrainingPhase;
  totalQuestions: number;
  requiredQuestions: number;
}[] {
  const grouped = getQuestionsGroupedByPhase(industry, subCategory);

  return [
    {
      phase: TrainingPhase.BASIC,
      totalQuestions: grouped[TrainingPhase.BASIC].length,
      requiredQuestions: grouped[TrainingPhase.BASIC].filter((q) => q.required).length,
    },
    {
      phase: TrainingPhase.STANDARD,
      totalQuestions: grouped[TrainingPhase.STANDARD].length,
      requiredQuestions: grouped[TrainingPhase.STANDARD].filter((q) => q.required).length,
    },
    {
      phase: TrainingPhase.ADVANCED,
      totalQuestions: grouped[TrainingPhase.ADVANCED].length,
      requiredQuestions: grouped[TrainingPhase.ADVANCED].filter((q) => q.required).length,
    },
  ];
}

export default {
  coreAI_Training_Questionnaire_Types,
  entertainmentQuestions,
  classesWorkshopsQuestions,
  foodDrinkQuestions,
  sportsOutdoorQuestions,
  localAttractionsQuestions,
  retailShoppingQuestions,
  healthWellnessQuestions,
  homeProfessionalServicesQuestions,
  placesToStayQuestions,
  mobileBusinessesQuestions,
  getTrainingQuestions,
  getQuestionsByCategory,
  getRequiredQuestions,
  validateTrainingData,
  getSmartDefaults,
  getQuestionsWithSmartDefaults,
  getInitialResponsesWithDefaults,
  getQuestionsByPhase,
  getQuestionsUpToPhase,
  getQuestionsGroupedByPhase,
  getPhaseSummary,
};
