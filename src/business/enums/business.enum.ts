export enum OutletCategoryList {
    FOOD_BEVERAGE = 'Food & Beverage Establishments',
    MOBILE_TEMPORARY = 'Mobile & Temporary Outlets',
    RETAIL_DISTRIBUTION = 'Retail & Distribution',
    HYBRID_EXPERIMENTAL = 'Hybrid & Experimental Models',
    ONLINE_HOME_BASED = 'Online & Home-Based Models',
  }
  
  export const OutletTypesByCategory = {
    [OutletCategoryList.FOOD_BEVERAGE]: [
      'Restaurant', 'Fine Dining', 'Casual Dining', 'Buffet', 'Theme Restaurant',
      'Café', 'Bakery', 'Confectionery', 'Ice Cream Parlour', 'Juice Bar',
      'Bar', 'Pub', 'Club', 'Lounge'
    ],
    [OutletCategoryList.MOBILE_TEMPORARY]: [
      'Food Truck', 'Food Stall', 'Food Cart', 'Mobile Bar', 'Event Pop-Up',
      'Roaming Pop-Up', 'Festival Stall', 'Catering Service', 'Cloud Kitchen', 'Dark Kitchen'
    ],
    [OutletCategoryList.RETAIL_DISTRIBUTION]: [
      'Supermarket', 'Convenience Store', 'Vending Machine', 'Warehouse', 'Distribution Outlet',
      'Wholesale Outlet', 'Franchise Outlet', 'Commission Outlet'
    ],
    [OutletCategoryList.HYBRID_EXPERIMENTAL]: [
      'Food Theater', 'Micro Market', 'Smart Vending', 'Hotel Restaurant', 'Canteen',
      'Tasting Room', 'Private Dining', 'Interactive Dining'
    ],
    [OutletCategoryList.ONLINE_HOME_BASED]: [
      'Online Only', 'Delivery-Based', 'Ghost Kitchen', 'Virtual Restaurant',
      'Home-Based Business', 'Home Chef', 'Instagram-Only Business'
    ]
  };
  
  export const BusinessUserCreatorType = {
    ADMIN: 'Admin',
    BUSINESS: 'Business',
    SYSTEM: 'System',
    SELF:'Self'
  };
  export const BusinessCreatorType = {
    ADMIN: 'Admin',
    BUSINESS_USER: 'BusinessUser',
  }