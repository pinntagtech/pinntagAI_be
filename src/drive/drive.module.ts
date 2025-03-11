import { Module } from '@nestjs/common';
import { DriveController } from './drive.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { FileCategory, FileCategorySchema } from './models/fileCategory.model';
import { Drive, DriveSchema } from './models/drive.model';
import { DriveService } from './drive.service';
import { Folder, folderSchema } from './models/folder.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileCategory.name, schema: FileCategorySchema },
      { name: Drive.name, schema: DriveSchema},
      { name:Folder.name, schema: folderSchema}
    ])
  ],
  controllers: [DriveController],
  providers: [DriveService]
})
export class DriveModule {}
