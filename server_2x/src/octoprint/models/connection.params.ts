import {IsAlphanumeric, IsNotEmpty, Length, validate} from "class-validator";
import {ApiKeyLengthMinimumDefault} from "../../printers/printers.config";

export class ConnectionParams {
    @IsNotEmpty()
    printerURL: string;

    @Length(ApiKeyLengthMinimumDefault)
    @IsAlphanumeric()
    printerKey: string;

    constructor(printerURL, printerKey) {
        this.printerURL = printerURL;
        this.printerKey = printerKey;
    }

    // This make sure we cant pass interface types - dont remove
    async validateParams() {
        return await validate(this);
    }
}