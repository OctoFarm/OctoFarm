import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ServerSettings} from "./entities/server-settings.entity";
import {ClientSettings} from "./entities/client-settings.entity";
import {ClientSettingsService} from "./services/client-settings.service";
import {ServerSettingsService} from "./services/server-settings.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([ServerSettings, ClientSettings])
    ],
    // ClientSettingsService goes through API I guess?
    // controllers: [ClientSettingsController]
    providers: [ClientSettingsService, ServerSettingsService],
    exports: [ServerSettingsService, ClientSettingsService]
})
export class SettingsModule {

}