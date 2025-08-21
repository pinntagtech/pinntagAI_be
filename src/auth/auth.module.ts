import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// import { GoogleStrategy } from './strategies/google.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/user/models/user.model';
import { Otp, OtpSchema } from './models/otp.model';
import { MailService } from 'src/mail/mail.service';
import { UserService } from 'src/user/user.service';
import { Token, TokenSchema } from './models/token.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import { GuestSession, GuestSessionSchema } from './models/guestSession.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
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
} from 'src/user/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { StripeService } from 'src/stripe/stripe.service';
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
} from './models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from './models/platformConfig.model';
import { SmsService } from 'src/sms/sms.service';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { SeederService } from 'src/seeder/seeder.service';
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
  BusinessCategory,
  BusinessCategorySchema,
} from 'src/business/model/businessCategory.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from 'src/business/model/businessIndustry.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from 'src/business/model/businessCountry.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from 'src/business/model/BussinessDocumentType.model';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
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
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';
import { SampleDocument, SampleDocumentSchema } from 'src/admin/models/sampleDocuments.model';

@Module({
  imports: [
    // MailModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Token.name, schema: TokenSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
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
      { name: Business.name, schema: BusinessSchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: Region.name, schema: RegionSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
    ]),
    PassportModule.register({ session: false }),
    JwtModule.register({
      secret: process.env.SESSION_SECRET,
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    LocalStrategy,
    Logger,
    MailService,
    UserService,
    S3Service,
    StripeService,
    SmsService,
    SeederService,
    DriveService,
    FirebaseService,
    // GoogleStrategy
  ],
})
export class AuthModule {}
