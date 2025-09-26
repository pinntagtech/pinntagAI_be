import {
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsMongoId,
  IsUrl,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateBusinessUserDto {
  // @IsUrl()
  @IsOptional()
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  webWalkThroughCompleted: boolean;

  @IsOptional()
  appWalkThroughCompleted: boolean;

  // @IsOptional()
  // @IsString()
  // countryCode: string;

  // // @IsPhoneNumber(null)
  // @IsOptional()
  // @IsString()
  // phone: string;
}
