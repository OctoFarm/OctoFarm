import {Controller, Get, Post, Req, Res} from "@nestjs/common";
import {ApiTags} from "@nestjs/swagger";
import {PrintersService} from "../services/printers.service";
import {Public} from "../../auth/decorators/auth.decorators";
import {ServerSettingsService} from "../../settings/services/server-settings.service";
import {prettyHelpers} from "../../dashboard/js/pretty";

@Controller("printers")
@ApiTags(PrintersMvcController.name)
export class PrintersMvcController {
    constructor(
        private printersService: PrintersService,
        private serverSettingsService: ServerSettingsService
    ) {
    }

    // ======= LEGACY MVC ENDPOINTS BELOW - PHASED OUT SOON ======
    @Get()
    @Public()
    async getPrinters(@Req() req, @Res() res) {
        const printers = await this.printersService.list();
        const serverSettings = await this.serverSettingsService.findFirstOrAdd();
        let user = null;
        let group = null;
        if (serverSettings.server.loginRequired === false) {
            user = "No User";
            group = "Administrator";
        } else {
            user = req.user?.name;
            group = req.user?.group;
        }
        res.render("printerManagement", {
            name: user,
            userGroup: group,
            version: process.env.npm_package_version,
            page: "Printer Manager",
            printerCount: printers.length,
            helpers: prettyHelpers,
        });
    }

    @Post("printerInfo")
    @Public()
    async getPrinterInfo(@Req() req, @Res() res){
        // const id = req.body.i;
        //
        // const printers = await PrinterClean.returnPrintersInformation();
        // if (typeof id === "undefined" || id === null) {
        //     res.send(printers);
        // } else {
        //     const index = _.findIndex(printers, function (o) {
        //         return o._id == id;
        //     });
        //     const returnPrinter = {
        //         printerName: printers[index].printerName,
        //         apikey: printers[index].apikey,
        //         _id: printers[index]._id,
        //         printerURL: printers[index].printerURL,
        //         storage: printers[index].storage,
        //         fileList: printers[index].fileList,
        //         systemChecks: printers[index].systemChecks,
        //     };
        //     res.send(returnPrinter);
    }
}