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
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/subscription/models/subscription.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import { S3Service } from 'src/s3.service';
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
import { OutletCategory, OutletCategorySchema } from 'src/business/model/outletCategory.model';
import { OutletType, OutletTypeSchema } from 'src/business/model/outletType.model';
import { BusinessUser, BusinessUserSchema } from 'src/business/model/businessUser.model';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Role.name, schema: RoleSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
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
      { name: Privilege.name, schema:PrivilegeSchema},
      { name:Resource.name, schema:ResourceSchema},
      { name:Action.name, schema:ActionSchema},
      { name:OutletCategory.name,schema:OutletCategorySchema},
      { name:OutletType.name,schema:OutletTypeSchema},
      { name:BusinessUser.name,schema:BusinessUserSchema}
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
  ],
})
export class MailModule {}
