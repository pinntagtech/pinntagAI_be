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

export enum ReferralType {
  PROMOTION = 'promotion',
  COUPON = 'coupon',
}

export class CreateReferralDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsOptional()
  amount?: number = 20;

  @IsMongoId()
  @IsNotEmpty()
  user: string;

  @IsEnum(ReferralType)
  referralType: ReferralType;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}

export class UpdateReferralDto {
  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsBoolean()
  @IsOptional()
  isBlacklisted?: boolean;

  @IsEnum(ReferralType)
  @IsOptional()
  referralType?: ReferralType;

  @IsDateString()
  @IsOptional()
  expiresAt?: Date;
}
