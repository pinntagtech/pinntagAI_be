export const DefaultBusinessOwnerRole = {
  name: 'Business Owner',
  creatorType: 'Business',
  belongsTo: 'Business',
  isSuperAdmin: false,
  isBusinessOwner: true,
  // privileges: {
  //   BUSINESS: ['create', 'read', 'update', 'delete'],
  //   PRODUCTS: ['create', 'read', 'update', 'delete'],
  //   ORDERS: ['create', 'read', 'update', 'delete'],
  //   PAYMENTS: ['create', 'read', 'update', 'delete'],
  //   COUPONS: ['create', 'read', 'update', 'delete'],
  // },
};
export const DefaultBusinessRoles = {
  Store_Manager: {
    name: 'Store Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REVIEWS: ['READ'],
    },
  },
  General_Manager: {
    name: 'General Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REVIEWS: ['READ'],
    },
  },
  Regional_Manager: {
    name: 'Regional Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REVIEWS: ['READ'],
    },
  },
  Operational_Manager: {
    name: 'Operations Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REVIEWS: ['READ'],
    },
  },
  Marketing_Manager: {
    name: 'Marketing Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      COUPONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      BANNERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      BRANDS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Finance_Manager: {
    name: 'Finance Manager',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      PAYMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REPORTS: ['READ'],
    },
  },
  Support_Executive: {
    name: 'Support Executive',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Franchise_Owner: {
    name: 'Franchise Owner',
    creatorType: 'Business',
    belongsTo: 'Business',
    isSuperAdmin: false,
    isBusinessOwner: false,
    privileges: {
      ORDERS: ['READ', 'UPDATE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      USERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
};

export const DefaultAdminRoles = {
  Managing_Director: {
    name: 'Managing Director',
    privileges: {
      BUSINESS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      USERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ROLES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      privileges: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REPORTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      SETTINGS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Board_Member: {
    name: 'Board Member',
    privileges: {
      BUSINESS: ['READ'],
      USERS: ['READ'],
      ROLES: ['READ'],
      privileges: ['READ'],
      REPORTS: ['READ'],
      SETTINGS: ['READ'],
    },
  },
  Manager: {
    name: 'Manager',
    privileges: {
      USERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ORDERS: ['READ'],
    },
  },
  Executive: {
    name: 'Executive',
    privileges: {
      MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
};
