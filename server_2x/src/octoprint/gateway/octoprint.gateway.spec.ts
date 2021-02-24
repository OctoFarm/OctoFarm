import {Test, TestingModule} from '@nestjs/testing';
import {OctoprintGateway} from './octoprint.gateway';
import {OctoPrintClientService} from '../services/octoprint-client.service';
import {HttpModule} from "@nestjs/common";

describe('OctoprintGateway', () => {
    let gateway: OctoprintGateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OctoprintGateway,
                OctoPrintClientService,
            ],
            imports: [
                HttpModule
            ]
        }).compile();

        gateway = module.get<OctoprintGateway>(OctoprintGateway);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
