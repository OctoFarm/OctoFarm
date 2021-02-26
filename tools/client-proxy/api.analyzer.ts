// This is meant to become a tool for converting an API to a Typescript set of models
// Do note how it is limited to the roles and plugins installed on OctoPrint, but that can be corrected easily.

// import * as fs from "fs";
// import {transform} from 'json-to-typescript';
// Transform the response to a model in TypeScript
// console.warn(result.status, 'Writing file to proxy folder.');
// fs.writeFileSync("src/octoprint/proxy/op-response-output.json", JSON.stringify(result.data, null, 2));
// transform('OctoPrintSettingsDto', result.data)
//     .then(transformation => {
//         fs.writeFileSync("src/octoprint/proxy/op-response.schema.ts", transformation);
//     });