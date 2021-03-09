import {IsAlphanumeric, IsNotEmpty, validateSync} from "class-validator";

export class SessionConnectionParams {
    @IsNotEmpty()
    printerURL: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    @IsAlphanumeric()
    sessionKey: string;

    constructor(printerURL, sessionKey, username) {
        this.printerURL = printerURL;
        this.sessionKey = sessionKey;
        this.username = username;
    }

    // This make sure we cant pass interface types - dont remove
    public validateParams() {
        return validateSync(this);
    }
}