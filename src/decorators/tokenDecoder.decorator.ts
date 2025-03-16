import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { Admin } from 'src/admin/models/admin.model';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { BusinessProfile } from 'src/business-profile/models/businessProfile.model';
import { User } from 'src/user/models/user.model';

export const TokenDecoder = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.isGuest) {
      const user: DecodedUser = {
        isGuest: true,
        userType: 'user',
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
      // console.log('User business......');
      const user: DecodedUser = {
        isGuest: false,
        role: 'business_profile',
        userType: BusinessProfile.name,
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
        userType: Admin.name,
        // name: request.user.firstName + ' ' + request.user.lastName,
        name: `${request.user?.name || ''}`,
        id: request.user?._id,
        businessProfile: '',
        isBusiness: false,
        ...request.user,
      };
      return user;
    } else {
      const user: DecodedUser = {
        isGuest: false,
        role: 'user',
        // name: request.user.firstName + ' ' + request.user.lastName,
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
