import { Logger, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './models/user.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from '../business-profile/models/businessProfile.model';
import { JwtService } from '@nestjs/jwt';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Follow, FollowSchema } from './models/follow.model';
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
} from '../subscription/models/refferal.model';
import { S3Service } from 'src/s3.service';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from '../subscription/models/transaction.model';
import { ContactUs, ContactUsSchema } from './models/contact-us.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { StripeService } from 'src/subscription/stripe/stripe.service';
import { WebhookSnapshot, WebhookSnapshotSchema } from './models/webhook.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { BusinessService } from 'src/business/business.service';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from 'src/auth/models/dashboardConfig.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from 'src/auth/models/platformConfig.model';
import { Brand, BrandSchema } from 'src/business/model/brand.model';
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
import {
  LocationGroup,
  LocationGroupSchema,
} from 'src/business/model/locationGroup.model';
import { Menu, MenuSchema } from 'src/business/model/menu.model';
import { Rating, RatingSchema } from 'src/business/model/rating.model';
import { Region, RegionSchema } from 'src/business/model/region.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Tag, TagSchema } from 'src/models/tags.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/outlet/model/outletType.model';
import {
  UserReward,
  UserRewardSchema,
} from 'src/rewards/model/userReward.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { MailService } from 'src/mail/mail.service';
import { SeederService } from 'src/seeder/seeder.service';
import { AuthService } from 'src/auth/auth.service';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import {
  EventResponse,
  EventResponseSchema,
} from 'src/event/models/event-response.model';
import {
  EventSchedule,
  EventScheduleSchema,
} from 'src/event/models/event-schedule.model';
import { SmsService } from 'src/sms/sms.service';
@Module({
  imports: [
    MongooseModule.forFeature([
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
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },

      // { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      // { name: BusinessCategory.name, schema: BusinessCategorySchema },

      // { name: Privilege.name, schema: PrivilegeSchema },
      // { name: BusinessCountry.name, schema: BusinessCountrySchema },
      // { name: Folder.name, schema: FolderSchema },
      // { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      // { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      // { name: Brand.name, schema: BrandSchema },
      // { name: Resource.name, schema: ResourceSchema },
      // { name: Department.name, schema: DepartmentSchema },
      // { name: Action.name, schema: ActionSchema },
      // { name: LocationGroup.name, schema: LocationGroupSchema },
      // { name: Region.name, schema: RegionSchema },
      // { name: UserReward.name, schema: UserRewardSchema },
      // { name: Rating.name, schema: RatingSchema },
      // { name: Menu.name, schema: MenuSchema },
      // { name: AppVersion.name, schema: AppVersionSchema },
      // { name: OutletCategory.name, schema: OutletCategorySchema },
      // { name: OutletType.name, schema: OutletTypeSchema },
      // { name: DashboardConfig.name, schema: DashboardConfigSchema },
      // { name: Tag.name, schema: TagSchema },
      // { name: PlatformConfig.name, schema: PlatformConfigSchema },
      // { name: Outlet.name, schema: OutletSchema },
      // { name: EventLocation.name, schema: EventLocationSchema },
      // { name: Category.name, schema: CategorySchema },
      // { name: AgeGroup.name, schema: AgeGroupSchema },
      // { name: EventResponse.name, schema: EventResponseSchema },
      // { name: EventSchedule.name, schema: EventScheduleSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    JwtService,
    Logger,
    S3Service,
    StripeService,
    DriveService,
    FirebaseService,
    // BusinessService,
    // MailService,
    // SeederService,
    // AuthService,
    // SmsService
  ],
})
export class UserModule {}
