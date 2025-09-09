// DTO for ETL URL Group
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import mongoose from 'mongoose';

export class CreateEtlSourceGroupDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsNotEmpty({ each: true })
    urls: Array<mongoose.Types.ObjectId>;

    @IsString()
    @IsNotEmpty()
    name: string;
    
    @IsString()
    @IsOptional()
    description?: string;
}

export class UpdateEtlSourceGroupDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsNotEmpty({ each: true })
    @IsOptional()
    urls?: Array<mongoose.Types.ObjectId>;

    @IsString()
    @IsOptional()
    name?: string;
    
    @IsString()
    @IsOptional()
    description?: string;
}