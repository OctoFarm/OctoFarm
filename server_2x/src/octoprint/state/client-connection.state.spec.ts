import {Test, TestingModule} from '@nestjs/testing';
import {ClientConnectionsState} from "./client-connections.state";
import {OctoPrintClientService} from "../services/octoprint-client.service";
import {HttpService} from "@nestjs/common";
import {of} from "rxjs";

describe(ClientConnectionsState.name, () => {
    let service: ClientConnectionsState;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ClientConnectionsState,
                OctoPrintClientService,
                {
                    provide: HttpService,
                    useValue: {
                        get: () => {
                            return of(null);
                        }
                    }
                }
            ]
        }).compile();

        service = module.get<ClientConnectionsState>(ClientConnectionsState);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('can call init with defaulting state resulting', () => {
        service.initState();
        const clientConnectionState = service.getState();
        expect(clientConnectionState).toBeTruthy();
        expect(clientConnectionState.websocketConnected).toEqual(false);
        expect(clientConnectionState).toEqual(ClientConnectionsState.defaultState);
    });

    it('cannot call init again without error', () => {
        service.initState();
        expect(() => service.initState()).toThrowError("Can't initialize already known state.");
    });

    it('should get frozen state', () => {
        service.initState();
        const frozenState = service.getState();
        expect(Object.isFrozen(frozenState)).toBe(true);
    });
});
