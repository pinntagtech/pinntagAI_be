import { Admin } from 'src/admin/models/admin.model';
import { DeviceTypes } from 'src/enums/auth.enums';
import { EventTypes } from 'src/enums/event.enums';
import { RoleBelonging, Roles } from 'src/roles/enums/roles.enum';
import { DurationType } from 'src/subscription/models/subscriptionProduct.model';

export enum BusinessIndustries {
  FOOD_DRINK = 'Food & Drink',
  RETAIL = 'Retail',
  HEALTH_BEAUTY = 'Health & Beauty',
  FITNESS_WELLNESS = 'Fitness & Wellness',
  ENTERTAINMENT = 'Entertainment',
  AUTOMOTIVE_SERVICES = 'Automotive Services',
  HOME_SERVICES = 'Home Services',
  PET_SERVICES = 'Pet Services',
  HOSPITALITY = 'Hospitality',
  PROFESSIONAL_SERVICES = 'Professional Services',
}

export enum EventCategory {
  ARTS_CRAFTS = 'Arts & Crafts',
  CHARITY = 'Charity',
  SPORTS = 'Sports',
  FOODS_DRINK = 'Foods & Drink',
  LOCAL_ATTRACTIONS = 'Local Attractions',
  ALL = 'all',
  CLUBS_CLASSES = 'Clubs & Classes',
  DAYS_OUT = 'Days Out',
  HAPPY_HOUR = 'Happy Hour',
  MUSIC_NIGHTLIFE = 'Music & Nightlife',
  PETS = 'Pets',
  BEAUTY_SPA = 'Beauty & Spa',
  ENTERTAINMENT = 'Entertainment',
  HEALTH_FITNESS = 'Health & Fitness',
  RETAIL = 'Retail',
}

export enum BusinessSubCategory {
  RESTAURANT = 'Restaurant',
  CAFE_COFFEE_SHOP = 'Cafe/Coffee Shop',
  BAKERY = 'Bakery',
  BAR = 'Bar',
  JUICE_BAR = 'Juice Bar',
  FOOD_TRUCK = 'Food Truck',
  CATERING_SERVICES = 'Catering Services',
  CLOUD_KITCHEN = 'Cloud Kitchen',
  FROZEN_DESSERTS = 'Frozen Desserts',

  ELECTRONICS_GADGETS = 'Electronics & Gadgets',
  CLOTHING_APPAREL = 'Clothing & Apparel',
  CONVENIENCE_STORE = 'Convenience Store',
  HOME_DECOR = 'Home Decor',
  STATIONERY = 'Stationery',
  GIFT_SHOP = 'Gift Shop',
  TOY_HOBBY_STORE = 'Toy & Hobby Store',
  JEWELRY_ACCESSORIES = 'Jewelry & Accessories',
  SMOKE_SHOP = 'Smoke Shop',
  THRIFT_STORE = 'Thrift Store',

  BEAUTY_COSMETICS = 'Beauty & Cosmetics',
  PET_SUPPLIES = 'Pet Supplies',
  SALON = 'Salon',
  SKINCARE_AESTHETICS = 'Skincare/ Aesthetics',
  SPA_MASSAGE = 'Spa & Massage',
  NAIL_BAR = 'Nail Bar',
  COSMETIC_SERVICES = 'Cosmetic Services',
  DERMATOLOGY_CLINIC = 'Dermatology Clinic',
  TANNING_STUDIO = 'Tanning Studio',

  FITNESS_CENTER = 'Fitness Center',
  YOGA_STUDIO = 'Yoga Studio',
  MARTIAL_ARTS = 'Martial Arts',
  PERSONAL_TRAINING = 'Personal Training',
  DANCE_STUDIO = 'Dance Studio',
  PHYSIOTHERAPY = 'Physiotherapy',
  WELLNESS_COACHING = 'Wellness Coaching',
  MEDITATION_CENTER = 'Meditation Center',

  EVENT_PLANNING = 'Event Planning',
  PARTY_RENTALS = 'Party Rentals',
  AMUSEMENT_CENTER = 'Amusement Center',
  ESCAPE_ROOM = 'Escape Room',
  LOCAL_EXPERIENCES = 'Local Experiences',
  PERFORMER_SERVICES = 'Performer Services',
  KIDS_ENTERTAINMENT = 'Kids Entertainment',
  PHOTOGRAPHY = 'Photography',

  GARAGE = 'Garage',
  DETAILING = 'Detailing',
  AUTO_ACCESSORIES = 'Auto Accessories',
  RENTAL = 'Rental',
  CUSTOMIZATION = 'Customization',

  HOME_CLEANING = 'Home Cleaning',
  ELECTRICAL_SERVICES = 'Electrical Services',
  PLUMBING_SERVICES = 'Plumbing Services',
  PEST_CONTROL = 'Pest Control',
  APPLIANCE_REPAIR = 'Appliance Repair',
  HANDYMAN_SERVICES = 'Handyman Services',
  GARDENING = 'Gardening',
  INTERIOR_DESIGN = 'Interior Design',
  MOVING_STORAGE = 'Moving & Storage',

  PET_GROOMING = 'Pet Grooming',
  PET_TRAINING = 'Pet Training',
  VETERINARY_CLINIC = 'Veterinary Clinic',
  PET_BOARDING = 'Pet Boarding',
  PET_ADOPTION_CENTER = 'Pet Adoption Center',
  PET_SUPPLIES_STORE = 'Pet Supplies Store',
  PET_WALKING_SERVICES = 'Pet Walking Services',

  HOTEL = 'Hotel',
  BED_BREAKFAST = 'Bed & Breakfast',
  HOMESTAY = 'Homestay',
  HOSTEL = 'Hostel',
  VACATION_RENTALS = 'Vacation Rentals',
  CAMPGROUNDS = 'Campgrounds',

  ACCOUNTING_CONSULTANT = 'Accounting Consultant',
  LEGAL_SERVICES = 'Legal Services',
  BUSINESS_CONSULTANT = 'Business Consultant',
  EDUCATION = 'Education',
  TRANSLATION = 'Translation',
}

