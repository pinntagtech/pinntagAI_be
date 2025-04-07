import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { DecodedUser } from 'src/auth/interfaces/decodedUser.interface';
import { UserTypes } from 'src/enums/auth.enums';

export const TokenDecoder = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (request.isGuest) { 
      return {
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
    }
    const user: DecodedUser = {
      isGuest: false,
      role: request.user?.role[0],
      userType: request.isBusiness ? UserTypes.BUSINESS : request.isAdmin ? UserTypes.ADMIN : UserTypes.USER,
      name: request.isBusiness ? request.user.name:'',
      id: request.user.id,
      businessProfile: request.isBusiness ? request.businessProfile : '',
      isBusiness: request.isBusiness,
      ...request.user,
    };
    return user;
  },
);
