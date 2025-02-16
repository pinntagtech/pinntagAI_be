import { IsIn, IsNotEmpty, IsString } from "class-validator";
import { OtpTypes } from "src/enums/auth.enums";

export class ResendOtpDto{
    @IsNotEmpty()
    @IsString()
    @IsIn([OtpTypes.EMAIL, OtpTypes.MOBILE])
    type: string;

    @IsNotEmpty()
    @IsString()
    user: string
}