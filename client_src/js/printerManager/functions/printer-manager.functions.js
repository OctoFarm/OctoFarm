import UI from "../../lib/functions/ui";
import OctoFarmClient from "../../lib/octofarm";

export async function scanNetworkForDevices() {
  e.target.disabled = true;
  UI.createAlert(
    "info",
    "Scanning your network for new devices now... Please wait!",
    20000
  );
  try {
    const scannedPrinters = await OctoFarmClient.get("printers/scanNetwork");
    for (let index = 0; index < scannedPrinters.length; index++) {
      const printer = {
        printerURL: "",
        cameraURL: "",
        name: "",
        group: "",
        apikey: ""
      };

      if (typeof scannedPrinters[index].name !== "undefined") {
        printer.name = scannedPrinters[index].name;
      }
      if (typeof scannedPrinters[index].url !== "undefined") {
        printer.printerURL = scannedPrinters[index].url;
      }
      PrintersManagement.addPrinter(printer);
    }
    UI.createAlert(
      "success",
      "Devices on your network have been scanned, any successful matches should now be visible to add to OctoFarm.",
      3000,
      "Clicked"
    );
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There we're issues scanning your network for devices... please check the logs",
      0,
      "clicked"
    );
  }
  e.target.disabled = false;
}
