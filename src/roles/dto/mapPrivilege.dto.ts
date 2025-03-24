import { IsArray, IsNotEmpty, IsString } from 'class-validator';

class ResourcePrivilege {
  @IsNotEmpty()
  @IsString()
  resource: string;

  @IsNotEmpty()
  @IsString({ each: true })
  actions: string[];
}

export class MapPrivilegeDto {
  @IsNotEmpty()
  @IsArray()
  data: ResourcePrivilege[];
}
