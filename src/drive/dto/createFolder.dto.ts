import { IsMongoId, IsString } from "class-validator";

export class CreateFolderDto {
  @IsMongoId()
  parent: string;

  @IsString()
  parentType: string;

  @IsMongoId()
  drive: string;

  @IsString()
  folderName: string;

}