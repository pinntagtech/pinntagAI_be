import { Transform } from 'class-transformer';
import {
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

  @IsNotEmpty()
  targetCount: number;

  @IsNotEmpty()
  rewardExpiration: number;

  @IsNotEmpty()
  categories: any;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountType: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  discountValue: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  promotionCode: string;

  @IsString()
  isFree: any;

  @ValidateIf((o) => o.isFree === false)
  @IsString()
  participationCost: string;

  @IsOptional()
  @IsString()
  //   @Transform(({ value }) => value.map((v) => v.trim()))
  targetGenders: any;

  @IsOptional()
  @IsString()
  minTargetAge: any;

  @IsOptional()
  @IsString()
  maxTargetAge: any;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  termsAndConditions: string;
}
