import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { RSVPTypes } from 'src/enums/event.enums';

export class AcceptInvitationDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
