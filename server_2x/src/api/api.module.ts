import {Module} from '@nestjs/common';
import {ApiService} from './api.service';
import {ApiController} from './api.controller';
import {HealthController} from "./controllers/health-check.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TerminusModule} from "@nestjs/terminus";

@Module({
    imports: [
        TypeOrmModule.forRoot(),
        TerminusModule
    ],
    controllers: [ApiController, HealthController],
    providers: [ApiService]
})
export class ApiModule {
}
