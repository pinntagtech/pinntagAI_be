import { IsNotEmpty, IsOptional } from "class-validator";


export class CheckInDto {
    @IsNotEmpty()
    locationId: string;

    @IsNotEmpty()
    latitude: number;

    @IsNotEmpty()
    longitude: number;

    @IsNotEmpty()
    title: string;

    @IsNotEmpty()
    message: string;

    @IsOptional()
    users: string[];

    @IsOptional()
    visibility: string;

}