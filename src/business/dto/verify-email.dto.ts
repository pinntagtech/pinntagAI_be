import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsNumber, IsString, MaxLength, MinLength } from "class-validator";

export class VerifyEmailDto {


  @IsNotEmpty()
    @IsEmail()
    @IsString()
    @Transform(({ value }) => value.toLowerCase())
    @Transform(({ value }) => value.trim())
    email: string;


  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}