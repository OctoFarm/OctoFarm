import {Controller, Get, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {settings} from "cluster";
import {Public} from "../../auth/decorators/auth.decorators";
import {UsersService} from "../services/users.service";

@Controller("users")
@ApiTags(UsersMvcController.name)
export class UsersMvcController {
    constructor(
        private serverSettingsService: ServerSettingsService,
        private usersService: UsersService
    ) {
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    @Public()
    @Get("login")
    async login(@Res() res) {
        const settings = await this.serverSettingsService.findFirstOrAdd();
        /* OLD FILE server_src/routes/users.js*/
        res.render("login", {
            page: "Login",
            registration: settings.server.registration,
            serverSettings: settings,
        });
    }

    @Public()
    @Get("register")
    async register(@Res() res) {
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        if (serverSettings?.server?.registration === true) {
            const userCount = await this.usersService.getUserCount();
            res.render("register", {
                page: "Register",
                serverSettings: settings,
                userCount
            });
        }
    }
}