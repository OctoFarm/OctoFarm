import {Controller, Get} from "@nestjs/common";
import {HealthCheck, HealthCheckService, TypeOrmHealthIndicator} from "@nestjs/terminus";
import {Public} from "../../utils/auth.decorators";

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
    ) {
    }

    @Get()
    @Public()
    @HealthCheck()
    readiness() {
        return this.health.check([
            async () => this.db.pingCheck('database', {timeout: 300}),
        ]);
    }
}