import { roleType } from 'src/contracts/enums/RoleType.enum';

export interface JwtPayload {
  id: string;
  email: string;
  type?: roleType;
  businessProfile?: string;
  role?: string;
}
