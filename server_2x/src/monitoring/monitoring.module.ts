import {Module} from '@nestjs/common';
import {MonitoringService} from './services/monitoring.service';
import {MonitoringController} from './controllers/monitoring.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Alert} from "./entities/alert.entity";
import {ErrorLog} from "./entities/error-log.entity";
import {FarmStatistics} from "./entities/farm-statistics.entity";
import {ErrorLogService} from "./services/error-log.service";
import {ErrorLogController} from "./controllers/error-log.controller";
import {FarmStatisticsService} from "./services/farm-statistics.service";
import {FarmStatisticsController} from "./controllers/farm-statistics.controller";
import {AlertsController} from "./controllers/alerts.controller";
import {AlertsService} from "./services/alerts.service";

@Module({
    imports: [TypeOrmModule.forFeature([Alert, ErrorLog, FarmStatistics])],
    controllers: [
        MonitoringController,
        ErrorLogController,
        FarmStatisticsController,
        AlertsController
    ],
    providers: [
        MonitoringService,
        ErrorLogService,
        FarmStatisticsService,
        AlertsService
    ]
})
export class MonitoringModule {
}
