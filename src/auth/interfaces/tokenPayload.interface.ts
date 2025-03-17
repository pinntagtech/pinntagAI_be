import { roleType } from 'src/contracts/enums/RoleType.enum';

export interface JwtPayload {
  id: string;
  userType: string;
  // email: string;
  // businessProfile?: string;
  role?: string;
  business?: string
}
