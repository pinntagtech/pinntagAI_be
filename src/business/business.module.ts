import { Logger, Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserSchema } from './model/businessUser.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { Business, BusinessSchema } from './model/business.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { Otp, OtpSchema } from 'src/auth/models/otp.model';
import { User } from 'src/user/models/user.model';
import { OutletCategorySchema } from './model/outletCategory.model';
import { UserService } from 'src/user/user.service';
import { Follow, FollowSchema } from 'src/user/models/follow.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
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
  Notification,
  NotificationSchema,
} from 'src/notification/models/notification.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
import { ContactUs, ContactUsSchema } from 'src/user/models/contact-us.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { Report, ReportSchema } from 'src/event/models/reports.model';
import {
  SavedEvent,
  SavedEventSchema,
} from 'src/event/models/savedEvent.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { S3Service } from 'src/s3.service';
import { StripeService } from 'src/stripe/stripe.service';
import { WebhookSnapshot, WebhookSnapshotSchema } from 'src/user/models/webhook.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Otp.name, schema: OtpSchema },
      { name: User.name, schema: OutletCategorySchema },
      { name: Follow.name, schema: FollowSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: Refferal.name, schema: RefferalSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: ContactUs.name, schema: ContactUsSchema },
      { name: Event.name, schema: EventSchema },
      { name: Report.name, schema: ReportSchema },
      { name: SavedEvent.name, schema: SavedEventSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: WebhookSnapshot.name,schema:WebhookSnapshotSchema}
    ]),
  ],
  controllers: [BusinessController],
  providers: [BusinessService, MailService, JwtService, UserService, Logger,S3Service,StripeService],
})
export class BusinessModule {}
