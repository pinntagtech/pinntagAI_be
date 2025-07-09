import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { PrivilegeService } from './privilege.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './models/roles.model';
import { Privilege, PrivilegeSchema } from './models/privilege.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import { Action, ActionSchema } from './models/actions.model';
import { RolesService } from './roles.service';
import { User, UserSchema } from 'src/user/models/user.model';
import { Resource, ResourceSchema } from './models/resource.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Admin.name, schema: AdminSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Action.name, schema: ActionSchema },
      { name: User.name, schema: UserSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
    ]),
  ],
  controllers: [RolesController],
  providers: [PrivilegeService, RolesService, JwtService],
})
export class RolesModule {}
