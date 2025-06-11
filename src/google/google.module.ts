import { Module } from '@nestjs/common';
import { GoogleController } from './google.controller';
import { GoogleService } from './google.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
// import { BusinessProfile, BusinessProfileSchema } from 'src/business-profile/models/businessProfile.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { GuestSession, GuestSessionSchema } from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { BusinessUser, BusinessUserSchema } from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },

    ]), 
  ],
  controllers: [GoogleController],
  providers: [GoogleService,JwtService]
})
export class GoogleModule {}
