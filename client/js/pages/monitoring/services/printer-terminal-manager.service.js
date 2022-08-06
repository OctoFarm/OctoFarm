import OctoPrintClient from "../../../services/octoprint/octoprint-client.service";
import OctoFarmClient from "../../../services/octofarm-client.service";
import CustomGenerator from "../../../services/custom-gcode-scripts.service.js";
import { setupClientSwitchDropDown } from "../../../services/modal-printer-select.service";
import "../../../utils/cleanup-modals.util";
import {
  setupConnectButton,
  setupConnectButtonListeners,
  updateConnectButtonState,
} from "./connect-button.service";
import {
  closePrinterManagerModalIfOffline,
  imageOrCamera,
} from "../../../utils/octofarm.utils";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../../exceptions/application-error.handler";
import {setupModalSwitcher} from "./modal-switcher.service";

let currentIndex = 0;

let currentPrinter = null;

let filamentManager = false;

export default class PrinterTerminalManagerService {
  static async init(index, printers, printerControlList) {
    //clear camera
    if (index !== "") {
      currentIndex = index;
      const id = _.findIndex(printers, function (o) {
        return o._id == index;
      });
      currentPrinter = printers[id];

      const changeFunction = function (value) {
        PrinterTerminalManagerService.init(value, printers, printerControlList);
      };

      setupClientSwitchDropDown(
        currentPrinter._id,
        printerControlList,
        changeFunction,
        true
      );

      //Load the printer dropdown
      await PrinterTerminalManagerService.loadPrinter(
        currentPrinter,
        printerControlList
      );
      const elements = PrinterTerminalManagerService.grabPage();
      elements.terminal.terminalWindow.innerHTML = "";
      await PrinterTerminalManagerService.applyState(currentPrinter, elements);
      PrinterTerminalManagerService.applyListeners(elements, currentPrinter);
      elements.terminal.terminalWindow.scrollTop =
        elements.terminal.terminalWindow.scrollHeight;
    } else {
      if (document.getElementById("terminal")) {
        const id = _.findIndex(printers, function (o) {
          return o._id == currentIndex;
        });
        currentPrinter = printers[id];

        const elements = PrinterTerminalManagerService.grabPage();
        await PrinterTerminalManagerService.applyState(
          currentPrinter,
          elements
        );
        document.getElementById("printerManagerModal").style.overflow = "auto";
      }
    }
  }

