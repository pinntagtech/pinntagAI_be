import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './models/subscription.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import { User, UserSchema } from 'src/user/models/user.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from './models/subscriptionProduct.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, JwtService],
})
export class SubscriptionModule {}
