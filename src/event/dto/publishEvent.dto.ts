import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class PublishEventDto{
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsOptional()
    @IsBoolean()
    saveAsTemplate: boolean;
}