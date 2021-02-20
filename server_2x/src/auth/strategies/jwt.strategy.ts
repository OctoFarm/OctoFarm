import {ExtractJwt, Strategy} from 'passport-jwt';
import {PassportStrategy} from '@nestjs/passport';
import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtOptions} from "../interfaces/jwt-options.model";
import {AuthService} from "../services/auth.service";
import {UserPayload} from "../interfaces/user-payload.model";
import {AuthConfiguration} from "../auth.configuration";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly authService: AuthService,
        @Inject(AuthConfiguration.KEY) jwtOptions: JwtOptions,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtOptions.secret,
        });
    }

    async validate(payload: UserPayload, done: Function) {
        const user = await this.authService.validateTokenClaims(payload);
        if (!user) {
            return done(new UnauthorizedException(), false);
        }
        done(null, user);
    }
}