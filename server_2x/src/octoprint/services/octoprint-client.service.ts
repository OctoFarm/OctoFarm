import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {AxiosResponse} from "axios";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";

@Injectable()
export class OctoPrintClientService {
    constructor(
        private httpService: HttpService
    ) {


    }

    getSettings(printerURL: string, apiKey: string): Observable<AxiosResponse<OctoPrintSettingsDto>> {
        return this.httpService.get<OctoPrintSettingsDto>(new URL('api/settings', printerURL).toString(), {
            headers: {
                "x-api-key": apiKey
            }
        });
    }

    setCORSEnabled(printerURL: string, apiKey: string): Observable<AxiosResponse<OctoPrintSettingsDto>> {
        return this.httpService.post<OctoPrintSettingsDto>(new URL('api/settings', printerURL).toString(),
            {
                "api": {
                    "allowCrossOrigin": true
                }
            }, {
                headers: [{
                    "x-api-key": apiKey
                }]
            });
    }
}
