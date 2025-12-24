import { Logger, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './models/notification.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
// import { BusinessProfile, BusinessProfileSchema } from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { Broadcast, BroadcastSchema } from './models/broadcast.model';
import { FirebaseService } from './firebase.service';
import { RedisBullService } from './redisBull.service';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
// import { Subscription } from 'rxjs';
import {
  SampleDocument,
  SampleDocumentSchema,
} from 'src/admin/models/sampleDocuments.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { FileSchema } from 'src/drive/models/file.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { EventSchema } from 'src/event/models/event.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { Subscription, SubscriptionSchema } from 'src/subscription/models/subscription.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { S3Service } from 'src/s3.service';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import {
  Refferal,
  RefferalSchema,
} from 'src/subscription/models/referral.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscription-product.model';
import { UserService } from 'src/user/user.service';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import {
  SubscriptionPrice,
  SubscriptionPriceSchema,
} from 'src/subscription/models/subscription-price.model';
import { Coupon, CouponSchema } from 'src/subscription/models/coupon.model';
import { Feed, FeedSchema } from 'src/feed/models/feed.model';
import { DynamicLinkService } from './dynamicLink.service';
import { AppsOnAirLinkService } from './appsonair.service';
import { HttpModule } from '@nestjs/axios';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { FeatureLimit, FeatureLimitSchema } from 'src/subscription/models/feature-limit.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import { ConsumerPurchase, ConsumerPurchaseSchema } from 'src/subscription/models/consumer-purchase.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Broadcast.name, schema: BroadcastSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: User.name, schema: UserSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: File.name, schema: FileSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: SubscriptionPrice.name, schema: SubscriptionPriceSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: Feed.name, schema: FeedSchema },
      { name: FeatureLimit.name, schema: FeatureLimitSchema},
      { name: Outlet.name, schema: OutletSchema },
      { name: ConsumerPurchase.name, schema: ConsumerPurchaseSchema }
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    JwtService,
    FirebaseService,
    RedisBullService,
    DriveService,
    S3Service,
    UserService,
    Logger,
    StripeService,
    DynamicLinkService,
    AppsOnAirLinkService,
    SubscriptionService,
  ],
})
export class NotificationModule {}
