import PrinterSelect from "./lib/modules/printerSelect";
import {
  bulkOctoPrintGcodeCommand,
  bulkPrintFileSetup,
  bulkOctoPrintControlCommand,
  bulkConnectPrinters,
  bulkDisconnectPrinters,
  bulkOctoPrintPreHeatCommand,
  bulkOctoPrintPowerCommand
} from "./pages/printer-manager/functions/bulk-commands-functions";
const multiPrintersSection = document.getElementById("multiPrintersSection");

const multiPrintCommandBtn = document.getElementById("multiPrintCommand");
if (multiPrintCommandBtn) {
  multiPrintCommandBtn.addEventListener("click", async (e) => {
    await PrinterSelect.create(
      multiPrintersSection,
      false,
      "Start a Bulk Print",
      await bulkPrintFileSetup
    );
  });
}

let bulkGcodeCommands = document.getElementById("bulkGcodeCommands");
bulkGcodeCommands.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Send Gcode to Printers",
    await bulkOctoPrintGcodeCommand
  );
});

const bulkConnectBtn = document.getElementById("bulkConnectBtn");
bulkConnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Connect Printers",
    await bulkConnectPrinters
  );
});
const bulkDisconnectBtn = document.getElementById("bulkDisconnectBtn");
bulkDisconnectBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Disconnect Printers",
    await bulkDisconnectPrinters
  );
});
const bulkPowerBtn = document.getElementById("bulkPowerBtn");
bulkPowerBtn.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Power On/Off Printers",
    await bulkOctoPrintPowerCommand
  );
});

let bulkPreHeat = document.getElementById("bulkPreHeat");
bulkPreHeat.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Pre-Heat Printers",
    await bulkOctoPrintPreHeatCommand
  );
});

let bulkControl = document.getElementById("bulkControl");
bulkControl.addEventListener("click", async (e) => {
  await PrinterSelect.create(
    multiPrintersSection,
    false,
    "Control Printers",
    await bulkOctoPrintControlCommand
  );
});