  static async loadPrinter(printer) {
    try {
      setupConnectButton(printer);
      let serverSettings = await OctoFarmClient.getServerSettings();
      filamentManager = serverSettings.filamentManager;
      //Load tools
      document.getElementById("printerControls").innerHTML = `

          <div class="row">
            <div class="col-sm-12 col-md-4 col-lg-3 text-center">
              <h5>Camera</h5><hr>
              ${imageOrCamera(printer, undefined, "Modal")}
              <h5 class="mt-1">Filters</h5><hr>
              <form class="was-validated">
                      <div class="custom-control custom-checkbox mb-3">
                        <input 
                        type="checkbox" class="custom-control-input" id="tempMessages" required checked>
                        <label class="custom-control-label" for="tempMessages">Temperature Messages</label>
                        <div class="valid-feedback">Showing temperature messages</div>
                        <div class="invalid-feedback">Not showing temperature messages</div>
                      </div>
                      </form>
              <form class="was-validated">
               <div class="custom-control custom-checkbox mb-3">
                <input
                type="checkbox" class="custom-control-input" id="sdMessages" required checked>
                <label class="custom-control-label" for="sdMessages">SD Messages</label>
                <div class="valid-feedback">Showing sd messages</div>
                <div class="invalid-feedback">Not showing sd messages</div>
              </div>
              </form>
              <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                <input
                type="checkbox" class="custom-control-input" id="waitMessages" required checked>
                <label class="custom-control-label" for="waitMessages">Wait Responses</label>
                <div class="valid-feedback">Showing wait responses</div>
                <div class="invalid-feedback">Not showing wait responses</div>
              </div>
                </form>
              <h5 class="mt-1">Custom Gocde Scripts</h5><hr>
              <div id="customGcodeCommandsArea" class="col-lg-12 text-center"></div>    
            </div>
            <div class="col-sm-12 col-md-8 col-lg-9 text-center">
               <h5>Terminal</h5>
               <hr>
               <div id="terminal" class="terminal-window bg-secondary text-left"></div>
              <div class="input-group">
                <textarea id="terminalInput" type="text" class="form-control" placeholder="" aria-label="" aria-describedby="basic-addon2"></textarea>
                <div class="input-group-append">
                  <button class="btn btn-secondary" id="terminalInputBtn" type="submit">Send</button>
                </div>
              </div>
            </div>
          
          </div>
            `;
      setupModalSwitcher("terminal", printer);
      await CustomGenerator.generateButtons(printer);

      return true;
    } catch (e) {
      console.error(e);
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Printer Terminal - ${e}`;
      throw new ApplicationError(errorObject);
    }
  }

  static applyListeners(elements, printer) {
    setupConnectButtonListeners(printer, elements.connectPage.connectButton);

    const submitTerminal = async function (e) {
      let input = elements.terminal.input.value.match(/[^\r\n]+/g);

      if (input !== null) {
        input = input.map(function (name) {
          if (!name.includes("=")) {
            return name.toLocaleUpperCase();
          } else {
            return name;
          }
        });
      } else {
        return null;
      }

      elements.terminal.input.value = "";

      const flashReturn = function () {
        elements.terminal.sendBtn.classList = "btn btn-secondary";
      };
      const opt = {
        commands: input,
      };
      const post = await OctoPrintClient.post(
        currentPrinter,
        "printer/command",
        opt
      );
      if (post.status === 204) {
        elements.terminal.sendBtn.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        elements.terminal.sendBtn.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    };
    elements.terminal.input.addEventListener("keypress", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        await submitTerminal(e);
      }
    });
    elements.terminal.sendBtn.addEventListener("click", async (e) => {
      await submitTerminal(e);
    });
  }

  static grabPage() {
    return {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus"),
      },
      jobStatus: {
        expectedCompletionDate: document.getElementById(
          "pmExpectedCompletionDate"
        ),
        expectedTime: document.getElementById("pmExpectedTime"),
        remainingTime: document.getElementById("pmTimeRemain"),
        elapsedTime: document.getElementById("pmTimeElapsed"),
        currentZ: document.getElementById("pmCurrentZ"),
        fileName: document.getElementById("pmFileName"),
        progressBar: document.getElementById("pmProgress"),
        expectedWeight: document.getElementById("pmExpectedWeight"),
        expectedPrinterCost: document.getElementById("pmExpectedPrinterCost"),
        expectedFilamentCost: document.getElementById("pmExpectedFilamentCost"),
        expectedTotalCosts: document.getElementById("pmJobCosts"),
        printerResends: document.getElementById("printerResends"),
        resendTitle: document.getElementById("resentTitle"),
        dlpPluginDataTitle: document.getElementById("dlpPluginDataTitle"),
        dlpPluginDataData: document.getElementById("dlpPluginDataData"),
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
      terminal: {
        terminalWindow: document.getElementById("terminal"),
        sendBtn: document.getElementById("terminalInputBtn"),
        input: document.getElementById("terminalInput"),
      },
      printerControls: {
        filamentDrop: document.getElementById("filamentManagerFolderSelect"),
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
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn"),
      },
      temperatures: {
        tempTime: document.getElementById("pmTempTime"),
        bed: document.querySelectorAll("[id^='bed']"),
        chamber: document.querySelectorAll("[id^='chamber']"),
        tools: document.querySelectorAll("[id^='tool']"),
      },
      filamentDrops: document.querySelectorAll(
        "[id$=FilamentManagerFolderSelect]"
      ),
    };
  }

  static async applyState(printer, elements) {
    if (closePrinterManagerModalIfOffline(printer)) {
      return;
    }

    //Garbage collection for terminal
    const isScrolledToBottom =
      elements.terminal.terminalWindow.scrollHeight -
        elements.terminal.terminalWindow.clientHeight <=
      elements.terminal.terminalWindow.scrollTop + 1;
    elements.terminal.terminalWindow.innerHTML = "";

    if (typeof printer.terminal !== "undefined") {
      const waitCheck = document.getElementById("waitMessages").checked;
      const tempCheck = document.getElementById("tempMessages").checked;
      const sdCheck = document.getElementById("sdMessages").checked;
      for (let l = 0; l < printer.terminal.length; l++) {
        const tempMess =
          /(Send: (N\d+\s+)?M105)|(Recv:\s+(ok\s+)?.*(B|T\d*):\d+)/;
        const sdMess = /(Send: (N\d+\s+)?M27)|(Recv: SD printing byte)/;
        const sdMess2 = /Recv: Not SD printing/;
        const waitMess = /Recv: wait/;
        if (printer.terminal[l].match(tempMess)) {
          if (tempCheck) {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine temperatureMessage">${printer.terminal[l]}</div>
        `
            );
          } else {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine temperatureMessage d-none">${printer.terminal[l]}</div>
        `
            );
          }
        } else if (
          printer.terminal[l].match(sdMess) ||
          printer.terminal[l].match(sdMess2)
        ) {
          if (sdCheck) {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine sdMessage">${printer.terminal[l]}</div>
        `
            );
          } else {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine sdMessage d-none">${printer.terminal[l]}</div>
        `
            );
          }
        } else if (printer.terminal[l].match(waitMess)) {
          if (waitCheck) {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine waitMessage">${printer.terminal[l]}</div>
        `
            );
          } else {
            elements.terminal.terminalWindow.insertAdjacentHTML(
              "beforeend",
              `
          <div id="logLine${l}" class="logLine waitMessage d-none">${printer.terminal[l]}</div>
        `
            );
          }
        } else {
          elements.terminal.terminalWindow.insertAdjacentHTML(
            "beforeend",
            `
          <div id="logLine${l}" class="logLine text-light">${printer.terminal[l]}</div>
        `
          );
        }
      }
    }

    if (isScrolledToBottom) {
      elements.terminal.terminalWindow.scrollTop =
        elements.terminal.terminalWindow.scrollHeight -
        elements.terminal.terminalWindow.clientHeight;
    }

    updateConnectButtonState(
      currentPrinter,
      elements.mainPage.status,
      elements.connectPage.connectButton,
      elements.connectPage.printerPort,
      elements.connectPage.printerBaud,
      elements.connectPage.printerProfile
    );
  }
}
