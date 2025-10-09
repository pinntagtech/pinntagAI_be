import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class DashboardSearchDto {
  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;

  @IsOptional()
  @IsString()
  carouselType: string;
  
  @IsNotEmpty()
  @IsString()
  search: string;

  @IsOptional()
  page: number;

  @IsOptional()
  limit: number;

  @IsOptional()
  distance?: number;

  @IsOptional()
  type?: string;

}