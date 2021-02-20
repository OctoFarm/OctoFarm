import {Provider} from "@nestjs/common";
import {AuthConfiguration} from "../../src/auth/auth.configuration";
import {JwtOptions} from "../../src/auth/interfaces/jwt-options.model";

export const TestProviders: Provider<any>[] = [
    {
        provide: AuthConfiguration.KEY,
        useValue: {
            secret: 'TotallySafeTest',
            expiresIn: 120
        } as JwtOptions
    }
]