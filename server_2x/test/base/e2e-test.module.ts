import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {TestProviders} from "./test.provider";


@Module({
    imports: [
        TypeOrmModule.forRoot({
                type: 'mongodb',
                useUnifiedTopology: true,
                port: 27017,
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