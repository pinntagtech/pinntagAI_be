import { IsOptional, IsString } from 'class-validator';

export class SavedEventsDto {
  @IsOptional()
  @IsString()
  latitude: string;

  @IsOptional()
  @IsString()
  longitude: string;

  @IsOptional()
  page: number;
}
