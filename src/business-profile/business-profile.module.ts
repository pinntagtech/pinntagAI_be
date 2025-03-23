import { Logger, Module } from '@nestjs/common';
import { BusinessProfileService } from './business-profile.service';
import { BusinessProfileController } from './business-profile.controller';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from './models/businessProfile.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { JwtService } from '@nestjs/jwt';
import { Gallery, GallerySchema } from './models/gallery.model';
import { Image, ImageSchema } from 'src/event/models/image.model';
import { AuthService } from 'src/auth/auth.service';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import { MailService } from 'src/mail/mail.service';
import { S3Service } from 'src/s3.service';
import { FacebookService } from 'src/user/facebook.service';
import {
  BusinessLocation,
  BusinessLocationSchema,
} from './models/businessLocation.model';
import {
  EventLocation,
  EventLocationSchema,
} from 'src/event/models/eventLocation.model';
import { Category, CategorySchema } from 'src/models/category.model';
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
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
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
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilage.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/business/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/business/model/outletType.model';
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
import { BusinessCountry, BusinessCountrySchema } from 'src/business/model/businessCountry.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: User.name, schema: UserSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Role.name, schema: RoleSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Gallery.name, schema: GallerySchema },
      { name: BusinessLocation.name, schema: BusinessLocationSchema },
      { name: Image.name, schema: ImageSchema },
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
    ]),
  ],
  controllers: [BusinessProfileController],
  providers: [
    BusinessProfileService,
    UserService,
    JwtService,
    Logger,
    AuthService,
    MailService,
    S3Service,
    FacebookService,
    StripeService,
    MailService,
    SmsService,
    SeederService,
  ],
})
export class BusinessProfileModule {}
