import {HttpModule, Module} from '@nestjs/common';
import {OctoPrintClientService} from './services/octoprint-client.service';
import {OctoprintGateway} from './gateway/octoprint.gateway';

import {ClientConnectionState} from "./state/client-connection.state";
import {ConnectionParamsModel} from "./models/connection-params.model";


@Module({
    imports: [HttpModule],
    providers: [
        OctoprintGateway,
        OctoPrintClientService,
        ClientConnectionState
    ]
})
export class OctoprintModule {
    constructor(
        private service: OctoPrintClientService
    ) {

    }

    onModuleInit() {
        const testPrinterConnectionParams = this.getEnvTestPrinter();
        this.service.getSettings(testPrinterConnectionParams)
            .subscribe(result => {
                testPrinterConnectionParams.printerKey
                console.warn("Global key provided", result.data.api.key === testPrinterConnectionParams.printerKey);
            });
    }

    private getEnvTestPrinter(): ConnectionParamsModel {
        const envTestPrinterURL = process.env["TEST_PRINTER_URL"];
        const envTestPrinterKey = process.env["TEST_PRINTER_KEY"];
        if (!!envTestPrinterURL && !!envTestPrinterKey) {
            return {
                printerURL: envTestPrinterURL,
                printerKey: envTestPrinterKey
            }
        } else return null;
    }
}
