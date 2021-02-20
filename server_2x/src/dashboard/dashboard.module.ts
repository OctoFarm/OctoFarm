import {Module} from "@nestjs/common";
import {PrintersModule} from "../printers/printers.module";
import {DashboardMvcController} from "./controller/dashboard-mvc.controller";
import {SettingsModule} from "../settings/settings.module";

@Module({
    imports: [
        PrintersModule,
        SettingsModule
    ],
    controllers: [DashboardMvcController]
})
export class DashboardModule {

}