import {Test, TestingModule} from '@nestjs/testing';
import {ClientConnectionsState} from "./client-connections.state";
import {OctoPrintClientService} from "../services/octoprint-client.service";
import {HttpService} from "@nestjs/common";
import {of} from "rxjs";
import {ConnectionParamsModel} from "../models/connection-params.model";

describe(ClientConnectionsState.name, () => {
    let service: ClientConnectionsState;

    const testParams = {
        printerKey: "TESTTESTTESTTESTTESTTESTTESTTEST",
        printerURL: "http://notexistedyet"
    };
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

    it('can call init with defaulting state resulting', async () => {
        await service.initState(testParams);
        const clientConnectionState = service.getState();
        expect(clientConnectionState).toBeTruthy();
        expect(clientConnectionState.websocketConnected).toEqual(null);
        expect(clientConnectionState.apiKeyValid).toEqual(true);
    });

    it('cannot call init again without error', async () => {
        await service.initState(testParams);
        await expect(service.initState(testParams)).rejects.toThrow("Can't initialize already known state.");
    });

    it('improper apiKey will show up as invalid state', async () => {
        const illegalTestParams = new ConnectionParamsModel("WAYTOOSHORT", "http://notexistedyet");
        await service.initState(illegalTestParams);
        expect(service.getState().apiKeyValid).toEqual(false);
    });

    it('anonymous type will not fail validation', async () => {
        const illegalTestParams = {
            printerKey: "TESTTEST123ESTTESTTESTTESTTEST",
            printerURL: "http://notexistedyet"
        };
        await service.initState(illegalTestParams);
        expect(service.getState().apiKeyValid).toEqual(true);
    });

    it('should get frozen state', async () => {
        await service.initState(testParams);
        const frozenState = service.getState();
        expect(Object.isFrozen(frozenState)).toBe(true);
    });
});
