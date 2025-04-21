import { IsNotEmpty, IsNumber, IsString } from "class-validator";



export class AddressAutofillDto {

    @IsNotEmpty()
    @IsString()
    address: string;

    @IsNotEmpty()
    @IsNumber()
    latitude: number;

    @IsNotEmpty()
    @IsNumber()
    longitude: number;
}