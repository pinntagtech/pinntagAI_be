export const DefaultBusinessOwnerRole = {
  name: 'Business Owner',
  creatorType: 'Business',
  belongsTo: 'Business',
  isSuperAdmin: false,
  isPrimaryAdmin: true,
  // privileges: {
  //   BUSINESS: ['create', 'read', 'update', 'delete'],
  //   PRODUCTS: ['create', 'read', 'update', 'delete'],
  //   ORDERS: ['create', 'read', 'update', 'delete'],
  //   PAYMENTS: ['create', 'read', 'update', 'delete'],
  //   COUPONS: ['create', 'read', 'update', 'delete'],
  // },
}
export const DefaultBusinessRoles = {
  Store_Manager: {
    name: 'Store Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isPrimaryAdmin: false,
    privileges: {
      ORDERS: ['create', 'read', 'update', 'delete'],
      PRODUCTS: ['create', 'read', 'update', 'delete'],
      REVIEWS: ['read'],
    },
  },
  Marketing_Manager: {
    name: 'Marketing Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isPrimaryAdmin: false,
    privileges: {
      COUPONS: ['create', 'read', 'update', 'delete'],
      BANNERS: ['create', 'read', 'update', 'delete'],
      BRANDS: ['create', 'read', 'update', 'delete'],
    },
  },
  Finance_Manager: {
    name: 'Finance Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isPrimaryAdmin: false,
    privileges: {
      PAYMENTS: ['create', 'read', 'update', 'delete'],
      REPORTS: ['read'],
    },
  },
  Support_Executive: {
    name: 'Support Executive',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isPrimaryAdmin: false,
    privileges: {
      MESSAGES: ['create', 'read', 'update', 'delete'],
      NOTIFICATIONS: ['create', 'read', 'update', 'delete'],
    },
  },
  Store_Supervisor: {
    name: 'Store Supervisor',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isPrimaryAdmin: false,
    privileges: {
      ORDERS: ['read', 'update'],
      PRODUCTS: ['create', 'read', 'update', 'delete'],
      USERS: ['create', 'read', 'update', 'delete'],
    },
  },
};

export const DefaultAdminRoles = {
  Managing_Director: {
    name: 'Managing Director',
    privileges: {
      BUSINESS: ['create', 'read', 'update', 'delete'],
      USERS: ['create', 'read', 'update', 'delete'],
      ROLES: ['create', 'read', 'update', 'delete'],
      privileges: ['create', 'read', 'update', 'delete'],
      REPORTS: ['create', 'read', 'update', 'delete'],
      SETTINGS: ['create', 'read', 'update', 'delete'],
      MESSAGES: ['create', 'read', 'update', 'delete'],
      NOTIFICATIONS: ['create', 'read', 'update', 'delete'],
      ORDERS: ['create', 'read', 'update', 'delete'],
      PRODUCTS: ['create', 'read', 'update', 'delete'],
    },
  },
  Board_Member: {
    name: 'Board Member',
    privileges: {
      BUSINESS: ['read'],
      USERS: ['read'],
      ROLES: ['read'],
      privileges: ['read'],
      REPORTS: ['read'],
      SETTINGS: ['read'],
    },
  },
  Manager: {
    name: 'Manager',
    privileges: {
      USERS: ['create', 'read', 'update', 'delete'],
      PRODUCTS: ['create', 'read', 'update', 'delete'],
      ORDERS: ['read'],
    },
  },
  Executive: {
    name: 'Executive',
    privileges: {
      MESSAGES: ['create', 'read', 'update', 'delete'],
      NOTIFICATIONS: ['create', 'read', 'update', 'delete'],
    },
  },
};