export const Seeder = {
  ContentCategories: [
    {
      title: 'Arts & Crafts',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/arts_and_crafts.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/arts_and_crafts.svg',
      activeColor: '#F1F3C2',
      description: 'Arts & Crafts',
    },
    {
      title: 'Beauty & Spa',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/beauty_and_spa.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/beauty_and_spa.svg',
      activeColor: '#F7B5CA',
      description: 'Beauty & Spa',
    },
    {
      title: 'Charity',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/charity.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/charity.svg',
      activeColor: '#A1EEBD',
      description: 'Charity',
    },
    {
      title: 'Clubs & Classes',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/clubs_and_classes.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/clubs_and_classes.svg',
      activeColor: '#A6D6D6',
      description: 'Clubs & Classes',
    },
    {
      title: 'Days Out',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/days_out.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/days_out.svg',
      activeColor: '#FFF1D5',
      description: 'Days Out',
    },
    {
      title: 'Entertainment',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/entertainment.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/entertainment.svg',
      activeColor: '#D9EAFD',
      description: 'Entertainment',
    },
    {
      title: 'Foods & Drink',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/food_and_drink.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/food_and_drink.svg',
      activeColor: '#FFCDB2',
      description: 'Foods & Drink',
    },
    {
      title: 'Happy Hour',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/happy_hour.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/happy_hour.svg',
      activeColor: '#FFE1E0',
      description: 'Happy Hour',
    },
    {
      title: 'Health & Fitness',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/health_and_fitness.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/health_and_fitness.svg',
      activeColor: '#CDFAD5',
      description: 'Health & Fitness',
    },
    {
      title: 'Local Attractions',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/local_attractions.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/local_attractions.svg',
      activeColor: '#FFE3E3',
      description: 'Local Attractions',
    },
    {
      title: 'Music & Nightlife',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/music_and_nightlife.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/music_and_nightlife.svg',
      activeColor: '#8EACCD',
      description: 'Music & Nightlife',
    },
    {
      title: 'Pets',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/pets.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/pets.svg',
      activeColor: '#D4F6FF',
      description: 'Pets',
    },
    {
      title: 'Retail',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/retail.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/retail.svg',
      activeColor: '#BFD8AF',
      description: 'Retail',
    },
    {
      title: 'Sports',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/sports.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/sports.svg',
      activeColor: '#FFCCEA',
      description: 'Sports',
    },
  ],

  roles: [
    // {
    //   name: Roles.ADMIN,
    //   creatorType: 'System',
    //   belongsTo: RoleBelonging.SYSTEM,
    // },
    {
      name: Roles.USER,
      creatorType: 'System',
      belongsTo: RoleBelonging.SYSTEM,
    },
    // {
    //   name: Roles.SUB_ADMIN,
    //   creatorType: 'System',
    // },
    // {
    //   name: Roles.STAFF,
    //   creatorType: 'System',
    // },
    {
      name: Roles.GUEST,
      creatorType: 'System',
      belongsTo: RoleBelonging.SYSTEM,
    },
    // {
    //   name: Roles.BUSINESS_PROFILE,
    //   creatorType: 'System',
    // },
  ],
  keywords: [
    {
      name: 'Dinner',
      color: '#FF0000',
    },
    {
      name: 'Live Music',
      color: '#FF0000',
    },
    {
      name: 'Cocktail Night',
      color: '#FF0000',
    },
    {
      name: 'Networking',
      color: '#FF0000',
    },
    {
      name: 'Food Tasting',
      color: '#FF0000',
    },
    {
      name: 'DJ Night',
      color: '#FF0000',
    },
    {
      name: 'Happy Hour',
      color: '#FF0000',
    },
    {
      name: 'Dance Floor',
      color: '#FF0000',
    },
    {
      name: 'Social Gathering',
      color: '#FF0000',
    },
    {
      name: 'Theme Night',
      color: '#FF0000',
    },
    {
      name: 'Pizza',
      color: '#FF0000',
    },
    {
      name: 'Lunch',
      color: '#FF0000',
    },
  ],
  ageGroups: [
    {
      sortOrder: 0,
      name: 'all',
      image: '',
      description: '',
    },
    {
      sortOrder: 1,
      name: '16-19',
      image: '',
      description: '',
    },
    {
      sortOrder: 2,
      name: '20-25',
      image: '',
      description: '',
    },
    {
      sortOrder: 3,
      name: '26-34',
      image: '',
      description: '',
    },
    {
      sortOrder: 4,
      name: '35-45',
      image: '',
      description: '',
    },
    {
      sortOrder: 5,
      name: '46-55',
      image: '',
      description: '',
    },
    {
      sortOrder: 6,
      name: '56-65',
      image: '',
      description: '',
    },
    {
      sortOrder: 7,
      name: '66-74',
      image: '',
      description: '',
    },
    {
      sortOrder: 8,
      name: '75+',
      image: '',
      description: '',
    },
  ],
  subscriptionProducts: [
    {
      name: 'Annual',
      description: 'Pay annually and save 25%',
      price: 479.99,
      durationType: DurationType.ANNUAL,
      duration: 1,
      isRecommended: true,
      stripeProductId: 'price_1PD5hKDkH0yJD0lhyKPKC1in',
    },
    {
      name: 'Monthly',
      description: 'Pay monthly',
      price: 49.99,
      durationType: DurationType.MONTHLY,
      duration: 1,
      isRecommended: false,
      stripeProductId: 'price_1PD5epDkH0yJD0lhkeroy5jp',
    },
    {
      name: 'Free',
      description: 'Free subscription for 30 days',
      price: 0.0,
      durationType: DurationType.MONTHLY,
      duration: 1,
      isRecommended: false,
    },
  ],

  appVersions: [
    {
      deviceType: DeviceTypes.ANDROID,
      version: '1.1.3',
      description: 'Initial release',
    },
    {
      deviceType: DeviceTypes.IOS,
      version: '1.1.3',
      description: 'Initial release',
    },
    {
      deviceType: DeviceTypes.WEB,
      version: '1.0.0',
      description: 'Initial release',
    },
  ],
  fileCategories: [
    {
      name: 'profile picture',
    },
    {
      name: 'thumbnail',
    },
    {
      name: 'gallery image',
    },
    {
      name: 'logo',
    },
    {
      name: 'promotional image',
    },
    {
      name: 'promotional video',
    },
    {
      name: 'brochure',
    },
    {
      name: 'live stream recording',
    },
    {
      name: 'business license',
    },
    {
      name: 'tax document',
    },
    {
      name: 'ID Proof',
    },
    {
      name: 'invoice',
    },
    {
      name: 'Audio Note',
    },
    {
      name: 'Content QR',
    },
    {
      name: 'other',
    },
  ],
  BusinessIndustries: [
    {
      title: 'Food & Drink',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Food+%26+Drink.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Food+%26+Drink.svg',
      activeColor: '#FFCDB2',
    },
    {
      title: 'Retail',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Retails.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Retails.svg',
      activeColor: '#8EACCD',
    },
    {
      title: 'Health & Beauty',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Health+%26+Beauty.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Health+%26+Beauty.svg',
      activeColor: '#AC87C5',
    },
    {
      title: 'Fitness & Wellness',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Fitness+%26+Wellness.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Fitness+%26+Wellness.svg',
      activeColor: '#A1EEBD',
    },
    {
      title: 'Entertainment',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Entertainment+%26+Experiences.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Entertainment+%26+Experiences.svg',
      activeColor: '#F6F193',
    },
    {
      title: 'Automotive Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Automotive+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Automotive+Services.svg',
      activeColor: '#CCD3CA',
    },
    {
      title: 'Home Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Home+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Home+Services.svg',
      activeColor: '#EECEB9',
    },
    {
      title: 'Pet Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Pet+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Pet+Services.svg',
      activeColor: '#D4F6FF',
    },
    {
      title: 'Hospitality',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Hospitality.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Hospitality.svg',
      activeColor: '#AC87C5',
    },
    {
      title: 'Professional Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Professional+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Professional+Services.svg',
      activeColor: '#BED7DC',
    },
  ],
  BusinessCategories: [
    {
      title: 'Restaurant',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Restaurant-Dine.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Restaurant-Dine.svg',
      activeColor: '#FFCDB2',
      industry: 'Food & Drink',
    },
    {
      title: 'Cafe/Coffee Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cafe-Coffee+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cafe-Coffee+Shop.svg',
      activeColor: '#DFCCFB',
      industry: 'Food & Drink',
    },
    {
      title: 'Bakery',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bakery-Desert+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bakery-Desert+Shop.svg',
      activeColor: '#D4F6FF',
      industry: 'Food & Drink',
    },
    {
      title: 'Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bar-Lounge-Pub.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bar-Lounge-Pub.svg',
      activeColor: '#CDFAD5',
      industry: 'Food & Drink',
    },
    {
      title: 'Juice Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Juice-Smoothie+Bar.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Juice-Smoothie+Bar.svg',
      activeColor: '#F7B5CA',
      industry: 'Food & Drink',
    },
    {
      title: 'Food Truck',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Food+Truck-Mobile+Vendor.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Food+Truck-Mobile+Vendor.svg',
      activeColor: '#F6F193',
      industry: 'Food & Drink',
    },
    {
      title: 'Catering Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Catering+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Catering+Services.svg',
      activeColor: '#FDB7EA',
      industry: 'Food & Drink',
    },
    {
      title: 'Cloud Kitchen',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cloud+Kitchen+-+Delivery+Only.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cloud+Kitchen+-+Delivery+Only.svg',
      activeColor: '#F0F1C5',
      industry: 'Food & Drink',
    },
    {
      title: 'Desserts',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Ice+Cream+-+Frozen+Desserts.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Ice+Cream+-+Frozen+Desserts.svg',
      activeColor: '#BED7DC',
      industry: 'Food & Drink',
    },

    {
      title: 'Clothing & Apparel',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Clothing+%26+Apparel.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Clothing+%26+Apparel.svg',
      activeColor: '#3498DB',
      industry: 'Retail',
    },
    {
      title: 'Electronics & Gadgets',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Electronics+%26+Gadgets.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Electronics+%26+Gadgets.svg',
      activeColor: '#2C3E50',
      industry: 'Retail',
    },
    {
      title: 'Convenience Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Grocery+%26+Convenience+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Grocery+%26+Convenience+Store.svg',
      activeColor: '#58D68D',
      industry: 'Retail',
    },
    {
      title: 'Home Decor',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Home+Decor+-+Furniture.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Home+Decor+-+Furniture.svg',
      activeColor: '#D4AC0D',
      industry: 'Retail',
    },
    {
      title: 'Jewelry & Accessories',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Jewelry+%26+Accessories.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Jewelry+%26+Accessories.svg',
      activeColor: '#D98880',
      industry: 'Retail',
    },
    {
      title: 'Beauty & Cosmetics',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Beauty+%26+Cosmetics.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Beauty+%26+Cosmetics.svg',
      activeColor: '#AF7AC5',
      industry: 'Retail',
    },
    {
      title: 'Stationery',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Bookstore+-+Stationery.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Bookstore+-+Stationery.svg',
      activeColor: '#AAB7B8',
      industry: 'Retail',
    },
    {
      title: 'Toy & Hobby Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Toy+%26+Hobby+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Toy+%26+Hobby+Store.svg',
      activeColor: '#F4D03F',
      industry: 'Retail',
    },
    {
      title: 'Pet Supplies',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Pet+Supplies.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Pet+Supplies.svg',
      activeColor: '#DC7633',
      industry: 'Retail',
    },
    {
      title: 'Smoke Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Vape+-+Smoke+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Vape+-+Smoke+Shop.svg',
      activeColor: '#34495E',
      industry: 'Retail',
    },
    {
      title: 'Gift Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Gift+%26+Souvenir+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Gift+%26+Souvenir+Shop.svg',
      activeColor: '#EC7063',
      industry: 'Retail',
    },
    {
      title: 'Thrift Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Thrift+-+Second+Hand+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Thrift+-+Second+Hand+Store.svg',
      activeColor: '#7D6608',
      industry: 'Retail',
    },
    {
      title: 'Salon',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Salon+-+Hairdresser.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Salon+-+Hairdresser.svg',
      activeColor: '#D35400',
      industry: 'Health & Beauty',
    },
    {
      title: 'Spa & Massage',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Spa+%26+Massage.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Spa+%26+Massage.svg',
      activeColor: '#A3E4D7',
      industry: 'Health & Beauty',
    },
    {
      title: 'Skincare/ Aesthetics',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Skincare+-+Aesthetics.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Skincare+-+Aesthetics.svg',
      activeColor: '#F5B7B1',
      industry: 'Health & Beauty',
    },
    {
      title: 'Nail Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Nail+Bar.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Nail+Bar.svg',
      activeColor: '#F1948A',
      industry: 'Health & Beauty',
    },
    {
      title: 'Cosmetic Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Cosmetic+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Cosmetic+Services.svg',
      activeColor: '#C39BD3',
      industry: 'Health & Beauty',
    },
    {
      title: 'Dermatology Clinic',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Dermatology+-+Skin+Clinic.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Dermatology+-+Skin+Clinic.svg',
      activeColor: '#7FB3D5',
      industry: 'Health & Beauty',
    },
    {
      title: 'Tanning Studio',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Light/Tanning+Studio.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Health+%26+Beauty/Dark/Tanning+Studio.svg',
      activeColor: '#EDBB99',
      industry: 'Health & Beauty',
    },
    {
      title: 'Fitness Center',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Gym+-+Fitness+Center.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Gym+-+Fitness+Center.svg',
      activeColor: '#1ABC9C',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Yoga Studio',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Yoga+-+Pilates+Studio.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Yoga+-+Pilates+Studio.svg',
      activeColor: '#76D7C4',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Martial Arts',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Martial+Arts+-+Boxing+Studio.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Martial+Arts+-+Boxing+Studio.svg',
      activeColor: '#2E4053',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Personal Training',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Personal+Training.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Personal+Training.svg',
      activeColor: '#117864',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Dance Studio',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Dance+Studio.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Dance+Studio.svg',
      activeColor: '#F39CBA',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Physiotherapy',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Physiotherapy+-+Rehabilitation.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Physiotherapy+-+Rehabilitation.svg',
      activeColor: '#85C1E9',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Wellness Coaching',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Wellness+Coaching.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Wellness+Coaching.svg',
      activeColor: '#45B39D',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Meditation Center',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Meditation+Center.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Meditation+Center.svg',
      activeColor: '#BB8FCE',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Event Planning',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Event+Planning.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Event+Planning.svg',
      activeColor: '#F5B041',
      industry: 'Entertainment',
    },
    {
      title: 'Party Rentals',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Party+Rentals.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Party+Rentals.svg',
      activeColor: '#DC7633',
      industry: 'Entertainment',
    },
    {
      title: 'Amusement Center',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Amusement+Center+-+Arcade.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Amusement+Center+-+Arcade.svg',
      activeColor: '#E74C3C',
      industry: 'Entertainment',
    },
    {
      title: 'Escape Room',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Escape+Room+-+VR+Experience.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Escape+Room+-+VR+Experience.svg',
      activeColor: '#5D6D7E',
      industry: 'Entertainment',
    },
    {
      title: 'Local Experiences',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Tours+%26+Local+Experiences.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Tours+%26+Local+Experiences.svg',
      activeColor: '#58D68D',
      industry: 'Entertainment',
    },
    {
      title: 'Performer Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/DJ+-+Performer+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/DJ+-+Performer+Services.svg',
      activeColor: '#AF601A',
      industry: 'Entertainment',
    },
    {
      title: 'Kids Entertainment',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Kids+Entertainment.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Kids+Entertainment.svg',
      activeColor: '#F7DC6F',
      industry: 'Entertainment',
    },
    {
      title: 'Photography',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Photography+-+Videography.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Photography+-+Videography.svg',
      activeColor: '#7FB3D5',
      industry: 'Entertainment',
    },
    {
      title: 'Garage',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Light/Garage.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Dark/Garage.svg',
      activeColor: '#5D6D7E',
      industry: 'Automotive Services',
    },
    {
      title: 'Detailing',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Light/Detailing.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Dark/Detailing.svg',
      activeColor: '#85929E',
      industry: 'Automotive Services',
    },
    {
      title: 'Auto Accessories',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Photography+-+Videography.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Photography+-+Videography.svg',
      activeColor: '#2E4053',
      industry: 'Automotive Services',
    },
    {
      title: 'Rental',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Light/Rental+-+Leasing.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Dark/Rental+-+Leasing.svg',
      activeColor: '#1F618D',
      industry: 'Automotive Services',
    },
    {
      title: 'Customization',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Light/Customization+-+Wrapping.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Dark/Customization+-+Wrapping.svg',
      activeColor: '#884EA0',
      industry: 'Automotive Services',
    },
    {
      title: 'Home Cleaning',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Home+Cleaning.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Home+Cleaning.svg',
      activeColor: '#F9E79F',
      industry: 'Home Services',
    },
    {
      title: 'Electrical Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Electrical+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Electrical+Services.svg',
      activeColor: '#F4D03F',
      industry: 'Home Services',
    },
    {
      title: 'Plumbing Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Plumbing+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Plumbing+Services.svg',
      activeColor: '#5499C7',
      industry: 'Home Services',
    },
    {
      title: 'Pest Control',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Pest+Control.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Pest+Control.svg',
      activeColor: '#CD6155',
      industry: 'Home Services',
    },
    {
      title: 'Appliance Repair',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Appliance+Repair.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Appliance+Repair.svg',
      activeColor: '#45B39D',
      industry: 'Home Services',
    },
    {
      title: 'Handyman Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Handyman+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Handyman+Services.svg',
      activeColor: '#D98880',
      industry: 'Home Services',
    },
    {
      title: 'Gardening',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Landscaping+-+Gardening.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Landscaping+-+Gardening.svg',
      activeColor: '#229954',
      industry: 'Home Services',
    },
    {
      title: 'Interior Design',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Interior+Design+-+Renovation.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Interior+Design+-+Renovation.svg',
      activeColor: '#A04000',
      industry: 'Home Services',
    },
    {
      title: 'Moving & Storage',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Moving+%26+Storage.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Moving+%26+Storage.svg',
      activeColor: '#7D3C98',
      industry: 'Home Services',
    },
    {
      title: 'Pet Grooming',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Grooming.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Grooming.svg',
      activeColor: '#FAD7A0',
      industry: 'Pet Services',
    },
    {
      title: 'Pet Training',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Training.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Training.svg',
      activeColor: '#EDBB99',
      industry: 'Pet Services',
    },
    {
      title: 'Veterinary Clinic',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Veterinary+Clinic.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Veterinary+Clinic.svg',
      activeColor: '#A9CCE3',
      industry: 'Pet Services',
    },
    {
      title: 'Pet Boarding',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Boarding+-+Daycare.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Boarding+-+Daycare.svg',
      activeColor: '#F7C5CC',
      industry: 'Pet Services',
    },
    {
      title: 'Pet Walking Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Walking+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Walking+Services.svg',
      activeColor: '#ABEBC6',
      industry: 'Pet Services',
    },
    {
      title: 'Pet Adoption Center',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Adoption+Center.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Adoption+Center.svg',
      activeColor: '#F9E79F',
      industry: 'Pet Services',
    },
    {
      title: 'Pet Supplies Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Light/Pet+Supplies+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Pet+Services/Dark/Pet+Supplies+Store.svg',
      activeColor: '#DC7633',
      industry: 'Pet Services',
    },
    {
      title: 'Hotel',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Hotel+-+Resort.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Hotel+-+Resort.svg',
      activeColor: '#1A5276',
      industry: 'Hospitality',
    },
    {
      title: 'Bed & Breakfast',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Bed+%26+Breakfast.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Bed+%26+Breakfast.svg',
      activeColor: '#F8C471',
      industry: 'Hospitality',
    },
    {
      title: 'Homestay',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Guest+House+-+Homestay.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Guest+House+-+Homestay.svg',
      activeColor: '#D7BDE2',
      industry: 'Hospitality',
    },
    {
      title: 'Hostel',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Hostel+-+Backpacker+Lodging.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Hostel+-+Backpacker+Lodging.svg',
      activeColor: '#58D68D',
      industry: 'Hospitality',
    },
    {
      title: 'Vacation Rentals',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Vacation+Rentals.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Vacation+Rentals.svg',
      activeColor: '#F5B041',
      industry: 'Hospitality',
    },
    {
      title: 'Campgrounds',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Campgrounds+-+Glamping.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Campgrounds+-+Glamping.svg',
      activeColor: '#229954',
      industry: 'Hospitality',
    },
    {
      title: 'Accounting Consultant',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Accounting+-+Tax+Consultant.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Accounting+-+Tax+Consultant.svg',
      activeColor: '#566573',
      industry: 'Professional Services',
    },
    {
      title: 'Legal Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Legal+Services+-+Law+Firm.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Legal+Services+-+Law+Firm.svg',
      activeColor: '#1C2833',
      industry: 'Professional Services',
    },
    {
      title: 'Business Consultant',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Business+Consultant.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Business+Consultant.svg',
      activeColor: '#2874A6',
      industry: 'Professional Services',
    },
    {
      title: 'Education',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Education+-+Tutoring.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Education+-+Tutoring.svg',
      activeColor: '#82E0AA',
      industry: 'Professional Services',
    },
    {
      title: 'Translation',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Translation+-+Language+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Translation+-+Language+Services.svg',
      activeColor: '#B2BABB',
      industry: 'Professional Services',
    },
  ],
  EventTemplates: [
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '15',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '15% Off All Vegan Desserts!',
      keywords: ['bakery', 'dessert', 'vegan', 'discount'],
      description:
        "Indulge your sweet tooth without any guilt by enjoying 15% off our entire range of vegan desserts. Whether you're a committed vegan or just looking to try healthier and plant-based options, our bakery offers a wide variety of treats including cakes, cookies, and pastries, all made with natural ingredients and no animal products. Perfect for anyone seeking delicious desserts that are kind to the environment and your body. This limited-time offer encourages you to explore the flavors of vegan baking with discounts on every item in the vegan section. Use promo code VEGANSWEET15 when you visit us in-store. It’s a wonderful way to treat yourself, friends, or family with sweets that everyone can enjoy. Don't miss out on this tasty deal, valid for one use per customer. Come savor the goodness while supporting sustainable eating choices.",
      minTargetAge: 16,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'VEGANSWEET15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Offer valid in-store only. Limited to one use per customer.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Bakery', 'Desserts'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Vegan+Desserts.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '10',
      businessProfile: null,
      categories: ['Happy Hour'],
      title: '$10 Off Sushi Platters!',
      keywords: ['restaurant', 'sushi', 'happy hour', 'discount'],
      description:
        'Relax and treat yourself to a delightful dining experience with $10 off our premium sushi platters during happy hour, from 4 PM to 6 PM daily. Perfectly crafted by our skilled chefs, our sushi platters feature fresh, high-quality ingredients including a variety of rolls, sashimi, and nigiri that will satisfy both sushi aficionados and newcomers alike. Whether you’re enjoying a casual night out or celebrating a special occasion, this offer makes it even more affordable to indulge in exquisite Japanese cuisine. Valid for dine-in customers only, this deal encourages you to unwind and enjoy great food paired with a welcoming atmosphere. Use promo code SUSHI10 at checkout to redeem this special offer. Don’t miss out on a chance to enjoy fresh sushi at a discounted price during our popular happy hour window. See you at the restaurant!',
      minTargetAge: 21,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'SUSHI10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Dine-in only. Valid during happy hour.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Restaurant'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Sushi+Platters.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '25',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '25% Off First Online Order!',
      keywords: ['cloud kitchen', 'delivery', 'discount', 'online order'],
      description:
        'Enjoy a fantastic 25% discount on your very first online order from our cloud kitchen. Our menu features a variety of delicious meals prepared fresh and delivered right to your doorstep, perfect for busy lifestyles and food lovers who appreciate convenience without compromising quality. Whether you crave gourmet burgers, healthy bowls, or ethnic specialties, this offer gives you a chance to sample our popular dishes at a great price. Simply enter promo code ORDER25 during checkout to receive the discount. This promotion is exclusively for first-time customers and applies to delivery orders only. Take advantage of this opportunity to explore new flavors and support local food service. The cloud kitchen model means we focus entirely on delivery, ensuring your food arrives fresh and ready to enjoy. Don’t miss out on your first order savings!',
      minTargetAge: 18,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'ORDER25',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'First-time customers only. Delivery only.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Cloud Kitchen'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/cloud+kitchen.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '3',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '$3 Off All Smoothies!',
      keywords: ['smoothie', 'juice bar', 'healthy', 'discount'],
      description:
        'Stay refreshed and energized with $3 off any smoothie purchase at our juice bar. Our smoothies are crafted with fresh fruits, vegetables, and superfoods designed to boost your health and satisfy your taste buds. Whether you’re looking for a post-workout recharge, a nutritious snack, or a delicious treat, this discount makes it easier to enjoy wholesome, tasty beverages. Perfect for all ages, our smoothies cater to a variety of dietary preferences including vegan, gluten-free, and low-sugar options. Visit us in-store to take advantage of this offer and sip on your favorite blend without breaking the bank. Use promo code SMOOTHIE3 to redeem. This promotion is not combinable with other deals and applies only to in-store purchases. Refresh yourself the healthy way today!',
      minTargetAge: 14,
      maxTargetAge: 40,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'SMOOTHIE3',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Offer valid on in-store orders only. Not valid with other deals.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Juice Bar'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Smoothies+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '30',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '30% Off Catering Orders Over $100',
      keywords: ['catering', 'discount', 'party food', 'event'],
      description:
        'Planning a party or corporate event? Take advantage of 30% off any catering order over $100 to make your occasion even more special. Our catering services provide a wide range of delicious options tailored to your event’s theme and dietary needs, from finger foods and appetizers to full meal buffets. We use fresh ingredients and professional presentation to ensure your guests are impressed. This significant discount allows you to enjoy high-quality food without stretching your budget. Whether it’s a birthday, anniversary, business meeting, or casual get-together, our team will help you customize the perfect menu. Advance booking is required to guarantee availability and service quality. Use promo code CATER30 when placing your order. Celebrate with fantastic food and savings!',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'CATER30',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Advance booking required. Minimum $100 order.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Catering Services'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Catering+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '10',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '10% Off All Breakfast Combos!',
      keywords: ['breakfast', 'cafe', 'morning deal', 'discount'],
      description:
        'Start your day the right way with 10% off all breakfast combo meals at our café. From hearty classics like eggs and bacon to lighter options like fresh fruit bowls and avocado toast, our breakfast combos are designed to fuel your morning efficiently and deliciously. Perfect for early risers, busy professionals, and families alike, this offer ensures you enjoy a nutritious start while saving money. Available for dine-in customers before 11 AM, this discount is ideal for those who want quality food in a cozy, welcoming environment. Use promo code BREAKFAST10 to claim your discount and make your morning brighter and tastier. Come in early and treat yourself to a great deal on the most important meal of the day!',
      minTargetAge: 16,
      maxTargetAge: 45,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'BREAKFAST10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid before 11 AM. Dine-in only.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Cafe/Coffee Shop'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Breakfast+Combos+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '2',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '$2 Off All Ice Cream Sundaes!',
      keywords: ['ice cream', 'dessert', 'summer', 'discount'],
      description:
        'Beat the heat and satisfy your sweet cravings with $2 off any ice cream sundae from our frozen dessert selection. Our sundaes feature rich, creamy ice cream topped with fresh fruits, nuts, sauces, and whipped cream, crafted to delight kids and adults alike. Whether you’re cooling down on a hot day or treating yourself after a meal, this offer lets you indulge in premium frozen desserts at a great price. Available in-store only and perfect for families, friends, and solo dessert lovers, this discount is easy to redeem using promo code SWEETDEAL2. Not valid on holidays to ensure the best experience during peak times. Don’t miss your chance to enjoy a classic treat and make your day a little sweeter!',
      minTargetAge: 10,
      maxTargetAge: 40,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'SWEETDEAL2',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'In-store only. Not valid on holidays.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Desserts'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Cream+Sundaes+.jpeg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Happy Hour'],
      title: '20% Off All Tap Beers!',
      keywords: ['bar', 'beer', 'happy hour', 'drinks'],
      description:
        'Celebrate happy hour with a refreshing 20% discount on all tap beers served at our bar from 6 PM to 9 PM daily. Whether you prefer crisp lagers, hoppy IPAs, rich stouts, or seasonal brews, our extensive selection of draft beers will satisfy every beer lover’s palate. Gather your friends and unwind after a long day in a lively and welcoming atmosphere while enjoying great savings on your favorite brews. This offer is valid for dine-in customers only and cannot be combined with other promotions. Use promo code TAPBEER20 to redeem your discount. Perfect for casual evenings, social gatherings, or after-work relaxation, this deal makes it easier to enjoy quality craft beers without stretching your budget. Cheers to good times and great beer!',
      minTargetAge: 21,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'TAPBEER20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Dine-in only. Valid during happy hour from 6 PM to 9 PM. Must be 21 or older.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Bar'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Tap+beer.jpeg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Happy Hour'],
      title: '20% Off Signature Cocktails!',
      keywords: ['bar', 'cocktails', 'happy hour', 'discount'],
      description:
        'Enjoy 20% off our signature cocktails during happy hour from 5 PM to 8 PM!',
      minTargetAge: 21,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'CHEERS20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid during happy hour only. Must be 21 or older.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Bar'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Signature+Cocktails!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '5',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: 'Save $5 on Your Coffee Order!',
      keywords: ['cafe', 'coffee', 'discount', 'morning deal'],
      description:
        'Start your day right! Save $5 on any coffee purchase over $20.',
      minTargetAge: 16,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'COFFEE5',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Minimum purchase of $20 required. Valid during weekdays.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Cafe/Coffee Shop'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Coffee+Order.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '10',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: '10% Off All Street Food Combos!',
      keywords: ['food truck', 'street food', 'combo', 'discount'],
      description:
        'Taste the street food vibes! Get 10% off any combo at our food truck.',
      minTargetAge: 18,
      maxTargetAge: 45,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'TRUCK10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Valid for combo meals only. Not applicable during events.',
      businessIndustry: 'Food & Drink',
      businessCategories: ['Food Truck'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/All+Street+Food+Combos!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '15',
      businessProfile: null,
      categories: ['Retail'],
      title: '15% Off All Car Accessories!',
      keywords: ['auto accessories', 'car accessories', 'discount'],
      description:
        'Upgrade your ride with our premium car accessories, now at 15% off!',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'UPGRADE15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid on selected items only.',
      businessIndustry: 'Automotive Services',
      businessCategories: ['Auto Accessories'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Car+Accessories!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '50',
      businessProfile: null,
      categories: ['Retail'],
      title: 'Save $50 on Custom Paint Jobs!',
      keywords: ['customization', 'paint job', 'auto services'],
      description:
        'Make your car stand out with a custom paint job and save $50 this week.',
      minTargetAge: 21,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'PAINT50',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for standard color options only.',
      businessIndustry: 'Automotive Services',
      businessCategories: ['Customization'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Custom+Paint+Jobs!.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '25',
      businessProfile: null,
      categories: ['Retail'],
      title: 'Get a $25 Off Premium Car Detailing!',
      keywords: ['detailing', 'car wash', 'premium service'],
      description:
        'Bring back the shine with our premium detailing service. Save $25 this month!',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'DETAIL25',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for full detailing packages only.',
      businessIndustry: 'Automotive Services',
      businessCategories: ['Detailing'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Car+Accessories!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },

    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Entertainment'],
      title: '20% Off Weekend Passes!',
      keywords: ['amusement', 'family fun', 'discount'],
      description:
        'Enjoy 20% off weekend passes at our amusement center! Fun for the whole family.',
      minTargetAge: 10,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'WEEKENDFUN',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid on Saturdays and Sundays only.',
      businessIndustry: 'Entertainment',
      businessCategories: ['Amusement Center'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Event+Planning+Packages!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '30',
      businessProfile: null,
      categories: ['Entertainment'],
      title: '$30 Off Group Bookings!',
      keywords: ['escape room', 'group activity', 'discount'],
      description:
        'Book an escape room experience for 4 or more people and save $30!',
      minTargetAge: 16,
      maxTargetAge: 45,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'ESCAPE30',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid on bookings of 4 or more. Excludes holidays.',
      businessIndustry: 'Entertainment',
      businessCategories: ['Escape Room'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Group+Bookings!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '10',
      businessProfile: null,
      categories: ['Entertainment'],
      title: '10% Off Event Planning Packages!',
      keywords: ['event planning', 'party', 'discount'],
      description:
        'Plan your next big event with us and get 10% off any package!',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'PLAN10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid for bookings made this month.',
      businessIndustry: 'Entertainment',
      businessCategories: ['Event Planning'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Event+Planning+Packages!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '25',
      businessProfile: null,
      categories: ['Clubs & Classes'],
      title: '25% Off First Dance Class!',
      keywords: ['dance studio', 'dance classes', 'discount'],
      description:
        'Join our dance studio and get 25% off your first class! Perfect for beginners.',
      minTargetAge: 12,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'DANCE25',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'New members only. Valid for first class.',
      businessIndustry: 'Fitness & Wellness',
      businessCategories: ['Dance Studio'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/First+Dance+Class!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '20',
      businessProfile: null,
      categories: ['Clubs & Classes'],
      title: 'Save $20 on Monthly Membership!',
      keywords: ['fitness center', 'gym', 'membership'],
      description:
        'Get fit with us! Enjoy a $20 discount on your first month of membership.',
      minTargetAge: 18,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'FIT20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for new memberships only.',
      businessIndustry: 'Fitness & Wellness',
      businessCategories: ['Fitness Center'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Monthly+Membership!+.jpeg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '15',
      businessProfile: null,
      categories: ['Clubs & Classes'],
      title: '15% Off All Yoga Classes!',
      keywords: ['yoga', 'wellness', 'discount'],
      description:
        'Experience tranquility and balance with 15% off all yoga classes this month.',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'ZEN15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid on drop-in classes only.',
      businessIndustry: 'Fitness & Wellness',
      businessCategories: ['Yoga Studio'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Yoga+Classes!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '30',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: 'Save $30 on Appliance Repair!',
      keywords: ['appliance repair', 'home services', 'discount'],
      description:
        'Get $30 off your first appliance repair service. Fast and reliable fixes!',
      minTargetAge: 25,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'FIX30',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Valid for first-time customers only. Excludes parts.',
      businessIndustry: 'Home Services',
      businessCategories: ['Appliance Repair'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Appliance+Repair!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: '20% Off Deep Cleaning Package!',
      keywords: ['home cleaning', 'deep clean', 'discount'],
      description:
        'Freshen up your home with 20% off our deep cleaning package. Book today!',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'CLEAN20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid for full home cleaning packages only.',
      businessIndustry: 'Home Services',
      businessCategories: ['Home Cleaning'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Deep+Cleaning+Package!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '50',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: '$50 Off Emergency Plumbing!',
      keywords: ['plumbing services', 'emergency plumbing', 'discount'],
      description:
        'Need urgent plumbing help? Get $50 off any emergency service today.',
      minTargetAge: 25,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'PLUMB50',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for emergency calls only. Excludes materials.',
      businessIndustry: 'Home Services',
      businessCategories: ['Plumbing Services'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Emergency+Plumbing!+.png',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '15',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: '15% Off Weekend Stays!',
      keywords: ['bed & breakfast', 'hospitality', 'discount', 'weekend'],
      description:
        'Escape the city and enjoy a cozy weekend at our B&B with 15% off your stay.',
      minTargetAge: 25,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'RELAX15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for Friday to Sunday stays. Booking required.',
      businessIndustry: 'Hospitality',
      businessCategories: ['Bed & Breakfast'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Weekend+Stays!+.png',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '50',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: '$50 Off Your Next Booking!',
      keywords: ['hotel', 'stay', 'discount', 'booking'],
      description:
        'Book your next hotel stay with us and save $50 on any room category.',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'STAY50',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid on bookings of 2 nights or more.',
      businessIndustry: 'Hospitality',
      businessCategories: ['Hotel'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Weekend+Stays!+.png',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Local Attractions'],
      title: '20% Off Long Stays!',
      keywords: ['vacation rentals', 'hospitality', 'discount', 'long stay'],
      description:
        'Planning an extended getaway? Get 20% off vacation rentals when you book for 7 nights or more.',
      minTargetAge: 21,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'LONGSTAY20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for stays of 7 nights or longer.',
      businessIndustry: 'Hospitality',
      businessCategories: ['Vacation Rentals'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Long+Stays!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Pets'],
      title: '20% Off Grooming Packages!',
      keywords: ['pet grooming', 'discount', 'dog grooming', 'cat grooming'],
      description:
        'Pamper your pet with a grooming session and enjoy 20% off any package!',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'GROOM20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Valid on full grooming packages only. Appointment required.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Pet Grooming'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Grooming+Packages!+.jpeg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '15',
      businessProfile: null,
      categories: ['Pets'],
      title: '$15 Off Weekend Boarding!',
      keywords: ['pet boarding', 'pet care', 'weekend discount'],
      description:
        'Going away for the weekend? Book your pet’s stay and get $15 off!',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'BOARD15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for weekend stays only. Limited availability.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Pet Boarding'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Weekend+Boarding!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '10',
      businessProfile: null,
      categories: ['Pets'],
      title: '10% Off First Vet Visit!',
      keywords: ['veterinary clinic', 'pet care', 'discount', 'first visit'],
      description:
        'New to our clinic? Get 10% off your pet’s first consultation with us.',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'HEALTHY10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for new patients only. Appointment required.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Veterinary Clinic'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/First+Vet+Visit!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Pets'],
      title: '20% Off Grooming Packages!',
      keywords: ['pet grooming', 'discount', 'dog grooming', 'cat grooming'],
      description:
        'Pamper your pet with a grooming session and enjoy 20% off any package!',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'GROOM20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Valid on full grooming packages only. Appointment required.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Pet Grooming'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Grooming+Packages!+.jpeg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '15',
      businessProfile: null,
      categories: ['Pets'],
      title: '$15 Off Weekend Boarding!',
      keywords: ['pet boarding', 'pet care', 'weekend discount'],
      description:
        'Going away for the weekend? Book your pet’s stay and get $15 off!',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'BOARD15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for weekend stays only. Limited availability.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Pet Boarding'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Weekend+Boarding!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '10',
      businessProfile: null,
      categories: ['Pets'],
      title: '10% Off First Vet Visit!',
      keywords: ['veterinary clinic', 'pet care', 'discount', 'first visit'],
      description:
        'New to our clinic? Get 10% off your pet’s first consultation with us.',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'HEALTHY10',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for new patients only. Appointment required.',
      businessIndustry: 'Pet Services',
      businessCategories: ['Veterinary Clinic'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/First+Vet+Visit!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '20',
      businessProfile: null,
      categories: ['Retail'],
      title: '20% Off Tax Consultation!',
      keywords: ['accounting', 'tax', 'consulting', 'discount'],
      description:
        'Get 20% off your first tax consultation with our certified accounting experts.',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'TAX20',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions:
        'Valid for first-time clients only. Appointment required.',
      businessIndustry: 'Professional Services',
      businessCategories: ['Accounting Consultant'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Tax+Consultation!+.png',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '50',
      businessProfile: null,
      categories: ['Retail'],
      title: '$50 Off Business Strategy Session!',
      keywords: ['business consulting', 'strategy', 'discount'],
      description:
        'Enhance your business strategy with a $50 discount on our expert consultation session.',
      minTargetAge: 30,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'BIZ50',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid for the first session only.',
      businessIndustry: 'Professional Services',
      businessCategories: ['Business Consultant'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Business+Strategy+Session!+.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'PERCENTAGE',
      discountValue: '15',
      businessProfile: null,
      categories: ['Retail'],
      title: '15% Off Legal Consultation!',
      keywords: ['legal services', 'lawyer', 'consultation', 'discount'],
      description:
        'Book a legal consultation today and get 15% off your first session with our attorneys.',
      minTargetAge: 25,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'LEGAL15',
      isFree: false,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid for initial consultations only.',
      businessIndustry: 'Professional Services',
      businessCategories: ['Legal Services'],
      thumbnail:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Templates/Legal+Consultation!.jpg',
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
  ],

  DashboardConfigs: [
    {
      name: 'Trending Now',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: true,
      freeIncluded: false,
      limit: 15,
      categories: [
        'Entertainment',
        'Music & Nightlife',
        'Sports',
        'Foods & Drink',
        'Health & Fitness',
      ],
      sortOrder: 100,
    },
    {
      name: 'Flash Deals',
      offersIncluded: false,
      eventsIncluded: false,
      flashOffersIncluded: true,
      freeIncluded: false,
      limit: 15,
      categories: ['Foods & Drink', 'Retail', 'Beauty & Spa', 'Happy Hour'],
      sortOrder: 200,
    },
    {
      name: 'Free Offers',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: true,
      limit: 15,
      categories: [
        'Clubs & Classes',
        'Days Out',
        'Entertainment',
        'Local Attractions',
        'Charity',
      ],
      sortOrder: 300,
    },
    {
      name: 'Food and Drink',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Foods & Drink', 'Happy Hour'],
      sortOrder: 400,
    },
    {
      name: 'Events Near You',
      offersIncluded: false,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: [
        'Music & Nightlife',
        'Sports',
        'Local Attractions',
        'Entertainment',
      ],
      sortOrder: 500,
    },
    {
      name: 'Health and Wellness',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Health & Fitness', 'Clubs & Classes'],
      sortOrder: 600,
    },
    {
      name: 'Charity and Community',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Charity', 'Local Attractions'],
      sortOrder: 700,
    },
    {
      name: 'Nightlife and Parties',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Music & Nightlife', 'Happy Hour'],
      sortOrder: 800,
    },
    {
      name: 'Retail and Shopping',
      offersIncluded: true,
      eventsIncluded: false,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Retail'],
      sortOrder: 900,
    },
    {
      name: 'Pet Friendly',
      offersIncluded: true,
      eventsIncluded: true,
      flashOffersIncluded: false,
      freeIncluded: false,
      limit: 15,
      categories: ['Pets'],
      sortOrder: 1000,
    },
  ],
  Departmens: [
    {
      name: 'Operations',
      description: 'Manages day-to-day business operations.',
      roles: [
        'Store Manager',
        'General Manager',
        'Regional Manager',
        'Operational Manager',
      ],
    },
    {
      name: 'Marketing',
      description:
        'Responsible for promoting products and enhancing brand image.',
      roles: ['Marketing Manager'],
    },
    {
      name: 'Finance',
      description: 'Handles financial transactions, reporting, and budgeting.',
      roles: ['Finance Manager'],
    },
    {
      name: 'Customer Support',
      description: 'Provides assistance and support to customers.',
      roles: ['Support Executive'],
    },
    {
      name: 'Sales',
      description: 'Drives revenue through customer acquisition and retention.',
      roles: ['Regional Manager', 'General Manager', 'Store Manager'],
    },
    {
      name: 'Product Management',
      description: 'Responsible for product planning and development.',
      roles: ['Operational Manager', 'General Manager'],
    },
    {
      name: 'Human Resources',
      description:
        'Manages recruitment, employee relations, and personnel policies.',
      roles: ['General Manager'],
    },
    {
      name: 'Logistics',
      description:
        'Oversees supply chain, inventory, and product distribution.',
      roles: ['Store Manager', 'Operational Manager'],
    },
    {
      name: 'IT and Systems',
      description:
        'Manages IT infrastructure, software, and technical support.',
      roles: ['Operational Manager', 'Support Executive'],
    },
    {
      name: 'Quality Assurance',
      description:
        'Ensures product and service quality through testing and evaluation.',
      roles: ['Operational Manager', 'General Manager'],
    },
    {
      name: 'Legal and Compliance',
      description:
        'Ensures adherence to legal regulations and compliance standards.',
      roles: ['Finance Manager', 'General Manager'],
    },
  ],
};
