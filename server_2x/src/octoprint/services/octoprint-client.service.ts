import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";
import {ConnectionParams} from "../models/connection.params";
import {map} from "rxjs/operators";
import {AxiosRequestConfig} from "axios";
import {OctoPrintCurrentUserDto} from "../dto/octoprint-currentuser.dto";

@Injectable()
export class OctoPrintClientService {
    constructor(
        private httpService: HttpService
    ) {
    }

    getSettings(params: ConnectionParams): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        return this.connectWithParams<OctoPrintSettingsDto>(params, "GET", url);
    }

    getCurrentUser(params: ConnectionParams): Observable<OctoPrintCurrentUserDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/currentuser', params.printerURL).toString();
        return this.connectWithParams<OctoPrintCurrentUserDto>(params, "GET", url);
    }

    setCORSEnabled(params: ConnectionParams): Observable<OctoPrintSettingsDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/settings', params.printerURL).toString();
        const data = {
            "api": {
                "allowCrossOrigin": true
            }
        };
        return this.connectWithParams<OctoPrintSettingsDto>(params, "POST", url, data);
    }

    protected connectWithParams<R>(params: ConnectionParams, method: "GET" | "POST" | "PUT" | "DELETE", url: string, body?: any) {
        const connectionConfig: AxiosRequestConfig = {
            headers: {
                "x-api-key": params.printerKey
            }
        };
        switch (method) {
            case "GET":
                return this.httpService.get<R>(url, connectionConfig).pipe(map(r => r.data));
            case "POST":
                return this.httpService.post<R>(url, body, connectionConfig).pipe(map(r => r.data));
            case "PUT":
                return this.httpService.delete<R>(url, connectionConfig).pipe(map(r => r.data));
            case "DELETE":
                return this.httpService.delete<R>(url, connectionConfig).pipe(map(r => r.data));
        }
    }

    private checkConnectionParams(connectionParams: ConnectionParams) {
        if (!connectionParams.printerURL) {
            throw Error("Can't connect to printer without URL");
        }
        if (!connectionParams.printerKey) {
            throw Error("Can't connect to printer without printer API Key");
        }
    }
}
