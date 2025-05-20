import { UserSchema } from "src/user/models/user.model";

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

export const DefaultBusinessDepartmentRoles = [
  {
    "name": "Operations",
    "description": "Manages day-to-day business operations.",
    "roles": [
      {
        "name": "Store Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "Regional Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "Operations Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Marketing",
    "description": "Responsible for promoting products and enhancing brand image.",
    "roles": [
      {
        "name": "Marketing Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "COUPONS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "BANNERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "BRANDS": ["CREATE", "READ", "UPDATE", "DELETE"]
        }
      }
    ]
  },
  {
    "name": "Finance",
    "description": "Handles financial transactions, reporting, and budgeting.",
    "roles": [
      {
        "name": "Finance Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "PAYMENTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REPORTS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Customer Support",
    "description": "Provides assistance and support to customers.",
    "roles": [
      {
        "name": "Support Executive",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "MESSAGES": ["CREATE", "READ", "UPDATE", "DELETE"],
          "NOTIFICATIONS": ["CREATE", "READ", "UPDATE", "DELETE"]
        }
      }
    ]
  },
  {
    "name": "Sales",
    "description": "Drives revenue through customer acquisition and retention.",
    "roles": [
      {
        "name": "Regional Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "Store Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Product Management",
    "description": "Responsible for product planning and development.",
    "roles": [
      {
        "name": "Operations Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Human Resources",
    "description": "Manages recruitment, employee relations, and personnel policies.",
    "roles": [
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Logistics",
    "description": "Oversees supply chain, inventory, and product distribution.",
    "roles": [
      {
        "name": "Store Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "Operations Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "IT and Systems",
    "description": "Manages IT infrastructure, software, and technical support.",
    "roles": [
      {
        "name": "Operations Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "Support Executive",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "MESSAGES": ["CREATE", "READ", "UPDATE", "DELETE"],
          "NOTIFICATIONS": ["CREATE", "READ", "UPDATE", "DELETE"]
        }
      }
    ]
  },
  {
    "name": "Quality Assurance",
    "description": "Ensures product and service quality through testing and evaluation.",
    "roles": [
      {
        "name": "Operations Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      },
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  },
  {
    "name": "Legal and Compliance",
    "description": "Ensures adherence to legal regulations and compliance standards.",
    "roles": [
      {
        "name": "Finance Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "PAYMENTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REPORTS": ["READ"]
        }
      },
      {
        "name": "General Manager",
        "creatorType": "Business",
        "belongsTo": "Business",
        "isSuperAdmin": false,
        "isBusinessOwner": false,
        "privileges": {
          "ORDERS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "PRODUCTS": ["CREATE", "READ", "UPDATE", "DELETE"],
          "REVIEWS": ["READ"]
        }
      }
    ]
  }
]


//--------------------------------

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
      BUSINESS: ['READ'],
      REFERRALS: ['CREATE', 'READ'],
      ORDERS: ['CREATE', 'READ'],
      PRODUCTS: ['READ'],
      CATEGORIES: ['READ'],
      BRANDS: ['READ'],
      LOCATIONS: ['READ'],
      MESSAGES: ['READ'],
      NOTIFICATIONS: ['READ'],
    },
  },
  Sales_Manager: {
    name: 'Sales Manager',
    privileges: {
      BUSINESS: ['READ'],
      REFERRALS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRODUCTS: ['READ'],
      CATEGORIES: ['READ'],
      BRANDS: ['READ'],
      REPORTS: ['READ'],
      LOCATIONS: ['READ'],
    },
  },
  Support_Executive: {
    name: 'Support Executive',
    privileges: {
      ORDERS: ['READ', 'UPDATE'],
      MESSAGES: ['READ', 'CREATE', 'UPDATE'],
      NOTIFICATIONS: ['READ', 'UPDATE'],
      REPORTS: ['READ'],
      USERS: ['READ'],
    },
  },
  Support_Manager: {
    name: 'Support Manager',
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE'],
      MESSAGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      NOTIFICATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REPORTS: ['READ'],
      USERS: ['READ'],
    },
  },
  Finance_User: {
    name: 'Finance User',
    privileges: {
      PAYMENTS: ['READ'],
      ORDERS: ['READ'],
      REPORTS: ['READ'],
    },
  },
  Finance_Manager: {
    name: 'Finance Manager',
    privileges: {
      PAYMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REPORTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ORDERS: ['READ'],
    },
  },
  Marketing_User: {
    name: 'Marketing User',
    privileges: {
      PRODUCTS: ['CREATE', 'READ'],
      BRANDS: ['CREATE', 'READ'],
      REFERRALS: ['CREATE', 'READ'],
      CATEGORIES: ['READ'],
    },
  },
  Marketing_Manager: {
    name: 'Marketing Manager',
    privileges: {
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      BRANDS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REFERRALS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      CATEGORIES: ['READ'],
    },
  },
  Product_Admin: {
    name: 'Product Admin',
    privileges: {
      PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      CATEGORIES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      BRANDS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Operations_User: {
    name: 'Operations User',
    privileges: {
      ORDERS: ['READ', 'UPDATE'],
      OUTLETS: ['READ', 'UPDATE'],
      LOCATIONS: ['READ'],
    },
  },
  Operations_Manager: {
    name: 'Operations Manager',
    privileges: {
      ORDERS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      OUTLETS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      LOCATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      REPORTS: ['READ'],
    },
  },
  IT_Support: {
    name: 'IT Support',
    privileges: {
      SETTINGS: ['READ', 'UPDATE'],
      PERMISSIONS: ['READ'],
      ROLES: ['READ'],
    },
  },
  IT_Manager: {
    name: 'IT Manager',
    privileges: {
      SETTINGS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PERMISSIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      ROLES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      PRIVILEGES: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
  Outlet_Manager: {
    name: 'Outlet Manager',
    privileges: {
      OUTLETS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
      LOCATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    },
  },
};
