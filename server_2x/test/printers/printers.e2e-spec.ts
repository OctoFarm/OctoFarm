import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {PrintersModule} from "../../dist/printers/printers.module";
import {AppModule} from "../../src/app.module";

describe('PrintersController (e2e)', () => {
    let app: INestApplication;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it('/printers (GET)', () => {
        return request(app.getHttpServer())
            .get('/printers')
            .expect(200)
            .expect('Hello World!');
    });
});
