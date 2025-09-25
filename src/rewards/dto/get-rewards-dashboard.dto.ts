import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { ActivityType, RewardType } from '../enums/rewards.enum';

export class GetRewardDashboardDto {
  @IsNotEmpty()
  latitude: string;

  @IsNotEmpty()
  longitude: string;

  @IsOptional()
  startDate: string;

  @IsOptional()
  endDate: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsIn(Object.values(RewardType), { each: true })
  rewardType: string[];
}
