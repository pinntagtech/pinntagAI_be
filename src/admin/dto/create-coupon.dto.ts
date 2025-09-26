import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { CouponType } from 'src/subscription/models/coupon.model';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsOptional()
  amount?: number = 20;

  @IsMongoId()
  @IsNotEmpty()
  user: string;

  @IsEnum(CouponType)
  couponType: CouponType;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}

export class UpdateCouponDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  isBlacklisted?: boolean;

  @IsEnum(CouponType)
  @IsOptional()
  couponType?: CouponType;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}
