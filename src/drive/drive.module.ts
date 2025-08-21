import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FileCategory, FileCategorySchema } from './models/fileCategory.model';
import { Drive, DriveSchema } from './models/drive.model';
import { DriveService } from './drive.service';
import { Folder, FolderSchema } from './models/folder.model';
import { User, UserSchema } from 'src/user/models/user.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { EventSchema } from 'src/event/models/event.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { JwtService } from '@nestjs/jwt';
import { S3Service } from 'src/s3.service';
import { File, FileSchema } from './models/file.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { SampleDocument, SampleDocumentSchema } from 'src/admin/models/sampleDocuments.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: User.name, schema: UserSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Token.name, schema: TokenSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
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
    ]),
  ],
  controllers: [DriveController],
  providers: [DriveService, JwtService, S3Service],
})
export class DriveModule {}
