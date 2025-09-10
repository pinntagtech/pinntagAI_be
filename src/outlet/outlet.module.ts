import { Module } from '@nestjs/common';
import { OutletController } from './outlet.controller';
import { OutletService } from './outlet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessUser, BusinessUserSchema } from 'src/business/model/businessUser.model';
import { OutletCategory, OutletCategorySchema } from './model/outletCategory.model';
import { OutletType, OutletTypeSchema } from './model/outletType.model';
import { Outlet, OutletSchema } from './model/outlet.model';
import { Role, RoleSchema } from 'src/roles/models/roles.model';
import { User, UserSchema } from 'src/user/models/user.model';
// import { BusinessProfile, BusinessProfileSchema } from 'src/business-profile/models/businessProfile.model';
import { GuestSession, GuestSessionSchema } from 'src/auth/models/guestSession.model';
import { Token, TokenSchema } from 'src/auth/models/token.model';
import { Admin, AdminSchema } from 'src/admin/models/admin.model';
import { Business, BusinessSchema } from 'src/business/model/business.model';
import { JwtService } from '@nestjs/jwt';
import { GoogleService } from 'src/google/google.service';
import { FileCategory, FileCategorySchema } from 'src/drive/models/fileCategory.model';
import { DriveService } from 'src/drive/drive.service';
import { Drive, DriveSchema } from 'src/drive/models/drive.model';
import { Folder, FolderSchema } from 'src/drive/models/folder.model';
import { Event, EventSchema } from 'src/event/models/event.model';
import { File, FileSchema } from 'src/drive/models/file.model';
import { S3Service } from 'src/s3.service';
import { SampleDocument, SampleDocumentSchema } from 'src/admin/models/sampleDocuments.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessUser.name, schema: BusinessUserSchema },
      { name: OutletCategory.name, schema: OutletCategorySchema },
      { name: OutletType.name, schema: OutletTypeSchema },
      { name: Outlet.name, schema: OutletSchema },
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
      // { name: BusinessProfile.name, schema: BusinessProfileSchema },
      { name: GuestSession.name, schema: GuestSessionSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: Business.name, schema: BusinessSchema },
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema },
      { name: Folder.name, schema: FolderSchema },
      { name: Event.name, schema: EventSchema },
      { name: File.name, schema: FileSchema},
      { name: SampleDocument.name, schema: SampleDocumentSchema },

    ])
  ],
  controllers: [OutletController],
  providers: [OutletService,JwtService,GoogleService,DriveService, S3Service]
})
export class OutletModule {}
