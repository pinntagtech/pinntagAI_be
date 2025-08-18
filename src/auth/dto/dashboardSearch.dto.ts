import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class DashboardSearchDto {
  @IsNotEmpty()
  latitude: number;

  @IsNotEmpty()
  longitude: number;

  @IsNotEmpty()
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

}