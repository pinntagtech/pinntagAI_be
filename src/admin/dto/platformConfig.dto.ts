import { IsOptional } from 'class-validator';

export class PlatformConfigDto {
  @IsOptional()
  distanceWeightage: number;
  @IsOptional()
  timeWeightage: number;
}
