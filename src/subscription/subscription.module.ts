import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Subscription, SubscriptionSchema } from './models/subscription.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import { User, UserSchema } from 'src/user/models/user.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from './models/subscription-product.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
import { FeatureLimit, FeatureLimitSchema } from './models/feature-limit.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { IAPAdminController } from './in-app-purchase/iap-admin.controller';
import { IapWebhookController } from './in-app-purchase/iap-webhook.controller';
import {
  AppleReceipt,
  AppleReceiptSchema,
} from './in-app-purchase/apple/apple-receipt.model';
import {
  GooglePurchase,
  GooglePurchaseSchema,
} from './in-app-purchase/google/google-purchase.model';
import { IapReceipt, IapReceiptSchema } from './models/iap-receipt.model';
import { AppleIAPService } from './in-app-purchase/apple/iap-apple.service';
import { GoogleIAPService } from './in-app-purchase/google/iap-google.service';
import {
  IapNotificationLog,
  IapNotificationLogSchema,
} from './models/iap-notification-log.model';
import { HttpModule } from '@nestjs/axios';
import { GoogleApiService } from './in-app-purchase/google/google-api.service';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import {
  SubscriptionPrice,
  SubscriptionPriceSchema,
} from './models/subscription-price.model';
import { Refferal, RefferalSchema } from './models/referral.model';
import { Coupon, CouponSchema } from './models/coupon.model';
import { MappingRepoService } from './in-app-purchase/google/mapping-repo.service';
import {
  ObfuscatedIdMap,
  ObfuscatedIdMapSchema,
  PurchaseTokenMap,
  PurchaseTokenMapSchema,
} from './models/iap-mapping.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: FeatureLimit.name, schema: FeatureLimitSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: AppleReceipt.name, schema: AppleReceiptSchema },
      { name: GooglePurchase.name, schema: GooglePurchaseSchema },
      { name: IapReceipt.name, schema: IapReceiptSchema },
      { name: IapNotificationLog.name, schema: IapNotificationLogSchema },
      { name: SubscriptionPrice.name, schema: SubscriptionPriceSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: ObfuscatedIdMap.name, schema: ObfuscatedIdMapSchema },
      { name: PurchaseTokenMap.name, schema: PurchaseTokenMapSchema },
    ]),
  ],
  controllers: [
    SubscriptionController,
    IAPAdminController,
    IapWebhookController,
  ],
  providers: [
    SubscriptionService,
    JwtService,
    StripeService,
    AppleIAPService,
    GoogleIAPService,
    GoogleApiService,
    MappingRepoService,
  ],
})
export class SubscriptionModule {}
