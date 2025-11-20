import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class UpgradePlanDto {
    @IsNotEmpty()
    statusCode: number;

    @IsOptional()
    @IsString()
    newPriceId?: string;

    @IsOptional()
    @IsString()
    newProductId?: string;

    @IsOptional()
    quantity?: number;

}