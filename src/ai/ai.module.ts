import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { HttpModule } from '@nestjs/axios';
import { User, UserSchema } from 'src/user/models/user.model';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/models/role.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, JwtService],
})
export class AiModule {}
