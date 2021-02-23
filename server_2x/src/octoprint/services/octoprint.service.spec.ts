import {Test, TestingModule} from '@nestjs/testing';
import {OctoprintService} from './octoprint.service';

describe(OctoprintService.name, () => {
    let service: OctoprintService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [OctoprintService],
        }).compile();

        service = module.get<OctoprintService>(OctoprintService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
