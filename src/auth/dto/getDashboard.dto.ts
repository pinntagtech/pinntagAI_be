import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';

export class GetDashboardDto {
  @IsNotEmpty()
  latitude: string;
  @IsNotEmpty()
  longitude: string;
  @IsOptional()
  @IsArray()
  categories: Array<string>;
  @IsOptional()
  startDate: string;
  @IsOptional()
  endDate: string;
}
