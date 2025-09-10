import { Module } from '@nestjs/common';
import { EtlService } from './etl.service';
import { EtlController } from './etl.controller';
import { ETL_Source, ETL_SourceSchema } from './models/etl-source.model';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ETL_Source_Group,
  ETL_Source_GroupSchema,
} from './models/etl-source-groups.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { PrivilegeService } from 'src/roles/privilege.service';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { JwtService } from '@nestjs/jwt';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { User, UserSchema } from 'src/user/models/user.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ETL_Source.name, schema: ETL_SourceSchema },
      { name: ETL_Source_Group.name, schema: ETL_Source_GroupSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Action.name, schema: ActionSchema },
      { name: User.name, schema: UserSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
    ]),
  ],
  controllers: [EtlController],
  providers: [EtlService, PrivilegeService, JwtService],
})
export class EtlModule {}
