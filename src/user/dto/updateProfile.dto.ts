import { IsIn, IsOptional } from 'class-validator';
import { Genders } from '../models/user.model';

export class UpdateProfileDto {
  @IsOptional()
  name: string;
  @IsOptional()
  firstName: string;
  @IsOptional()
  lastName: string;
  @IsOptional()
  phone: string;
  @IsOptional()
  latitude: number;
  @IsOptional()
  longitude: number;
  @IsOptional()
  @IsIn([Genders.MALE, Genders.FEMALE, Genders.OTHER, Genders.RATHER_NOT_SAY])
  gender: string;
  @IsOptional()
  age: number;
}
