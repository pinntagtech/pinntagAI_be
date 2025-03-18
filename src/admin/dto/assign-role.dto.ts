import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class AssignRoleDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  userId: string | mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  roleId: string | mongoose.Types.ObjectId;
}
