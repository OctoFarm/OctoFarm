import {Test, TestingModule} from '@nestjs/testing';
import {MonitoringController} from './monitoring.controller';
import {MonitoringService} from '../services/monitoring.service';

describe(MonitoringController.name, () => {
    let controller: MonitoringController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MonitoringController],
            providers: [MonitoringService],
        }).compile();

        controller = module.get<MonitoringController>(MonitoringController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
