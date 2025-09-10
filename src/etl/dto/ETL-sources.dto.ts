// Generate a DTO (Data Transfer Object) for ETL URL
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ETL_Source_Status } from '../helpers/enums';

export class CreateEtlSourceDto {
    @IsString()
    @IsNotEmpty()
    url: string;
    
    @IsString()
    @IsNotEmpty()
    label: string;
    
    @IsString()
    @IsOptional()
    description?: string;

    status?: ETL_Source_Status;
}

export class UpdateEtlSourceDto {
    @IsString()
    @IsOptional()
    url?: string;

    @IsString()
    @IsOptional()
    laabel?: string;

    @IsString()
    @IsOptional()
    description?: string;

    status?: ETL_Source_Status;
}
