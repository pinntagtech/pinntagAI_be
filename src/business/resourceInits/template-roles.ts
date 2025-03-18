import { RoleCreatorType } from "src/roles/enums/roles.enum";

export const DefaultBusinessRoles = [
    {
      name: 'Business Owner',
      description: 'Full access to manage business operations.',
      creatorType: RoleCreatorType.SYSTEM,
      belongsTo: 'Business',
      isSuperAdmin: false,
      isPrimaryAdmin: true,
    },
    {
      name: 'Manager',
      description: 'Manages day-to-day operations and employees.',
      creatorType: RoleCreatorType.SYSTEM,
      belongsTo: 'Business',
      isSuperAdmin: false,
      isPrimaryAdmin: false,
    },
    {
      name: 'Staff',
      description: 'Handles specific tasks such as service or kitchen work.',
      creatorType: RoleCreatorType.SYSTEM,
      belongsTo: 'Business',
      isSuperAdmin: false,
      isPrimaryAdmin: false,
    }
  ];
  