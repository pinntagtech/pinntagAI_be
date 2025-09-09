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
    ]),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET_KEY,
    }),
  ],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeeModule {}
