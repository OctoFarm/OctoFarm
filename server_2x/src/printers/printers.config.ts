import {registerAs} from "@nestjs/config";
import {PrintersConfigurationModel} from "./models/printers-configuration.model";

export const PRINTERS_OPTIONS = 'PRINTERS_MODULE_OPTIONS';
export const PRINTERS_UPDATE_PERIOD = 'PRINTERS_UPDATE_PERIOD';

export const PrintersConfig = registerAs(PRINTERS_OPTIONS, (): PrintersConfigurationModel => {
    const updateEventStreamPeriod = parseInt(process.env[PRINTERS_UPDATE_PERIOD], 10) || 1000;
    return {
        updateEventStreamPeriod
    }
});