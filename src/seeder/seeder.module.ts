import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgeGroup, AgeGroupSchema } from 'src/models/ageGroup.model';
import { Category, CategorySchema } from 'src/models/contentCategory.model';
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
import { Privilege, PrivilegeSchema } from 'src/roles/models/privilage.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { Resource, ResourceSchema } from 'src/roles/models/resource.model';
import { Action, ActionSchema } from 'src/roles/models/actions.model';
import {
  OutletCategory,
  OutletCategorySchema,
} from 'src/outlet/model/outletCategory.model';
import {
  OutletType,
  OutletTypeSchema,
} from 'src/outlet/model/outletType.model';
import {
  BusinessUser,
  BusinessUserSchema,
} from 'src/business/model/businessUser.model';
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
import {
  BusinessConstitution,
  BusinessConstitutionSchema,
} from 'src/business/model/businessConstitution.model';
import {
  BusinessDocumentType,
  BusinessDocumentTypeSchema,
} from 'src/business/model/BussinessDocumentType.model';
import { Template, TemplateSchema } from 'src/event/models/template.model';
import { DashboardConfig, DashboardConfigSchema } from 'src/auth/models/dashboardConfig.model';
import { Department, DepartmentSchema } from 'src/business/model/department.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { DriveService } from 'src/drive/drive.service';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { FileSchema } from 'src/drive/models/file.model';
import { S3Service } from 'src/s3.service';

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
    ]),
  ],
  controllers: [],
  providers: [SeederService,DriveService,S3Service],
})
export class SeederModule {}
