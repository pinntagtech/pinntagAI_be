import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectFacebookDto {
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
