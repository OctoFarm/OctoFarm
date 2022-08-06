import OctoFarmClient from "../octofarm-client.service";
import OctoPrintClient from "./octoprint-client.service";
import UI from "../../utils/ui";
import { canWeTurnOnThePrinter, canWeTurnOffThePrinter } from "../../utils/octofarm.utils";
import PrinterPowerService from "../printer-power.service";

const powerOnPrinterSequence = async (printer) => {
  const canPowerOnThePrinter = canWeTurnOnThePrinter(printer);
  //TODO enable quick connect setting for this to be enabled or disabled...
  if (canPowerOnThePrinter) {
    if(!await PrinterPowerService.printerIsPoweredOn(printer)){
      const post = await PrinterPowerService.sendPowerCommandForPrinter(
          printer,
          printer.powerSettings.powerOnURL,
          printer.powerSettings.powerOnCommand,
          "power on"
      );
      // Should be long enough for the printer to boot up.
      // TODO also make customisable
      const body = {
        action: "Printer: power on",
        status: post.status,
      };
      await OctoFarmClient.updateUserActionsLog(printer._id, body);
      await UI.delay(5000);
    }
  }
}

const powerOffPrinterSequence = async (printer) => {
  const canPowerOffThePrinter = canWeTurnOffThePrinter(printer);
  //TODO enable quick connect setting for this to be enabled or disabled...
  if (canPowerOffThePrinter) {
    if(await PrinterPowerService.printerIsPoweredOn(printer)){
      const post = await PrinterPowerService.sendPowerCommandForPrinter(
          printer,
          printer.powerSettings.powerOffURL,
          printer.powerSettings.powerOffCommand,
          "power off"
      );
      // Should be long enough for the printer to boot up.
      // TODO also make customisable
      const body = {
        action: "Printer: power off",
        status: post.status,
      };
      await OctoFarmClient.updateUserActionsLog(printer._id, body);
      await UI.delay(2000);
    }
  }
}

export const connectPrinterSequence = async (printer) => {
  await powerOnPrinterSequence(printer);
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
  return post?.status;
}

export const disconnectPrinterSequenceNoConfirm = async (printer) => {
    let data = {
      command: "disconnect",
    };
    let post = await OctoPrintClient.post(
        printer,
        "connection",
        data
    );
    const body = {
      action: "Printer: disconnected",
      status: post.status,
    };
    await OctoFarmClient.updateUserActionsLog(printer._id, body);
    await UI.delay(3000);
    await powerOffPrinterSequence(printer);
    return post?.status;
}

export const printStartSequence = async (printer) => {
  const status = await connectPrinterSequence(printer);
  await OctoPrintClient.updateFeedAndFlow(printer);
  await OctoPrintClient.updateFilamentOffsets(printer);
  await OctoPrintClient.updateBedOffsets(printer);
  await OctoFarmClient.updateActiveControlUser(printer._id);
  return status;
};
