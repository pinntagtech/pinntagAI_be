import {
  IsDate,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Genders } from 'src/user/models/user.model';

export class PersonDetailDto {
  @IsOptional()
  @IsString()
  profilePhoto: string;

  @IsString()
  name: string;

  @IsDateString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  @IsIn([Genders.FEMALE, Genders.MALE, Genders.OTHER, Genders.RATHER_NOT_SAY])
  gender: string;
}
