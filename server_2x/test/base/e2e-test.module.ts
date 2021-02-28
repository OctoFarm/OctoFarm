import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TestProviders} from "./test.provider";

@Module({
    imports: [
        TypeOrmModule.forRoot({
                type: 'mongodb',
                host: '127.0.0.1',
                useUnifiedTopology: true,
                port: 27018,
                entities: ["./src/**/*.entity{.ts,.js}"],
                database: 'test',
                synchronize: true,
            }
        ),
    ],
    providers: [...TestProviders],
    exports: [
        TypeOrmModule,
        ...TestProviders
    ]
})
export class E2eTestModule {

}