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
import { BusinessService } from 'src/business/business.service';
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
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from 'src/business/model/businessCountry.model';
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
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import {
  BusinessCategory,
  BusinessCategorySchema,
} from 'src/business/model/businessCategory.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from 'src/business/model/businessIndustry.model';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/auth.service';
import { SeederService } from 'src/seeder/seeder.service';
import { SmsService } from 'src/sms/sms.service';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { EventResponse, EventResponseSchema } from 'src/event/models/event-response.model';
import { EventSchedule, EventScheduleSchema } from 'src/event/models/event-schedule.model';
import { SampleDocument, SampleDocumentSchema } from 'src/admin/models/sampleDocuments.model';
import { BusinessDocVerificationLeads, BusinessDocVerificationLeadsSchema } from 'src/admin/models/BusinessDocVerificationLeads.model';

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

      { name: Privilege.name, schema: PrivilegeSchema },
      { name: BusinessCountry.name, schema: BusinessCountrySchema },
      { name: Folder.name, schema: FolderSchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Action.name, schema: ActionSchema },
      { name: LocationGroup.name, schema: LocationGroupSchema },
      { name: Region.name, schema: RegionSchema },
      { name: UserReward.name, schema: UserRewardSchema },
      { name: Rating.name, schema: RatingSchema },
      { name: Menu.name, schema: MenuSchema },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: DashboardConfig.name, schema: DashboardConfigSchema },
      { name: Tag.name, schema: TagSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },
      { name: Category.name, schema: CategorySchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
      { name: BusinessDocVerificationLeads.name, schema: BusinessDocVerificationLeadsSchema },
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
    BusinessService,
    MailService,
    SeederService,
    AuthService,
    SmsService,
  ],
})
export class RewardsModule {}
