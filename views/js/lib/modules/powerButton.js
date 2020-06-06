import OctoPrintClient from "../octoprint.js";

export default class PowerButton {
    static returnPowerBtn(printer){
        let powerBtn = `
             <button title="Toggle your printers power"
                                    id="printerPower-${printer._id}"
                                    class="btn btn-outline-danger btn-sm" type="button" disabled>
                                <i id="printerStatus-${printer._id}" class="fas fa-power-off" style="color: black;"></i>
                            </button>
                            <button title="Other power actions" type="button" class="btn btn-sm btn-outline-danger dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                <span class="sr-only">Toggle Dropdown</span>
                            </button>
                            <div class="dropdown-menu text-center dropdown-menu-right">
                                  <a id="printerPowerOn-${printer._id}" title="Turn on your printer" class="dropdown-item d-none" href="#"><i class="textComplete fas fa-power-off"></i> Power On Printer</a>
                                <a id="printerPowerOff-${printer._id}" title="Turn off your printer" class="dropdown-item d-none" href="#"><i class="textOffline fas fa-power-off"></i> Power Off Printer</a>
                          
                                <div id="printerDropDownMaker-${printer._id}" class="dropdown-divider d-none"></div>
                                <a id="printerRestartOctoPrint-${printer._id}" title="Restart OctoPrint Service" class="dropdown-item d-none" href="#"><i class="textActive fas fa-redo"></i> Restart OctoPrint</a>
                                <a id="printerRestartHost-${printer._id}" title="Reboot OctoPrint Host" class="dropdown-item d-none" href="#"><i class="textActive fas fa-sync-alt"></i> Reboot Host</a>
                                <a id="printerShutdownHost-${printer._id}" title="Shutdown OctoPrint Host" class="dropdown-item d-none" href="#"><i class="textOffline fas fa-power-off"></i> Shutdown Host</a>
                            </div>
            `
        return powerBtn
    }
    static async applyBtn(printer) {
        if (typeof printer.settingsServer !== 'undefined' && !document.getElementById("printerPower-" + printer._id)) {
            if (printer.settingsServer.commands.serverRestartCommand !== "" || printer.settingsServer.commands.systemRestartCommand !== "" || printer.settingsServer.commands.systemShutdownCommand !== "") {
                document.getElementById("powerBtn-" + printer._id).innerHTML = PowerButton.returnPowerBtn(printer);
                if (printer.settingsServer.commands.serverRestartCommand !== "") {
                    let restartOctoPrint = document.getElementById("printerRestartOctoPrint-" + printer._id)
                    restartOctoPrint.classList.remove("d-none")
                    restartOctoPrint.addEventListener('click', event => {
                        OctoPrintClient.system(printer, "restart");

                    });
                }
                if (printer.settingsServer.commands.systemRestartCommand !== "") {
                    let restartHost = document.getElementById("printerRestartHost-" + printer._id)
                    restartHost.classList.remove("d-none");
                    restartHost.addEventListener('click', event => {
                        OctoPrintClient.system(printer, "reboot");
                    });
                }

                if (printer.settingsServer.commands.systemShutdownCommand !== "") {
                    let shutdownHost = document.getElementById("printerShutdownHost-" + printer._id)
                    shutdownHost.classList.remove("d-none");
                    shutdownHost.addEventListener('click', event => {
                        OctoPrintClient.system(printer, "shutdown");
                    });
                }
            }

        }
        if (printer.powerSettings !== null) {
            if (!document.getElementById("printerPower-" + printer._id)) {
                if(document.getElementById("powerBtn-"+ printer._id)){
                    document.getElementById("powerBtn-" + printer._id).innerHTML = PowerButton.returnPowerBtn(printer);
                    PowerButton.powerButtons(printer);
                }

            }else{
                PowerButton.powerButtons(printer);
            }
        }
    }
    static async powerButtons(printer) {
        let divider = document.getElementById("printerDropDownMaker-" + printer._id)
        if (printer.powerSettings.powerOffURL !== "") {
            if (divider.classList.contains("d-none")) {
                divider.classList.remove("d-none")
            }
            let powerOffPrinter = document.getElementById("printerPowerOff-" + printer._id)
            if (powerOffPrinter.classList.contains("d-none")) {
                powerOffPrinter.classList.remove("d-none");
                powerOffPrinter.addEventListener('click', async event => {
                    await OctoPrintClient.power(printer, printer.powerSettings.powerOffURL, "Power Off", printer.powerSettings.powerOffCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                });
            }

        }
        if (printer.powerSettings.powerOnURL !== "") {
            if (divider.classList.contains("d-none")) {
                divider.classList.remove("d-none")
            }
            let powerOnnPrinter = document.getElementById("printerPowerOn-" + printer._id)
            if (powerOnnPrinter.classList.contains("d-none")) {
                powerOnnPrinter.classList.remove("d-none");
                powerOnnPrinter.addEventListener('click', async event => {
                    await OctoPrintClient.power(printer, printer.powerSettings.powerOnURL, "Power On", printer.powerSettings.powerOnCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                    await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                });
            }
        }
        if (printer.powerSettings.powerStatusURL !== "") {
            if (divider.classList.contains("d-none")) {
                divider.classList.remove("d-none")
            }
            let status = await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand)
        }
        if (printer.powerSettings.powerToggleURL !== "") {
            if (divider.classList.contains("d-none")) {
                divider.classList.remove("d-none")
            }
            let powerTogglePrinter = document.getElementById("printerPower-" + printer._id)
            if(powerTogglePrinter){
                if (powerTogglePrinter.disabled === true) {
                    powerTogglePrinter.disabled = false;
                    powerTogglePrinter.addEventListener('click', async event => {
                        let status = await OctoPrintClient.power(printer, printer.powerSettings.powerToggleURL, "Power Toggle", printer.powerSettings.powerToggleCommand);
                        await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                        await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                        await OctoPrintClient.getPowerStatus(printer, printer.powerSettings.powerStatusURL, printer.powerSettings.powerStatusCommand);
                    });
                }
            }

        }
    }
}