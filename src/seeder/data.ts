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
      title: 'all',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/all.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/all.svg',
      activeColor: '#012426',
      description: 'All',
    },
    {
      title: 'Arts & Crafts',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/arts_and_crafts.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/arts_and_crafts.svg',
      activeColor: '#FFEB3B',
      description: 'Arts & Crafts',
    },
    {
      title: 'Beauty & Spa',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/beauty_and_spa.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/beauty_and_spa.svg',
      activeColor: '#EE536E',
      description: 'Beauty & Spa',
    },
    {
      title: 'Charity',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/charity.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/charity.svg',
      activeColor: '#ADD243',
      description: 'Charity',
    },
    {
      title: 'Clubs & Classes',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/clubs_and_classes.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/clubs_and_classes.svg',
      activeColor: '#5AB1E2',
      description: 'Clubs & Classes',
    },
    {
      title: 'Days Out',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/days_out.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/days_out.svg',
      activeColor: '#E5D59B',
      description: 'Days Out',
    },
    {
      title: 'Entertainment',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/entertainment.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/entertainment.svg',
      activeColor: '#ACDCD9',
      description: 'Entertainment',
    },
    {
      title: 'Foods & Drink',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/food_and_drink.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/food_and_drink.svg',
      activeColor: '#F59438',
      description: 'Foods & Drink',
    },
    {
      title: 'Happy Hour',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/happy_hour.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/happy_hour.svg',
      activeColor: '#E77A6B',
      description: 'Happy Hour',
    },
    {
      title: 'Health & Fitness',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/health_and_fitness.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/health_and_fitness.svg',
      activeColor: '#71E2AC',
      description: 'Health & Fitness',
    },
    {
      title: 'Local Attractions',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/local_attractions.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/local_attractions.svg',
      activeColor: '#FCBBBB',
      description: 'Local Attractions',
    },
    {
      title: 'Music & Nightlife',
      lightIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/music_and_nightlife.svg',
      darkIcon:
        'https://pinntagbucket.s3.amazonaws.com/categories/music_and_nightlife.svg',
      activeColor: '#7B88FB',
      description: 'Music & Nightlife',
    },
    {
      title: 'Pets',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/pets.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/pets.svg',
      activeColor: '#54BDF9',
      description: 'Pets',
    },
    {
      title: 'Retail',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/retail.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/retail.svg',
      activeColor: '#C9DD91',
      description: 'Retail',
    },
    {
      title: 'Sports',
      lightIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/sports.svg',
      darkIcon: 'https://pinntagbucket.s3.amazonaws.com/categories/sports.svg',
      activeColor: '#F05A39',
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
      activeColor: '#E74C3C',
    },
    {
      title: 'Retail',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Retails.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Retails.svg',
      activeColor: '#2980B9',
    },
    {
      title: 'Health & Beauty',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Health+%26+Beauty.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Health+%26+Beauty.svg',
      activeColor: '#AF7AC5',
    },
    {
      title: 'Fitness & Wellness',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Fitness+%26+Wellness.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Fitness+%26+Wellness.svg',
      activeColor: '#1ABC9C',
    },
    {
      title: 'Entertainment',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Entertainment+%26+Experiences.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Entertainment+%26+Experiences.svg',
      activeColor: '#F1C40F',
    },
    {
      title: 'Automotive Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Automotive+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Automotive+Services.svg',
      activeColor: '#34495E',
    },
    {
      title: 'Home Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Home+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Home+Services.svg',
      activeColor: '#D35400',
    },
    {
      title: 'Pet Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Pet+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Pet+Services.svg',
      activeColor: '#F39C12',
    },
    {
      title: 'Hospitality',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Hospitality.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Hospitality.svg',
      activeColor: '#8E44AD',
    },
    {
      title: 'Professional Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Light/Professional+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Industry/Dark/Professional+Services.svg',
      activeColor: '#2C3E50',
    },
  ],
  BusinessCategories: [
    {
      title: 'Restaurant',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Restaurant-Dine.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Restaurant-Dine.svg',
      activeColor: '#C0392B',
      industry: 'Food & Drink',
    },
    {
      title: 'Cafe/Coffee Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cafe-Coffee+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cafe-Coffee+Shop.svg',
      activeColor: '#8E5E3A',
      industry: 'Food & Drink',
    },
    {
      title: 'Bakery',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bakery-Desert+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bakery-Desert+Shop.svg',
      activeColor: '#F39C12',
      industry: 'Food & Drink',
    },
    {
      title: 'Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bar-Lounge-Pub.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bar-Lounge-Pub.svg',
      activeColor: '#6C3483',
      industry: 'Food & Drink',
    },
    {
      title: 'Juice Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Juice-Smoothie+Bar.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Juice-Smoothie+Bar.svg',
      activeColor: '#27AE60',
      industry: 'Food & Drink',
    },
    {
      title: 'Food Truck',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Food+Truck-Mobile+Vendor.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Food+Truck-Mobile+Vendor.svg',
      activeColor: '#E67E22',
      industry: 'Food & Drink',
    },
    {
      title: 'Catering Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Catering+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Catering+Services.svg',
      activeColor: '#A04000',
      industry: 'Food & Drink',
    },
    {
      title: 'Cloud Kitchen',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cloud+Kitchen+-+Delivery+Only.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cloud+Kitchen+-+Delivery+Only.svg',
      activeColor: '#7B241C',
      industry: 'Food & Drink',
    },
    {
      title: 'Frozen Desserts',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Ice+Cream+-+Frozen+Desserts.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Ice+Cream+-+Frozen+Desserts.svg',
      activeColor: '#FADBD8',
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
      categories: ['Retail'],
      title: 'Flash Sale: 15% Off All Items!',
      keywords: ['sale', 'discount', 'retail'],
      description:
        'Enjoy 15% off on all products this weekend only. Limited stock!',
      minTargetAge: 18,
      maxTargetAge: 60,
      targetGenders: ['male', 'female'],
      promotionCode: 'FLASH15',
      isFree: true,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Offer valid till stock lasts.',
      businessIndustry: BusinessIndustries.RETAIL,
      businessCategories: [BusinessSubCategory.CONVENIENCE_STORE],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '100',
      businessProfile: null,
      categories: ['Foods & Drink'],
      title: 'Free Dessert With Every Meal!',
      keywords: ['dessert', 'restaurant', 'free'],
      description: 'Get a free dessert with every main course this week!',
      minTargetAge: 16,
      maxTargetAge: 55,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'SWEETDEAL',
      isFree: true,
      participationCost: '',
      termsApplied: true,
      termsAndConditions: 'Valid for dine-in only.',
      businessIndustry: 'Food & Beverage',
      businessCategories: ['Food & Beverage'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['Health & Fitness'],
      title: 'Free Yoga Class',
      keywords: ['yoga', 'health', 'wellness'],
      description: 'Join our free weekend yoga session and rejuvenate!',
      minTargetAge: 21,
      maxTargetAge: 65,
      targetGenders: ['female'],
      promotionCode: '',
      isFree: true,
      participationCost: '',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: BusinessIndustries.FITNESS_WELLNESS,
      businessCategories: [BusinessSubCategory.YOGA_STUDIO],
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
      categories: ['all'],
      title: '10% Off On Health Insurance Plans',
      keywords: ['insurance', 'finance', 'discount'],
      description: 'Secure your future with 10% off on our best-selling plans.',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male', 'female'],
      promotionCode: 'INSURE10',
      isFree: false,
      participationCost: '1000',
      termsApplied: true,
      termsAndConditions: 'Valid for new customers only.',
      businessIndustry: BusinessIndustries.PROFESSIONAL_SERVICES,
      businessCategories: [BusinessSubCategory.ACCOUNTING_CONSULTANT],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['all'],
      title: 'Tech Meetup 2025',
      keywords: ['tech', 'networking', 'software'],
      description:
        'Join leading developers and startups for a day of innovation.',
      minTargetAge: 18,
      maxTargetAge: 50,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: '',
      isFree: false,
      participationCost: '500',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: BusinessIndustries.AUTOMOTIVE_SERVICES,
      businessCategories: ['Technology & Software'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '5000',
      businessProfile: null,
      categories: ['all'],
      title: '₹5,000 Off On Booking Fees!',
      keywords: ['real estate', 'discount', 'booking'],
      description: 'Book your dream home and get ₹5,000 off instantly.',
      minTargetAge: 30,
      maxTargetAge: 65,
      targetGenders: ['male', 'female'],
      promotionCode: 'HOMESWEET',
      isFree: false,
      participationCost: '20000',
      termsApplied: true,
      termsAndConditions: 'Offer valid on bookings above ₹10 lakh.',
      businessIndustry: 'Real Estate & Construction',
      businessCategories: ['Real Estate & Construction'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['all'],
      title: 'Test Drive Carnival',
      keywords: ['cars', 'test drive', 'automobile'],
      description:
        'Experience the latest car models at our exclusive test drive event.',
      minTargetAge: 25,
      maxTargetAge: 60,
      targetGenders: ['male'],
      promotionCode: '',
      isFree: true,
      participationCost: '',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: 'Automotive & Transportation',
      businessCategories: ['Automotive & Transportation'],
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
      categories: ['all'],
      title: '20% Off On All Online Courses',
      keywords: ['education', 'learning', 'online'],
      description:
        'Level up your skills with 20% off all our certified courses.',
      minTargetAge: 16,
      maxTargetAge: 45,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'LEARN20',
      isFree: false,
      participationCost: '2000',
      termsApplied: true,
      termsAndConditions: 'Offer valid for this month only.',
      businessIndustry: 'Education & Training',
      businessCategories: ['Education & Training'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['all'],
      title: 'Factory Open Day Tour',
      keywords: ['manufacturing', 'industry', 'tour'],
      description: 'Get a behind-the-scenes look at how our products are made.',
      minTargetAge: 18,
      maxTargetAge: 55,
      targetGenders: ['male', 'female'],
      promotionCode: '',
      isFree: true,
      participationCost: '',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: 'Manufacturing & Industrial',
      businessCategories: ['Manufacturing & Industrial'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['Entertainment'],
      title: 'Film Premiere Event',
      keywords: ['film', 'movie', 'premiere'],
      description:
        'Join us for an exclusive screening of the latest blockbuster.',
      minTargetAge: 18,
      maxTargetAge: 60,
      targetGenders: ['male', 'female'],
      promotionCode: '',
      isFree: true,
      participationCost: '',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: 'Media & Entertainment',
      businessCategories: ['Media & Entertainment'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'offer',
      user: null,
      discountType: 'FLAT',
      discountValue: '500',
      businessProfile: null,
      categories: ['all'],
      title: '₹500 Off On All Bookings!',
      keywords: ['tourism', 'discount', 'travel'],
      description: 'Book a vacation today and get ₹500 off on all bookings.',
      minTargetAge: 18,
      maxTargetAge: 60,
      targetGenders: ['male', 'female'],
      promotionCode: 'TRAVEL500',
      isFree: false,
      participationCost: '1000',
      termsApplied: true,
      termsAndConditions:
        'Offer valid for bookings made before end of this month.',
      businessIndustry: 'Tourism & Hospitality',
      businessCategories: ['Tourism & Hospitality'],
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
      categories: ['all'],
      title: '25% Off On Organic Produce',
      keywords: ['organic', 'farming', 'discount'],
      description: 'Get fresh, organic produce at 25% off this week only.',
      minTargetAge: 18,
      maxTargetAge: 60,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: 'FRESH25',
      isFree: false,
      participationCost: '500',
      termsApplied: true,
      termsAndConditions: 'Offer valid till stock lasts.',
      businessIndustry: 'Agriculture & Farming',
      businessCategories: ['Agriculture & Farming'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
    {
      creatorType: 'AdminUser',
      type: 'business_event',
      user: null,
      discountType: 'NONE',
      discountValue: '0',
      businessProfile: null,
      categories: ['Charity'],
      title: 'Charity Run 2025',
      keywords: ['charity', 'run', 'non-profit'],
      description: 'Join our charity run to raise funds for a good cause.',
      minTargetAge: 18,
      maxTargetAge: 65,
      targetGenders: ['male', 'female', 'others'],
      promotionCode: '',
      isFree: true,
      participationCost: '',
      termsApplied: false,
      termsAndConditions: '',
      businessIndustry: 'Non-Profit & Social Enterprises',
      businessCategories: ['Non-Profit & Social Enterprises'],
      createdAt: null,
      updatedAt: null,
      __v: 0,
    },
  ],
};
