import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from "class-validator";

export class VerifyEmailDto {

  @IsNotEmpty()
  @IsString()
  userId:string;

  @IsNotEmpty()
  @IsString()
  signupMethod: string;


  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}