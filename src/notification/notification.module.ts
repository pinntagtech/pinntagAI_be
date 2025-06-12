import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
// import { BusinessProfile, BusinessProfileSchema } from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { BusinessUser, BusinessUserSchema } from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, JwtService],
})
export class NotificationModule {}
