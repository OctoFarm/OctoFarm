import OctoFarmClient from "../octofarm-client.service";
import OctoPrintClient from "./octoprint-client.service";
import UI from "../../utils/ui";
import { canWeTurnOnThePrinter, canWeTurnOffThePrinter } from "../../utils/octofarm.utils";
import PrinterPowerService from "../printer-power.service";

const powerOnPrinterSequence = async (printer) => {
  const canPowerOnThePrinter = canWeTurnOnThePrinter(printer);
  if (canPowerOnThePrinter) {
    if(!await PrinterPowerService.printerIsPoweredOn(printer)){
      const post = await PrinterPowerService.sendPowerCommandForPrinter(
          printer,
          printer.powerSettings.powerOnURL,
          printer.powerSettings.powerOnCommand,
          "power on"
      );
      const body = {
        action: "Printer: power on",
        status: post.status,
      };
      await OctoFarmClient.updateUserActionsLog(printer._id, body);
      await UI.delay(printer.quickConnectSettings.connectAfterPowerTimeout);
    }
  }
}

const powerOffPrinterSequence = async (printer) => {
  const canPowerOffThePrinter = canWeTurnOffThePrinter(printer);
  if (canPowerOffThePrinter) {
    if(await PrinterPowerService.printerIsPoweredOn(printer)){
      const post = await PrinterPowerService.sendPowerCommandForPrinter(
          printer,
          printer.powerSettings.powerOffURL,
          printer.powerSettings.powerOffCommand,
          "power off"
      );
      const body = {
        action: "Printer: power off",
        status: post.status,
      };
      await OctoFarmClient.updateUserActionsLog(printer._id, body);
      await UI.delay(printer.quickConnectSettings.powerAfterDisconnectTimeout);
    }
  }
}

export const connectPrinterSequence = async (printer) => {
  const alert = UI.createAlert("warning", "Attempting connect sequence! please wait...", 0, "clicked");
  if(printer.quickConnectSettings.powerPrinter){
    await powerOnPrinterSequence(printer);
  }
  if(printer.quickConnectSettings.connectPrinter){
    const data = {
      command: "connect",
      port: printer?.connectionOptions?.portPreference ? printer.connectionOptions.portPreference : "AUTO",
      baudrate: printer?.connectionOptions?.baudratePreference ? parseInt(printer.connectionOptions.baudratePreference) : 0,
      printerProfile: printer?.connectionOptions?.printerProfilePreference ? printer.connectionOptions.printerProfilePreference : "_default",
    };

    let post = await OctoPrintClient.post(printer, "connection", data);
    const body = {
      action: "Printer: connected",
      status: post?.status,
    };
    await OctoFarmClient.updateUserActionsLog(printer._id, body);
    alert.close();
    return post?.status;
  }
  alert.close();
  return 204;
}

export const disconnectPrinterSequenceNoConfirm = async (printer) => {
    let post = {
      status: 204
    }
    if(printer.quickConnectSettings.connectPrinter) {
      let data = {
        command: "disconnect",
      };
      post = await OctoPrintClient.post(
          printer,
          "connection",
          data
      );
      const body = {
        action: "Printer: disconnected",
        status: post.status,
      };
      await OctoFarmClient.updateUserActionsLog(printer._id, body);
    }
    if(printer.quickConnectSettings.powerPrinter){
      await powerOffPrinterSequence(printer);
    }

    return post?.status ? post.status : 200;
}

export const printStartSequence = async (printer) => {
  const status = await connectPrinterSequence(printer);
  await OctoPrintClient.updateFeedAndFlow(printer);
  await OctoPrintClient.updateFilamentOffsets(printer);
  await OctoPrintClient.updateBedOffsets(printer);
  await OctoFarmClient.updateActiveControlUser(printer._id);
  return status;
};
