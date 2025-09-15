import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeModule } from 'nestjs-stripe';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import {
  SubscriptionPrice,
  SubscriptionPriceSchema,
} from '../models/subscription-price.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: Business.name,
        schema: BusinessSchema,
      },
      {
        name: Subscription.name,
        schema: SubscriptionSchema,
      },
      {
        name: WebhookSnapshot.name,
        schema: WebhookSnapshotSchema,
      },
      {
        name: Token.name,
        schema: TokenSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: GuestSession.name,
        schema: GuestSessionSchema,
      },
      {
        name: Admin.name,
        schema: AdminSchema,
      },
      {
        name: BusinessUser.name,
        schema: BusinessUserSchema,
      },
      {
        name: SubscriptionPrice.name,
        schema: SubscriptionPriceSchema,
      },
    ]),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
    }),
  ],
  controllers: [StripeController],
  providers: [StripeService, JwtService],
})
export class StripeeModule {}
