import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateScheduleDto } from "./create-schedule.dto";
import { PartialType } from "@nestjs/mapped-types";

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
    @IsOptional()
    @IsString()
    outletId: string;

    @IsOptional()
    @IsString()
    spotId: string;
}

export class UpdatePinDropV2Dto extends PartialType(PinDropV2Dto) {}