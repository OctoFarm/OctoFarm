import {Controller, Get, Inject, Req, Res, Sse} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {Public} from "../../utils/auth.decorators";
import {ClientSettingsService} from "../../settings/services/client-settings.service";
import {PrintersService} from "../../printers/services/printers.service";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {prettyHelpers} from "../js/pretty";
import {interval, Observable} from "rxjs";
import {map} from "rxjs/operators";
import {ConfigType} from "@nestjs/config";
import {DashboardConfig} from "../dashboard.config";
import {DashboardSseMessageDto} from "../dto/sse-message.dto";
import {stringify} from "flatted";

@Controller("dashboard")
@ApiTags(DashboardMvcController.name)
export class DashboardMvcController {
    constructor(
        private clientSettingsService: ClientSettingsService,
        private serverSettingsService: ServerSettingsService,
        private printersService: PrintersService,
        @Inject(DashboardConfig.KEY) private dashboardOptions: ConfigType<typeof DashboardConfig>,
    ) {
    }

    @Sse("update-sse")
    @Public()
    async updateDashboard(): Promise<Observable<string | DashboardSseMessageDto>> {
        // const currentOperations = await PrinterClean.returnCurrentOperations();
        // const dashStatistics = await PrinterClean.returnDashboardStatistics();
        // const printerInformation = await PrinterClean.returnPrintersInformation();
        const clientSettings = await this.clientSettingsService.getOrAddDashboardSettings();

        return interval(1000)
            .pipe(
                map(_ => {
                        return stringify({
                            printerInformation: null,
                            currentOperations: null,
                            dashStatistic: null,
                            dashboardSettings: clientSettings.dashboard,
                        });
                    }
                )
            );
    }

    @Get()
    @Public()
    async getDashboard(@Req() req, @Res() res) {
        const dashboardSettings = await this.clientSettingsService.getOrAddDashboardSettings();
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        const printers = await this.printersService.list();

        // NotExpectedYet oi mate it's all you's 'ere!
        // const dashStatistics = await PrinterClean.returnDashboardStatistics();

        let user = null;
        let group = null;
        if (serverSettings.server.loginRequired === false) {
            user = "No User";
            group = "Administrator";
        } else {
            user = req.user?.name;
            group = req.user?.group;
        }

        res.render("dashboard", {
            name: user,
            userGroup: group,
            version: process.env.npm_package_version,
            printerCount: printers.length,
            page: "Dashboard",
            helpers: prettyHelpers,
            dashboardSettings: dashboardSettings,
            // dashboardStatistics: dashStatistics,
        });
    }
}