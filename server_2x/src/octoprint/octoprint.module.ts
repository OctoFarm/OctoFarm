import {HttpModule, Module} from '@nestjs/common';
import {OctoPrintClientService} from './services/octoprint-client.service';
import {OctoprintGateway} from './gateway/octoprint.gateway';

import {PrinterConnectionState} from "./state/client-connection.state";


@Module({
    imports: [HttpModule],
    providers: [
        OctoprintGateway,
        OctoPrintClientService,
        PrinterConnectionState
    ]
})
export class OctoprintModule {
    constructor(
        private service: OctoPrintClientService
    ) {

    }

    onModuleInit() {
                // import * as fs from "fs";
                // import {transform} from 'json-to-typescript';
                // Transform the response to a model in TypeScript
                // console.warn(result.status, 'Writing file to proxy folder.');
                // fs.writeFileSync("src/octoprint/proxy/op-response-output.json", JSON.stringify(result.data, null, 2));
                // transform('OctoPrintSettingsDto', result.data)
                //     .then(transformation => {
                //         fs.writeFileSync("src/octoprint/proxy/op-response.schema.ts", transformation);
                //     });
    }
}
