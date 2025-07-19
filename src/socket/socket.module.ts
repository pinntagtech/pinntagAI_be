import { Module, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { SocketGateway } from './socket.gateway';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../user/models/user.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from '../business/model/businessUser.model';
import { Admin, AdminSchema } from '../admin/models/admin.model';
import { AuthService } from 'src/auth/auth.service';
import { Subscription } from 'rxjs';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from 'src/auth/models/dashboardConfig.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from 'src/auth/models/platformConfig.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import {
  BusinessCategory,
  BusinessCategorySchema,
} from 'src/business/model/businessCategory.model';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from 'src/business/model/businessCountry.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from 'src/business/model/businessIndustry.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from 'src/business/model/BussinessDocumentType.model';
import {
  Department,
  DepartmentSchema,
} from 'src/business/model/department.model';
import { Region, RegionSchema } from 'src/business/model/region.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { File, FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import {
  EventResponse,
  EventResponseSchema,
} from 'src/event/models/event-response.model';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event/models/event-schedule.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/outlet/model/outletType.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { SubscriptionSchema } from 'src/subscription/models/subscription.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';
import { S3Service } from 'src/s3.service';
import { StripeService } from 'src/stripe/stripe.service';
import { DriveService } from 'src/drive/drive.service';
import { SmsService } from 'src/sms/sms.service';
import { SeederService } from 'src/seeder/seeder.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Token.name, schema: TokenSchema },
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
    ]),
  ],
  providers: [SocketGateway, JwtService, Logger, AuthService, UserService,MailService,S3Service,StripeService,SmsService, DriveService,SeederService],
  exports: [SocketGateway],
})
export class SocketModule {}
