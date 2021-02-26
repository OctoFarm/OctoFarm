import {OctoPrintClientService} from "../services/octoprint-client.service";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import {ClientConnectionStateModel} from "../models/client-connection-state.model";
import {ConnectionParamsModel} from "../models/connection-params.model";
import {Injectable} from "@nestjs/common";
import {validate} from "class-validator";

@Injectable()
export class ClientConnectionsState {
    public static defaultState: ClientConnectionStateModel = {
        apiKeyValid: null,
        apiKeyAccepted: null,
        apiKeyIsGlobal: null,
        corsEnabled: null,
        userHasRequiredRoles: null,
        websocketConnected: null,
        websocketHealthy: null
    };
    private connectionParams: ConnectionParamsModel;
    private state: ClientConnectionStateModel;

    constructor(
        private octoPrintClientService: OctoPrintClientService
    ) {
    }

    public async initState(connectionParams: ConnectionParamsModel) {
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

        const settings = await this.octoPrintClientService.getSettings(this.connectionParams).toPromise();
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

        const currentUser = await this.octoPrintClientService.getCurrentUser(this.connectionParams).toPromise();
        console.warn(currentUser);
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
            && this.state.userHasRequiredRoles;
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