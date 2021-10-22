import { findIndex } from "lodash";

import OctoFarmClient from "../../services/octofarm-client.service.js";
import UI from "../../lib/functions/ui";
import PrinterSelect from "../../lib/modules/printerSelect";
import {
  octoPrintPluginInstallAction,
  updateOctoPrintPlugins
} from "../../octoprint/octoprint-plugin-commands";
import {
  disconnectPrinterFromOctoPrint,
  quickConnectPrinterToOctoPrint,
  sendPowerCommandToOctoPrint,
  updateOctoPrintClient
} from "../../octoprint/octoprint-client-commands";
import {
  printerPreHeatBed,
  printerPreHeatTool,
  printerPreHeatChamber,
  printerStartPrint,
  printerPausePrint,
  printerRestartPrint,
  printerResumePrint,
  printerStopPrint,
  printerMoveAxis,
  printerHomeAxis,
  printerSendGcode
} from "../../octoprint/octoprint-printer-commands";
import CustomGenerator from "../../lib/modules/customScripts";
import { setupPluginSearch } from "./plugin-search.function";
import { returnPluginListTemplate } from "../templates/octoprint-plugin-list.template";
import {
  showBulkActionsModal,
  updateBulkActionsProgress,
  generateTableRows,
  updateTableRow
} from "./bulk-actions-progress.functions";

// TODO this should come from printer select to save the extra call, re-iteration and matching.
async function getCurrentlySelectedPrinterList() {
  try {
    const currentPrinterList = await OctoFarmClient.listPrinters();
    const matchedPrinters = [];
    //Grab all check boxes
    const selectedPrinters = PrinterSelect.getSelected();
    selectedPrinters.forEach((element) => {
      const printerID = element.id.split("-");
      const index = findIndex(currentPrinterList, function (o) {
        return o._id == printerID[1];
      });
      if (index > -1) {
        matchedPrinters.push(currentPrinterList[index]);
      }
    });
    return matchedPrinters;
  } catch (e) {
    console.error(e);
    UI.createAlert("error", `Couldn't get selected printer list: ${e}`, 0, "clicked");
    return [];
  }
}

