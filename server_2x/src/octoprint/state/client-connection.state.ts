// We will assume for brevity that this state belongs to one specific printer
// It is therefore already reduced for simplicity
import {OctoPrintClientService} from "../services/octoprint-client.service";
import {tap} from "rxjs/operators";
import {Observable} from "rxjs";
import {ClientConnectionStateModel} from "../models/client-connection-state.model";
import {ConnectionParamsModel} from "../models/connection-params.model";

export class ClientConnectionState {
    public static defaultState: ClientConnectionStateModel = {
        apiKeyAccepted: false,
        apiKeyIsGlobal: false,
        apiKeyProvided: false,
        apiKeyValid: false,
        corsEnabled: false,
        userHasRequiredRoles: false,
        websocketConnected: false,
        websocketHealthy: false
        // Defaults
    };
    private state: ClientConnectionStateModel;

    constructor(
        private octoPrintClientService: OctoPrintClientService
    ) {
    }

    initState() {
        if (!this.state) {
            this.state = {...ClientConnectionState.defaultState};
        } else {
            throw Error("Can't initialize already known state.");
        }
    }

    getState() {
        return Object.freeze(this.state); // Reduce
    }

    isApiKeyStateAccepted() {
        return !!this.state ||
            this.state.apiKeyProvided
            && this.state.apiKeyAccepted
            && this.state.apiKeyIsGlobal === false;
    }

    userHasRequiredRoles() {
        // Alternatively we could scan the permissions, but that's much more work.
        return !!this.state ||
            this.state.apiKeyAccepted
            && this.state.userHasRequiredRoles;
    }

    setCorsEnabled(params: ConnectionParamsModel): Observable<any> {
        if (this.userHasRequiredRoles()) {
            return this.octoPrintClientService
                .setCORSEnabled(params)
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