// This is meant to become a tool for converting an API to a Typescript set of models
// Do note how it is limited to the roles and plugins installed on OctoPrint, but that can be corrected easily.

import * as fs from "fs";
import {transform} from 'json-to-typescript';
import {HttpService, Injectable} from "@nestjs/common";
import {ConnectionParamsModel} from "../../src/octoprint/models/connection-params.model";
import {TEST_PRINTER_KEY, TEST_PRINTER_URL} from "../../src/octoprint/octoprint.constants";
import {OctoPrintClientService} from "../../src/octoprint/services/octoprint-client.service";
import * as path from "path";
import {Observable} from "rxjs";

@Injectable()
export class ProxyApiGeneratorService {
    private outputFolder: string;

    constructor(
        private httpService: HttpService,
        private octoprint: OctoPrintClientService
    ) {
    }

    getEnvSettings(): ConnectionParamsModel {
        return {
            printerURL: process.env[TEST_PRINTER_URL],
            printerKey: process.env[TEST_PRINTER_KEY]
        }
    }

    async generateSchemas(folder: string) {
        console.log("CWD: ", process.cwd());
        console.warn('Writing files to folder', folder);
        const params = this.getEnvSettings();

        this.outputFolder = path.join(folder, "temp");
        this.generateOutputFolder();

        await this.generateSchema(
            this.octoprint.getSettings(params),
            "octoprint-settings.dto.ts",
            "OctoPrintSettingsDto"
        );

        await this.generateSchema(
            this.octoprint.getCurrentUser(params),
            "octoprint-currentuser.dto.ts",
            "OctoPrintCurrentUserDto"
        );
    }

    generateSchema(callable$: Observable<any>, tsName: string, interfaceName: string) {
        return callable$.toPromise().then(result => {
            // We dont output json
            // const schemaJson = path.join(this.outputFolder, jsonName || "temp-response.json");
            // fs.writeFileSync(schemaJson, JSON.stringify(result, null, 2));

            const schemaDtoFile = path.join(this.outputFolder, tsName);
            transform(interfaceName, result)
                .then(transformation => {
                    fs.writeFileSync(schemaDtoFile, transformation);
                });
        });
    }

    private generateOutputFolder() {
        if (!fs.existsSync(this.outputFolder)) {
            console.warn("Creating folder", path.resolve(this.outputFolder));
            fs.mkdirSync(this.outputFolder, {recursive: true});
        }
    }
}