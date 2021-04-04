import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {OctoPrintSettingsDto} from "../dto/octoprint-settings.dto";
import {ConnectionParams} from "../models/connection.params";
import {map} from "rxjs/operators";
import {AxiosRequestConfig} from "axios";
import {OctoPrintCurrentUserDto} from "../dto/octoprint-currentuser.dto";
import * as WebSocket from 'ws';
import {OctoPrintSessionDto} from "../dto/octoprint-session.dto";
import {SessionConnectionParams} from "../models/session-connection.params";
import {ConnectionMessageDto} from "../dto/websocket/connection-message.dto";
import {HistoryMessageDto} from "../dto/websocket/history-message.dto";
import {TimelapseMessageDto} from "../dto/websocket/timelapse-message.dto";
import {CurrentMessageDto} from "../dto/websocket/current-message.dto";
import {EventMessageDto} from "../dto/websocket/event-message.dto";
import {PluginMessageDto} from "../dto/websocket/plugin-message.dto";
import {OctoprintGateway} from "../../../tools/octoprint-websocket-mock/gateway/octoprint.gateway";
import {transform} from "json-to-typescript";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class OctoPrintClientService {
    private messageCount = 0;
    private knownEventTypes = [];

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

    loginUserSession(params: ConnectionParams): Observable<OctoPrintSessionDto> {
        this.checkConnectionParams(params);

        const url = new URL('api/login?passive=true', params.printerURL).toString();
        return this.connectWithParams<OctoPrintSessionDto>(params, "POST", url);
    }

    /**
     * Get an OctoPrint WebSocket client instance
     * @param {ConnectionParams} params - connection parameters
     * @param proxyGateway
     */
    getWebSocketClient(params: SessionConnectionParams, proxyGateway?: OctoprintGateway) {
        this.checkConnectionParams(params);

        const constructedURL = new URL(params.printerURL);
        const websocketURL = `ws://${constructedURL.host}/sockjs/websocket`;
        const socket = new WebSocket(websocketURL, {followRedirects: false});
        socket.onerror = (event: WebSocket.ErrorEvent) => {
            console.log('ws error', event.message);
        };
        socket.onopen = (event) => {
            socket.send(JSON.stringify({
                auth: 'prusa:' + params.sessionKey
            }), (result) => {
                if (!!result) {
                    console.log('authentication ws failed:', result);
                }
            });

            socket.send(JSON.stringify({
                throttle: 2
            }), (result) => {
                if (!!result) {
                    console.log('throttle ws failed:', result);
                }
            });
        };
        socket.onclose = () => {
            console.warn('socket closed');
        }

        socket.onmessage = async (event) => {
            const jsonMessage = JSON.parse(event.data.toString()) as
                ConnectionMessageDto
                | HistoryMessageDto
                | TimelapseMessageDto
                | CurrentMessageDto
                | EventMessageDto
                | PluginMessageDto;
            let analysedType = "";
            if (jsonMessage.connected !== undefined) {
                console.log('connection message. version:', jsonMessage.connected.version);
                analysedType = "connected";
            } else if (jsonMessage.history !== undefined) {
                console.log('history message. completion:', jsonMessage.history.progress.completion);
                analysedType = "history";
            } else if (jsonMessage.timelapse !== undefined) {
                console.log('timelapse message. timelapse:', jsonMessage.timelapse);
                analysedType = "timelapse";
            } else if (jsonMessage.current !== undefined) {
                // console.log('current message. servertime:', jsonMessage.current.serverTime);
                analysedType = "current";
            } else if (jsonMessage.event !== undefined) {
                const eventType = jsonMessage.event.type;
                if (!this.knownEventTypes.includes(eventType)) {
                    this.knownEventTypes.push(eventType);

                    const fileName = eventType.replace(/[A-Z]/g, (match, offset) => (offset > 0 ? '-' : '') + match.toLowerCase()) + ".dto.ts";

                    const dtoInterfaceName = eventType + "Dto";
                    if (!fileName || !dtoInterfaceName) {
                        console.error('Failed to process new event message! Type:', eventType, dtoInterfaceName, fileName);
                    }
                    else {
                        console.log('New event message! Type:', eventType, dtoInterfaceName, fileName);
                        this.writeDto(jsonMessage.event.payload, fileName, dtoInterfaceName);
                    }
                }
                else {
                    console.log('Known event message. type:', eventType);
                }
                analysedType = "event";
            } else if (jsonMessage.plugin !== undefined) {
                console.log('plugin message. plugin:', jsonMessage.plugin.plugin);
                analysedType = "plugin";
            } else {
                console.log('unknown message type');
            }
            if (!!proxyGateway?.handleBroadcastEvent) {
                proxyGateway.handleBroadcastEvent({
                    type: analysedType,
                    payload: jsonMessage
                });
            }
        };
        // Listen for messages
        return socket;
    }

    writeDto(dtoData: any, fileName, interfaceName) {
        // Used to generate dto's - keep
        const schemaDtoFile = path.join("./src/octoprint/dto/websocket/events/", fileName);
        transform(interfaceName, dtoData)
            .then(transformation => {
                fs.writeFileSync(schemaDtoFile, transformation);
            });
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

    private checkConnectionParams(connectionParams: ConnectionParams | SessionConnectionParams) {
        if (!connectionParams.printerURL) {
            throw Error("Can't test your printer's API without URL");
        }

        const errors = connectionParams.validateParams();
        if (errors.length > 0) {
            throw Error("Can't reach your printer's API or WebSocket without proper connection parameters. "
                + JSON.stringify(connectionParams));
        }
    }
}
