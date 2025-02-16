import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class PublishCrawledEventDto {
  @IsNotEmpty()
  @IsArray()
  ids: Array<string>;

  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  businessProfile: string;
}
