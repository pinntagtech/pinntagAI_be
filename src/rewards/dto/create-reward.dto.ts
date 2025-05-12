import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  ActivityType,
  RedemptionMode,
  RewardType,
} from '../enums/rewards.enum';

export class CreateRewardDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(RewardType))
  rewardType: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(RedemptionMode))
  redemptionMode: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(ActivityType))
  activityType: string;

  @IsOptional()
  @IsArray()
  locations: Array<string> | Array<Location>;

  @IsNotEmpty()
  targetCount: number;

  @IsNotEmpty()
  rewardExpiration: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;
}
