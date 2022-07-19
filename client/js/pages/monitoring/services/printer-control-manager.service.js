import OctoPrintClient from "../../../services/octoprint/octoprint-client.service";
import OctoFarmClient from "../../../services/octofarm-client.service";
import UI from "../../../utils/ui.js";
import CustomGenerator from "../../../services/custom-gcode-scripts.service.js";
import { setupClientSwitchDropDown } from "../../../services/modal-printer-select.service";
import { printActionStatusResponse } from "../../../services/octoprint/octoprint.helpers-commands.actions";
import "../../../utils/cleanup-modals.util";
import {
  setupConnectButton,
  setupConnectButtonListeners,
  updateConnectButtonState,
} from "./connect-button.service";
import {
  closePrinterManagerModalIfOffline,
  imageOrCamera,
  printerIsDisconnectedOrError,
} from "../../../utils/octofarm.utils";
import {
  findBigFilamentDropDowns,
  returnBigFilamentSelectorTemplate,
  fillFilamentDropDownList,
} from "../../../services/printer-filament-selector.service";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../../exceptions/application-error.handler";
import {setupModalSwitcher} from "./modal-switcher.service";

let currentIndex = 0;

let currentPrinter = null;

let filamentManager = false;

export default class PrinterControlManagerService {
  static async init(index, printers, printerControlList) {
    try {
      //clear camera
      if (index !== "") {
        currentIndex = index;
        const id = _.findIndex(printers, function (o) {
          return o._id === index;
        });
        currentPrinter = printers[id];

        const changeFunction = function (value) {
          PrinterControlManagerService.init(
            value,
            printers,
            printerControlList
          );
        };
        setupClientSwitchDropDown(
          currentPrinter._id,
          printerControlList,
          changeFunction,
          true
        );
        await PrinterControlManagerService.loadPrinter(
          currentPrinter,
          printerControlList
        );
        const elements = PrinterControlManagerService.grabPage();
        elements.printerControls["step" + currentPrinter.stepRate].className =
          "btn btn-dark active";
        await PrinterControlManagerService.applyState(currentPrinter, elements);
        await PrinterControlManagerService.applyTemps(currentPrinter, elements);
        PrinterControlManagerService.applyListeners(elements, printers);
      } else {
        const id = _.findIndex(printers, function (o) {
          return o._id === currentIndex;
        });
        currentPrinter = printers[id];
        const elements = PrinterControlManagerService.grabPage();
        await PrinterControlManagerService.applyState(currentPrinter, elements);
        await PrinterControlManagerService.applyTemps(currentPrinter, elements);
        document.getElementById("printerManagerModal").style.overflow = "auto";
      }
    } catch (e) {
      console.error(e);
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Printer Control - ${e}`;
      throw new ApplicationError(errorObject);
    }
  }

  static async loadPrinter(printer) {
    //Load Connection Panel

    try {
      setupConnectButton(printer);
      //setup power btn
      // await PrinterPowerService.applyBtn(printer, "pmPowerBtn-");

      let serverSettings = await OctoFarmClient.getServerSettings();
      filamentManager = serverSettings.filamentManager;
      //Load tools
      document.getElementById("printerControls").innerHTML = `
            <div class="row">                
                <!-- Camera --> 
                <div class="col-md-4 col-lg-3 text-center">
                  <span id="cameraRow">  
                    <h5>Camera</h5><hr>
                    <div class="row">
                       <div class="col-12">
                          ${imageOrCamera(printer, undefined, "Modal")}
                        </div>
                    </div>
                  </span>
                  <h5>Operation</h5><hr>
                  <button id="pmPrintStart" type="button" class="btn btn-success" role="button"><i class="fas fa-print"></i> Print</button>
                  <button id="pmPrintPause" type="button" class="btn btn-light" role="button" disabled><i class="fas fa-pause"></i> Pause</button>
                  <button id="pmPrintRestart" type="button" class="btn btn-danger" role="button"><i class="fas fa-undo"></i> Restart</button>
                  <button id="pmPrintResume" type="button" class="btn btn-success" role="button"><i class="fas fa-redo"></i> Resume</button>
                  <button id="pmPrintStop" type="button" class="btn btn-danger" disabled><i class="fas fa-square"></i> Cancel</button>
                </div>
                <!-- Control -->
                <div class="col-md-4 col-lg-6 text-center">
                    <h5>Jog</h5><hr>    
                    <div class="row">
                        <div class="col-3"></div>
                        <div class="col-3 text-center">
                            <button id="pcYpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button>
                        </div>
                        <div class="col-3"></div>
                        <div class="col-3 text-center">
                            <button id="pcZpos" type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-3 text-center">
                            <button id="pcXneg" type="button" class="btn btn-light"><i class="fas fa-arrow-left"></i></button>
                        </div>
                        <div class="col-3 text-center">
                            <button id="pcXYhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button>
                        </div>
                        <div class="col-3 text-center">
                            <button id="pcXpos" type="button" class="btn btn-light"><i class="fas fa-arrow-right"></i></button>
                        </div>
                        <div class="col-3 text-center">
                            <button id="pcZhome" type="button" class="btn btn-light"><i class="fas fa-home"></i></button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-3"></div>
                        <div class="col-3 text-center">
                            <button id="pcYneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button>
                        </div>
                        <div class="col-3"></div>
                        <div class="col-3 text-center">
                            <button id="pcZneg" type="button" class="btn btn-light"><i class="fas fa-arrow-down"></i></button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 text-center">
                                <div id="pcAxisSteps" class="btn-group" role="group">
                                    <button id="pcAxisSteps01" type="button" class="btn btn-light" value="01">0.1</button>
                                    <button id="pcAxisSteps1" type="button" class="btn btn-light" value="1">1</button>
                                    <button id="pcAxisSteps10" type="button" class="btn btn-light" value="10">10</button>
                                    <button id="pcAxisSteps100" type="button" class="btn btn-light" value="100">100</button>
                                </div>
                        </div>
                    </div>
                    <h5>Extrusion</h5><hr>
                      <div class="input-group">
                          <input id="pcExtruder" type="number" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="basic-addon2">
                          <div class="input-group-append">
                              <span class="input-group-text" id="basic-addon2">mm</span>
                                  <button id="pcExtrude" class="btn btn-light"><i class="fas fa-redo"></i> Extrude</button> 
                                  <button id="pcRetract" class="btn btn-light"><i class="fas fa-undo"></i> Retract</button>
                          </div>
                      </div>
                  </div>
               <!-- Tools -->
                <div class="col-md-4 col-lg-3 text-center">
                    <h5>Tools</h5><hr>
                    <div class="row">
                      <div class="col-12">
                          <button id="pmTempTime" type="button" class="btn btn-secondary btn-sm float-right" disabled>Updated: <i class="far fa-clock"></i> Never</button>
                      </div>
                      </div>
                    <div class="row" id="pmToolTemps">
      
                    </div>
                    <div class="row" id="pmOtherTemps">
                    </div>
                </div>  
                <!-- Feed/Flow -->
                <div class="col-md-4 col-lg-4 text-center">
                  <h5>Feed/Flow Rate</h5><hr>
                  <div class="row">
                      <div class="col-10 col-lg-8 col-xl-8">
                          <label for="pcFeed">Feed Rate: <span id="pcFeedValue">${
                            printer.feedRate
                          }%</span></label>
                          <input type="range" class="octoRange custom-range" min="10" max="300" step="1" id="pcFeed" value="${
                            printer.feedRate
                          }">
                      </div>
                      <div class="col-2 col-lg-4 col-xl-4">
                          <button id="pcFeedRate" type="button" class="btn btn-light">Update</button>
                      </div>
                  </div>
                  <div class="row">
                      <div class="col-10 col-lg-8 col-xl-8">
                          <label for="pcFlow">Flow Rate: <span id="pcFlowValue">${
                            printer.flowRate
                          }%</span></label>
                          <input type="range" class="octoRange custom-range" min="75" max="125" step="1" id="pcFlow" value="${
                            printer.flowRate
                          }">
                      </div>
                      <div class="col-2 col-lg-4 col-xl-4">
                          <button id="pcFlowRate" type="button" class="btn btn-light">Update</button>
                      </div>
                  </div>
               </div>
                <!-- Motors/Fans -->
                <div class="col-md-4 col-lg-4 text-center">
                  <h5>Motors / Fans</h5><hr>
                  <div class="row">
                    <div class="col-12 text-center">
                        <button id="pcMotorTog" class="btn btn-light" type="submit">Motors Off</button>
                    </div>
                </div>
                  <div class="row">
                    <div class="col-12 text-center">
                    <label for="pcFlow">Fan Percent: <span id="pcFanPercent">100%</span></label>
                    <input type="range" class="octoRange custom-range" min="0" max="100" step="1" id="pcFanPercent" value="100">
                     <button id="pcFanOn" class="btn btn-light" type="submit">Set Fans</button> <button id="pcFanOff" class="btn btn-light" type="submit">Fans Off</button></center>
                    </div>
                </div>
               </div>
               <!-- CustomGcode -->
                <div class="col-md-4 col-lg-4 text-center">
                  <h5>Custom Gcode</h5><hr>
                  <span id="customGcodeCommandsArea" class="d-none">
                  </span>
                </div>  
            </div>
      `;
      setupModalSwitcher("control", printer);
      const printerToolTemps = document.getElementById("pmToolTemps");
      document.getElementById("pmOtherTemps").innerHTML = "";
      printerToolTemps.innerHTML = "";
      if (
        typeof printer.currentProfile !== "undefined" &&
        printer.currentProfile !== null
      ) {
        const keys = Object.keys(printer.currentProfile);
        for (const element of keys) {
          if (element.includes("extruder")) {
            for (let i = 0; i < printer.currentProfile[element].count; i++) {
              printerToolTemps.insertAdjacentHTML(
                "beforeend",
                `
                <div class="md-form input-group mb-3">
                    <div title="Actual Tool temperature" class="input-group-prepend">
                        <span class="input-group-text"><span>${i}: </span><span id="tool${i}Actual"> 0°C</span></span>
                    </div>
                    <input title="Set your target Tool temperature" id="tool${i}Target" type="number" class="form-control col" placeholder="0°C" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                    <div class="input-group-append">
                        <button class="btn btn-md btn-light m-0 p-1" type="button" id="tool${i}Set">Set</button>
                    </div>
                </div>
                ${returnBigFilamentSelectorTemplate(i)}
              `
              );
              await fillFilamentDropDownList(
                document.getElementById(`tool-${i}-bigFilamentSelect`),
                printer,
                i
              );
            }
          } else if (element.includes("heatedBed")) {
            if (printer.currentProfile[element]) {
              document.getElementById("pmOtherTemps").insertAdjacentHTML(
                "beforeend",
                `
                           <div class="col text-center">
                              <h5>Bed</h5>
                          <hr>
                            <div class="md-form input-group mb-3">
                                <div title="Actual Bed temperature" class="input-group-prepend">
                                    <span id="bedActual" class="input-group-text">0°C</span>
                                </div>
                                <input title="Set your target Bed temperature" id="bedTarget" type="number" class="form-control col-lg-12 col-xl-12" placeholder="0°C" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                                <div class="input-group-append">
                                    <button class="btn btn-md btn-light m-0 p-1" type="button" id="bedSet">Set</button>
                                </div>
                            </div>
                            </div>
                         `
              );
            }
          } else if (element.includes("heatedChamber")) {
            if (printer.currentProfile[element]) {
              document.getElementById("pmOtherTemps").insertAdjacentHTML(
                "beforeend",
                `
                         <div class="col text-center">
                              <h5>Chamber</h5>
                          <hr>
                          <div class="md-form input-group mb-3">
                              <div title="Actual Bed temperature" class="input-group-prepend">
                                  <span id="chamberActual" class="input-group-text">0°C</span>
                              </div>
                              <input title="Set your target Bed temperature" id="chamberTarget" type="number" class="form-control col-lg-12 col-xl-12" placeholder="0°C" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                              <div class="input-group-append">
                                  <button class="btn btn-md btn-light m-0 p-1" type="button" id="chamberSet">Set</button>
                              </div>
                          </div>
                            </div>
                         `
              );
            }
          }
        }
      }

      await CustomGenerator.generateButtons(printer);

      return true;
    } catch (e) {
      UI.createAlert(
        "error",
        "Something has gone wrong with loading the Printer Manager... Hard Failure, please submit as a bug on github: " +
          e,
        0,
        "clicked"
      );
      console.error(e);
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Printer Control - ${e}`;
      throw new ApplicationError(errorObject);
    }
  }

  static applyListeners(elements) {
    const rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });

    setupConnectButtonListeners(
      currentPrinter,
      elements.connectPage.connectButton
    );

    //Control Listeners... There's a lot!
    elements.printerControls.xPlus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "x");
    });
    elements.printerControls.xMinus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "x", "-");
    });
    elements.printerControls.yPlus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "y");
    });
    elements.printerControls.yMinus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "y", "-");
    });
    elements.printerControls.xyHome.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "home", ["x", "y"]);
    });
    elements.printerControls.zPlus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "z");
    });
    elements.printerControls.zMinus.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "jog", "z", "-");
    });
    elements.printerControls.zHome.addEventListener("click", async (e) => {
      await OctoPrintClient.move(e, currentPrinter, "home", ["z"]);
    });
    elements.printerControls.step01.addEventListener("click", async () => {
      await OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "01",
      });
      elements.printerControls.step01.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step1.addEventListener("click", async () => {
      await OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "1",
      });
      elements.printerControls.step1.className = "btn btn-dark active";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step10.addEventListener("click", async () => {
      await OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "10",
      });
      elements.printerControls.step10.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step100.addEventListener("click", async () => {
      await OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "100",
      });
      elements.printerControls.step100.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
    });

    if (currentPrinter.currentProfile !== null) {
      const keys = Object.keys(currentPrinter.currentProfile);
      for (const element of keys) {
        if (element.includes("extruder")) {
          for (
            let i = 0;
            i < currentPrinter.currentProfile[element].count;
            i++
          ) {
            const toolSet = async function () {
              const flashReturn = function () {
                document.getElementById("tool" + i + "Set").className =
                  "btn btn-md btn-light m-0 p-1";
              };
              let { value } = document.getElementById("tool" + i + "Target");
              document.getElementById("tool" + i + "Target").value = "";
              if (value === "Off") {
                value = 0;
              }
              const opt = {
                command: "target",
                targets: {
                  ["tool" + i]: parseInt(value),
                },
              };
              const post = await OctoPrintClient.post(
                currentPrinter,
                "printer/tool",
                opt
              );
              const { status } = post;
              if (status === 204) {
                document.getElementById("tool" + i + "Set").className =
                  "btn btn-md btn-success m-0 p-1";
                setTimeout(flashReturn, 500);
              } else {
                document.getElementById("tool" + i + "Set").className =
                  "btn btn-md btn-danger m-0 p-1";
                setTimeout(flashReturn, 500);
              }
            };
            document
              .getElementById("tool" + i + "Target")
              .addEventListener("change", async () => {
                if (document.getElementById("tool" + i + "Target").value <= 0) {
                  document.getElementById("tool" + i + "Target").value = "0";
                }
              });
            document
              .getElementById("tool" + i + "Target")
              .addEventListener("keypress", async (e) => {
                if (e.key === "Enter") {
                  await toolSet();
                }
              });
            document
              .getElementById("tool" + i + "Set")
              .addEventListener("click", async (e) => {
                await toolSet();
              });
          }
        } else if (element.includes("heatedBed")) {
          if (currentPrinter.currentProfile[element]) {
            const bedSet = async function () {
              const flashReturn = function () {
                elements.temperatures.bed[2].classList =
                  "btn btn-md btn-light m-0 p-1";
              };
              let { value } = elements.temperatures.bed[1];

              elements.temperatures.bed[1].value = "";
              if (value === "Off") {
                value = 0;
              }
              const opt = {
                command: "target",
                target: parseInt(value),
              };
              const post = await OctoPrintClient.post(
                currentPrinter,
                "printer/bed",
                opt
              );
              if (post?.status === 204) {
                elements.temperatures.bed[2].className =
                  "btn btn-md btn-success m-0 p-1";
              } else {
                elements.temperatures.bed[2].className =
                  "btn btn-md btn-danger m-0 p-1";
              }
              elements.temperatures.bed[2].value = "";
              setTimeout(flashReturn, 500);
            };
            if (elements.temperatures.bed[1]) {
              elements.temperatures.bed[1].addEventListener(
                "change",
                async () => {
                  if (elements.temperatures.bed[1].value <= 0) {
                    elements.temperatures.bed[1].value = "";
                  }
                }
              );
            }

            elements.temperatures.bed.forEach((node) => {
              if (node.id.includes("Target")) {
                if (node) {
                  node.addEventListener("keypress", async (e) => {
                    if (e.key === "Enter") {
                      await bedSet();
                    }
                  });
                }
              }
              if (node.id.includes("Set")) {
                if (node) {
                  node.addEventListener("click", async (e) => {
                    await bedSet();
                  });
                }
              }
            });
          }
        } else if (element.includes("heatedChamber")) {
          if (currentPrinter.currentProfile[element]) {
            const chamberSet = async function () {
              const flashReturn = function () {
                elements.temperatures.chamber[2].classList =
                  "btn btn-md btn-light m-0 p-1";
              };
              let { value } = elements.temperatures.chamber[1];

              elements.temperatures.chamber[1].value = "";
              if (value === "Off") {
                value = 0;
              }
              const opt = {
                command: "target",
                target: parseInt(value),
              };
              const post = await OctoPrintClient.post(
                currentPrinter,
                "printer/chamber",
                opt
              );
              const { status } = post;
              if (status === 204) {
                elements.temperatures.chamber[2].className =
                  "btn btn-md btn-success m-0 p-1";
              } else {
                elements.temperatures.chamber[2].className =
                  "btn btn-md btn-danger m-0 p-1";
              }
              setTimeout(flashReturn, 500);
            };
            if (elements.temperatures.chamber[1]) {
              elements.temperatures.chamber[1].addEventListener(
                "change",
                async () => {
                  if (elements.temperatures.chamber[1].value <= 0) {
                    elements.temperatures.chamber[1].value = "";
                  }
                }
              );
            }

            elements.temperatures.chamber.forEach((node) => {
              if (node.id.includes("Target")) {
                if (node) {
                  node.addEventListener("keypress", async (e) => {
                    if (e.key === "Enter") {
                      await chamberSet();
                    }
                  });
                }
              }
              if (node.id.includes("Set")) {
                if (node) {
                  node.addEventListener("click", async (e) => {
                    await chamberSet();
                  });
                }
              }
            });
          }
        }
      }
    }

    elements.printerControls.feedRate.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.feedRateValue.innerHTML;
      value = value.replace("%", "");
      await OctoFarmClient.post("printers/feedChange", {
        printer: currentPrinter._id,
        newSteps: value,
      });
      const opt = {
        command: "feedrate",
        factor: parseInt(value),
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/printhead",
        opt
      );
      if (post?.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.flowRate.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.flowRateValue.innerHTML;
      value = value.replace("%", "");
      await OctoFarmClient.post("printers/flowChange", {
        printer: currentPrinter._id,
        newSteps: value,
      });
      const opt = {
        command: "flowrate",
        factor: parseInt(value),
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/tool",
        opt
      );
      if (post?.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.motorsOff.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      const opt = {
        commands: ["M18"],
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/command",
        opt
      );
      if (post?.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.fansOn.addEventListener("click", async (e) => {
      let fanspeed = elements.printerControls.fanPercent.innerHTML;
      fanspeed = fanspeed.replace("%", "");
      fanspeed /= 100;
      fanspeed = 255 * fanspeed;
      fanspeed = Math.floor(Number.parseFloat(fanspeed));

      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      const opt = {
        commands: [`M106 S${fanspeed}`],
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/command",
        opt
      );
      if (post?.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.fansOff.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      const opt = {
        commands: ["M107"],
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/command",
        opt
      );
      if (post?.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.extrude.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      if (
        typeof elements.printerControls.extruder.value !== "undefined" &&
        elements.printerControls.extruder.value !== ""
      ) {
        const select = OctoPrintClient.selectTool(currentPrinter, "tool0");
        if (select) {
          const { value } = elements.printerControls.extruder;
          const opt = {
            command: "extrude",
            amount: parseInt(value),
          };
          const post = await OctoPrintClient.post(
            currentPrinter,
            "printer/tool",
            opt
          );
          if (post?.status === 204) {
            e.target.classList = "btn btn-success";
            setTimeout(flashReturn, 500);
          } else {
            e.target.classList = "btn btn-danger";
            setTimeout(flashReturn, 500);
          }
        }
      } else {
        UI.createAlert(
          "error",
          "You haven't told octoprint how much you'd like to extrude...",
          3000,
          "clicked"
        );
      }
    });
    elements.printerControls.retract.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      if (
        typeof elements.printerControls.extruder.value !== "undefined" &&
        elements.printerControls.extruder.value !== ""
      ) {
        const select = OctoPrintClient.selectTool(currentPrinter, "tool0");
        if (select) {
          let { value } = elements.printerControls.extruder;
          value = "-" + value;
          const opt = {
            command: "extrude",
            amount: parseInt(value),
          };
          const post = await OctoPrintClient.post(
            currentPrinter,
            "printer/tool",
            opt
          );
          if (post?.status === 204) {
            e.target.classList = "btn btn-success";
            setTimeout(flashReturn, 500);
          } else {
            e.target.classList = "btn btn-danger";
            setTimeout(flashReturn, 500);
          }
        }
      } else {
        UI.createAlert(
          "error",
          "You haven't told octoprint how much you'd like to retract...",
          3000,
          "clicked"
        );
      }
    });
    elements.printerControls.printStart.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "start",
      };

      const { status } = await OctoPrintClient.jobAction(
        currentPrinter,
        opts,
        e
      );
      printActionStatusResponse(status, "print");
    });
    elements.printerControls.printPause.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "pause",
      };
      const { status } = await OctoPrintClient.jobAction(
        currentPrinter,
        opts,
        e
      );
      printActionStatusResponse(status, "pause");
    });
    elements.printerControls.printRestart.addEventListener(
      "click",
      async (e) => {
        e.target.disabled = true;
        const opts = {
          command: "restart",
        };
        const { status } = await OctoPrintClient.jobAction(
          currentPrinter,
          opts,
          e
        );
        printActionStatusResponse(status, "restart");
      }
    );
    elements.printerControls.printResume.addEventListener(
      "click",
      async (e) => {
        e.target.disabled = true;
        const opts = {
          command: "pause",
          action: "resume",
        };
        const { status } = await OctoPrintClient.jobAction(
          currentPrinter,
          opts,
          e
        );
        printActionStatusResponse(status, "resume");
      }
    );
    elements.printerControls.printStop.addEventListener("click", async (e) => {
      bootbox.confirm({
        message: `${currentPrinter.printerName}: <br>Are you sure you want to cancel the ongoing print?`,
        buttons: {
          cancel: {
            label: "<i class=\"fa fa-times\"></i> Cancel",
          },
          confirm: {
            label: "<i class=\"fa fa-check\"></i> Confirm",
          },
        },
        async callback(result) {
          if (result) {
            e.target.disabled = true;
            const opts = {
              command: "cancel",
            };
            const { status } = await OctoPrintClient.jobAction(
              currentPrinter,
              opts,
              e
            );
            printActionStatusResponse(status, "cancel");
          }
        },
      });
    });
  }

  static grabPage() {
    return {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus"),
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        connectButton: document.getElementById("pmConnect"),
        portDropDown: document.getElementById("pmSerialPort"),
        baudDropDown: document.getElementById("pmBaudrate"),
        profileDropDown: document.getElementById("pmProfile"),
      },
      printerControls: {
        filamentDrop: document.getElementById("FilamentSelect"),
        fileUpload: document.getElementById("printerManagerUploadBtn"),
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
        feedRate: document.getElementById("pcFeedRate"),
        flowRate: document.getElementById("pcFlowRate"),
        feedRateValue: document.getElementById("pcFeedValue"),
        flowRateValue: document.getElementById("pcFlowValue"),
        motorsOff: document.getElementById("pcMotorTog"),
        fanPercent: document.getElementById("pcFanPercent"),
        fansOn: document.getElementById("pcFanOn"),
        fansOff: document.getElementById("pcFanOff"),
        extruder: document.getElementById("pcExtruder"),
        extrude: document.getElementById("pcExtrude"),
        retract: document.getElementById("pcRetract"),
        progress: document.getElementById("pcAxisSteps100"),
        printStart: document.getElementById("pmPrintStart"),
        printPause: document.getElementById("pmPrintPause"),
        printRestart: document.getElementById("pmPrintRestart"),
        printResume: document.getElementById("pmPrintResume"),
        printStop: document.getElementById("pmPrintStop"),
      },
      temperatures: {
        tempTime: document.getElementById("pmTempTime"),
        bed: document.querySelectorAll("[id^='bed']"),
        chamber: document.querySelectorAll("[id^='chamber']"),
        tools: document.querySelectorAll("[id^='tool']"),
      },
      filamentDrops: findBigFilamentDropDowns(),
    };
  }

  static async applyState(printer, elements) {
    if (closePrinterManagerModalIfOffline(printer)) {
      return;
    }

    updateConnectButtonState(
      printer,
      elements.mainPage.status,
      elements.connectPage.connectButton,
      elements.connectPage.printerPort,
      elements.connectPage.printerBaud,
      elements.connectPage.printerProfile
    );

    if (printer.printerState.colour.category === "Active") {
      await PrinterControlManagerService.controls(true, true);
      elements.printerControls.printStart.disabled = true;
      elements.printerControls.printStart.style.display = "inline-block";
      elements.printerControls.printPause.disabled = false;
      elements.printerControls.printPause.style.display = "inline-block";
      elements.printerControls.printStop.disabled = false;
      elements.printerControls.printStop.style.display = "inline-block";
      elements.printerControls.printRestart.disabled = true;
      elements.printerControls.printRestart.style.display = "none";
      elements.printerControls.printResume.disabled = true;
      elements.printerControls.printResume.style.display = "none";
    } else if (
      printer.printerState.colour.category === "Idle" ||
      printer.printerState.colour.category === "Complete"
    ) {
      await PrinterControlManagerService.controls(false);
      if (
        typeof printer.job !== "undefined" &&
        printer.currentJob.fileName === "No File Selected"
      ) {
        elements.printerControls.printStart.disabled = true;
        elements.printerControls.printStart.style.display = "inline-block";
        elements.printerControls.printPause.disabled = true;
        elements.printerControls.printPause.style.display = "inline-block";
        elements.printerControls.printStop.disabled = true;
        elements.printerControls.printStop.style.display = "inline-block";
        elements.printerControls.printRestart.disabled = true;
        elements.printerControls.printRestart.style.display = "none";
        elements.printerControls.printResume.disabled = true;
        elements.printerControls.printResume.style.display = "none";
      } else {
        if (printer.printerState.state === "Paused") {
          await PrinterControlManagerService.controls(false);
          elements.printerControls.printStart.disabled = true;
          elements.printerControls.printStart.style.display = "none";
          elements.printerControls.printPause.disabled = true;
          elements.printerControls.printPause.style.display = "none";
          elements.printerControls.printStop.disabled = false;
          elements.printerControls.printStop.style.display = "inline-block";
          elements.printerControls.printRestart.disabled = false;
          elements.printerControls.printRestart.style.display = "inline-block";
          elements.printerControls.printResume.disabled = false;
          elements.printerControls.printResume.style.display = "inline-block";
        } else {
          elements.printerControls.printStart.disabled = false;
          elements.printerControls.printStart.style.display = "inline-block";
          elements.printerControls.printPause.disabled = true;
          elements.printerControls.printPause.style.display = "inline-block";
          elements.printerControls.printStop.disabled = true;
          elements.printerControls.printStop.style.display = "inline-block";
          elements.printerControls.printRestart.disabled = true;
          elements.printerControls.printRestart.style.display = "none";
          elements.printerControls.printResume.disabled = true;
          elements.printerControls.printResume.style.display = "none";
        }
      }
    } else if (printerIsDisconnectedOrError(printer)) {
      await PrinterControlManagerService.controls(true);
      elements.printerControls.printStart.disabled = true;
      elements.printerControls.printStart.style.display = "inline-block";
      elements.printerControls.printPause.disabled = true;
      elements.printerControls.printPause.style.display = "inline-block";
      elements.printerControls.printStop.disabled = true;
      elements.printerControls.printStop.style.display = "inline-block";
      elements.printerControls.printRestart.disabled = true;
      elements.printerControls.printRestart.style.display = "none";
      elements.printerControls.printResume.disabled = true;
      elements.printerControls.printResume.style.display = "none";
    }
  }

  static async applyTemps(printer, elements) {
    if (printer.tools !== null) {
      const currentTemp = printer.tools[0];
      elements.temperatures.tempTime.innerHTML =
        "Updated: <i class=\"far fa-clock\"></i> " +
        new Date().toTimeString().substring(1, 8);
      if (currentTemp.bed.actual !== null) {
        elements.temperatures.bed[0].innerHTML = currentTemp.bed.actual + "°C";
        elements.temperatures.bed[1].placeholder =
          currentTemp.bed.target + "°C";
      }
      if (currentTemp.chamber.actual !== null) {
        elements.temperatures.chamber[0].innerHTML =
          currentTemp.chamber.actual + "°C";
        elements.temperatures.chamber[1].placeholder =
          currentTemp.chamber.target + "°C";
      }
      let keys = Object.keys(currentTemp);
      keys = keys.reverse();
      keys.forEach((key) => {
        if (key.includes("tool")) {
          elements.temperatures.tools.forEach((tool) => {
            if (tool.id.includes(key) && tool.id.includes("Actual")) {
              tool.innerHTML = currentTemp[key].actual + "°C";
            }
            if (tool.id.includes(key) && tool.id.includes("Target")) {
              tool.placeholder = currentTemp[key].target + "°C";
            }
          });
        }
      });

      //Setup listeners
    }
  }

  static async controls(enable, printing) {
    let elements = PrinterControlManagerService.grabPage();
    const { filamentDrops } = elements;
    const { printerControls } = elements;

    let spool = true;
    if (!filamentManager) {
      spool = false;
    }

    if (typeof printing !== "undefined" && printing) {
      printerControls.feedRate.disabled = !printing;
      printerControls.flowRate.disabled = !printing;
      printerControls.fansOn.disabled = !printing;
      printerControls.fansOff.disabled = !printing;
      filamentDrops.forEach((drop) => {
        drop.disabled = spool;
      });
    } else {
      printerControls.feedRate.disabled = enable;
      printerControls.flowRate.disabled = enable;
      printerControls.fansOn.disabled = enable;
      printerControls.fansOff.disabled = enable;
      filamentDrops.forEach((drop) => {
        drop.disabled = enable;
      });
    }
    printerControls.xPlus.disabled = enable;
    printerControls.xMinus.disabled = enable;
    printerControls.yPlus.disabled = enable;
    printerControls.yMinus.disabled = enable;
    printerControls.xyHome.disabled = enable;
    printerControls.zPlus.disabled = enable;
    printerControls.zMinus.disabled = enable;
    printerControls.zHome.disabled = enable;
    printerControls.step01.disabled = enable;
    printerControls.step1.disabled = enable;
    printerControls.step10.disabled = enable;
    printerControls.step100.disabled = enable;

    printerControls.motorsOff.disabled = enable;
    printerControls.extrude.disabled = enable;
    printerControls.retract.disabled = enable;
  }
}
