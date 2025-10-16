import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class BusinessActivationRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^\+?[0-9]{1,4}$/, {
    message: 'countryCode must be a valid international dialing code',
  })
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^[0-9]{7,15}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;
}
