import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ProfileTypes } from 'src/enums/user.enum';

export class FollowDto {
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsNotEmpty()
  @IsString()
  @IsIn(ProfileTypes)
  profileType: string;
}
