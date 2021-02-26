import {IsAlphanumeric, IsNotEmpty, Length} from "class-validator";
import {ApiKeyLengthMinimumDefault} from "../../printers/printers.config";

export class ConnectionParamsModel {
    @IsNotEmpty()
    printerURL: string;

    @Length(ApiKeyLengthMinimumDefault)
    @IsAlphanumeric()
    printerKey: string;
}