import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { PrivilegeService } from './privilege.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './models/roles.model';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
  ],
  controllers: [RolesController],
  providers: [PrivilegeService],
})
export class RolesModule {}
