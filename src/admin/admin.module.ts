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
import { Category, CategorySchema } from 'src/models/category.model';
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
import { Permission, PermissionSchema } from './models/permission.model';
import { AdminRole, AdminRoleSchema } from './models/adminRole.model';
import {
  BusinessRole,
  BusinessRoleSchema,
} from 'src/business-profile/models/businessRole.model';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { SeederService } from 'src/seeder/seeder.service';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilage.model';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Permission.name, schema: PermissionSchema },
      { name: AdminRole.name, schema: AdminRoleSchema },
      { name: BusinessRole.name, schema: BusinessRoleSchema },
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
      { name: Privilege.name, schema: PrivilegeSchema},
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
  ],
})
export class AdminModule {}
