import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { Category, CategorySchema } from 'src/models/category.model';
import { Role, RoleSchema } from 'src/roles/models/role.model';
import { User, UserSchema } from 'src/user/models/user.model';
import { SeederService } from './seeder.service';
import {
  SubscriptionProduct,
  SubscriptionProductSchema,
} from 'src/subscription/models/subscriptionProduct.model';
import { AppVersion, AppVersionSchema } from 'src/models/appVersion.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import {
  FileCategory,
  FileCategorySchema,
} from 'src/drive/models/fileCategory.model';
import { AppService } from 'src/app.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import {
  BusinessProfile,
  BusinessProfileSchema,
} from 'src/business-profile/models/businessProfile.model';
import { AdminV2, AdminV2Schema } from 'src/admin/models/adminV2.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Category.name, schema: CategorySchema },
      { name: AgeGroup.name, schema: AgeGroupSchema },
      { name: SubscriptionProduct.name, schema: SubscriptionProductSchema },
      { name: AppVersion.name, schema: AppVersionSchema },
      { name: Event.name, schema: EventSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema },
      { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: AdminV2.name, schema: AdminV2Schema },
    ]),
  ],
  controllers: [],
  providers: [SeederService],
})
export class SeederModule {}
