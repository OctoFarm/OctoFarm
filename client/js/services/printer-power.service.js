import { sendPowerCommandToOctoPrint } from "./octoprint/octoprint-client-commands.actions";
import UI from "../utils/ui";
import {
  canWeDetectPrintersPowerState,
  canWeRestartOctoPrint,
  canWeRestartOctoPrintHost,
  canWeShutdownOctoPrintHost,
  canWeShutdownThePrinter,
  canWeTurnOnThePrinter,
  printerIsPrinting,
} from "../utils/octofarm.utils";
import OctoPrintClient from "./octoprint/octoprint-client.service";
import OctoFarmClient from "./octofarm-client.service";

export default class PrinterPowerService {
  static async printerIsPoweredOn(printer) {
    let powerStatus = false;

    const powerReturn = await OctoPrintClient.getPowerStatus(
      printer,
      printer.powerSettings.powerStatusURL,
      printer.powerSettings.powerStatusCommand
    );

    if (!!powerReturn) {
      powerStatus = powerReturn[Object.keys(powerReturn)[0]];
      // Patches for string based state response tasmota/tplink plugins

      if(typeof powerStatus === "string"){
        if(powerStatus === "off"){
          powerStatus = false;
        }

        if(powerStatus === "on"){
          powerStatus = true;
        }
      }

    }

    await OctoFarmClient.post("/printers/overridepower/" + printer._id, { printerPowerState: powerStatus })

    return powerStatus;
  }

  static async revealPowerButtons(printer) {
    if (printer.disabled) {
      return;
    }
    const canRestartOctoPrint = canWeRestartOctoPrint(printer);
    const canRestartOctoPrintHost = canWeRestartOctoPrintHost(printer);
    const canShutdownOctoPrintHost = canWeShutdownOctoPrintHost(printer);
    const canShutdownThePrinter = canWeShutdownThePrinter(printer);
    const canPowerOnThePrinter = canWeTurnOnThePrinter(printer);
    const canDetectPowerState = canWeDetectPrintersPowerState(printer);

    const isPrinting = printerIsPrinting(printer);

    const restartOctoPrintButton = document.getElementById(
      "printerRestartOctoPrint-" + printer._id
    );
    if (canRestartOctoPrint) {
      restartOctoPrintButton.disabled = !canRestartOctoPrint;
      UI.removeDisplayNoneFromElement(restartOctoPrintButton);
    }
    const restartOctoPrintHostButton = document.getElementById(
      "printerRestartHost-" + printer._id
    );
    if (canRestartOctoPrintHost) {
      restartOctoPrintHostButton.disabled = !canRestartOctoPrintHost;
      UI.removeDisplayNoneFromElement(restartOctoPrintHostButton);
    }
    const shutdownOctoPrintHostButton = document.getElementById(
      "printerShutdownHost-" + printer._id
    );
    if (canShutdownOctoPrintHost) {
      shutdownOctoPrintHostButton.disabled = !canShutdownOctoPrintHost;
      UI.removeDisplayNoneFromElement(shutdownOctoPrintHostButton);
    }
    const shutdownPrinterButton = document.getElementById(
      "printerPowerOff-" + printer._id
    );
    const turnOnThePrinterButton = document.getElementById(
      "printerPowerOn-" + printer._id
    );

    const powerBadge = document.getElementById(`powerState-${printer._id}`);
    if (canDetectPowerState) {
      PrinterPowerService.updatePrinterPowerState(printer.printerPowerState, powerBadge);
    }

    if (canShutdownThePrinter) {
      if (!canDetectPowerState) {
        shutdownPrinterButton.disabled = isPrinting || canDetectPowerState;
      } else {
        shutdownPrinterButton.disabled =
          isPrinting || !printer.printerPowerState;
      }

      UI.removeDisplayNoneFromElement(shutdownPrinterButton);
    }

    if (canPowerOnThePrinter) {
      if (!canDetectPowerState) {
        turnOnThePrinterButton.disabled = isPrinting || canDetectPowerState;
      } else {
        turnOnThePrinterButton.disabled =
          isPrinting || printer.printerPowerState;
      }

      UI.removeDisplayNoneFromElement(turnOnThePrinterButton);
    }

    if (
      canRestartOctoPrint ||
      canShutdownOctoPrintHost ||
      canRestartOctoPrintHost ||
      canShutdownThePrinter ||
      canPowerOnThePrinter
    ) {
      UI.removeDisplayNoneFromElement(
        document.getElementById("octoPrintHeader-" + printer._id)
      );
    }
  }
  static setupEventListeners(printer) {
    document
      .getElementById(`printerRestartOctoPrint-${printer._id}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        const { status, message } = await sendPowerCommandToOctoPrint(
          printer,
          "restart"
        );
        UI.createAlert(status, message, 3000, "Clicked");
        e.target.disabled = false;
      });
    document
      .getElementById(`printerRestartHost-${printer._id}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        const { status, message } = await sendPowerCommandToOctoPrint(
          printer,
          "reboot"
        );
        UI.createAlert(status, message, 3000, "Clicked");
        e.target.disabled = false;
      });
    document
      .getElementById(`printerShutdownHost-${printer._id}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        const { status, message } = await sendPowerCommandToOctoPrint(
          printer,
          "shutdown"
        );
        UI.createAlert(status, message, 3000, "Clicked");
        e.target.disabled = false;
      });
    document
      .getElementById(`printerPowerOff-${printer._id}`)
      .addEventListener("click", (e) => {
        e.target.disabled = true;
        bootbox.confirm(
          "Are you sure you'd like to power down your printer?",
          async function (result) {
            if (result) {
              await PrinterPowerService.sendPowerCommandForPrinter(
                printer,
                printer.powerSettings.powerOffURL,
                printer.powerSettings.powerOffCommand,
                "power off"
              );
              e.target.disabled = false;
            }
          }
        );
      });
    document
      .getElementById(`printerPowerOn-${printer._id}`)
      .addEventListener("click", async (e) => {
        e.target.disabled = true;
        await PrinterPowerService.sendPowerCommandForPrinter(
          printer,
          printer.powerSettings.powerOnURL,
          printer.powerSettings.powerOnCommand,
          "power on"
        );
        e.target.disabled = false;
      });
  }

  static updatePrinterPowerState(state, powerBadge) {
    if(typeof state === "undefined"){
      return;
    }
    if(!!powerBadge){
      UI.removeDisplayNoneFromElement(powerBadge);
      if (!state) {
        if (!powerBadge.classList.contains("text-danger")) {
          powerBadge.classList.add("text-danger");
          powerBadge.classList.remove("text-success");
        }
      }
      if (state) {
        if (!powerBadge.classList.contains("text-success")) {
          powerBadge.classList.add("text-success");
          powerBadge.classList.remove("text-danger");
        }
      }
    }

  }

  static async sendPowerCommandForPrinter(printer, url, command, action) {
    const post = await OctoPrintClient.sendPowerCommand(printer, url, command, action);
    await UI.delay(1000);
    const powerBadge = document.getElementById(`powerState-${printer._id}`);
    PrinterPowerService.updatePrinterPowerState(await PrinterPowerService.printerIsPoweredOn(printer), powerBadge);
    return post;
  }
}
