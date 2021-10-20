import PrinterSelect from "./lib/modules/printerSelect";
import {
  bulkOctoPrintGcodeCommand,
  bulkOctoPrintControlCommand,
  bulkConnectPrinters,
  bulkDisconnectPrinters,
  bulkOctoPrintPreHeatCommand,
  bulkOctoPrintPowerCommand
} from "./printer-manager/functions/bulk-commands-functions";
import FileManager from "./lib/modules/fileManager";

const multiUploadBtn = document.getElementById("multUploadBtn");
if (multiUploadBtn) {
  multiUploadBtn.addEventListener("click", (e) => {
    FileManager.multiUpload().then((r) => {});
  });
}

let bulkGcodeCommands = document.getElementById("bulkGcodeCommands");
bulkGcodeCommands.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Send Gcode to Printers",
    bulkOctoPrintGcodeCommand
  );
});

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Connect Printers",
    bulkConnectPrinters
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Disconnect Printers",
    bulkDisconnectPrinters
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Power On/Off Printers",
    bulkOctoPrintPowerCommand
  );
});

let bulkPreHeat = document.getElementById("bulkPreHeat");
bulkPreHeat.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Pre-Heat Printers",
    await bulkOctoPrintPreHeatCommand
  );
});

let bulkControl = document.getElementById("bulkControl");
bulkControl.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Control Printers",
    bulkOctoPrintControlCommand
  );
});
