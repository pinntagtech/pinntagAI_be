import { IsArray, IsString, ArrayNotEmpty, IsNotEmpty } from 'class-validator';

export class EtlDataDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    eventIds: string[];

    @IsString()
    @IsNotEmpty()
    businessId: string;
}