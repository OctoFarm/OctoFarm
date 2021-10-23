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
  multiUploadBtn.addEventListener("click", async (e) => {
    await FileManager.multiUpload();
  });
}

let bulkGcodeCommands = document.getElementById("bulkGcodeCommands");
bulkGcodeCommands.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Send Gcode to Printers",
    await bulkOctoPrintGcodeCommand
  );
});

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Connect Printers",
    await bulkConnectPrinters
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Disconnect Printers",
    await bulkDisconnectPrinters
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    document.getElementById("multiPrintersSection"),
    false,
    "Power On/Off Printers",
    await bulkOctoPrintPowerCommand
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
    await bulkOctoPrintControlCommand
  );
});
