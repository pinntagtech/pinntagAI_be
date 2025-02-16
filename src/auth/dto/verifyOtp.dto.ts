import { IsIn, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { OtpTypes } from "src/enums/auth.enums";

export class VerifyOtpDto {
    @IsNotEmpty()
    @IsString()
    user: string;

    @IsNotEmpty()
    @IsString()
    @IsIn([OtpTypes.EMAIL, OtpTypes.MOBILE])
    type: string

    @IsNotEmpty()
    @IsNumber()
    otp: number
}