export async function bulkOctoPrintPluginUpdate() {
  try {
    let currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    let toUpdate = [];
    let pluginList = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter?.octoPrintPluginUpdates?.length > 0) {
        message += currentPrinter.printerName + "<br>";
        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
        for (let plugin = 0; plugin < currentPrinter.octoPrintPluginUpdates.length; plugin++) {
          let currentPlugin = currentPrinter.octoPrintPluginUpdates[plugin];
          pluginList.push(currentPlugin.id);
        }
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert("error", "There are no plugin updates available!", 0, "clicked");
      return;
    }
    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following printers plugins...",
      message: message,
      callback: async function (result) {
        if (result) {
          showBulkActionsModal();
          updateBulkActionsProgress(0, toUpdate.length);
          generateTableRows(toUpdate);
          for (let i = 0; i < toUpdate.length; i++) {
            const response = await updateOctoPrintPlugins(pluginList, toUpdate[i]);
            updateTableRow(toUpdate[i]._id, response.status, response.message);
            updateBulkActionsProgress(i, toUpdate.length);
          }
          updateBulkActionsProgress(toUpdate.length, toUpdate.length);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your plugins: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkOctoPrintClientUpdate() {
  try {
    let currentPrinterList = await OctoFarmClient.listPrinters();
    let message = "";
    let toUpdate = [];
    for (let printer = 0; printer < currentPrinterList.length; printer++) {
      let currentPrinter = currentPrinterList[printer];
      if (currentPrinter?.octoPrintUpdate?.updateAvailable) {
        message += currentPrinter.printerName + "<br>";

        toUpdate.push({
          _id: currentPrinter._id,
          printerURL: currentPrinter.printerURL,
          printerName: currentPrinter.printerName,
          apikey: currentPrinter.apikey
        });
      }
    }
    if (toUpdate.length < 1) {
      UI.createAlert("error", "There are no OctoPrint updates available!", 0, "clicked");
      return;
    }
    message += "Are you sure?";
    bootbox.confirm({
      size: "medium",
      title: "This will update the following OctoPrint Installs...",
      message: message,
      callback: async function (result) {
        if (result) {
          showBulkActionsModal();
          updateBulkActionsProgress(0, toUpdate.length);
          generateTableRows(toUpdate);
          for (let i = 0; i < toUpdate.length; i++) {
            const response = await updateOctoPrintClient(toUpdate[i]);
            updateTableRow(toUpdate[i]._id, response.status, response.message);
            updateBulkActionsProgress(i, toUpdate.length);
          }
          updateBulkActionsProgress(toUpdate.length, toUpdate.length);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Encountered and error whilst trying to update your OctoPrint Clients: ${e}`,
      0,
      "clicked"
    );
  }
}

export async function bulkConnectPrinters() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToControl.length);
  generateTableRows(printersToControl);
  for (let p = 0; p < printersToControl.length; p++) {
    const response = await quickConnectPrinterToOctoPrint(printersToControl[p]);
    updateTableRow(printersToControl[p]._id, response.status, response.message);
    updateBulkActionsProgress(p, printersToControl.length);
  }
  updateBulkActionsProgress(printersToControl.length, printersToControl.length);
}

export async function bulkDisconnectPrinters() {
  const printersToDisconnect = await getCurrentlySelectedPrinterList();
  showBulkActionsModal();
  updateBulkActionsProgress(0, printersToDisconnect.length);
  generateTableRows(printersToDisconnect);
  for (let p = 0; p < printersToDisconnect.length; p++) {
    const response = await disconnectPrinterFromOctoPrint(printersToDisconnect[p]);
    updateTableRow(printersToDisconnect[p]._id, response.status, response.message);
    updateBulkActionsProgress(p, printersToDisconnect.length);
  }
  updateBulkActionsProgress(printersToDisconnect.length, printersToDisconnect.length);
}

export function bulkOctoPrintPowerCommand() {
  bootbox.prompt({
    title: "Power command!",
    message: "<p>Please select an option below:</p>",
    inputType: "radio",
    inputOptions: [
      {
        text: "Restart OctoPrint",
        value: "restart"
      },
      {
        text: "Reboot Host",
        value: "reboot"
      },
      {
        text: "Shutdown Host",
        value: "shutdown"
      }
    ],
    callback: async function (result) {
      const printersToPower = await getCurrentlySelectedPrinterList();
      showBulkActionsModal();
      updateBulkActionsProgress(0, printersToPower.length);
      generateTableRows(printersToPower);
      for (let p = 0; p < printersToPower.length; p++) {
        const response = await sendPowerCommandToOctoPrint(printersToPower[p], result);
        updateTableRow(printersToPower[p]._id, response.status, response.message);
        updateBulkActionsProgress(p, printersToPower.length);
      }
      updateBulkActionsProgress(printersToPower.length, printersToPower.length);
    }
  });
}

export function bulkOctoPrintPreHeatCommand() {
  bootbox.dialog({
    title: "Bulk printer heating...",
    message: `
        <form class="form-inline">
           <div class="input-group mb-3">
            <div class="input-group-prepend">
              <label class="input-group-text" for="preHeatToolSelect">Tool #: </label>
            </div>
            <select class="custom-select" id="preHeatToolSelect">
              <option selected value="0">0</option>
              <option value="0">1</option>
              <option value="0">2</option>
              <option value="0">3</option>
              <option value="0">4</option>
            </select>
          </div>
          <div class="input-group mb-3">
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatToolTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Bed</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatBedTempSelect">
            <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
          <p>&nbsp;</p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text" id="basic-addon1">Chamber</span>
            </div>
            <input type="text" class="form-control" placeholder="0" aria-label="0" aria-describedby="basic-addon1" id="preHeatChamberTempSelect">
                  <div class="input-group-append">
              <span class="input-group-text" id="basic-addon1">°C</span>
            </div>
          </div>
        </form>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    buttons: {
      action: {
        label: '<i class="fas fa-fire"></i> Heat!',
        className: "btn-success",
        callback: async function () {
          let toolNumber = document.getElementById("preHeatToolSelect");
          let toolTemp = document.getElementById("preHeatToolTempSelect");
          let bedTemp = document.getElementById("preHeatBedTempSelect");
          let chamberTemp = document.getElementById("preHeatChamberTempSelect");

          const printersToPreHeat = await getCurrentlySelectedPrinterList();
          showBulkActionsModal();
          updateBulkActionsProgress(0, printersToPreHeat.length);
          generateTableRows(printersToPreHeat);
          for (let p = 0; p < printersToPreHeat.length; p++) {
            let response;
            if (toolTemp.value && toolTemp.value > 0) {
              response = await printerPreHeatTool(printersToPreHeat[p], toolTemp, toolNumber);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (bedTemp.value !== "" && bedTemp.value > 0) {
              response = await printerPreHeatBed(printersToPreHeat[p], bedTemp);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
            if (chamberTemp.value !== "" && chamberTemp.value > 0) {
              response = await printerPreHeatChamber(printersToPreHeat[p], chamberTemp);
              updateTableRow(printersToPreHeat[p]._id, response.status, response.message);
              updateBulkActionsProgress(p, printersToPreHeat.length);
            }
          }
          updateBulkActionsProgress(printersToPreHeat.length, printersToPreHeat.length);
        }
      }
    }
  });
}

export async function bulkOctoPrintControlCommand() {
  const printersToControl = await getCurrentlySelectedPrinterList();
  let cameraBlock = "";
  printersToControl.forEach((printer) => {
    if (printer.cameraURL && printer.cameraURL.length !== 0) {
      cameraBlock += `
        <div class="col-lg-3">
            <img width="100%" src="${printer.cameraURL}">
        </div>
        `;
    }
  });

  bootbox.dialog({
    title: "Bulk printer control",
    message: `
      <div id="printerControls" class="row">
            <div class="col-lg-12">
              <div class="row">
                 ${cameraBlock}
              </div>
            </div>
            <div class="col-md-6">
                            <div class="row">
                    <div class="col-9">
                        <center>
                            <h5>X/Y</h5>
                        </center>
                        <hr>
                    </div>
                    <div class="col-3">
                        <center>
                            <h5>Z</h5>
                        </center>
                        <hr>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3">
                        <center><button id="pcXneg" type="button" class="btn btn-light"><i class="fas fa-arrow-left"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXYhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcXpos" type="button" class="btn btn-light"><i class="fas fa-arrow-right"></i></button></center>
                    </div>
                    <div class="col-3">
                        <center><button id="pcZhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcYneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                    <div class="col-3"></div>
                    <div class="col-3">
                        <center><button id="pcZneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button></center>
                    </div>
                </div>
                <div class="row">
                    <div class="col-12">
                        <center>
                            <div id="pcAxisSteps" class="btn-group" role="group">
                                <button id="pcAxisSteps01" type="button" class="btn btn-light" value="01">0.1</button>
                                <button id="pcAxisSteps1" type="button" class="btn btn-light" value="1">1</button>
                                <button id="pcAxisSteps10" type="button" class="btn btn-dark active" value="10">10</button>
                                <button id="pcAxisSteps100" type="button" class="btn btn-light" value="100">100</button>
                            </div>
                        </center>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
            <center>
            <button id="pmPrintStart" type="button" class="btn btn-success mb-1" role="button" style="display: inline-block;"><i class="fas fa-print"></i> Print</button> <br>
            <button id="pmPrintPause" type="button" class="btn btn-light mb-1" role="button" style="display: inline-block;"><i class="fas fa-pause"></i> Pause</button> <br>
            <button id="pmPrintRestart" type="button" class="btn btn-warning mb-1" role="button"  style="display: inline-block;"><i class="fas fa-undo"></i> Restart</button> <br>
            <button id="pmPrintResume" type="button" class="btn btn-info mb-1" role="button"  style="display: inline-block;"><i class="fas fa-redo"></i> Resume</button> <br>
            <button id="pmPrintStop" type="button" class="btn btn-danger mb-1" style="display: inline-block;"><i class="fas fa-square"></i> Cancel</button> <br>
            </center>
            </div>
        `,
    size: "large",
    onEscape: true,
    backdrop: true,
    closeButton: true,
    onShow: function (e) {
      //Grab Page
      const printerControls = {
        xPlus: document.getElementById("pcXpos"),
        xMinus: document.getElementById("pcXneg"),
        yPlus: document.getElementById("pcYpos"),
        yMinus: document.getElementById("pcYneg"),
        xyHome: document.getElementById("pcXYhome"),
        zPlus: document.getElementById("pcZpos"),
        zMinus: document.getElementById("pcZneg"),
        zHome: document.getElementById("pcZhome"),
        step01: document.getElementById("pcAxisSteps01"),
        step1: document.getElementById("pcAxisSteps1"),
        step10: document.getElementById("pcAxisSteps10"),
        step100: document.getElementById("pcAxisSteps100"),
        printStart: document.getElementById("pmPrintStart"),
        printPause: document.getElementById("pmPrintPause"),
        printRestart: document.getElementById("pmPrintRestart"),
        printResume: document.getElementById("pmPrintResume"),
        printStop: document.getElementById("pmPrintStop")
      };
      printerControls.printStart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerStartPrint(printer, e);
        });
      });
      printerControls.printPause.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerPausePrint(printer, e);
        });
      });
      printerControls.printRestart.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerRestartPrint(printer, e);
        });
      });
      printerControls.printResume.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerResumePrint(printer, e);
        });
      });
      printerControls.printStop.addEventListener("click", (e) => {
        bootbox.confirm({
          message: "Are you sure you want to cancel all of your ongoing print?",
          buttons: {
            cancel: {
              label: '<i class="fa fa-times"></i> Cancel'
            },
            confirm: {
              label: '<i class="fa fa-check"></i> Confirm'
            }
          },
          callback(result) {
            if (result) {
              printersToControl.forEach((printer) => {
                printerStopPrint(printer, e);
              });
            }
          }
        });
      });

      printerControls.xPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x");
        });
      });
      printerControls.xMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "x", "-");
        });
      });
      printerControls.yPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y");
        });
      });
      printerControls.yMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "y", "-");
        });
      });
      printerControls.xyHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["x", "y"]);
        });
      });
      printerControls.zPlus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z");
        });
      });
      printerControls.zMinus.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerMoveAxis(e, printer, "z", "-");
        });
      });
      printerControls.zHome.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          printerHomeAxis(e, printer, ["z"]);
        });
      });
      printerControls.step01.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "01"
          });
        });

        printerControls.step01.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step1.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "1"
          });
        });

        printerControls.step1.className = "btn btn-dark active";
        printerControls.step01.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step10.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "10"
          });
        });

        printerControls.step10.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
        printerControls.step100.className = "btn btn-light";
      });
      printerControls.step100.addEventListener("click", (e) => {
        printersToControl.forEach((printer) => {
          OctoFarmClient.post("printers/stepChange", {
            printer: printer._id,
            newSteps: "100"
          });
        });

        printerControls.step100.className = "btn btn-dark active";
        printerControls.step1.className = "btn btn-light";
        printerControls.step10.className = "btn btn-light";
        printerControls.step01.className = "btn btn-light";
      });
    }
  });
}

