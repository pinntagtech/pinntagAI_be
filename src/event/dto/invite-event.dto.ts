import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InviteEventDto {
  @IsNotEmpty()
  @IsString()
  event: string;

  @IsOptional()
  @IsArray()
  users: Array<string>;
}
