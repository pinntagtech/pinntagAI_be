import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from './user/models/user.model';
import { Category, CategorySchema } from './models/contentCategory.model';
import { MailModule } from './mail/mail.module';
import { EventModule } from './event/event.module';
import { AgeGroup, AgeGroupSchema } from './models/ageGroup.model';
import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';
import { SubscriptionModule } from './subscription/subscription.module';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from './subscription/models/subscription-product.model';
import { NotificationModule } from './notification/notification.module';
import { AppVersion, AppVersionSchema } from './models/appVersion.model';
import { StripeModule } from 'nestjs-stripe';
import { StripeeModule } from './subscription/stripe/stripe.module';
import { InAppPurchaseModule } from './subscription/in-app-purchase/iap.module';
import { Event, EventSchema } from './event/models/event.model';
// import {
//   BusinessProfile,
//   BusinessProfileSchema,
// } from './business-profile/models/businessProfile.model';
import { Token, TokenSchema } from './auth/models/token.model';
import { CronModule } from './cron/cron.module';
import { SmsModule } from './sms/sms.module';
import { Otp, OtpSchema } from './auth/models/otp.model';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import {
  PlatformConfig,
  PlatformConfigSchema,
} from './auth/models/platformConfig.model';
import {
  FileCategory,
  FileCategorySchema,
} from './drive/models/fileCategory.model';
import { Admin, AdminSchema } from './admin/models/admin.model';
import { Drive, DriveSchema } from './drive/models/drive.model';
import { DriveModule } from './drive/drive.module';
import { RolesModule } from './roles/roles.module';
import { Role, RoleSchema } from './roles/models/roles.model';
import { Privilege, PrivilegeSchema } from './roles/models/privilege.model';
import { Resource, ResourceSchema } from './roles/models/resource.model';
import { Action, ActionSchema } from './roles/models/actions.model';
import { BusinessModule } from './business/business.module';
import {
  OutletCategory,
  OutletCategorySchema,
} from './outlet/model/outletCategory.model';
import { OutletType, OutletTypeSchema } from './outlet/model/outletType.model';
import { AppController } from './app.controller';
import {
  BusinessUser,
  BusinessUserSchema,
} from './business/model/businessUser.model';
import {
  BusinessCategory,
  BusinessCategorySchema,
} from './business/model/businessCategory.model';
import {
  BusinessIndustry,
  BusinessIndustrySchema,
} from './business/model/businessIndustry.model';
import {
  BusinessCountry,
  BusinessCountrySchema,
} from './business/model/businessCountry.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from './business/model/BussinessDocumentType.model';
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from './business/model/businessConstitution.model';
import { RateLimiterModule } from 'nestjs-rate-limiter';
import { OutletModule } from './outlet/outlet.module';
import { GoogleModule } from './google/google.module';
import { RewardsModule } from './rewards/rewards.module';
import { Template, TemplateSchema } from './event/models/template.model';
import {
  DashboardConfig,
  DashboardConfigSchema,
} from './auth/models/dashboardConfig.model';
import {
  Department,
  DepartmentSchema,
} from './business/model/department.model';
import { Business, BusinessSchema } from './business/model/business.model';
import { DriveService } from './drive/drive.service';
import { File, FileSchema } from './drive/models/file.model';
import { Folder, FolderSchema } from './drive/models/folder.model';
import { S3Service } from './s3.service';
import { Region, RegionSchema } from './business/model/region.model';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { Outlet, OutletSchema } from './outlet/model/outlet.model';
import { SeederConfig, SeederConfigSchema } from './models/seederConfig.model';
import { SocketGateway } from './socket/socket.gateway';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth/auth.service';
import {
  GuestSession,
  GuestSessionSchema,
} from './auth/models/guestSession.model';
import { Refferal, RefferalSchema } from './subscription/models/referral.model';
import {
  EventLocation,
  EventLocationSchema,
} from './event/models/eventLocation.model';
import { Follow, FollowSchema } from './user/models/follow.model';
import {
  EventResponse,
  EventResponseSchema,
} from './event/models/event-response.model';
import {
  EventSchedule,
  EventScheduleSchema,
} from './event/models/event-schedule.model';
import { UserService } from './user/user.service';
import {
  Subscription,
  SubscriptionSchema,
} from './subscription/models/subscription.model';
import {
  Notification,
  NotificationSchema,
} from './notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from './subscription/models/transaction.model';
import { ContactUs, ContactUsSchema } from './user/models/contact-us.model';
import { Report, ReportSchema } from './event/models/reports.model';
import { SavedEvent, SavedEventSchema } from './event/models/savedEvent.model';
import { SocketModule } from './socket/socket.module';
import { StripeService } from './subscription/stripe/stripe.service';
import { MailService } from './mail/mail.service';
import { SmsService } from './sms/sms.service';
import {
  WebhookSnapshot,
  WebhookSnapshotSchema,
} from './user/models/webhook.model';
import { FirebaseService } from './notification/firebase.service';
import { Tag, TagSchema } from './models/tags.model';
import {
  UserAllowedNotification,
  UserAllowedNotificationSchema,
} from './business/model/userAllowedNotification.model';
import { Reward, RewardSchema } from './rewards/model/reward.model';
import {
  SampleDocument,
  SampleDocumentSchema,
} from './admin/models/sampleDocuments.model';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { EtlModule } from './etl/etl.module';
import { RedisBullService } from './notification/redisBull.service';
import {
  Broadcast,
  BroadcastSchema,
} from './notification/models/broadcast.model';
import {
  SubscriptionPrice,
  SubscriptionPriceSchema,
} from './subscription/models/subscription-price.model';
import { Coupon, CouponSchema } from './subscription/models/coupon.model';
import multer from 'multer';
import { RewardLocation, RewardLocationSchema } from './rewards/model/rewardLocation.model';
import { FeedController } from './feed/feed.controller';
import { FeedService } from './feed/feed.service';
import { FeedModule } from './feed/feed.module';
import { Feed, FeedSchema } from './feed/models/feed.model';
import { FeaturedAsset, FeaturedAssetSchema } from './admin/models/featuredAssets.model';
import { UserSearchActivity, UserSearchActivitySchema } from './user/models/userSearchActivity.model';

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true, // makes cache available everywhere
      useFactory: async () => ({
        store: redisStore,
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        ttl: 60, // default cache time = 60 seconds
      }),
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    // RateLimiterModule.register({
    //   points: 5, // 5 requests
    //   duration: 60, // per 60 seconds (1 minute)
    //   keyPrefix: 'ratelimit', // Optional: Redis-based tracking
    // }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      { name: Role.name, schema: RoleSchema },
      { name: Category.name, schema: CategorySchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: Event.name, schema: EventSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Privilege.name, schema: PrivilegeSchema },
      { name: Resource.name, schema: ResourceSchema },
      { name: Action.name, schema: ActionSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: BusinessIndustry.name, schema: BusinessIndustrySchema },
      { name: BusinessCategory.name, schema: BusinessCategorySchema },
      { name: BusinessCountry.name, schema: BusinessCountrySchema },
      { name: BusinessConstitution.name, schema: BusinessConstitutionSchema },
      { name: BusinessDocumentType.name, schema: BusinessDocumentTypeSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: DashboardConfig.name, schema: DashboardConfigSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: File.name, schema: FileSchema },
      { name: Region.name, schema: RegionSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: SeederConfig.name, schema: SeederConfigSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: EventLocation.name, schema: EventLocationSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: EventResponse.name, schema: EventResponseSchema },
      { name: EventSchedule.name, schema: EventScheduleSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: WebhookSnapshot.name, schema: WebhookSnapshotSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Reward.name, schema: RewardSchema },
      {
        name: SubscriptionPrice.name,
        schema: SubscriptionPriceSchema,
      },
      {
        name: UserAllowedNotification.name,
        schema: UserAllowedNotificationSchema,
      },
      { name: SampleDocument.name, schema: SampleDocumentSchema },
      { name: Broadcast.name, schema: BroadcastSchema },
      { name: Coupon.name, schema: CouponSchema },
      { name: RewardLocation.name, schema: RewardLocationSchema },
      { name: Feed.name, schema: FeedSchema },
      { name: FeaturedAsset.name, schema: FeaturedAssetSchema },
      { name: UserSearchActivity.name, schema: UserSearchActivitySchema},
    ]),
    StripeeModule,
    AuthModule,
    UserModule,
    MailModule,
    EventModule,
    SeederModule,
    SubscriptionModule,
    NotificationModule,
    StripeModule,
    InAppPurchaseModule,
    CronModule,
    AiModule,
    SmsModule,
    AdminModule,
    DriveModule,
    RolesModule,
    BusinessModule,
    OutletModule,
    GoogleModule,
    RewardsModule,
    SocketModule,
    EtlModule,
    FeedModule,
  ],
  controllers: [AppController, FeedController],
  providers: [
    AppService,
    UserService,
    AuthService,
    Logger,
    SeederService,
    DriveService,
    S3Service,
    JwtService,
    StripeService,
    MailService,
    SmsService,
    FirebaseService,
    RedisBullService,
    FeedService,
  ],
})
export class AppModule {
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply((req, res, next) => {
//         // Only parse multipart/form-data
//         if (req.is('multipart/form-data')) {
//           return multer().any()(req, res, next);
//         }
//         next();
//       })
//       .forRoutes('*'); // or specific routes
//   }
}
