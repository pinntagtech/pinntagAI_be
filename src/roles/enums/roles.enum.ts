import { BusinessUser } from "src/business/model/businessUser.model";

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
  OUTLETS: 'outlets'
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
  Dashboard: 'dashboard',
  Businesses: 'businesses',
  Business_Segments: 'business segments',
  Consumers: 'consumers',
  Content_Categories: 'content categories',
  Content_Templates: 'content templates',
  Explore_Settings: 'explore settings',
  My_Users: 'my users',
  Storage: 'storage',
  Roles_Privileges: 'roles & privileges',
  Content_ETL: 'content etl',
  Reported_Content: 'reported content',
  Analytics: 'analytics',
}

export const BusinessResourceTypes = {
  
}