export async function bulkOctoPrintGcodeCommand() {
  const printersToSendGcode = await getCurrentlySelectedPrinterList();

  bootbox.prompt({
    size: "large",
    title: "What gcode commands would you like sent?",
    inputType: "textarea",
    onShow: async function (e) {
      let textArea = document.getElementsByClassName(
        "bootbox-input bootbox-input-textarea form-control"
      );
      const customGcodeEE = "<div class='mb-1' id='customGcodeCommandsArea'></div>";
      textArea[0].insertAdjacentHTML("beforebegin", customGcodeEE);
      const gcodeButtons = await OctoFarmClient.getCustomGcode();
      let area = document.getElementById("customGcodeCommandsArea");
      if (area) {
        gcodeButtons.forEach((scripts) => {
          let button = CustomGenerator.getButton(scripts);
          area.insertAdjacentHTML("beforeend", button);
          document.getElementById("gcode-" + scripts._id).addEventListener("click", async (e) => {
            showBulkActionsModal();
            updateBulkActionsProgress(0, printersToSendGcode.length);
            generateTableRows(printersToSendGcode);
            for (let p = 0; p < printersToSendGcode.length; p++) {
              if (scripts.printerIds.includes(printersToSendGcode[p]._id)) {
                let post = await CustomGenerator.fireCommand(
                  scripts._id,
                  scripts.gcode,
                  printersToSendGcode[p]
                );
                updateBulkActionsProgress(p, printersToSendGcode.length);
                if (post.status === 204) {
                  updateTableRow(
                    printersToSendGcode[p]._id,
                    "success",
                    "Successfully sent your command to the printer!"
                  );
                } else {
                  updateTableRow(
                    printersToSendGcode[p]._id,
                    "danger",
                    "Failed to send your command to the printer!"
                  );
                }
              } else {
                //Skipped
                updateTableRow(
                  printersToSendGcode[p]._id,
                  "warning",
                  "Printer was skipped because it is not allowed to be sent the script..."
                );
              }
            }
            updateBulkActionsProgress(printersToSendGcode.length, printersToSendGcode.length);
          });
        });
      }
    },
    callback: async function (result) {
      if (result) {
        for (let p = 0; p < printersToSendGcode.length; p++) {
          await printerSendGcode(printersToSendGcode[p], result);
        }
      }
    }
  });
}

