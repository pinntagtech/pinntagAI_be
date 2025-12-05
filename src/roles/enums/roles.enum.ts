import { BusinessUser } from 'src/business/model/businessUser.model';

export const RoleCreatorType = {
  ADMIN: 'Admin',
  BUSINESS: BusinessUser.name,
  SYSTEM: 'System',
};

export const RoleBelonging = {
  SYSTEM: 'System',
  BUSINESS: 'Business',
};

export const Roles = {
  ADMIN: 'admin',
  USER: 'user',
  SUB_ADMIN: 'sub_admin',
  STAFF: 'staff',
  GUEST: 'guest',
  BUSINESS_PROFILE: 'business_profile',
  SUPER_ADMIN: 'Super Admin',
};

export const Actions = {
  ALL: 'all',
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
};

export const ResourceTypes = {
  ADMIN: 'admin',
  BUSINESS: 'business',
  BUSINESS_USER: 'business User',
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  REFERRALS: 'referrals',
  OTPS: 'otps',
  AUTH: 'auth',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  SHIPPING: 'shipping',
  SETTINGS: 'settings',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  REVIEWS: 'reviews',
  REPORTS: 'reports',
  BANNERS: 'banners',
  PAGES: 'pages',
  FAQS: 'faqs',
  COUPONS: 'coupons',
  BRANDS: 'brands',
  WISHLISTS: 'wishlists',
  CARTS: 'carts',
  LOCATIONS: 'locations',
  TAXES: 'taxes',
  ADDRESSES: 'addresses',
  PRIVILEGES: 'privileges',
  OUTLETS: 'outlets',
  ETL_Source: 'etl_source',
  ETL_Source_Group: 'etl_source_group',
  // PAYMENT_METHODS: 'payment_methods',
  // SHIPPING_METHODS: 'shipping_methods',
  // ORDER_STATUSES: 'order_statuses',
  // ORDER_TRACKINGS: 'order_trackings',
  // ORDER_REFUNDS: 'order_refunds',
  // ORDER_PAYMENTS: 'order_payments',
  // ORDER_ITEMS: 'order_items',
  // ORDER_INVOICES: 'order_invoices',
  // ORDER_DETAILS: 'order_details',
  // ORDER_DELIVERIES: 'order_deliveries',
  // ORDER_COMMISSIONS: 'order_commissions',
};

export const AdminResourceTypes = {
  DASHBOARD: 'dashboard',
  BUSINESSES: 'businesses',
  BUSINESS_SEGMENTS: 'business segments',
  CONSUMERS: 'consumers',
  CONTENT_CATEGORIES: 'content categories',
  CONTENT_TEMPLATES: 'content templates',
  EXPLORE_SETTINGS: 'explore settings',
  MY_USERS: 'my users',
  STORAGE: 'storage',
  ROLES_AND_PRIVILEGES: 'roles & privileges',
  CONTENT_ETL: 'content etl',
  REPORTED_CONTENT: 'reported content',
  ANALYTICS: 'analytics',
};

export const BusinessResourceTypes = {
  DASHBOARD: 'dashboard',
  CONTENT: 'content',
  REWARDS: 'rewards',
  STORAGE: 'storage',
  LOCATIONS: 'locations',
  REGIONS: 'regions',
  DEPARTMENTS: 'departments',
  ROLES_AND_PRIVILEGES: 'roles_and_privileges',
  TEAM: 'team',
  TEMPLATES: 'templates',
  SUBSCRIPTION: 'subscription',
  BUSINESS_PROFILE: 'business_profile',
  FEED: 'feed',
  CHECKIN_AND_REDEMPTION: 'Check-ins & Redemptions'
};
