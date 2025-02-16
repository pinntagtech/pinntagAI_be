import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { DeviceTypes } from 'src/enums/auth.enums';

export class GuestLoginDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([
    DeviceTypes.ANDROID,
    DeviceTypes.IOS,
    DeviceTypes.WEB,
    DeviceTypes.POSTMAN,
  ])
  deviceType: string;
}
