import {sendPowerCommandToOctoPrint} from "./octoprint/octoprint-client-commands.actions";
import UI from "../utils/ui";
import {
  canWeDetectPrintersPowerState,
  canWeRestartOctoPrint,
  canWeRestartOctoPrintHost,
  canWeShutdownOctoPrintHost,
  canWeShutdownThePrinter,
  canWeTurnOnThePrinter, printerIsPrinting
} from "../utils/octofarm.utils";
import OctoPrintClient from "./octoprint/octoprint-client.service";

export default class PrinterPowerService {
  static timer = {};

  static async printerIsPoweredOn(printer) {
    let powerStatus = false;
    const powerReturn = await OctoPrintClient.getPowerStatus(
        printer,
        printer.powerSettings.powerStatusURL,
        printer.powerSettings.powerStatusCommand
    );

    if(!!powerReturn){
      powerStatus = powerReturn[Object.keys(powerReturn)[0]]
    }

    return powerStatus;
  }

  static async revealPowerButtons(printer) {
    if(printer.disabled){
      return;
    }
    const canRestartOctoPrint = canWeRestartOctoPrint(printer);
    const canRestartOctoPrintHost = canWeRestartOctoPrintHost(printer);
    const canShutdownOctoPrintHost = canWeShutdownOctoPrintHost(printer);
    const canShutdownThePrinter = canWeShutdownThePrinter(printer);
    const canPowerOnThePrinter = canWeTurnOnThePrinter(printer);
    const canDetectPowerState = canWeDetectPrintersPowerState(printer);

    const isPrinting = printerIsPrinting(printer);

    const restartOctoPrintButton = document.getElementById("printerRestartOctoPrint-"+printer._id);
    if(canRestartOctoPrint){
      restartOctoPrintButton.disabled = !canRestartOctoPrint;
      UI.removeDisplayNoneFromElement(restartOctoPrintButton)
    }
    const restartOctoPrintHostButton = document.getElementById("printerRestartHost-"+printer._id);
    if(canRestartOctoPrintHost){
      restartOctoPrintHostButton.disabled = !canRestartOctoPrintHost;
      UI.removeDisplayNoneFromElement(restartOctoPrintHostButton)
    }
    const shutdownOctoPrintHostButton = document.getElementById("printerShutdownHost-"+printer._id);
    if(canShutdownOctoPrintHost){
      shutdownOctoPrintHostButton.disabled = !canShutdownOctoPrintHost;
      UI.removeDisplayNoneFromElement(shutdownOctoPrintHostButton)
    }
    const shutdownPrinterButton = document.getElementById("printerPowerOff-"+printer._id);
    const turnOnThePrinterButton = document.getElementById("printerPowerOn-"+printer._id);
    const powerBadge = document.getElementById(`powerState-${printer._id}`)
    let isPoweredOn = false;

    if(canDetectPowerState){
      if(!this.timer[printer._id]){
        this.timer[printer._id] = 0;
      }
      if(this.timer[printer._id] >= 10000){
        this.timer[printer._id] = 0;
        isPoweredOn = await PrinterPowerService.printerIsPoweredOn(printer);
      }
      this.timer[printer._id] = this.timer[printer._id] + 500;
      UI.removeDisplayNoneFromElement(powerBadge);
      if(!isPoweredOn){
        if(!powerBadge.classList.contains("text-danger")){
          powerBadge.classList.add("text-danger");
          powerBadge.classList.remove("text-success");
        }
      }
      if(isPoweredOn){
        if(!powerBadge.classList.contains("text-success")){
          powerBadge.classList.add("text-success");
          powerBadge.classList.remove("text-danger")
        }
      }
    }

    if(canShutdownThePrinter){
      if(!canDetectPowerState){
        shutdownPrinterButton.disabled = isPrinting || canDetectPowerState
      }else{
        shutdownPrinterButton.disabled = isPrinting || !isPoweredOn;
      }


      UI.removeDisplayNoneFromElement(shutdownPrinterButton)
    }

    if(canPowerOnThePrinter){
      if(!canDetectPowerState){
        turnOnThePrinterButton.disabled = isPrinting || canDetectPowerState
      }else{
        turnOnThePrinterButton.disabled = isPrinting || isPoweredOn;
      }

      UI.removeDisplayNoneFromElement(turnOnThePrinterButton)
    }

    if(canRestartOctoPrint || canShutdownOctoPrintHost || canRestartOctoPrintHost || canShutdownThePrinter || canPowerOnThePrinter){
      UI.removeDisplayNoneFromElement(document.getElementById("octoPrintHeader-"+printer._id));
    }
  }
  static setupEventListeners(printer){
    document.getElementById(`printerRestartOctoPrint-${printer._id}`).addEventListener("click", async (e) => {
      e.target.disabled = true;
      const {status, message} = await sendPowerCommandToOctoPrint(printer, "restart");
      UI.createAlert(status, message, 3000, "Clicked")
      e.target.disabled = false;
    })
    document.getElementById(`printerRestartHost-${printer._id}`).addEventListener("click", async (e) => {
      e.target.disabled = true;
      const {status, message} = await sendPowerCommandToOctoPrint(printer, "reboot");
      UI.createAlert(status, message, 3000, "Clicked")
      e.target.disabled = false;
    })
    document.getElementById(`printerShutdownHost-${printer._id}`).addEventListener("click", async (e) => {
      e.target.disabled = true;
      const {status, message} = await sendPowerCommandToOctoPrint(printer, "shutdown");
      UI.createAlert(status, message, 3000, "Clicked")
      e.target.disabled = false;
    })
    document.getElementById(`printerPowerOff-${printer._id}`).addEventListener("click", (e) => {
      e.target.disabled = true;
      bootbox.confirm("Are you sure you'd like to power down your printer?", async function(result){
        if(result){
          await PrinterPowerService.sendPowerCommandForPrinter(printer, printer.powerSettings.powerOffURL, printer.powerSettings.powerOffCommand, "power off")
          e.target.disabled = false;
        }
      });


    })
    document.getElementById(`printerPowerOn-${printer._id}`).addEventListener("click", async (e) => {
      e.target.disabled = true;
      await this.sendPowerCommandForPrinter(printer, printer.powerSettings.powerOnURL, printer.powerSettings.powerOnCommand, "power on")
      e.target.disabled = false;
    })
  }

  static async sendPowerCommandForPrinter(printer, url, command, action){
    const { apikey, printerName } = printer;

    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL);
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey);
    }

    let post;
    if(!!command || command !== ""){
      post = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apikey
        },
        body: command
      })
    }else{
      post = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      })
    }
    if(!post?.ok){
      UI.createAlert(
          "error",
          `${printerName}: Failed to complete ${action}<br> Status: ${post.statusText}`,
          3000,
          "Clicked"
      )
    }else{
      UI.createAlert(
          "success",
          `${printerName}: Successfully ${action}!`,
          3000,
          "Clicked"
      )
    }
  }
}
