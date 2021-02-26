import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";
import {ConnectionParamsModel} from "../models/connection-params.model";
import {map} from "rxjs/operators";
import {AxiosRequestConfig} from "axios";

@Injectable()
export class OctoPrintClientService {
    constructor(
        private httpService: HttpService
    ) {
    }

    getSettings(params: ConnectionParamsModel): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        return this.connectWithParams<OctoPrintSettingsDto>(params, "GET", url)
            .pipe(
                map(result => result.data)
            );
    }

    getCurrentUser(params: ConnectionParamsModel): Observable<any> {
        this.checkConnectionParams(params);

        const url = new URL('api/currentuser', params.printerURL).toString();
        return this.connectWithParams<any>(params, "GET", url);
    }

    setCORSEnabled(params: ConnectionParamsModel): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        const data = {
            "api": {
                "allowCrossOrigin": true
            }
        };
        return this.connectWithParams<OctoPrintSettingsDto>(params, "POST", url, data)
            .pipe(
                map(result => result.data)
            );
    }

    protected connectWithParams<R>(params: ConnectionParamsModel, method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: any) {
        const connectionConfig: AxiosRequestConfig = {
            headers: {
                "x-api-key": params.printerKey
            }
        };
        console.log(method, connectionConfig, url);
        switch (method) {
            case "GET":
                return this.httpService.get<R>(url, connectionConfig);
            case "POST":
                return this.httpService.post<R>(url, body, connectionConfig);
            case "PUT":
                return this.httpService.delete<R>(url, connectionConfig);
            case "DELETE":
                return this.httpService.delete<R>(url, connectionConfig);
        }
    }

    private checkConnectionParams(connectionParams: ConnectionParamsModel) {
        if (!connectionParams.printerURL) {
            throw Error("Can't connect to printer without URL");
        }
        if (!connectionParams.printerKey) {
            throw Error("Can't connect to printer without printer API Key");
        }
    }
}
