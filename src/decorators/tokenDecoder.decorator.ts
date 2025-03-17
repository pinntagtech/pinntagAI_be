import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserTypes } from 'src/enums/auth.enums';

export const TokenDecoder = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.isGuest) {
      const user: DecodedUser = {
        isGuest: true,
        userType: UserTypes.USER,
        id: request.sessionId,
        role: 'GUEST',
        name: 'Guest',
        email: '',
        isBusiness: false,
        profilePhoto: '',
        isEmailVerified: false,
        isPhoneVerified: false,
        sessionId: request.sessionId,
      };
      return user;
    } else if (request.isBusiness) {
      const user: DecodedUser = {
        isGuest: false,
        role: 'business_profile',
        userType: UserTypes.BUSINESS,
        name: request.user.firstName + ' ' + request.user.lastName,
        id: request.user._id,
        businessProfile: request.businessProfile,
        isBusiness: true,
        ...request.user,
      };
      return user;
    } else if (request.isAdmin) {
      const user: DecodedUser = {
        isGuest: false,
        isBusiness: false,
        role: request.user.role,
        userType: UserTypes.ADMIN,
        name: `${request.user?.name || ''}`,
        id: request.user?._id,
        businessProfile: '',
        ...request.user,
      };
      return user;
    } else {
      const user: DecodedUser = {
        isGuest: false,
        role: UserTypes.USER,
        name: `${request.user?.name || ''}`,
        id: request.user?._id,
        businessProfile: '',
        isBusiness: false,
        ...request.user,
      };
      return user;
    }
  },
);
