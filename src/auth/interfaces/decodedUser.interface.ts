export interface DecodedUser {
  isGuest: boolean;
  id: string;
  email: string;
  role: string;
  name: string;
  profilePhoto: string;
  isBusiness: boolean;
  businessProfile?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  sessionId?: string;
}
