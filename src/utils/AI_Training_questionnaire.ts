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
    | "number"
    | "time"
    | "boolean";
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

export enum BusinessIndustries {
  FOOD_DRINK = "Food & Drink",
  RETAIL = "Retail",
  HEALTH_BEAUTY = "Health & Beauty",
  FITNESS_WELLNESS = "Fitness & Wellness",
  ENTERTAINMENT = "Entertainment",
  AUTOMOTIVE_SERVICES = "Automotive Services",
  HOME_SERVICES = "Home Services",
  PET_SERVICES = "Pet Services",
  HOSPITALITY = "Hospitality",
  PROFESSIONAL_SERVICES = "Professional Services",
}

export enum BusinessSubCategory {
  // Food & Drink
  RESTAURANT = "Restaurant",
  CAFE_COFFEE_SHOP = "Cafe/Coffee Shop",
  BAKERY = "Bakery",
  BAR = "Bar",
  JUICE_BAR = "Juice Bar",
  FOOD_TRUCK = "Food Truck",
  CATERING_SERVICES = "Catering Services",
  CLOUD_KITCHEN = "Cloud Kitchen",
  FROZEN_DESSERTS = "Frozen Desserts",

  // Retail
  ELECTRONICS_GADGETS = "Electronics & Gadgets",
  CLOTHING_APPAREL = "Clothing & Apparel",
  CONVENIENCE_STORE = "Convenience Store",
  HOME_DECOR = "Home Decor",
  STATIONERY = "Stationery",
  GIFT_SHOP = "Gift Shop",
  TOY_HOBBY_STORE = "Toy & Hobby Store",
  JEWELRY_ACCESSORIES = "Jewelry & Accessories",
  SMOKE_SHOP = "Smoke Shop",
  THRIFT_STORE = "Thrift Store",
  BEAUTY_COSMETICS = "Beauty & Cosmetics",
  PET_SUPPLIES = "Pet Supplies",

  // Health & Beauty
  SALON = "Salon",
  SKINCARE_AESTHETICS = "Skincare/ Aesthetics",
  SPA_MASSAGE = "Spa & Massage",
  NAIL_BAR = "Nail Bar",
  COSMETIC_SERVICES = "Cosmetic Services",
  DERMATOLOGY_CLINIC = "Dermatology Clinic",
  TANNING_STUDIO = "Tanning Studio",

  // Fitness & Wellness
  FITNESS_CENTER = "Fitness Center",
  YOGA_STUDIO = "Yoga Studio",
  MARTIAL_ARTS = "Martial Arts",
  PERSONAL_TRAINING = "Personal Training",
  DANCE_STUDIO = "Dance Studio",
  PHYSIOTHERAPY = "Physiotherapy",
  WELLNESS_COACHING = "Wellness Coaching",
  MEDITATION_CENTER = "Meditation Center",

  // Entertainment
  EVENT_PLANNING = "Event Planning",
  PARTY_RENTALS = "Party Rentals",
  AMUSEMENT_CENTER = "Amusement Center",
  ESCAPE_ROOM = "Escape Room",
  LOCAL_EXPERIENCES = "Local Experiences",
  PERFORMER_SERVICES = "Performer Services",
  KIDS_ENTERTAINMENT = "Kids Entertainment",
  PHOTOGRAPHY = "Photography",

  // Automotive Services
  GARAGE = "Garage",
  DETAILING = "Detailing",
  AUTO_ACCESSORIES = "Auto Accessories",
  RENTAL = "Rental",
  CUSTOMIZATION = "Customization",

  // Home Services
  HOME_CLEANING = "Home Cleaning",
  ELECTRICAL_SERVICES = "Electrical Services",
  PLUMBING_SERVICES = "Plumbing Services",
  PEST_CONTROL = "Pest Control",
  APPLIANCE_REPAIR = "Appliance Repair",
  HANDYMAN_SERVICES = "Handyman Services",
  GARDENING = "Gardening",
  INTERIOR_DESIGN = "Interior Design",
  MOVING_STORAGE = "Moving & Storage",

