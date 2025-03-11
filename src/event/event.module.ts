import { Module, Logger } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './models/event.model';
import { Category, CategorySchema } from 'src/models/category.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { Role, RoleSchema } from 'src/models/role.model';
import {
  GuestSession,
  GuestSessionSchema,
} from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { JwtService } from '@nestjs/jwt';
import { Image, ImageSchema } from './models/image.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
import { S3Service } from 'src/s3.service';
import { Template, TemplateSchema } from './models/template.model';
import { HttpModule } from '@nestjs/axios';
import { FacebookService } from 'src/user/facebook.service';
import {
  EventLocation,
  EventLocationSchema,
} from './models/eventLocation.model';
import {
  BusinessLocation,
  BusinessLocationSchema,
} from 'src/business-profile/models/businessLocation.model';
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
} from 'src/subscription/models/subscriptionProduct.model';
import { Refferal, RefferalSchema } from 'src/user/models/refferal.model';
import {
  EventInvitation,
  EventInvitationSchema,
} from './models/eventInvitation.model';
import {
  Transaction,
  TransactionSchema,
} from 'src/user/models/transaction.model';
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
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: Template.name, schema: TemplateSchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: BusinessLocation.name, schema: BusinessLocationSchema },
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
      { name:Admin.name, schema: AdminSchema},
    ]),
  ],
  controllers: [EventController],
  providers: [
    EventService,
    JwtService,
    S3Service,
    FacebookService,
    UserService,
    Logger,
    StripeService,
    FirebaseService,
    DynamicLinkService,
  ],
})
export class EventModule {}
