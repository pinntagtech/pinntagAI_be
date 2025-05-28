import { Logger, Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  CrawledEvent,
  CrawledEventSchema,
} from 'src/event/models/crawled-event.model';
import { EventSchema } from 'src/event/models/event.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { Image, ImageSchema } from 'src/event/models/image.model';
import {
  BusinessLocation,
  BusinessLocationSchema,
} from 'src/business-profile/models/businessLocation.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { HttpModule } from '@nestjs/axios';
import { S3Service } from 'src/s3.service';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from 'src/auth/models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from 'src/auth/models/platformConfig.model';
import { UserService } from 'src/user/user.service';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
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
import {
  EventResponse,
  EventResponseSchema,
} from 'src/event/models/event-response.model';
import { StripeService } from 'src/stripe/stripe.service';
import { Admin, AdminSchema } from './models/admin.model';
import { User, UserSchema } from 'src/user/models/user.model';
// import { Permission, PermissionSchema } from './models/permission.model';
// import { AdminRole, AdminRoleSchema } from './models/adminRole.model';

import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { SeederService } from 'src/seeder/seeder.service';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilage.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { MailService } from 'src/mail/mail.service';
import { RolesService } from 'src/roles/roles.service';
import { PrivilegeService } from 'src/roles/privilege.service';
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
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { AuthService } from 'src/auth/auth.service';
import { SmsService } from 'src/sms/sms.service';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event/models/event-schedule.model';
import { Department, DepartmentSchema } from 'src/business/model/department.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { FileSchema } from 'src/drive/models/file.model';
import { Region, RegionSchema } from 'src/business/model/region.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      // { name: AdminRole.name, schema: AdminRoleSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Token.name, schema: TokenSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: CrawledEvent.name, schema: CrawledEventSchema },
      { name: Event.name, schema: EventSchema },
      { name: Report.name, schema: ReportSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Image.name, schema: ImageSchema },
      { name: BusinessLocation.name, schema: BusinessLocationSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: DashboardConfig.name, schema: DashboardConfigSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Action.name, schema: ActionSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },
      { name: BusinessCountry.name, schema: BusinessCountrySchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: Region.name, schema: RegionSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    JwtService,
    Logger,
    S3Service,
    StripeService,
    UserService,
    SeederService,
    MailService,
    RolesService,
    PrivilegeService,
    AuthService,
    SmsService,
    DriveService,
  ],
})
export class AdminModule {}
