import { IsNotEmpty } from "class-validator";

export class PinDropDto {
    @IsNotEmpty()
    outletId: string;

    @IsNotEmpty()
    latitude: number;

    @IsNotEmpty()
    longitude: number;

    @IsNotEmpty()
    accuracy: number;

}