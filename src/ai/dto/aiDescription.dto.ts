import { IsNotEmpty, IsString } from 'class-validator';

export class AiDescriptionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  category: string;
}
