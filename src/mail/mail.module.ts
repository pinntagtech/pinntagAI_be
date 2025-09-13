import { Global, Logger, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { User, UserSchema } from 'src/user/models/user.model';
import { JwtService } from '@nestjs/jwt';
import { Token, TokenSchema } from 'src/auth/models/token.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
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
import { S3Service } from 'src/s3.service';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
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
import { SmsService } from 'src/sms/sms.service';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { SeederService } from 'src/seeder/seeder.service';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/outlet/model/outletType.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from 'src/business/model/businessIndustry.model';
import {
  BusinessCategory,
  BusinessCategorySchema,
} from 'src/business/model/businessCategory.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from 'src/business/model/businessCountry.model';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from 'src/business/model/BussinessDocumentType.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event/models/event-schedule.model';
import {
  Department,
  DepartmentSchema,
} from 'src/business/model/department.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { File, FileSchema } from 'src/drive/models/file.model';
import { Region, RegionSchema } from 'src/business/model/region.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { Tag, TagSchema } from 'src/models/tags.model';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import {
  SampleDocument,
  SampleDocumentSchema,
} from 'src/admin/models/sampleDocuments.model';
import { RedisBullService } from 'src/notification/redisBull.service';
import { Broadcast, BroadcastSchema } from 'src/notification/models/broadcast.model';
import {
  SubscriptionPrice,
  SubscriptionPriceSchema,
} from 'src/subscription/models/subscription-price.model';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
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
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Action.name, schema: ActionSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },
      { name: BusinessCountry.name, schema: BusinessCountrySchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: Region.name, schema: RegionSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: Broadcast.name, schema: BroadcastSchema},
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
      { name: SubscriptionPrice.name, schema: SubscriptionPriceSchema },
    ]),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'tns.flutter1@gmail.com',
          pass: 'yexu pyto ujrl tuks',
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
      template: {
        dir: join(__dirname + '/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  providers: [
    MailService,
    UserService,
    AuthService,
    JwtService,
    Logger,
    S3Service,
    StripeService,
    SmsService,
    SeederService,
    DriveService,
    FirebaseService,
    RedisBullService,
  ],
})
export class MailModule {}
