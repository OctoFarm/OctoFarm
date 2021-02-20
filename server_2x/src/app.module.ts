import {Logger, Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {ConfigModule} from "@nestjs/config";
import {PrintersModule} from "./printers/printers.module";
import {UsersModule} from "./users/users.module";
import {AuthModule} from "./auth/auth.module";
import {CryptoModule} from "./crypto/crypto.module";
import {APP_FILTER} from "@nestjs/core";
import {ExceptionsLoggerFilter} from "./providers/exception.filters";
import {ApiModule} from './api/api.module';
import {MigrationsModule} from "./migrations/migrations.module";
import {BootController} from "./boot/boot.controller";
import {SettingsModule} from "./settings/settings.module";
import {DashboardModule} from "./dashboard/dashboard.module";

@Module({
    providers: [
        {
            provide: APP_FILTER,
            useClass: ExceptionsLoggerFilter,
        },
    ],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [".env", ".env.development", ".env.production"],
        }),
        PrintersModule,
        SettingsModule,
        UsersModule,
        DashboardModule,
        ApiModule,
        AuthModule,
        CryptoModule,
        TypeOrmModule.forRoot(),
        MigrationsModule,
    ],
    controllers: [BootController]
})
export class AppModule {
    private readonly logger = new Logger(AppModule.name);
}
