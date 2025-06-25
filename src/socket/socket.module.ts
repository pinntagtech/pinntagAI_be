import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../user/models/user.model';
import { BusinessUser, BusinessUserSchema } from '../business/model/businessUser.model';
import { Admin, AdminSchema } from '../admin/models/admin.model';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
  ],
  providers: [SocketGateway, JwtService, Logger],
  exports: [SocketGateway],
})
export class SocketModule {}
