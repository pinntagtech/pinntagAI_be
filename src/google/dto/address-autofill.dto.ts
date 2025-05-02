import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";



export class AddressAutofillDto {

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsOptional()
    @IsNumber()
    latitude: number;

    @IsOptional()
    @IsNumber()
    longitude: number;
}