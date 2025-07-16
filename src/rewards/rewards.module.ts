import { Logger, Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { Reward, RewardSchema } from './model/reward.model';
import { DriveService } from 'src/drive/drive.service';
import { S3Service } from 'src/s3.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { File, FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Image, ImageSchema } from 'src/event/models/image.model';
import { JwtService } from '@nestjs/jwt';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import {
  RewardLocation,
  RewardLocationSchema,
} from './model/rewardLocation.model';
import { UserReward, UserRewardSchema } from './model/userReward.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import { UserService } from 'src/user/user.service';
import { FirebaseService } from 'src/notification/firebase.service';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import { StripeService } from 'src/stripe/stripe.service';
import { DynamicLinkService } from 'src/notification/dynamicLink.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Event.name, schema: EventSchema },
      { name: File.name, schema: FileSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Image.name, schema: ImageSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: RewardLocation.name, schema: RewardLocationSchema },
      { name: UserReward.name, schema: UserRewardSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
    ]),
  ],
  controllers: [RewardsController],
  providers: [
    RewardsService,
    DriveService,
    S3Service,
    JwtService,
    UserService,
    FirebaseService,
    Logger,
    StripeService,
    DynamicLinkService,
  ],
})
export class RewardsModule {}
