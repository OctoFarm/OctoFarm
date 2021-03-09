import {HttpModule, Inject, Module} from '@nestjs/common';
import {OctoPrintClientService} from './services/octoprint-client.service';

import {ClientConnectionsState} from "./state/client-connections.state";
import {ConfigModule, ConfigType} from "@nestjs/config";
import {OctoPrintConfig} from "./octoprint.config";


@Module({
    imports: [
        HttpModule,
        ConfigModule.forFeature(OctoPrintConfig),
    ],
    providers: [
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
        private clientConnectionsState: ClientConnectionsState,
        @Inject(OctoPrintConfig.KEY) private testPrinterConnectionParams: ConfigType<typeof OctoPrintConfig>,
    ) {
    }

    async onModuleInit() {
        if (!!this.testPrinterConnectionParams) {
            await this.clientConnectionsState.initState(this.testPrinterConnectionParams);
            await this.clientConnectionsState.testClientConnection();
        }
    }
}
