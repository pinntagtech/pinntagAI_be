import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
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
  @IsString()
  locations: string;

  @IsNotEmpty()
  targetCount: string;

  @IsNotEmpty()
  rewardExpiration: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @IsNotEmpty()
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string' },
  )
  startDate: string;

  @IsNotEmpty()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate: string;
}
export class UpdateRewardDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(RewardType))
  rewardType: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(RedemptionMode))
  redemptionMode: string;

  // @IsOptional()
  // @IsString()
  // @Transform(({ value }) => value.trim())
  // @IsIn(Object.values(ActivityType))
  // activityType: string;

  @IsOptional()
  @IsString()
  locations: any;

  @IsOptional()
  targetCount: string;

  @IsOptional()
  rewardExpiration: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string' },
  )
  startDate: any;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO 8601 date string' })
  endDate: any;
}