  // Pet Services
  PET_GROOMING = "Pet Grooming",
  PET_TRAINING = "Pet Training",
  VETERINARY_CLINIC = "Veterinary Clinic",
  PET_BOARDING = "Pet Boarding",
  PET_ADOPTION_CENTER = "Pet Adoption Center",
  PET_SUPPLIES_STORE = "Pet Supplies Store",
  PET_WALKING_SERVICES = "Pet Walking Services",

  // Hospitality
  HOTEL = "Hotel",
  BED_BREAKFAST = "Bed & Breakfast",
  HOMESTAY = "Homestay",
  HOSTEL = "Hostel",
  VACATION_RENTALS = "Vacation Rentals",
  CAMPGROUNDS = "Campgrounds",

  // Professional Services
  ACCOUNTING_CONSULTANT = "Accounting Consultant",
  LEGAL_SERVICES = "Legal Services",
  BUSINESS_CONSULTANT = "Business Consultant",
  EDUCATION = "Education",
  TRANSLATION = "Translation",
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
      type: "multi_select",
      options: [
        "Monday mornings",
        "Weekday afternoons",
        "Mid-week",
        "Sunday evenings",
        "Early mornings",
        "Late nights",
        "Specific months (specify in comments)",
      ],
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
      id: "inventory_to_promote",
      question:
        "Are there specific items you need to move more quickly (excess inventory, seasonal items)?",
      type: "text",
      required: false,
      category: "operations",
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
    // Restaurant specific
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
    // Cafe/Coffee Shop specific
    {
      id: "cafe_work_friendly",
      question: "Is your cafe work/study-friendly?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "cafe_wifi",
      question: "Do you offer free WiFi?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    // Bakery specific
    {
      id: "bakery_specialties",
      question: "What are your specialty baked goods?",
      type: "multi_select",
      options: [
        "Bread",
        "Pastries",
        "Cakes",
        "Cookies",
        "Custom cakes",
        "Dietary-specific items",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "bakery_custom_orders",
      question: "Do you take custom orders for events?",
      type: "boolean",
      required: true,
      category: "operations",
    },
    // Bar specific
    {
      id: "bar_type",
      question: "What type of bar are you?",
      type: "multiple_choice",
      options: [
        "Sports bar",
        "Cocktail bar",
        "Pub",
        "Wine bar",
        "Nightclub",
        "Lounge",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "bar_entertainment",
      question: "What entertainment do you offer?",
      type: "multi_select",
      options: [
        "Live music",
        "DJ",
        "Trivia nights",
        "Sports on TV",
        "Karaoke",
        "Games/Pool tables",
        "None",
      ],
      required: true,
      category: "business_info",
    },
  ],
};

// ============================================
// RETAIL SPECIFIC QUESTIONS
// ============================================

export const retailQuestions: CategoryQuestions = {
  industry: BusinessIndustries.RETAIL,
  commonQuestions: [
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
      id: "clearance_frequency",
      question: "How often do you need to clear inventory?",
      type: "multiple_choice",
      options: ["Weekly", "Monthly", "Seasonally", "Occasionally", "Rarely"],
      required: true,
      category: "operations",
    },
    {
      id: "brand_partnerships",
      question: "Do you carry specific brands or your own products?",
      type: "multiple_choice",
      options: [
        "Exclusively branded products",
        "Mix of brands",
        "Own brand/products",
        "Curated selection",
      ],
      required: true,
      category: "business_info",
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
    {
      id: "loyalty_program",
      question: "Do you have a loyalty or rewards program?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "gift_services",
      question: "Do you offer gift wrapping or gift services?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [
    // Electronics & Gadgets
    {
      id: "electronics_warranty",
      question: "Do you offer warranties or protection plans?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "electronics_repairs",
      question: "Do you offer repair or tech support services?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    // Clothing & Apparel
    {
      id: "apparel_style",
      question: "What style of clothing do you specialize in?",
      type: "multi_select",
      options: [
        "Casual",
        "Formal",
        "Athletic/Activewear",
        "Streetwear",
        "Vintage",
        "Designer",
        "Sustainable",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "apparel_demographics",
      question: "Who do you primarily sell to?",
      type: "multi_select",
      options: [
        "Men",
        "Women",
        "Children",
        "Babies",
        "Plus-size",
        "Petite",
        "All",
      ],
      required: true,
      category: "customer_profile",
    },
  ],
};

// ============================================
// HEALTH & BEAUTY SPECIFIC QUESTIONS
// ============================================

export const healthBeautyQuestions: CategoryQuestions = {
  industry: BusinessIndustries.HEALTH_BEAUTY,
  commonQuestions: [
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
      question: "How many practitioners/stylists work at your location?",
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
      id: "product_sales",
      question: "Do you sell products (shampoos, skincare, etc.)?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "first_time_specials",
      question: "Do you offer first-time client specials?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "cancellation_rate",
      question: "What percentage of appointments get cancelled or no-showed?",
      type: "multiple_choice",
      options: ["Less than 5%", "5-10%", "10-20%", "20-30%", "More than 30%"],
      required: true,
      category: "operations",
    },
    {
      id: "appointment_fill_rate",
      question: "How booked are you typically?",
      type: "multiple_choice",
      options: [
        "Always fully booked",
        "80-100% booked",
        "60-80% booked",
        "40-60% booked",
        "Under 40% booked",
      ],
      required: true,
      category: "operations",
    },
  ],
  specificQuestions: [
    // Salon
    {
      id: "salon_specialties",
      question: "What are your salon specialties?",
      type: "multi_select",
      options: [
        "Hair cutting",
        "Hair coloring",
        "Hair treatments",
        "Styling",
        "Extensions",
        "Keratin treatments",
        "Bridal services",
      ],
      required: true,
      category: "business_info",
    },
    // Spa & Massage
    {
      id: "spa_types",
      question: "What types of massage/spa services do you offer?",
      type: "multi_select",
      options: [
        "Swedish massage",
        "Deep tissue",
        "Hot stone",
        "Aromatherapy",
        "Couples massage",
        "Facials",
        "Body treatments",
      ],
      required: true,
      category: "business_info",
    },
  ],
};

// ============================================
// FITNESS & WELLNESS SPECIFIC QUESTIONS
// ============================================

export const fitnessWellnessQuestions: CategoryQuestions = {
  industry: BusinessIndustries.FITNESS_WELLNESS,
  commonQuestions: [
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
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "class_schedule",
      question: "How many classes do you offer per week?",
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
      id: "trial_classes",
      question: "Do you offer trial classes or free sessions?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "peak_class_times",
      question: "When are your classes most popular?",
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
      id: "under_utilized_slots",
      question: "Which time slots are typically under-booked?",
      type: "text",
      required: true,
      category: "operations",
      helpText: "This helps us suggest targeted deals for these times",
    },
    {
      id: "member_retention_goal",
      question: "What is your primary challenge?",
      type: "multiple_choice",
      options: [
        "Attracting new members",
        "Retaining current members",
        "Filling specific class times",
        "Upselling services",
        "Building community",
      ],
      required: true,
      category: "goals",
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
        "Juice bar",
        "Retail products",
        "Childcare",
        "WiFi lounge",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "referral_program",
      question: "Do you have a member referral program?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
  ],
  specificQuestions: [],
};

// ============================================
// ENTERTAINMENT SPECIFIC QUESTIONS
// ============================================

export const entertainmentQuestions: CategoryQuestions = {
  industry: BusinessIndustries.ENTERTAINMENT,
  commonQuestions: [
    {
      id: "booking_lead_time",
      question: "How far in advance do customers typically book?",
      type: "multiple_choice",
      options: ["Same day", "1-3 days", "1 week", "2-4 weeks", "1+ months"],
      required: true,
      category: "operations",
    },
    {
      id: "group_sizes",
      question: "What group sizes do you typically serve?",
      type: "multi_select",
      options: [
        "Individuals",
        "Couples",
        "Small groups (3-6)",
        "Medium groups (7-15)",
        "Large groups (16-30)",
        "Extra large (30+)",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "event_types",
      question: "What types of events do you cater to?",
      type: "multi_select",
      options: [
        "Birthday parties",
        "Corporate events",
        "Team building",
        "Bachelor/Bachelorette",
        "Family gatherings",
        "Date nights",
        "Kids parties",
        "School groups",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "packages_available",
      question: "Do you offer packages or bundles?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "capacity_per_slot",
      question: "What is your maximum capacity per time slot?",
      type: "number",
      required: true,
      category: "operations",
    },
    {
      id: "utilization_rate",
      question: "What percentage of your capacity is typically filled?",
      type: "multiple_choice",
      options: ["90-100%", "70-90%", "50-70%", "30-50%", "Under 30%"],
      required: true,
      category: "operations",
    },
    {
      id: "last_minute_bookings",
      question: "Can you accommodate last-minute bookings?",
      type: "boolean",
      required: true,
      category: "operations",
    },
    {
      id: "special_occasions_focus",
      question: "Which special occasions are most important for your business?",
      type: "multi_select",
      options: [
        "Birthdays",
        "Anniversaries",
        "Graduations",
        "Holidays",
        "Date nights",
        "Family reunions",
        "Corporate milestones",
      ],
      required: true,
      category: "customer_profile",
    },
  ],
  specificQuestions: [],
};

// ============================================
// AUTOMOTIVE SERVICES SPECIFIC QUESTIONS
// ============================================

export const automotiveQuestions: CategoryQuestions = {
  industry: BusinessIndustries.AUTOMOTIVE_SERVICES,
  commonQuestions: [
    {
      id: "service_types",
      question: "What types of services do you offer?",
      type: "text",
      required: true,
      category: "business_info",
      helpText: "List your main service categories",
    },
    {
      id: "vehicle_types",
      question: "What types of vehicles do you service?",
      type: "multi_select",
      options: [
        "Sedans",
        "SUVs",
        "Trucks",
        "Luxury vehicles",
        "Electric vehicles",
        "Motorcycles",
        "Classic cars",
        "Fleet vehicles",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "appointment_system",
      question: "How do customers schedule services?",
      type: "multi_select",
      options: [
        "Walk-in",
        "By appointment",
        "Online booking",
        "Phone",
        "Mobile app",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "service_duration",
      question: "What is the typical service duration?",
      type: "multiple_choice",
      options: [
        "Under 30 minutes",
        "30-60 minutes",
        "1-2 hours",
        "2-4 hours",
        "Half day",
        "Full day+",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "waiting_area",
      question: "Do you have a customer waiting area?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "seasonal_services",
      question:
        "Do you have seasonal services (e.g., winterization, AC check)?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "package_deals",
      question: "Do you offer service packages?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "maintenance_reminders",
      question: "Do you send maintenance reminders to customers?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
  ],
  specificQuestions: [],
};

// ============================================
// HOME SERVICES SPECIFIC QUESTIONS
// ============================================

export const homeServicesQuestions: CategoryQuestions = {
  industry: BusinessIndustries.HOME_SERVICES,
  commonQuestions: [
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
      id: "job_size",
      question: "What size jobs do you typically handle?",
      type: "multi_select",
      options: [
        "Small repairs/fixes",
        "Medium projects",
        "Large renovations",
        "Commercial projects",
        "All sizes",
      ],
      required: true,
      category: "business_info",
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
      id: "seasonal_demand",
      question: "Which seasons are busiest for you?",
      type: "multi_select",
      options: ["Spring", "Summer", "Fall", "Winter", "Consistent year-round"],
      required: true,
      category: "operations",
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
        "Real estate agents",
      ],
      required: true,
      category: "customer_profile",
    },
  ],
  specificQuestions: [],
};

// ============================================
// PET SERVICES SPECIFIC QUESTIONS
// ============================================

export const petServicesQuestions: CategoryQuestions = {
  industry: BusinessIndustries.PET_SERVICES,
  commonQuestions: [
    {
      id: "pet_types",
      question: "What types of pets do you service?",
      type: "multi_select",
      options: [
        "Dogs",
        "Cats",
        "Birds",
        "Small animals (rabbits, guinea pigs)",
        "Reptiles",
        "Fish",
        "Exotic pets",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "appointment_based",
      question: "Are your services appointment-based or walk-in?",
      type: "multiple_choice",
      options: [
        "Appointment only",
        "Walk-in only",
        "Both options",
        "Drop-off service",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "service_duration_pets",
      question: "How long do services typically take?",
      type: "multiple_choice",
      options: [
        "Under 30 min",
        "30-60 min",
        "1-2 hours",
        "2-4 hours",
        "Half day",
        "Full day",
        "Overnight",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "package_deals_pets",
      question: "Do you offer package deals or memberships?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "multi_pet_discount",
      question: "Do you offer discounts for multiple pets?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "seasonal_services_pets",
      question: "Do you have seasonal services or promotions?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "pet_products",
      question: "Do you sell pet products or supplies?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
  ],
  specificQuestions: [],
};

// ============================================
// HOSPITALITY SPECIFIC QUESTIONS
// ============================================

export const hospitalityQuestions: CategoryQuestions = {
  industry: BusinessIndustries.HOSPITALITY,
  commonQuestions: [
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
      id: "minimum_stay",
      question: "Do you have minimum stay requirements?",
      type: "multiple_choice",
      options: [
        "No minimum",
        "2 nights",
        "3 nights",
        "Week minimum",
        "Varies by season",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "cancellation_policy",
      question: "What is your cancellation policy?",
      type: "multiple_choice",
      options: [
        "Flexible (free cancellation)",
        "Moderate (24-48 hrs)",
        "Strict (7+ days)",
        "Non-refundable options available",
      ],
      required: true,
      category: "operations",
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
// PROFESSIONAL SERVICES SPECIFIC QUESTIONS
// ============================================

export const professionalServicesQuestions: CategoryQuestions = {
  industry: BusinessIndustries.PROFESSIONAL_SERVICES,
  commonQuestions: [
    {
      id: "service_delivery",
      question: "How do you deliver your services?",
      type: "multi_select",
      options: [
        "In-person",
        "Virtual/Online",
        "Hybrid",
        "On-site at client location",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "client_type",
      question: "Who are your primary clients?",
      type: "multi_select",
      options: [
        "Individuals",
        "Small businesses",
        "Medium businesses",
        "Large corporations",
        "Non-profits",
        "Government",
      ],
      required: true,
      category: "customer_profile",
    },
    {
      id: "engagement_length",
      question: "What is the typical length of client engagement?",
      type: "multiple_choice",
      options: [
        "One-time",
        "Short-term (weeks)",
        "Medium-term (months)",
        "Long-term (6+ months)",
        "Ongoing retainer",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "consultation_process",
      question: "Do you offer free initial consultations?",
      type: "boolean",
      required: true,
      category: "marketing",
    },
    {
      id: "pricing_model",
      question: "What is your pricing model?",
      type: "multi_select",
      options: [
        "Hourly rate",
        "Project-based",
        "Retainer",
        "Package pricing",
        "Value-based",
      ],
      required: true,
      category: "business_info",
    },
    {
      id: "capacity_constraints",
      question: "Are you currently at capacity or looking for more clients?",
      type: "multiple_choice",
      options: [
        "At capacity",
        "Mostly booked",
        "Moderate availability",
        "Actively seeking clients",
      ],
      required: true,
      category: "operations",
    },
    {
      id: "specializations",
      question: "What are your areas of specialization?",
      type: "text",
      required: true,
      category: "business_info",
      helpText: "List your key specialties or niches",
    },
    {
      id: "certifications",
      question:
        "Do you have relevant certifications or credentials to promote?",
      type: "boolean",
      required: true,
      category: "business_info",
    },
    {
      id: "referral_sources",
      question: "Where do most of your clients come from?",
      type: "multi_select",
      options: [
        "Referrals",
        "Online search",
        "Social media",
        "Networking events",
        "Previous clients",
        "Partnerships",
        "Advertising",
      ],
      required: true,
      category: "marketing",
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
    case BusinessIndustries.FOOD_DRINK:
      categoryQuestions = foodDrinkQuestions;
      break;
    case BusinessIndustries.RETAIL:
      categoryQuestions = retailQuestions;
      break;
    case BusinessIndustries.HEALTH_BEAUTY:
      categoryQuestions = healthBeautyQuestions;
      break;
    case BusinessIndustries.FITNESS_WELLNESS:
      categoryQuestions = fitnessWellnessQuestions;
      break;
    case BusinessIndustries.ENTERTAINMENT:
      categoryQuestions = entertainmentQuestions;
      break;
    case BusinessIndustries.AUTOMOTIVE_SERVICES:
      categoryQuestions = automotiveQuestions;
      break;
    case BusinessIndustries.HOME_SERVICES:
      categoryQuestions = homeServicesQuestions;
      break;
    case BusinessIndustries.PET_SERVICES:
      categoryQuestions = petServicesQuestions;
      break;
    case BusinessIndustries.HOSPITALITY:
      categoryQuestions = hospitalityQuestions;
      break;
    case BusinessIndustries.PROFESSIONAL_SERVICES:
      categoryQuestions = professionalServicesQuestions;
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
    case BusinessIndustries.FOOD_DRINK:
      categoryQuestions = foodDrinkQuestions;
      break;
    case BusinessIndustries.RETAIL:
      categoryQuestions = retailQuestions;
      break;
    case BusinessIndustries.HEALTH_BEAUTY:
      categoryQuestions = healthBeautyQuestions;
      break;
    case BusinessIndustries.FITNESS_WELLNESS:
      categoryQuestions = fitnessWellnessQuestions;
      break;
    case BusinessIndustries.ENTERTAINMENT:
      categoryQuestions = entertainmentQuestions;
      break;
    case BusinessIndustries.AUTOMOTIVE_SERVICES:
      categoryQuestions = automotiveQuestions;
      break;
    case BusinessIndustries.HOME_SERVICES:
      categoryQuestions = homeServicesQuestions;
      break;
    case BusinessIndustries.PET_SERVICES:
      categoryQuestions = petServicesQuestions;
      break;
    case BusinessIndustries.HOSPITALITY:
      categoryQuestions = hospitalityQuestions;
      break;
    case BusinessIndustries.PROFESSIONAL_SERVICES:
      categoryQuestions = professionalServicesQuestions;
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
  // FOOD & DRINK - Cafe/Coffee Shop
  {
    subcategory: BusinessSubCategory.CAFE_COFFEE_SHOP,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      meal_periods: ["Breakfast", "Brunch", "Lunch", "Afternoon/Tea time"],
      target_audience: ["Students (18-24)", "Young Professionals (25-34)", "All ages"],
      marketing_goals: ["Increase foot traffic", "Build customer loyalty", "Increase average transaction value"],
      slow_periods: ["Weekday afternoons", "Sunday evenings"],
      cafe_work_friendly: true,
      cafe_wifi: true,
    },
  },
  // FOOD & DRINK - Bakery
  {
    subcategory: BusinessSubCategory.BAKERY,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      meal_periods: ["Breakfast", "Brunch"],
      target_audience: ["Families with children", "All ages"],
      marketing_goals: ["Increase foot traffic", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Easter", "Thanksgiving", "Christmas/Holiday Season"],
      bakery_custom_orders: true,
    },
  },
  // FOOD & DRINK - Bar
  {
    subcategory: BusinessSubCategory.BAR,
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
  // FOOD & DRINK - Food Truck
  {
    subcategory: BusinessSubCategory.FOOD_TRUCK,
    defaults: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      meal_periods: ["Lunch", "Dinner"],
      target_audience: ["Young Professionals (25-34)", "Students (18-24)"],
      marketing_goals: ["Increase foot traffic", "Build brand awareness", "Increase social media engagement"],
      dining_style: "Take-out focused",
    },
  },
  // FOOD & DRINK - Catering
  {
    subcategory: BusinessSubCategory.CATERING_SERVICES,
    defaults: {
      busiest_days: ["Friday", "Saturday", "Sunday"],
      target_audience: ["Families with children", "Established Professionals (35-50)"],
      marketing_goals: ["Attract new customers", "Build brand awareness", "Promote specific products/services"],
      important_seasons: ["Spring Break", "Summer", "Christmas/Holiday Season", "Local festivals/events"],
    },
  },
  // RETAIL - Clothing & Apparel
  {
    subcategory: BusinessSubCategory.CLOTHING_APPAREL,
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
  // RETAIL - Convenience Store
  {
    subcategory: BusinessSubCategory.CONVENIENCE_STORE,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      target_audience: ["All ages"],
      marketing_goals: ["Build customer loyalty", "Increase foot traffic", "Increase average transaction value"],
      slow_periods: ["Mid-week", "Late nights"],
    },
  },
  // HEALTH & BEAUTY - Salon
  {
    subcategory: BusinessSubCategory.SALON,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)", "All ages"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Valentine's Day", "Mother's Day", "Christmas/Holiday Season"],
      booking_system: ["Online booking", "Phone only"],
      first_time_specials: true,
      product_sales: true,
    },
  },
  // HEALTH & BEAUTY - Spa & Massage
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
  // FITNESS & WELLNESS - Fitness Center
  {
    subcategory: BusinessSubCategory.FITNESS_CENTER,
    defaults: {
      busiest_hours: ["Early morning (6-9 AM)", "Morning (9-12 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)"],
      marketing_goals: ["Attract new customers", "Build customer loyalty", "Promote specific products/services"],
      important_seasons: ["New Year", "Summer"],
      peak_class_times: ["Early morning (5-7 AM)", "After work (5-7 PM)"],
      personal_training: true,
      trial_classes: true,
      referral_program: true,
    },
  },
  // FITNESS & WELLNESS - Yoga Studio
  {
    subcategory: BusinessSubCategory.YOGA_STUDIO,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Wednesday", "Thursday", "Saturday"],
      target_audience: ["Young Professionals (25-34)", "Established Professionals (35-50)", "Seniors (50+)"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Build brand awareness"],
      important_seasons: ["New Year", "Spring Break", "Summer"],
      peak_class_times: ["Early morning (5-7 AM)", "Evening (7-9 PM)", "Weekends"],
      experience_levels: ["Beginners", "Intermediate", "Advanced", "All levels"],
      trial_classes: true,
    },
  },
  // ENTERTAINMENT - Event Planning
  {
    subcategory: BusinessSubCategory.EVENT_PLANNING,
    defaults: {
      busiest_days: ["Friday", "Saturday", "Sunday"],
      target_audience: ["Families with children", "Established Professionals (35-50)", "Young Professionals (25-34)"],
      marketing_goals: ["Attract new customers", "Build brand awareness", "Promote specific products/services"],
      important_seasons: ["Spring Break", "Summer", "Christmas/Holiday Season", "Local festivals/events"],
      event_types: ["Birthday parties", "Corporate events", "Team building", "Family gatherings"],
      packages_available: true,
    },
  },
  // AUTOMOTIVE SERVICES - Garage
  {
    subcategory: BusinessSubCategory.GARAGE,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      target_audience: ["All ages"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Spring", "Fall"],
      appointment_system: ["Walk-in", "By appointment", "Phone"],
      seasonal_services: true,
      package_deals: true,
      maintenance_reminders: true,
    },
  },
  // HOME SERVICES - Home Cleaning
  {
    subcategory: BusinessSubCategory.HOME_CLEANING,
    defaults: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      target_audience: ["Families with children", "Established Professionals (35-50)", "Seniors (50+)"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      important_seasons: ["Spring", "Christmas/Holiday Season"],
      emergency_services: false,
      free_estimates: true,
      service_guarantees: true,
    },
  },
  // PET SERVICES - Pet Grooming
  {
    subcategory: BusinessSubCategory.PET_GROOMING,
    defaults: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Friday", "Saturday"],
      target_audience: ["Families with children", "Young Professionals (25-34)", "All ages"],
      marketing_goals: ["Build customer loyalty", "Attract new customers", "Promote specific products/services"],
      important_seasons: ["Summer", "Christmas/Holiday Season"],
      pet_types: ["Dogs", "Cats"],
      appointment_based: "Appointment only",
      package_deals_pets: true,
      multi_pet_discount: true,
    },
  },
  // HOSPITALITY - Hotel
  {
    subcategory: BusinessSubCategory.HOTEL,
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
  // PROFESSIONAL SERVICES - Accounting Consultant
  {
    subcategory: BusinessSubCategory.ACCOUNTING_CONSULTANT,
    defaults: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      target_audience: ["Established Professionals (35-50)", "Small businesses"],
      marketing_goals: ["Attract new customers", "Build customer loyalty", "Build brand awareness"],
      important_seasons: ["New Year", "Back to School"],
      service_delivery: ["In-person", "Virtual/Online", "Hybrid"],
      client_type: ["Individuals", "Small businesses", "Medium businesses"],
      consultation_process: true,
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
    [BusinessIndustries.FOOD_DRINK]: {
      busiest_hours: ["Lunch time (12-2 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Increase foot traffic", "Attract new customers"],
      seasonal_relevance: true,
    },
    [BusinessIndustries.RETAIL]: {
      busiest_hours: ["Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday", "Sunday"],
      marketing_goals: ["Increase foot traffic", "Attract new customers"],
      seasonal_relevance: true,
      seasonal_products: true,
    },
    [BusinessIndustries.HEALTH_BEAUTY]: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)", "Evening (5-8 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      first_time_specials: true,
    },
    [BusinessIndustries.FITNESS_WELLNESS]: {
      busiest_hours: ["Early morning (6-9 AM)", "Evening (5-8 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      trial_classes: true,
    },
    [BusinessIndustries.ENTERTAINMENT]: {
      busiest_days: ["Friday", "Saturday", "Sunday"],
      marketing_goals: ["Attract new customers", "Build brand awareness"],
      packages_available: true,
    },
    [BusinessIndustries.AUTOMOTIVE_SERVICES]: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      seasonal_services: true,
    },
    [BusinessIndustries.HOME_SERVICES]: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      free_estimates: true,
    },
    [BusinessIndustries.PET_SERVICES]: {
      busiest_hours: ["Morning (9-12 PM)", "Afternoon (2-5 PM)"],
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Build customer loyalty", "Attract new customers"],
      pet_types: ["Dogs", "Cats"],
    },
    [BusinessIndustries.HOSPITALITY]: {
      busiest_days: ["Friday", "Saturday"],
      marketing_goals: ["Attract new customers", "Build brand awareness"],
      guest_type: ["Leisure travelers", "Families"],
    },
    [BusinessIndustries.PROFESSIONAL_SERVICES]: {
      busiest_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      marketing_goals: ["Attract new customers", "Build customer loyalty"],
      consultation_process: true,
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
function assignPhaseToQuestion(question: any): AI_Training_Questionnaire_Type {
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

  return questionsWithPhases.filter((q) => q.phase! === phase);
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
    [TrainingPhase.BASIC]: questionsWithPhases.filter((q) => q.phase! === TrainingPhase.BASIC),
    [TrainingPhase.STANDARD]: questionsWithPhases.filter((q) => q.phase! === TrainingPhase.STANDARD),
    [TrainingPhase.ADVANCED]: questionsWithPhases.filter((q) => q.phase! === TrainingPhase.ADVANCED),
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
  foodDrinkQuestions,
  retailQuestions,
  healthBeautyQuestions,
  fitnessWellnessQuestions,
  entertainmentQuestions,
  automotiveQuestions,
  homeServicesQuestions,
  petServicesQuestions,
  hospitalityQuestions,
  professionalServicesQuestions,
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
