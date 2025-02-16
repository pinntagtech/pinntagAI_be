import { IsNotEmpty, IsIn, IsString } from 'class-validator';
import { RSVPTypes } from 'src/enums/event.enums';

export class RespondRsvp {
  @IsNotEmpty()
  @IsString()
  @IsIn(Object.values(RSVPTypes))
  rsvp: string;
}
