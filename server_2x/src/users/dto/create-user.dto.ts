import {IsEnum, IsNotEmpty, IsString, MinLength} from "class-validator";
import {GroupEnum} from "../types/group.enum";
import {USER_CONSTANTS} from "../users.constants";

export class CreateUserDto {
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
    @IsEnum(GroupEnum)
    group: GroupEnum = GroupEnum.User;
}
