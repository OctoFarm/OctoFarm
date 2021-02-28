import {HttpModule, Module} from '@nestjs/common';
import {OctoPrintClientService} from './services/octoprint-client.service';
import {OctoprintGateway} from './gateway/octoprint.gateway';

import {ClientConnectionsState} from "./state/client-connections.state";
import {ConnectionParams} from "./models/connection.params";
import {TEST_PRINTER_KEY, TEST_PRINTER_URL} from "./octoprint.constants";


@Module({
    imports: [HttpModule],
    providers: [
        OctoprintGateway,
        OctoPrintClientService,
        ClientConnectionsState
    ],
    exports: [
        OctoPrintClientService
    ]
})
export class OctoprintModule {
    constructor(
        private service: OctoPrintClientService,
        private clientConnectionsState: ClientConnectionsState
    ) {

    }

    async onModuleInit() {
        const testPrinterConnectionParams = this.getEnvTestPrinter();
        if (!!testPrinterConnectionParams) {
            await this.clientConnectionsState.initState(testPrinterConnectionParams);
            await this.clientConnectionsState.testClientConnection();
        }
    }

    private getEnvTestPrinter(): ConnectionParams {
        const envTestPrinterURL = process.env[TEST_PRINTER_URL];
        const envTestPrinterKey = process.env[TEST_PRINTER_KEY];
        if (!!envTestPrinterURL && !!envTestPrinterKey) {
            return new ConnectionParams(envTestPrinterURL, envTestPrinterKey);
        } else return null;
    }
}
