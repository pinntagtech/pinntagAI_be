import { Logger, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { UserService } from 'src/user/user.service';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscription-product.model';
import { Subscription } from 'rxjs';
import {
  Refferal,
  RefferalSchema,
} from 'src/subscription/models/refferal.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import {
  EventResponse,
  EventResponseSchema,
} from 'src/event/models/event-response.model';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from 'src/auth/models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from 'src/auth/models/platformConfig.model';
import { SubscriptionSchema } from 'src/subscription/models/subscription.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import { S3Service } from 'src/s3.service';
import { StripeService } from 'src/stripe/stripe.service';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { Admin } from 'mongodb';
import { AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { FirebaseService } from 'src/notification/firebase.service';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Role.name, schema: RoleSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Event.name, schema: EventSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: DashboardConfig.name, schema: DashboardConfigSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
    ]),
  ],
  providers: [
    SmsService,
    UserService,
    Logger,
    S3Service,
    StripeService,
    DriveService,
    FirebaseService,
  ],
})
export class SmsModule {}
