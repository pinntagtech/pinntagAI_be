import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ResetPaswordDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsNumber()
  otp: number;
}
