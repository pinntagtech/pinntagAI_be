import { IsOptional } from 'class-validator';

export class SaveSubsDataDto {
  @IsOptional()
  productId: string;

  // Accept ISO 8601 date-time strings, e.g. "2025-09-26T10:15:30Z"
  @IsOptional()
  transactionDate: string;

  @IsOptional()
  purchaseId: string;

  // Currently validating as string; switch to @IsEnum(PurchaseStatus) if you define the enum above
  @IsOptional()
  status: string; // enum -> string

  @IsOptional()
  serverVerificationData: any;

  @IsOptional()
  localVerificationData: any;
}
