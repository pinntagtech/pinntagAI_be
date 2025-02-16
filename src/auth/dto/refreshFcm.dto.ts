import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshFcmDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  deviceType: string;
}
