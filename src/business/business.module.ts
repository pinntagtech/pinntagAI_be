import { Logger, Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserSchema } from './model/businessUser.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { Business, BusinessSchema } from './model/business.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { User, UserSchema } from 'src/user/models/user.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from '../outlet/model/outletCategory.model';
import { UserService } from 'src/user/user.service';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
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
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { S3Service } from 'src/s3.service';
import { StripeService } from 'src/stripe/stripe.service';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import { SeederService } from 'src/seeder/seeder.service';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilage.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { OutletType, OutletTypeSchema } from '../outlet/model/outletType.model';
import { AuthService } from 'src/auth/auth.service';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
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
import {
  BusinessCategory,
  BusinessCategorySchema,
} from './model/businessCategory.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from './model/businessIndustry.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from './model/businessCountry.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from './model/BussinessDocumentType.model';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from './model/businessConstitution.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { File, FileSchema } from 'src/drive/models/file.model';
import { Brand, BrandSchema } from './model/brand.model';
import { PrivilegeService } from 'src/roles/privilege.service';
import { Department, DepartmentSchema } from './model/department.model';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event/models/event-schedule.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: Follow.name, schema: FollowSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: Category.name, schema: CategorySchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Action.name, schema: ActionSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: DashboardConfig.name, schema: DashboardConfigSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },
      { name: BusinessCountry.name, schema: BusinessCountrySchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: User.name, schema: UserSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
    ]),
  ],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    MailService,
    JwtService,
    UserService,
    Logger,
    S3Service,
    StripeService,
    SeederService,
    AuthService,
    SmsService,
    DriveService,
    PrivilegeService,
  ],
})
export class BusinessModule {}
