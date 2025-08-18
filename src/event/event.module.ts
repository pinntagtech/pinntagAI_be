import { Module, Logger } from '@nestjs/common';
import { EventController } from './event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './models/event.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
import { Image, ImageSchema } from './models/image.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from 'src/business-profile/models/businessProfile.model';
import { S3Service } from 'src/s3.service';
import { Template, TemplateSchema } from './models/template.model';
import { HttpModule } from '@nestjs/axios';
import { FacebookService } from 'src/user/facebook.service';
import {
  EventLocation,
  EventLocationSchema,
} from './models/eventLocation.model';
// import {
//   BusinessLocation,
//   BusinessLocationSchema,
// } from 'src/business-profile/models/businessLocation.model';
import {
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import { UserService } from 'src/user/user.service';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscription-product.model';
import {
  Refferal,
  RefferalSchema,
} from 'src/subscription/models/refferal.model';
import {
  EventInvitation,
  EventInvitationSchema,
} from './models/eventInvitation.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/subscription/models/transaction.model';
import { Report, ReportSchema } from './models/reports.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { SavedEvent, SavedEventSchema } from './models/savedEvent.model';
import { StripeService } from 'src/stripe/stripe.service';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { CrawledEvent, CrawledEventSchema } from './models/crawled-event.model';
import { FirebaseService } from 'src/notification/firebase.service';
import { DynamicLinkService } from 'src/notification/dynamicLink.service';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from 'src/user/models/webhook.model';
import {
  EventResponse,
  EventResponseSchema,
} from './models/event-response.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { EventService2 } from './event.service2';
import {
  EventSchedule,
  EventScheduleSchema,
} from './models/event-schedule.model';
import { Outlet, OutletSchema } from 'src/outlet/model/outlet.model';
import { BusinessService } from 'src/business/business.service';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilege.model';
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
import { File, FileSchema } from 'src/drive/models/file.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { GoogleService } from 'src/google/google.service';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from 'src/business/model/BussinessDocumentType.model';
import { Brand, BrandSchema } from 'src/business/model/brand.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import {
  Department,
  DepartmentSchema,
} from 'src/business/model/department.model';
import { Action } from 'rxjs/internal/scheduler/Action';
import { ActionSchema } from 'src/roles/models/actions.model';
import {
  LocationGroup,
  LocationGroupSchema,
} from 'src/business/model/locationGroup.model';
import { Region, RegionSchema } from 'src/business/model/region.model';
import {
  UserReward,
  UserRewardSchema,
} from 'src/rewards/model/userReward.model';
import { Rating, RatingSchema } from 'src/business/model/rating.model';
import { MenuSchema } from 'src/business/model/menu.model';
import { Menu } from 'src/business/model/types.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from 'src/business/model/userAllowedNotification.model';
import { MailService } from 'src/mail/mail.service';
import { SeederService } from 'src/seeder/seeder.service';
import { AuthService } from 'src/auth/auth.service';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/outlet/model/outletType.model';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from 'src/auth/models/dashboardConfig.model';
import { Tag, TagSchema } from 'src/models/tags.model';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from 'src/auth/models/platformConfig.model';
import { SmsService } from 'src/sms/sms.service';
import { Reward, RewardSchema } from 'src/rewards/model/reward.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Category.name, schema: CategorySchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Image.name, schema: ImageSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      // { name: BusinessLocation.name, schema: BusinessLocationSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: EventInvitation.name, schema: EventInvitationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: CrawledEvent.name, schema: CrawledEventSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: File.name, schema: FileSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },

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
      { name: Reward.name, schema: RewardSchema },
      // { name: BusinessCategory.name, schema: BusinessCategorySchema },
      // { name: BusinessCountry.name, schema: BusinessCountrySchema },
    ]),
  ],
  controllers: [EventController],
  providers: [
    // EventService,
    EventService2,
    JwtService,
    S3Service,
    FacebookService,
    UserService,
    Logger,
    StripeService,
    FirebaseService,
    DynamicLinkService,
    DriveService,
    GoogleService,
    BusinessService,
    MailService,
    SeederService,
    AuthService,
    SmsService,
    // BusinessService,
  ],
})
export class EventModule {}
