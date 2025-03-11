import { DeviceTypes } from 'src/enums/auth.enums';
import { Roles } from 'src/enums/user.enum';
import { DurationType } from 'src/subscription/models/subscriptionProduct.model';

export const Seeder = {
  categories: [
    {
      name: 'all',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/all.svg',
      description: 'All',
      color: '#012426',
    },
    {
      name: 'Arts & Crafts',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/arts_and_crafts.svg',
      description: 'Arts & Crafts',
      color: '#FFEB3B',
    },
    {
      name: 'Beauty & Spa',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/beauty_and_spa.svg',
      description: 'Beauty & Spa',
      color: '#EE536E',
    },
    {
      name: 'Charity',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/charity.svg',
      description: 'Charity',
      color: '#ADD243',
    },
    {
      name: 'Clubs & Classes',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/clubs_and_classes.svg',
      description: 'Clubs & Classes',
      color: '#5AB1E2',
    },
    {
      name: 'Days Out',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/days_out.svg',
      description: 'Days Out',
      color: '#E5D59B',
    },
    {
      name: 'Entertainment',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/entertainment.svg',
      description: 'Entertainment',
      color: '#ACDCD9',
    },
    {
      name: 'Foods & Drink',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/food_and_drink.svg',
      description: 'Foods & Drink',
      color: '#F59438',
    },
    {
      name: 'Happy Hour',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/happy_hour.svg',
      description: 'Happy Hour',
      color: '#E77A6B',
    },
    {
      name: 'Health & Fitness',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/health_and_fitness.svg',
      description: 'Health & Fitness',
      color: '#71E2AC',
    },
    {
      name: 'Local Attractions',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/local_attractions.svg',
      description: 'Local Attractions',
      color: '#FCBBBB',
    },
    {
      name: 'Music & Nightlife',
      image:
        'https://pinntagbucket.s3.amazonaws.com/categories/music_and_nightlife.svg',
      description: 'Music & Nightlife',
      color: '#7B88FB',
    },
    {
      name: 'Pets',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/pets.svg',
      description: 'Pets',
      color: '#54BDF9',
    },
    {
      name: 'Retail',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/retail.svg',
      description: 'Retail',
      color: '#C9DD91',
    },
    {
      name: 'Sports',
      image: 'https://pinntagbucket.s3.amazonaws.com/categories/sports.svg',
      description: 'Sports',
      color: '#F05A39',
    },
  ],
  roles: [
    {
      name: Roles.ADMIN,
    },
    {
      name: Roles.USER,
    },
    {
      name: Roles.SUB_ADMIN,
    },
    {
      name: Roles.STAFF,
    },
    {
      name: Roles.GUEST,
    },
    {
      name: Roles.BUSINESS_PROFILE,
    },
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
  ]
};
