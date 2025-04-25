import { BusinessIndustries } from 'src/business/enums/business.enum';
import { DeviceTypes } from 'src/enums/auth.enums';
import { RoleBelonging, Roles } from 'src/roles/enums/roles.enum';
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
      title: 'Entertainment & Experiences',
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
      title: 'Restaurant / Dine-In',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Restaurant-Dine.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Restaurant-Dine.svg',
      activeColor: '#C0392B',
      industry: 'Food & Drink',
    },
    {
      title: 'Cafe / Coffee Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cafe-Coffee+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cafe-Coffee+Shop.svg',
      activeColor: '#8E5E3A',
      industry: 'Food & Drink',
    },
    {
      title: 'Bakery / Dessert Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bakery-Desert+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bakery-Desert+Shop.svg',
      activeColor: '#F39C12',
      industry: 'Food & Drink',
    },
    {
      title: 'Bar / Lounge / Pub',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Bar-Lounge-Pub.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Bar-Lounge-Pub.svg',
      activeColor: '#6C3483',
      industry: 'Food & Drink',
    },
    {
      title: 'Juice / Smoothie Bar',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Juice-Smoothie+Bar.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Juice-Smoothie+Bar.svg',
      activeColor: '#27AE60',
      industry: 'Food & Drink',
    },
    {
      title: 'Food Truck / Mobile Vendor',
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
      title: 'Cloud Kitchen / Delivery Only',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Light/Cloud+Kitchen+-+Delivery+Only.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Food+%26+Drink/Dark/Cloud+Kitchen+-+Delivery+Only.svg',
      activeColor: '#7B241C',
      industry: 'Food & Drink',
    },
    {
      title: 'Ice Cream / Frozen Desserts',
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
      title: 'Grocery & Convenience Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Grocery+%26+Convenience+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Grocery+%26+Convenience+Store.svg',
      activeColor: '#58D68D',
      industry: 'Retail',
    },
    {
      title: 'Home Decor / Furniture',
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
      title: 'Bookstore / Stationery',
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
      title: 'Vape / Smoke Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Vape+-+Smoke+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Vape+-+Smoke+Shop.svg',
      activeColor: '#34495E',
      industry: 'Retail',
    },
    {
      title: 'Gift & Souvenir Shop',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Gift+%26+Souvenir+Shop.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Gift+%26+Souvenir+Shop.svg',
      activeColor: '#EC7063',
      industry: 'Retail',
    },
    {
      title: 'Thrift / Second Hand Store',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Light/Thrift+-+Second+Hand+Store.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Retails/Dark/Thrift+-+Second+Hand+Store.svg',
      activeColor: '#7D6608',
      industry: 'Retail',
    },
    {
      title: 'Salon / Hairdresser',
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
      title: 'Skincare / Aesthetics',
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
      title: 'Dermatology / Skin Clinic',
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
      title: 'Gym / Fitness Center',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Gym+-+Fitness+Center.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Gym+-+Fitness+Center.svg',
      activeColor: '#1ABC9C',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Yoga / Pilates Studio',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Light/Yoga+-+Pilates+Studio.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Fitness+%26+Wellness/Dark/Yoga+-+Pilates+Studio.svg',
      activeColor: '#76D7C4',
      industry: 'Fitness & Wellness',
    },
    {
      title: 'Martial Arts / Boxing Studio',
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
      title: 'Physiotherapy / Rehabilitation',
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
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Party Rentals',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Party+Rentals.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Party+Rentals.svg',
      activeColor: '#DC7633',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Amusement Center / Arcade',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Amusement+Center+-+Arcade.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Amusement+Center+-+Arcade.svg',
      activeColor: '#E74C3C',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Escape Room / VR Experience',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Escape+Room+-+VR+Experience.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Escape+Room+-+VR+Experience.svg',
      activeColor: '#5D6D7E',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Tours & Local Experiences',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Tours+%26+Local+Experiences.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Tours+%26+Local+Experiences.svg',
      activeColor: '#58D68D',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'DJ / Performer Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/DJ+-+Performer+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/DJ+-+Performer+Services.svg',
      activeColor: '#AF601A',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Kids Entertainment',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Kids+Entertainment.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Kids+Entertainment.svg',
      activeColor: '#F7DC6F',
      industry: 'Entertainment & Experiences',
    },
    {
      title: 'Photography / Videography',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Photography+-+Videography.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Photography+-+Videography.svg',
      activeColor: '#7FB3D5',
      industry: 'Entertainment & Experiences',
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
      title: 'Auto Parts & Accessories',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Light/Photography+-+Videography.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Entertainment+%26+Experiences/Dark/Photography+-+Videography.svg',
      activeColor: '#2E4053',
      industry: 'Automotive Services',
    },
    {
      title: 'Rental / Leasing',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Light/Rental+-+Leasing.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Automotive+Services/Dark/Rental+-+Leasing.svg',
      activeColor: '#1F618D',
      industry: 'Automotive Services',
    },
    {
      title: 'Customization / Wrapping',
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
      title: 'Landscaping / Gardening',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Light/Landscaping+-+Gardening.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Home+Services/Dark/Landscaping+-+Gardening.svg',
      activeColor: '#229954',
      industry: 'Home Services',
    },
    {
      title: 'Interior Design / Renovation',
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
      title: 'Pet Boarding / Daycare',
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
      title: 'Hotel / Resort',
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
      title: 'Guest House / Homestay',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Guest+House+-+Homestay.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Guest+House+-+Homestay.svg',
      activeColor: '#D7BDE2',
      industry: 'Hospitality',
    },
    {
      title: 'Hostel / Backpacker Lodging',
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
      title: 'Campgrounds / Glamping',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Light/Campgrounds+-+Glamping.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Hospitality/Dark/Campgrounds+-+Glamping.svg',
      activeColor: '#229954',
      industry: 'Hospitality',
    },
    {
      title: 'Accounting / Tax Consultant',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Accounting+-+Tax+Consultant.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Accounting+-+Tax+Consultant.svg',
      activeColor: '#566573',
      industry: 'Professional Services',
    },
    {
      title: 'Legal Services / Law Firm',
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
      title: 'Education / Tutoring',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Education+-+Tutoring.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Education+-+Tutoring.svg',
      activeColor: '#82E0AA',
      industry: 'Professional Services',
    },
    {
      title: 'Translation / Language Services',
      lightIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Light/Translation+-+Language+Services.svg',
      darkIcon:
        'https://pinntag-assets.s3.us-east-1.amazonaws.com/Category/Professional+Services/Dark/Translation+-+Language+Services.svg',
      activeColor: '#B2BABB',
      industry: 'Professional Services',
    },
  ],
};
