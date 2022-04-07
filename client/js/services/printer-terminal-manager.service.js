import OctoPrintClient from "./octoprint-client.service";
import OctoFarmClient from "./octofarm-client.service";
import UI from "../utils/ui.js";
import {returnDropDown} from "./filament-manager-plugin.service";
import CustomGenerator from "./custom-gcode-scripts.service.js";
import {setupClientSwitchDropDown} from "./modal-printer-select.service";

let currentIndex = 0;

let currentPrinter = null;

let filamentManager = false;

const refreshCounter = 5000;
$("#printerManagerModal").on("hidden.bs.modal", function (e) {
  // Fix for mjpeg stream not ending when element removed...

  if (document.getElementById("printerControlCamera")) {
    document.getElementById("printerControlCamera").src = "";
  }
});
$("#connectionModal").on("hidden.bs.modal", function (e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterTerminalManagerService {
  static async init(index, printers, printerControlList) {
    //clear camera
    if (index !== "") {
      if (document.getElementById("printerControlCamera")) {
        document.getElementById("printerControlCamera").src = "";
      }

      currentIndex = index;
      const id = _.findIndex(printers, function (o) {
        return o._id == index;
      });
      currentPrinter = printers[id];

      const changeFunction = function (value) {
        PrinterTerminalManagerService.init(value, printers, printerControlList);
      };

      setupClientSwitchDropDown(currentPrinter._id, printerControlList, changeFunction, true);

      //Load the printer dropdown
      const filamentDropDown = await returnDropDown();
      await PrinterTerminalManagerService.loadPrinter(
        currentPrinter,
        printerControlList,
        filamentDropDown
      );
      const elements = PrinterTerminalManagerService.grabPage();
      elements.terminal.terminalWindow.innerHTML = "";
      PrinterTerminalManagerService.applyState(currentPrinter, elements);
      PrinterTerminalManagerService.applyListeners(elements, printers, filamentDropDown);
    } else {
      if (document.getElementById("terminal")) {
        const id = _.findIndex(printers, function (o) {
          return o._id == currentIndex;
        });
        currentPrinter = printers[id];

        const elements = PrinterTerminalManagerService.grabPage();
        PrinterTerminalManagerService.applyState(currentPrinter, elements);
        document.getElementById("printerManagerModal").style.overflow = "auto";
      }
    }
  }

  static async loadPrinter(printer, printerControlList, filamentDropDown) {
    try {
      const printerPort = document.getElementById("printerPortDrop");
      const printerBaud = document.getElementById("printerBaudDrop");
      const printerProfile = document.getElementById("printerProfileDrop");
      const printerConnect = document.getElementById("printerConnect");

      printerPort.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardSerialPort">Port:</label> </div> <select class="custom-select bg-secondary text-light" id="pmSerialPort"></select></div>
    `;
      printerBaud.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardBaudrate">Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="pmBaudrate"></select></div>
    `;
      printerProfile.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardPrinterProfile">Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="pmProfile"></select></div>
    `;
      printer.connectionOptions.baudrates.forEach((baud) => {
        if (baud !== 0) {
          document
            .getElementById("pmBaudrate")
            .insertAdjacentHTML("beforeend", `<option value="${baud}">${baud}</option>`);
        } else {
          document
            .getElementById("pmBaudrate")
            .insertAdjacentHTML("beforeend", `<option value="${baud}">AUTO</option>`);
        }
      });
      if (printer.connectionOptions.baudratePreference != null) {
        document.getElementById("pmBaudrate").value = printer.connectionOptions.baudratePreference;
      }
      printer.connectionOptions.ports.forEach((port) => {
        document
          .getElementById("pmSerialPort")
          .insertAdjacentHTML("beforeend", `<option value="${port}">${port}</option>`);
      });
      if (printer.connectionOptions.portPreference != null) {
        document.getElementById("pmSerialPort").value = printer.connectionOptions.portPreference;
      }
      printer.connectionOptions.printerProfiles.forEach((profile) => {
        document
          .getElementById("pmProfile")
          .insertAdjacentHTML(
            "beforeend",
            `<option value="${profile.id}">${profile.name}</option>`
          );
      });
      if (printer.connectionOptions.printerProfilePreference != null) {
        document.getElementById("pmProfile").value =
          printer.connectionOptions.printerProfilePreference;
      }
      if (
        printer.printerState.state === "Disconnected" ||
        printer.printerState.state === "Error!"
      ) {
        printerConnect.innerHTML =
          "<center> <button id=\"pmConnect\" class=\"btn btn-success inline\" value=\"connect\">Connect</button><a title=\"Open your Printers Web Interface\" id=\"pmWebBtn\" type=\"button\" class=\"tag btn btn-info ml-1\" target=\"_blank\" href=\"" +
          printer.printerURL +
          "\" role=\"button\"><i class=\"fas fa-globe-europe\"></i></a><div id=\"powerBtn-" +
          printer._id +
          "\" class=\"btn-group ml-1\"></div></center>";
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      } else {
        printerConnect.innerHTML =
          "<center> <button id=\"pmConnect\" class=\"btn btn-danger inline\" value=\"disconnect\">Disconnect</button><a title=\"Open your Printers Web Interface\" id=\"pmWebBtn\" type=\"button\" class=\"tag btn btn-info ml-1\" target=\"_blank\" href=\"" +
          printer.printerURL +
          "\" role=\"button\"><i class=\"fas fa-globe-europe\"></i></a><div id=\"pmPowerBtn-" +
          printer._id +
          "\" class=\"btn-group ml-1\"></div></center>";
        document.getElementById("pmSerialPort").disabled = true;
        document.getElementById("pmBaudrate").disabled = true;
        document.getElementById("pmProfile").disabled = true;
      }
      let serverSettings = await OctoFarmClient.getServerSettings();
      filamentManager = serverSettings.filamentManager;
      //Load tools
      document.getElementById("printerControls").innerHTML = `
          <div class="row">
                <div class="col-12">
                    <center>
                        <h5>Custom Gocde Scripts</h5>
                    </center>
                    <hr>
                </div>
              <div id="customGcodeCommandsArea" class="col-lg-12 text-center">
              </div>
          </div>
          <div class="row">
                <div class="col-12">
                    <center>
                        <h5>Terminal</h5>
                    </center>
                    <hr>
                </div>
                </div>
                <div class="row">
                 <div id="terminal" class="terminal-window bg-secondary">
                  </div>
                    <div class="input-group">
                      <textarea id="terminalInput" type="text" class="form-control" placeholder="" aria-label="" aria-describedby="basic-addon2"></textarea>
                      <div class="input-group-append">
                        <button class="btn btn-secondary" id="terminalInputBtn" type="submit">Send</button>
                      </div>
                    </div>
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
                </div>
            </div>
            `;
      CustomGenerator.generateButtons(printer);

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
    }
  }

  static applyListeners(elements) {
    if (currentPrinter.state != "Disconnected") {
      elements.connectPage.connectButton.addEventListener("click", (e) => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(elements.connectPage.connectButton.value, currentPrinter);
      });
    } else {
      elements.connectPage.connectButton.addEventListener("click", (e) => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(elements.connectPage.connectButton.value, currentPrinter);
      });
    }

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
        commands: input
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/command", opt);
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
        submitTerminal(e);
      }
    });
    elements.terminal.sendBtn.addEventListener("click", async (e) => {
      submitTerminal(e);
    });
  }

  static grabPage() {
    const printerManager = {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus")
      },
      jobStatus: {
        expectedCompletionDate: document.getElementById("pmExpectedCompletionDate"),
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
        dlpPluginDataData: document.getElementById("dlpPluginDataData")
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        connectButton: document.getElementById("pmConnect"),
        portDropDown: document.getElementById("pmSerialPort"),
        baudDropDown: document.getElementById("pmBaudrate"),
        profileDropDown: document.getElementById("pmProfile")
      },
      terminal: {
        terminalWindow: document.getElementById("terminal"),
        sendBtn: document.getElementById("terminalInputBtn"),
        input: document.getElementById("terminalInput")
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
        printStop: document.getElementById("pmPrintStop")
      },
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn")
      },
      temperatures: {
        tempTime: document.getElementById("pmTempTime"),
        bed: document.querySelectorAll("[id^='bed']"),
        chamber: document.querySelectorAll("[id^='chamber']"),
        tools: document.querySelectorAll("[id^='tool']")
      },
      filamentDrops: document.querySelectorAll("[id$=FilamentManagerFolderSelect]")
    };

    return printerManager;
  }

  static async applyState(printer, elements) {
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
        const tempMess = /(Send: (N\d+\s+)?M105)|(Recv:\s+(ok\s+)?.*(B|T\d*):\d+)/;
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
        } else if (printer.terminal[l].match(sdMess) || printer.terminal[l].match(sdMess2)) {
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
          <div id="logLine${l}" class="logLine">${printer.terminal[l]}</div>
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
    elements.mainPage.status.innerHTML = printer.printerState.state;
    elements.mainPage.status.className = `btn btn-${printer.printerState.colour.name} mb-2`;
  }
}
