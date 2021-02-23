import {Module} from "@nestjs/common";
import {AuthService} from "./services/auth.service";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {JwtStrategy} from "./strategies/jwt.strategy";
import {AuthController} from "./controllers/auth.controller";
import {UsersModule} from "../users/users.module";
import {CryptoModule} from "../crypto/crypto.module";
import {ConfigModule} from "@nestjs/config";
import {AuthConfig, DefaultAdminPassword} from "./auth.config";
import {APP_GUARD} from "@nestjs/core";
import {JwtAuthGuard} from "./guards/jwt-auth.guard";
import {UsersService} from "../users/services/users.service";
import {GroupEnum} from "../users/types/group.enum";
import {AuthMvcController} from "./controllers/auth-mvc.controller";
import {SettingsModule} from "../settings/settings.module";

@Module({
    providers: [
        JwtStrategy,
        AuthService,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
    imports: [
        PassportModule,
        ConfigModule.forFeature(AuthConfig),
        JwtModule.registerAsync({
            useFactory: AuthConfig
        }),
        UsersModule,
        SettingsModule,
        CryptoModule
    ],
    controllers: [
        AuthController,
        AuthMvcController
    ],
    exports: [AuthService, JwtModule]
})
export class AuthModule {
    constructor(private userService: UsersService) {
    }

    async onModuleInit() {
        await this.ensureAdminUserExists();
    }

    async ensureAdminUserExists() {
        const user = await this.userService.findOne({group: GroupEnum.Admin});
        if (!user) {
            await this.userService.create({
                group: GroupEnum.Admin,
                name: "admin",
                username: "admin",
                password: DefaultAdminPassword
            });
        }
    }
}
