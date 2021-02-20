import {IsEnum, IsNotEmpty, validate} from "class-validator";
import {GroupEnum} from "../types/group.enum";
import {ValidationException} from "../../providers/validation.exception";

export class CreateUserDto {
    name: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    @IsEnum(GroupEnum)
    group: GroupEnum = GroupEnum.User;
}
