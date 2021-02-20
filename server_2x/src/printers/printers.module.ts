import {Module} from "@nestjs/common";
import {PrintersController} from "./controllers/printers.controller";
import {PrintersService} from "./services/printers.service";
import {Printer} from "./entities/printer.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import {PrintersMvcController} from "./controllers/printers-mvc.controller";
import {SettingsModule} from "../settings/settings.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Printer]),
        SettingsModule
    ],
    providers: [
        PrintersService
    ],
    exports: [
        PrintersService
    ],
    controllers: [
        PrintersController,
        PrintersMvcController
    ]
})
export class PrintersModule {
    constructor() {
    }
}