import { Logger, Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { CronController } from './cron.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { MailService } from 'src/mail/mail.service';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { UserService } from 'src/user/user.service';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscription-product.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import {
  Refferal,
  RefferalSchema,
} from 'src/subscription/models/refferal.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { S3Service } from 'src/s3.service';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import {
  SampleDocument,
  SampleDocumentSchema,
} from 'src/admin/models/sampleDocuments.model';
import { SubscriptionPrice, SubscriptionPriceSchema } from 'src/subscription/models/subscription-price.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Follow.name, schema: FollowSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
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
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
      {
        name: SubscriptionPrice.name,
        schema: SubscriptionPriceSchema,
      },
    ]),
  ],
  controllers: [CronController],
  providers: [
    CronService,
    MailService,
    UserService,
    Logger,
    S3Service,
    StripeService,
    DriveService,
    FirebaseService,
  ],
})
export class CronModule {}
