import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PostToSocialMediaDto {
  @IsNotEmpty()
  @IsString()
  eventId: string;

  @IsOptional()
  @IsBoolean()
  facebook: boolean;

  @IsOptional()
  @IsBoolean()
  twitter: boolean;

  @IsOptional()
  @IsBoolean()
  instagram: boolean;
}
