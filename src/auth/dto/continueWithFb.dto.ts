import { IsNotEmpty, IsOptional } from "class-validator";

export class ContinueWithFacebookDto{
    @IsNotEmpty()
    id: string;
    @IsNotEmpty()
    email: string;
    @IsNotEmpty()
    firstName: string;
    @IsOptional()
    lastName: string;
    @IsOptional()
    picture: string;
    @IsNotEmpty()
    accessToken: string;
}