import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OAuth2Dto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  profilePhoto: string;

  @IsOptional()
//   @Transform(({ value }) => {
//   console.log("User entered email:", value);
//   return value;
// })
  @IsString()
  // @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  oAuthToken: string;

  @IsOptional()
  @IsString()
  fcmToken: string;

  @IsOptional()
  @IsString()
  deviceType: string;
}
