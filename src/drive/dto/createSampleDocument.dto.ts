import { IsString } from 'class-validator';

export class CreateSampleDocumentDto {
  @IsString()
  title: string;

  @IsString()
  description: string;
}
