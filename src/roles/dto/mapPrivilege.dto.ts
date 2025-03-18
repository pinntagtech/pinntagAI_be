import { IsNotEmpty, IsString } from 'class-validator';

export class MapPrivilegeDto {
  @IsNotEmpty()
  @IsString()
  roleId: string;

  @IsNotEmpty()
  @IsString()
  resourceId: string;

  @IsNotEmpty()
  @IsString()
  actionId: string;
}
