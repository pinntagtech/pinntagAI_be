import { IsNotEmpty, IsString } from 'class-validator';

export class BusinessCategoryDto {
  @IsNotEmpty()
  @IsString()
  industry: string;
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsString()
  lightIcon: string;
  @IsString()
  darkIcon: string;
  @IsString()
  activeColor: string;
}
