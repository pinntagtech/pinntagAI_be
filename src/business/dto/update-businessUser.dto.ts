import { IsOptional, IsString, IsPhoneNumber, IsMongoId, IsUrl } from 'class-validator';

export class UpdateBusinessUserDto {
  // @IsUrl()
  @IsOptional()
  profilePhoto?: string;

  @IsString()
  name: string;

  @IsString()
  countryCode: string;

  // @IsPhoneNumber(null)
  @IsString()
  phone: string;

}