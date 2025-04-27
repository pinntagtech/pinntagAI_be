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

// export const DefaultAdminRoles = {
//   Managing_Director: {
//     name: 'Managing Director',
//     privileges: {
//       BUSINESS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       USERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       ROLES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       privileges: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       REPORTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       SETTINGS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//     },
//   },
//   Board_Member: {
//     name: 'Board Member',
//     privileges: {
//       BUSINESS: ['READ'],
//       USERS: ['READ'],
//       ROLES: ['READ'],
//       privileges: ['READ'],
//       REPORTS: ['READ'],
//       SETTINGS: ['READ'],
//     },
//   },
//   Manager: {
//     name: 'Manager',
//     privileges: {
//       USERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       ORDERS: ['READ'],
//     },
//   },
//   Executive: {
//     name: 'Executive',
//     privileges: {
//       MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//       NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
//     },
//   },
// };

export const DefaultAdminRoles = {
  Sales_User: {
    name: 'Sales User',
    privileges: {
      Business: ['READ'],
      Referrals: ['CREATE', 'READ'],
      Orders: ['CREATE', 'READ'],
      Products: ['READ'],
      Categories: ['READ'],
      Brands: ['READ'],
      Locations: ['READ'],
      Messages: ['READ'],
      Notifications: ['READ'],
    },
  },
  Sales_Manager: {
    name: 'Sales Manager',
    privileges: {
      Business: ['READ'],
      Referrals: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Orders: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Products: ['READ'],
      Categories: ['READ'],
      Brands: ['READ'],
      Reports: ['READ'],
      Locations: ['READ'],
    },
  },
  Support_Executive: {
    name: 'Support Executive',
    privileges: {
      Orders: ['READ', 'UPDATE'],
      Messages: ['READ', 'CREATE', 'UPDATE'],
      Notifications: ['READ', 'UPDATE'],
      Reports: ['READ'],
      Users: ['READ'],
    },
  },
  Support_Manager: {
    name: 'Support Manager',
    privileges: {
      Orders: ['CREATE', 'READ', 'UPDATE'],
      Messages: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Notifications: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Reports: ['READ'],
      Users: ['READ'],
    },
  },
  Finance_User: {
    name: 'Finance User',
    privileges: {
      Payments: ['READ'],
      Orders: ['READ'],
      Reports: ['READ'],
    },
  },
  Finance_Manager: {
    name: 'Finance Manager',
    privileges: {
      Payments: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Reports: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Orders: ['READ'],
    },
  },
  Marketing_User: {
    name: 'Marketing User',
    privileges: {
      Products: ['CREATE', 'READ'],
      Brands: ['CREATE', 'READ'],
      Referrals: ['CREATE', 'READ'],
      Categories: ['READ'],
    },
  },
  Marketing_Manager: {
    name: 'Marketing Manager',
    privileges: {
      Products: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Brands: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Referrals: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Categories: ['READ'],
    },
  },
  Product_Admin: {
    name: 'Product Admin',
    privileges: {
      Products: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Categories: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Brands: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Operations_User: {
    name: 'Operations User',
    privileges: {
      Orders: ['READ', 'UPDATE'],
      Outlets: ['READ', 'UPDATE'],
      Locations: ['READ'],
    },
  },
  Operations_Manager: {
    name: 'Operations Manager',
    privileges: {
      Orders: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Outlets: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Locations: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Reports: ['READ'],
    },
  },
  IT_Support: {
    name: 'IT Support',
    privileges: {
      Settings: ['READ', 'UPDATE'],
      Permissions: ['READ'],
      Roles: ['READ'],
    },
  },
  IT_Manager: {
    name: 'IT Manager',
    privileges: {
      Settings: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Permissions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Roles: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Privileges: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Outlet_Manager: {
    name: 'Outlet Manager',
    privileges: {
      Outlets: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      Locations: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
};
