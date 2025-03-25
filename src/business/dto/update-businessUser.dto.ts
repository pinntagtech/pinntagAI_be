import { IsOptional, IsString, IsPhoneNumber, IsMongoId, IsUrl } from 'class-validator';

export class UpdateBusinessUserDto {
  @IsOptional()
  // @IsUrl()
  profilePhoto?: string;

  @IsString()
  name: string;

  @IsString()
  countryCode: string;

  // @IsPhoneNumber(null)
  phone: string;

}