import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {AxiosResponse} from "axios";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";
import {ConnectionParamsModel} from "../models/connection-params.model";

@Injectable()
export class OctoPrintClientService {
    constructor(
        private httpService: HttpService
    ) {
    }

    private checkConnectionParams(connectionParams: ConnectionParamsModel) {
        if (!connectionParams.printerURL) {
            throw Error("Can't connect to printer without URL");
        }
        if (!connectionParams.printerKey) {
            throw Error("Can't connect to printer without printer API Key");
        }
    }

    getSettings(connectionParams: ConnectionParamsModel): Observable<AxiosResponse<OctoPrintSettingsDto>> {
        this.checkConnectionParams(connectionParams);

        return this.httpService.get<OctoPrintSettingsDto>(new URL('api/settings', connectionParams.printerURL).toString(), {
            headers: {
                "x-api-key": connectionParams.printerKey
            }
        });
    }

    setCORSEnabled(params: ConnectionParamsModel): Observable<AxiosResponse<OctoPrintSettingsDto>> {
        this.checkConnectionParams(params);

        return this.httpService.post<OctoPrintSettingsDto>(new URL('api/settings', params.printerURL).toString(),
            {
                "api": {
                    "allowCrossOrigin": true
                }
            }, {
                headers: [{
                    "x-api-key": params.printerKey
                }]
            });
    }
}
