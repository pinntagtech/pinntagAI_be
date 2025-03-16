import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from './user/models/user.model';
import { Category, CategorySchema } from './models/category.model';
import { MailModule } from './mail/mail.module';
import { Logger } from 'winston';
import { EventModule } from './event/event.module';
import { BusinessProfileModule } from './business-profile/business-profile.module';
import { AgeGroup, AgeGroupSchema } from './models/ageGroup.model';
import { SeederModule } from './seeder/seeder.module';
import { SeederService } from './seeder/seeder.service';
import { SubscriptionModule } from './subscription/subscription.module';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from './subscription/models/subscriptionProduct.model';
import { NotificationModule } from './notification/notification.module';
import { AppVersion, AppVersionSchema } from './models/appVersion.model';
import { StripeModule } from 'nestjs-stripe';
import { StripeeModule } from './stripe/stripe.module';
import { InAppPurchaseModule } from './in-app-purchase/in-app-purchase.module';
import { Event, EventSchema } from './event/models/event.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from './business-profile/models/businessProfile.model';
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
import { Privilege, PrivilegeSchema } from './roles/models/privilage.model';

@Module({
  imports: [
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    // }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: './.env',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
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
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: PlatformConfig.name, schema: PlatformConfigSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Privilege.name, schema: PrivilegeSchema}
    ]),
    StripeeModule,
    AuthModule,
    UserModule,
    MailModule,
    EventModule,
    SeederModule,
    BusinessProfileModule,
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
  ],
  controllers: [AppController],
  providers: [AppService, Logger, SeederService],
})
export class AppModule {}
