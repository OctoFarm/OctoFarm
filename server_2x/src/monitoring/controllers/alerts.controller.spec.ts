import {Test, TestingModule} from '@nestjs/testing';
import {AlertsController} from "./alerts.controller";

describe(AlertsController.name, () => {
    let controller: AlertsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AlertsController],
        }).compile();

        controller = module.get<AlertsController>(AlertsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
