import { IsNotEmpty } from "class-validator";
import { CreateScheduleDto } from "./create-schedule.dto";

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

export class PinDropV2Dto extends CreateScheduleDto {
    @IsNotEmpty()
    outletId: string;

    @IsNotEmpty()
    spotId: string;
}