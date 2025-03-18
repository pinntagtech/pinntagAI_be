import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { PrivilegeService } from './privilege.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './models/roles.model';
import { Privilege, PrivilegeSchema } from './models/privilage.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
import { Action, ActionSchema } from './models/actions.model';
import { RolesService } from './roles.service';
import { User, UserSchema } from 'src/user/models/user.model';
import { Resource, ResourceSchema } from './models/resource.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Action.name, schema: ActionSchema },
      { name: User.name, schema: UserSchema },
      { name: Resource.name, schema: ResourceSchema },
    ]),
  ],
  controllers: [RolesController],
  providers: [PrivilegeService, RolesService],
})
export class RolesModule {}
