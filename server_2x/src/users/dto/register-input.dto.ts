import {IsNotEmpty, IsString, Min, MinLength} from "class-validator";
import {Matches} from "../../utils/validations.util";
import {nameof} from "../../utils/property-reflection.util";
import {USER_CONSTANTS} from "../users.constants";

export class RegisterInputDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(USER_CONSTANTS.usernameLengthMinimum)
    username: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(USER_CONSTANTS.passwordLengthMinimum)
    password: string;

    @IsNotEmpty()
    @IsString()
    @Matches(nameof<RegisterInputDto>("password"))
    password2: string;
}