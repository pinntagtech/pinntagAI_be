import { IsString } from "class-validator";

export class CreateIndustryDto {
    @IsString()
    title: string;
    @IsString()
    lightIcon: string;
    @IsString()
    darkIcon: string;
    @IsString()
    activeColor: string;
}