import { IsString } from 'class-validator';
export class createRoleDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  creator: string;

  @IsString()
  resource: string;

  @IsString()
  action: string;
}
