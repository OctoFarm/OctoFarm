import OctoFarmClient from "../octofarm-client.service";
import OctoPrintClient from "./octoprint-client.service";
import UI from "../../utils/ui";
import {canWeTurnOnThePrinter} from "../../utils/octofarm.utils";
import PrinterPowerService from "../printer-power.service";

const powerOnPrinterSequence = async (printer) => {
  const canPowerOnThePrinter = canWeTurnOnThePrinter(printer);
  //TODO enable quick connect setting for this to be enabled or disabled...
  if (canPowerOnThePrinter) {
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
    await UI.delay(3000);
  }
}

export const connectPrinterSequence = async (printer) => {
  await powerOnPrinterSequence(printer);
  let data = {};
  data = {
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
    return post?.status;
}

export const printStartSequence = async (printer) => {
  const post = await connectPrinterSequence(printer);
  await OctoPrintClient.updateFeedAndFlow(printer);
  await OctoPrintClient.updateFilamentOffsets(printer);
  await OctoPrintClient.updateBedOffsets(printer);
  await OctoFarmClient.updateActiveControlUser(printer._id);
  return post?.status;
};
