import { Module } from '@nestjs/common';
import { InAppPurchaseService } from './iap.service';
import { InAppPurchaseController } from './iap.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AppleReceipt,
  AppleReceiptSchema,
} from 'src/subscription/in-app-purchase/apple/apple-receipt.model';
import {
  GooglePurchase,
  GooglePurchaseSchema,
} from 'src/subscription/in-app-purchase/google/google-purchase.model';
import {
  IapReceipt,
  IapReceiptSchema,
} from 'src/subscription/models/iap-receipt.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { JwtService } from '@nestjs/jwt';
import { GoogleIAPService } from './google/iap-google.service';
import { Transaction, TransactionSchema } from '../models/transaction.model';
import { Subscription, SubscriptionSchema } from '../models/subscription.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from '../models/subscription-product.model';
import {
  IapNotificationLog,
  IapNotificationLogSchema,
} from '../models/iap-notification-log.model';
import { GoogleApiService } from './google/google-api.service';
import { MappingRepoService } from './google/mapping-repo.service';
import {
  ObfuscatedIdMap,
  ObfuscatedIdMapSchema,
  PurchaseTokenMap,
  PurchaseTokenMapSchema,
} from '../models/iap-mapping.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AppleReceipt.name, schema: AppleReceiptSchema },
      { name: GooglePurchase.name, schema: GooglePurchaseSchema },
      { name: IapReceipt.name, schema: IapReceiptSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: IapNotificationLog.name, schema: IapNotificationLogSchema },
      { name: ObfuscatedIdMap.name, schema: ObfuscatedIdMapSchema },
      { name: PurchaseTokenMap.name, schema: PurchaseTokenMapSchema },
    ]),
  ],
  controllers: [InAppPurchaseController],
  providers: [
    InAppPurchaseService,
    JwtService,
    GoogleIAPService,
    GoogleApiService,
    MappingRepoService,
  ],
})
export class InAppPurchaseModule {}
