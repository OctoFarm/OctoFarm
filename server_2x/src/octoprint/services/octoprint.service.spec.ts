import {Test, TestingModule} from '@nestjs/testing';
import {OctoPrintClientService} from './octoprint-client.service';

describe(OctoPrintClientService.name, () => {
    let service: OctoPrintClientService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OctoPrintClientService],
        }).compile();

        service = module.get<OctoPrintClientService>(OctoPrintClientService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
