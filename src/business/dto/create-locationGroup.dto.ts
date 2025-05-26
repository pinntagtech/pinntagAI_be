import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId, ArrayUnique } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateLocationGroupDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly description?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ArrayUnique()  // ensure no duplicate IDs in the array
  readonly locations?: string[];  // array of Outlet IDs (as strings)
}

export class UpdateLocationGroupDto extends PartialType(CreateLocationGroupDto) {
  // All fields from CreateLocationGroupDto are optional here.
  // (name?: string, description?: string, locations?: string[])
}
