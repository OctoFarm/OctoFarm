import {OctoPrintClientService} from "../services/octoprint-client.service";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import {ClientConnectionStateModel} from "../models/client-connection-state.model";
import {ConnectionParams} from "../models/connection.params";
import {Injectable, Logger} from "@nestjs/common";
import {validate} from "class-validator";
import {AxiosError} from "axios";
import HttpStatusCode from "../../utils/http-status-codes.enum";
import {OctoprintGroupType} from "../types/octoprint-group.type";

@Injectable()
export class ClientConnectionsState {
    public static defaultState: ClientConnectionStateModel = {
        apiKeyValid: null,
        apiKeyAccepted: null,
        apiKeyIsGlobal: null,
        corsEnabled: null,
        userHasRequiredGroups: null,
        apiConnected: null,
        websocketConnected: null,
        websocketHealthy: null
    };
    private connectionParams: ConnectionParams;
    private state: ClientConnectionStateModel;
    private logger = new Logger(ClientConnectionsState.name);

    constructor(
        private octoPrintClientService: OctoPrintClientService
    ) {
    }

    public async initState(connectionParams: ConnectionParams) {
        if (!this.state) {
            this.state = {...ClientConnectionsState.defaultState};
            this.connectionParams = connectionParams;
            await this.validateConnectionParams();
        } else {
            throw Error("Can't initialize already known state.");
        }
    }

    public async testClientConnection() {
        if (!this.state) {
            throw new Error("Call initState(connectionParams) before testing the client connection.");
        }

        const jsonParams = JSON.stringify(this.connectionParams);
        await this.octoPrintClientService.getSettings(this.connectionParams)
            .subscribe(
                async settings => {
                    if (!settings.api)
                        throw new Error("Client settings response did not contain the api section. Cant validate client connection.");

                    this.patchState({
                        apiKeyAccepted: true
                    });

                    const apiKey = settings.api.key;
                    if (apiKey === undefined)
                        throw new Error("Client settings api:apiKey was not found. Cant test connection. Aborting.");
                    this.validateKeyIsNotGlobalKey(apiKey);

                    const corsEnabled = settings.api.allowCrossOrigin;
                    if (corsEnabled === undefined)
                        throw new Error("Client settings api:allowCrossOrigin was not found. Cant test connection. Aborting.");
                    this.patchState({
                        corsEnabled
                    });

                    const currentUser = await this.octoPrintClientService.getCurrentUser(this.connectionParams).toPromise()
                    const userFulfillsRequiredGroups = currentUser.groups.includes(OctoprintGroupType.ADMIN.toString())
                        && currentUser.groups.includes(OctoprintGroupType.USERS.toString());
                    this.patchState({
                        userHasRequiredGroups: userFulfillsRequiredGroups
                    })
                    console.warn(currentUser.groups, OctoprintGroupType.USERS.toString());

                    console.warn('state', this.getState());
                }, (error: AxiosError) => {
                    if (error.isAxiosError) {
                        if (!error?.response || error?.response.status === null || error?.response.status === undefined) {
                            this.logger.error("AxiosResponse:response field was empty or didn't contain a status code, so the error cannot be handled properly.");
                            return;
                        }

                        const status = error.response.status;
                        switch (status as HttpStatusCode) {
                            case HttpStatusCode.FORBIDDEN:
                                this.patchState({
                                    apiKeyAccepted: false
                                });
                                this.logger.error("This API key was not accepted by OctoPrint using these parameters:\n\t" + jsonParams);
                                break;
                            case HttpStatusCode.BAD_GATEWAY:
                                this.logger.error("OctoPrint return BAD_GATEWAY. Make sure it is fully started and running.\n\t"
                                    + jsonParams, error.stack);
                                break;
                            case HttpStatusCode.NOT_FOUND || HttpStatusCode.BAD_REQUEST:
                                this.logger.error("The OctoPrint API returned error (bad request or not found):\n\tCode:"
                                    + status, error.stack);
                                break;
                            default:
                                this.logger.error("OctoPrint client responded with an unknown status when using the following parameters: "
                                    + this.connectionParams, error.stack);
                                break;
                        }

                        console.warn('state', this.getState());
                    } else {
                        this.logger.error("Couldn't call the OctoPrint connector service due to internal error. " + jsonParams, error.stack);
                    }
                }
            );
    }

    public getState() {
        return Object.freeze(this.state); // Reduce
    }

    isApiKeyStateValidated() {
        return !!this.state && this.state.apiKeyValid;
    }

    isApiKeyStateAccepted() {
        return this.isApiKeyStateValidated()
            && this.state.apiKeyAccepted
            && this.state.apiKeyIsGlobal === false;
    }

    userHasRequiredRoles() {
        // Alternatively we could scan the permissions, but that's much more work.
        return this.isApiKeyStateAccepted()
            && this.state.userHasRequiredGroups;
    }

    ensureCorsEnabled(): Observable<any> {
        if (!this.connectionParams) {
            throw new Error("Cant enable CORS when connection params are not provided for instance.");
        }
        if (this.userHasRequiredRoles()) {
            return this.octoPrintClientService
                .setCORSEnabled(this.connectionParams)
                .pipe(tap(_ => {
                    this.patchState({
                        corsEnabled: true
                    });
                }, error => {
                    // Analyze the state
                    // ...
                    // Conclude how the error 'resets' the state
                    this.patchState({
                        corsEnabled: false,
                        websocketConnected: false,
                        websocketHealthy: false
                    });
                    // rethrow the error or let Promise.reject do the work
                }));
        }
    }

    private async validateConnectionParams() {
        const errors = await validate(this.connectionParams);
        this.patchState({
            apiKeyValid: errors?.length === 0
        });
    }

    private validateKeyIsNotGlobalKey(globalKey: string) {
        if (this.connectionParams.printerKey === globalKey) {
            this.patchState({
                apiKeyIsGlobal: true
            });
            throw Error("This connection has a Global API key. That's not tolerated. Please provide an OctoPrint Application Key or User API Key instead.");
        } else {
            this.patchState({
                apiKeyIsGlobal: false
            });
        }
    }

    private patchState(adjustments: Partial<ClientConnectionStateModel>) {
        const newState = {
            ...this.state,
            ...adjustments
        };

        // Calculate differences
        // ...
        // Log the action
        // ...

        // Act
        this.state = newState;
    }
}