export async function bulkOctoPrintPluginAction(action) {
  const printersForPluginAction = await getCurrentlySelectedPrinterList();
  try {
    let pluginList = [];
    let printerPluginList = null;
    if (action === "install") {
      printerPluginList = await OctoFarmClient.get(
        "printers/pluginList/" + printersForPluginAction[0]._id
      );
    } else {
      printerPluginList = await OctoFarmClient.get("printers/pluginList/all");
    }
    printerPluginList.forEach((plugin) => {
      if (action === "install") {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.archive
        });
      } else {
        pluginList.push({
          text: returnPluginListTemplate(plugin),
          value: plugin.id
        });
      }
    });
    pluginList = _.sortBy(pluginList, [
      function (o) {
        return o.text;
      }
    ]);
    pluginList = _.uniqBy(pluginList, function (e) {
      return e.text;
    });

    //Install Promt
    bootbox.prompt({
      size: "large",
      title: `<form class="form-inline float-right">
                  <div class="form-group">
                    <label for="searchPlugins">
                      Please choose the plugin you'd like to install... or: &nbsp;
                    </label>
                    <input width="75%" id="searchPlugins" type="text" placeholder="Search for your plugin name here..." class="search-control search-control-underlined">
                  </div>
                </form>`,
      inputType: "checkbox",
      multiple: true,
      inputOptions: pluginList,
      scrollable: true,
      onShow: function (e) {
        setupPluginSearch();
      },
      callback: async function (result) {
        if (result) {
          let pluginAmount = result.length * printersForPluginAction.length;
          let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
          if (action === "install") {
            cleanAction = cleanAction + "ing";
          }
          showBulkActionsModal();
          updateBulkActionsProgress(0, printersForPluginAction.length);
          generateTableRows(printersForPluginAction);
          for (let p = 0; p < printersForPluginAction.length; p++) {
            const response = await octoPrintPluginInstallAction(
              printersForPluginAction[p],
              result,
              action
            );
            updateTableRow(printersForPluginAction[p]._id, response.status, response.message);
            updateBulkActionsProgress(p, printersForPluginAction.length);
          }
          updateBulkActionsProgress(printersForPluginAction.length, printersForPluginAction.length);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Failed to generate plugin list, please check logs: ${e}`,
      0,
      "clicked"
    );
  }
}
