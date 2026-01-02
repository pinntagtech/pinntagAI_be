import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import mongoose from 'mongoose';
import { EventTypes } from 'src/enums/event.enums';

export class CreateOfferDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  title: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsIn(Object.values(EventTypes))
  eventType: string;

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

  @IsOptional()
  @IsString()
  isFree: any;

  @IsOptional()
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

  @IsOptional()
  bookingSite: string;

  @IsOptional()
  itemQuantity: any;

  @IsOptional()
  itemName: any;

  @IsOptional()
  itemPrice: any;

  @IsOptional()
  currency: string;

  @IsOptional()
  preBookingRequired: any;

  @IsOptional()
  minOrderPerBooking: any;

  @IsOptional()
  maxOrderPerBooking: any;

  @IsOptional()
  flashDealEndTime: any;

  @IsOptional()
  isRedeemable:any;

  @IsOptional()
  redemptionFrequency: string;

  @IsOptional()
  checkInRequired:any;

  @IsOptional()
  expectedAtLocation: any;




}
