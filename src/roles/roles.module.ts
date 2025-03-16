import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { PrivilegeService } from './privilege.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './models/roles.model';
import { Privilege, PrivilegeSchema } from './models/privilage.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema },{name:Privilege.name, schema:PrivilegeSchema}]),
  ],
  controllers: [RolesController],
  providers: [PrivilegeService],
})
export class RolesModule {}
