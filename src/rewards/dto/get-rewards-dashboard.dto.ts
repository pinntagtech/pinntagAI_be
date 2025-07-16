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
  @IsIn(Object.values(RewardType))
  rewardType: string;
}
