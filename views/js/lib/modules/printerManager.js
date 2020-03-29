import OctoPrintClient from "../octoprint.js";
import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import * as FilamentManager from "../../filamentManagement.js";

const returnFilament = FilamentManager.returnFilament;
const chooseFilament = FilamentManager.choose;

let currentIndex = 0;

let previousLog = null;

let lastPrinter = null;

//Close modal event listeners...
$("#printerManagerModal").on("hidden.bs.modal", function(e) {
  //Fix for mjpeg stream not ending when element removed...
  document.getElementById("printerControlCamera").src = "";
  document.getElementById("printerControlCamera").remove();
});
$("#connectionModal").on("hidden.bs.modal", function(e) {
  //Fix for mjpeg stream not ending when element removed...
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterManager {
  static async init(printers) {
    let i = _.findIndex(printers, function(o) {
      return o.index == currentIndex;
    });
    let printer = null;
    if (typeof printers != "undefined" && printers != "") {
      if (typeof printers.length === "undefined") {
        printer = printers;
        lastPrinter = printers;
      } else {
        printer = printers[i];
        lastPrinter = printers[i];
      }
      if (typeof printer.options === "undefined") {
        return;
      }
      const availableBaud = printer.options.baudrates;
      const availablePort = printer.options.ports;
      const availableProfile = printer.options.printerProfiles;

      const preferedBaud = printer.options.baudratePreference;
      const preferedPort = printer.options.portPreference;
      const preferedProfile = printer.options.printerProfilePreference;
      const selectedBaud = printer.current.baudrate;
      const selectedPort = printer.current.port;
      const selectedProfile = printer.current.printerProfile;
      //Fake name
      let name = "";
      let valueName = "";
      if (
        printer.settingsAppearance.name === "null" ||
        printer.settingsAppearance.name === ""
      ) {
        name = "Type a name here and save";
        printer.settingsAppearance.name = "";
        valueName = "";
      } else {
        name = printer.settingsAppearance.name;
        valueName = printer.settingsAppearance.name;
      }

      //Fake job and progress
      let job = "";
      let progress = "";

      if (
        typeof printer.progress != "undefined" &&
        printer.progress.completion != null
      ) {
        progress = printer.progress;
      } else {
        progress = {
          completion: 0,
          filepos: 0,
          printTime: 0,
          printTimeLeft: 0
        };
      }
      if (typeof printer.job != "undefined") {
        job = printer.job;
      } else {
        job = {
          file: {
            name: "No File Selected"
          },
          estimatedPrintTime: 0,
          lastPrintTime: 0
        };
      }
      if (
        typeof printer.currentZ === "undefined" ||
        printer.currentZ === null
      ) {
        printer.currentZ = 0;
      }
      if (
        currentIndex ===
        parseInt(document.getElementById("printerIndex").innerHTML)
      ) {
      } else {
        let camURL = "";
        if (typeof printer.camURL != "undefined" && printer.camURL != "") {
          camURL = printer.camURL;
        }
        document.getElementById("printerInformation").innerHTML = `
          <h5>Printer Information</h5><hr>
          <form>
          <div class="form-row">
              <div class="col">
              <label for="newPrinterName">Printer Name</label>
              <input id="newPrinterName" type="text" class="form-control bg-dark text-white" placeholder="${name}" value="${valueName}">
  
              </div>
          </div>
          </form>
          <form>
          <div class="form-row">
              <div class="col-lg-2">
              <label for="newPrinterIP">IP Address</label>
              <input id="newPrinterIP" type="text" class="form-control bg-dark text-white" placeholder="${printer.ip}" disabled>
              </div>
              <div class="col-lg-1">
              <label for="newPrinterPort">Port</label>
              <input id="newPrinterPort" type="text" class="form-control bg-dark text-white" placeholder="${printer.port}" disabled>
              </div>
              <div class="col-lg-4">
              <label for="newPrinterCamURL">Camera URL</label>
              <input id="newPrinterCamURL" type="text" class="form-control bg-dark text-white" placeholder="${printer.camURL}" value="${camURL}">
              </div>
              <div class="col-lg-5">
              <label for="newPrinterAPIKey">API Key</label>
              <input id="newPrinterAPIKey" type="text" class="form-control bg-dark text-white" placeholder="${printer.apikey}" disabled>
              </div>
          </div>
          </form>
  
          <p class="mb-1"><b>Model:</b> ${printer.profile[selectedProfile].model} </p>
          <p class="mb-1"><b>H:</b> ${printer.profile[selectedProfile].volume.height}mm x <b>W:</b> ${printer.profile[selectedProfile].volume.width}mm x <b>D:</b> ${printer.profile[selectedProfile].volume.depth}mm</p>
          <p class="mb-1"> <b>Extruder Count:</b> ${printer.profile[selectedProfile].extruder.count}</p>
          <p class="mb-1"><b>E0 Nozzle Size:</b> ${printer.profile[selectedProfile].extruder.nozzleDiameter}</p>
          <p class="mb-1"><b>Heated Chamber:</b> ${printer.profile[selectedProfile].heatedChamber}</p>
          </div>
          
          `;
        document.getElementById("printerTerminal").innerHTML = `
          <div id="terminal" class="terminal-window bg-secondary">
  
  
          </div>`;

        document.getElementById("cameraRotation").innerHTML = `
        
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="camRot90">
          <label class="form-check-label" for="camRot90">
            Rotate your camera by 90°
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="camFlipH">
          <label class="form-check-label" for="camFlipH">
            Flip your camera horizontally
          </label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="camFlipV">
          <label class="form-check-label" for="camFlipV">
            Flip your camera vertically
          </label>
        </div>
      
      `;
        document.getElementById("camRot90").checked =
          printer.settingsWebcam.rotate90;
        document.getElementById("camFlipH").checked =
          printer.settingsWebcam.flipH;
        document.getElementById("camFlipV").checked =
          printer.settingsWebcam.flipV;

        let flipH = "";
        let flipV = "";
        let rotate90 = "";
        if (typeof printer.settingsWebcam != "undefined") {
          if (printer.settingsWebcam.flipH) {
            flipH = "flipH";
          }
          if (printer.settingsWebcam.flipV) {
            flipV = "flipV";
          }
          if (printer.settingsWebcam.rotate90) {
            rotate90 = "rotate90";
          }
        }

        document.getElementById("printerControls").innerHTML = `
          <div class="row">
          <div class="col-12 col-sm-12 col-md-4 col-lg-4 col-xl-6">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Camera</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                  <div id="cameraCol" class="col-12">
                    <img class="${flipH} ${flipV} ${rotate90}" id="printerControlCamera" width="100%" src="http://${
          printer.camURL
        }"/>
                  </div>
              </div>
          </div>
          <div class="col-12 col-sm-12 col-md-8 col-lg-8 col-xl-6">
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
                      <center><button id="pcZpos"type="button" class="btn btn-light"><i class="fas fa-arrow-up"></i></button></center>
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
                              <button id="pcAxisSteps10" type="button" class="btn btn-light" value="10">10</button>
                              <button id="pcAxisSteps100" type="button" class="btn btn-light" value="100">100</button>
                          </div>
                      </center>
                  </div>
              </div>
              <div class="row">
              <div class="col-12">
              <br>
              <center>
              <h5>Operation</h5>
          </center>
          <hr><br>
          <center>
          <button id="pmPrintStart" type="button" class="btn btn-success" role="button"><i class="fas fa-print"></i> Print</button>
          <button id="pmPrintPause" type="button" class="btn btn-light" role="button" disabled><i class="fas fa-pause"></i> Pause</button>
          <button id="pmPrintRestart" type="button" class="btn btn-danger" role="button"><i class="fas fa-undo"></i> Restart</button>
          <button id="pmPrintResume" type="button" class="btn btn-success" role="button"><i class="fas fa-redo"></i> Resume</button>
          <button id="pmPrintStop" type="button" class="btn btn-danger" disabled><i class="fas fa-square"></i> Cancel</button>
          </center></div>
          </div>
          </div>
      </div></div>
      <div class="row">
      <div class="col-md-7">
      <center>
      <h5>File Manager</h5>
  </center>
  <hr>
      </div>
      <div class="col-md-5">
      <center>
      <h5>Print Status</h5>
  </center>
  <hr>
      </div>
    </div>
          <div class="row">
      
            <div class="col-md-7">
              <div class="row">
                <div class="col-lg-12 text-center">
          
                <div class="col-12 list-group" id="fileLocations"><div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="fileManagerFolderSelect">Folders:</label> </div> <select class="custom-select bg-secondary text-light" id="fileManagerFolderSelect"><option value="local">local</option></select></div></div>
                <div class="row">
                <div class="col-lg-2">
                  <i class="fas fa-file-upload"></i><span id="fileCounts"> 0</span>
                </div>
                <div class="col-lg-10">
                  <div class="progress">
                    <div id="fileProgress" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                      0%
                    </div>
                  </div>
                </div>
              </div>
                <div class="col-12"><div class="custom-file"><label class="custom-file-label " for="printerManagerUploadBtn"><i class="fas fa-file-import"></i> Choose File(s)</label><input id="printerManagerUploadBtn" multiple="" accept=".gcode,.gco,.g" type="file" class="custom-file-input"></div></div>
                <ul class="col-12 list-group border-secondary" id="fileManagerFileList" style="height:250px; overflow-y:scroll;">
  
  
                  
                  </ul>
                </div>
              </div>
            </div>
            <div class="col-md-5">
            <div class="col-12 list-group" id="fileLocations"><div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="fileSearchBar">Search:</label> </div><input id="fileSearch" type="text" class="form-control" aria-label="Small" aria-describedby="inputGroup-sizing-sm" placeholder="Type your filename here"></div></div>
            <div class="col-12"> <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="filamentManagerFolderSelect">Filament:</label> </div> <select class="custom-select bg-secondary text-light" id="filamentManagerFolderSelect"><option value="" selected></option></select></div>
            <center>
              <div class="progress mb-2">
              <div id="pmProgress" class="progress-bar" role="progressbar progress-bar-striped" style="width:${
                progress.completion
              }%;" aria-valuenow="${
          progress.completion
        }%" aria-valuemin="0" aria-valuemax="100">${progress.completion}%</div>
            </div>
              <b>Expected Print Time: </b><p class="mb-1" id="pmExpectedTime">${Calc.generateTime(
                job.estimatedPrintTime
              )}</p>
              <b>Print Time Remaining: </b><p class="mb-1" id="pmTimeRemain">${Calc.generateTime(
                progress.printTimeLeft
              )}</p>
              <b>Print Time Elapsed: </b><p class="mb-1" id="pmTimeElapsed">${Calc.generateTime(
                job.printTime
              )}</p>
              <b>Current Z: </b><p class="mb-1" id="pmCurrentZ">${
                printer.currentZ
              }mm</p>
              <b class="mb-1">File Name: </b><p class="mb-1" id="pmFileName">${
                job.file.name
              }</p>
             
            </div>
          </div>
          `;

        printer.gcode = printer.gcode.gcode;
        let afterPrintCancelled = "";
        if (typeof printer.gcode.afterPrintCancelled != "undefined") {
          afterPrintCancelled = printer.gcode.afterPrintCancelled;
        }
        let afterPrintDone = "";
        if (typeof printer.gcode.afterPrintDone != "undefined") {
          afterPrintDone = printer.gcode.afterPrintDone;
        }
        let afterPrintPaused = "";
        if (typeof printer.gcode.afterPrintPaused != "undefined") {
          afterPrintPaused = printer.gcode.afterPrintPaused;
        }
        let afterPrinterConnected = "";
        if (typeof printer.gcode.afterPrinterConnected != "undefined") {
          afterPrinterConnected = printer.gcode.afterPrinterConnected;
        }
        let beforePrintResumed = "";
        if (typeof printer.gcode.beforePrintResumed != "undefined") {
          beforePrintResumed = printer.gcode.beforePrintResumed;
        }
        let afterToolChange = "";
        if (typeof printer.gcode.afterToolChange != "undefined") {
          afterToolChange = printer.gcode.afterToolChange;
        }
        let beforePrintStarted = "";
        if (typeof printer.gcode.beforePrintStarted != "undefined") {
          beforePrintStarted = printer.gcode.beforePrintStarted;
        }
        let beforePrinterDisconnected = "";
        if (typeof printer.gcode.beforePrinterDisconnected != "undefined") {
          beforePrinterDisconnected = printer.gcode.beforePrinterDisconnected;
        }
        let beforeToolChange = "";
        if (typeof printer.gcode.beforeToolChange != "undefined") {
          beforeToolChange = printer.gcode.beforeToolChange;
        }
        document.getElementById("printerManagerGcode").innerHTML = `
          <div class="form-group">
              <label for="settingsAfterPrinterCancelled">After Printing Cancelled</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterCancelled" rows="2">${afterPrintCancelled}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterDone">After Printing Done</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterDone" rows="2">${afterPrintDone}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterPaused">After Printing Paused</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterPaused" rows="2">${afterPrintPaused}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterConnected">After Printer Connected</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterConnected" rows="2">${afterPrinterConnected}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsAfterToolChange">After Tool Change</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterToolChange" rows="2">${afterToolChange}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsBeforePrinterResumed">Before Printing Resumed</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterResumed" rows="2">${beforePrintResumed}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsBeforePrinterStarted">Before Printing Started</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterStarted" rows="2">${beforePrintStarted}</textarea>
              </div>
              <div class="form-group">
              <labe
              l for="settingsBeforePrinterDisconnected">Before Printer Disconnected</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterDisconnected" rows="2">${beforePrinterDisconnected}</textarea>
              </div>
              <div class="form-group">
              <label for="settingsBeforeToolChange">Before Tool Change</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforeToolChange" rows="2">${beforeToolChange}</textarea>
              </div>
          `;
        document.getElementById("printerControls").insertAdjacentHTML(
          "beforeend",
          `<div class="row">
          <div class="col-12 col-sm-12 col-md-6">
              <center>
                  <h5>Tool 0</h5>
              </center>
              <hr>
              <div class="md-form input-group mb-3">
                  <div class="input-group-prepend">
                      <span id="pcE0Actual" class="input-group-text">Actual: °C</span>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcE0neg">-</button>
                  </div>
                  <input id="pcE0Target" type="text" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                  <div class="input-group-append">
                      <span class="input-group-text">°C</span>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcE0pos">+</button>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcE0set">Set</button>
                  </div>
              </div>
          </div>
          <div class="col-12 col-sm-12 col-md-6">
              <center>
                  <h5>Bed</h5>
              </center>
              <hr>
              <div class="md-form input-group mb-3">
                  <div class="input-group-prepend">
                      <span id="pcBedActual" class="input-group-text">Actual: °C</span>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcBedneg">-</button>
                  </div>
                  <input id="pcBedTarget" type="text" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                  <div class="input-group-append">
                      <span class="input-group-text">°C</span>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcBedpos">+</button>
                      <button class="btn btn-md btn-light m-0 px-3" type="button" id="pcBedset">Set</button>
                  </div>
              </div>
          </div>
      </div>
      <div class="row">
          <div class="col-12 col-sm-12 col-md-12 col-lg-5 col-xl-5">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Feed / Flow Rate</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                  <div class="col-8">
                      <label for="pcFeed">Feed Rate: <span id="pcFeedValue">${printer.feedRate}%</span></label>
                      <input type="range" class="octoRange custom-range" min="50" max="150" step="1" id="pcFeed" value="${printer.feedRate}">
                  </div>
                  <div class="col-4">
                      <button id="pcFeedRate" type="button" class="btn btn-light">Update</button>
                  </div>
              </div>
              <div class="row">
                  <div class="col-8">
                      <label for="pcFlow">Flow Rate: <span id="pcFlowValue">${printer.flowRate}%</span></label>
                      <input type="range" class="octoRange custom-range" min="75" max="125" step="1" id="pcFlow" value="${printer.flowRate}">
                  </div>
                  <div class="col-4">
                      <button id="pcFlowRate" type="button" class="btn btn-light">Update</button>
                  </div>
              </div>
          </div>
          <div class="col-12 col-sm-12 col-md-12 col-lg-3 col-xl-3">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Motors / Fans</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                  <div class="col-12">
                      <center><button id="pcMotorTog" class="btn btn-light" type="submit">Motors Off</button></center>
                  </div>
              </div>
              <div class="row">
                  <div class="col-12">
                  <label for="pcFlow">Fan Percent: <span id="pcFanPercent">100%</span></label>
                  <input type="range" class="octoRange custom-range" min="0" max="100" step="1" id="pcFanPercent" value="100">
                      <center><button id="pcFanOn" class="btn btn-light" type="submit">Set Fans</button> <button id="pcFanOff" class="btn btn-light" type="submit">Fans Off</button></center>
                  </div>
              </div>
          </div>
          <div class="col-12 col-sm-12 col-md-12 col-lg-4 col-xl-4">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Extruder</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                  <div class="col-12">
                      <center>
                          <div class="input-group mb-3">
                              <input id="pcExtruder" type="text" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="basic-addon2">
                              <div class="input-group-append">
                                  <span class="input-group-text" id="basic-addon2">mm</span>
                              </div>
                          </div>
                      </center>
                  </div>
              <div class="row">
                  <div class="col-12 text-center">
                      <center><button id="pcExtrude" class="btn btn-light" type="submit"><i class="fas fa-redo"></i> Extrude</button> <button id="pcRetract" class="btn btn-light" type="submit"><i class="fas fa-undo"></i> Retract</button></center>
              </div>
          </div>
          </div>
  `
        );
        let pluginManager = document.getElementById("printerManagerPlugins");
        pluginManager.innerHTML = "";
        let plugins = Object.keys(printer.plugins);
        plugins.forEach(plug => {
          pluginManager.insertAdjacentHTML(
            "beforeend",
            `
          
          <div style="display:inline-block;">
            <label class="">${plug}</label>
           
            <div class="invalid-feedback" style="display:inline-block;">Not Supported</div>
          </div>
          
          `
          );
          // <div class="valid-feedback" style="display:inline-block;">Activated!</div>
        });
        document.getElementById("printerIndex").innerHTML = i;
        document.getElementById("printerWeb").innerHTML =
          '<center><a href="http://' +
          printer.url +
          '" target="_blank"><button id="printerWebInterfaceBtn" type="button" class="btn btn-info"><i class="fas fa-globe-europe"></i><br> Web Interface</button></a></center>';
        document.getElementById("printerRestart").innerHTML =
          '<center><button id="printerRestartBtn" type="button" class="btn btn-warning" href="#" target="_blank"><i class="fas fa-redo"></i><br>Restart Octoprint</button></center>';
        document.getElementById("printerReboot").innerHTML =
          ' <center><button id="printerRebootBtn" type="button" class="btn btn-danger" href="#" target="_blank"><i class="fas fa-sync-alt"></i><br>Reboot System</button></center>';
        document.getElementById("printerShutdown").innerHTML =
          '<center><button id="printerShutdownBtn" type="button" class="btn btn-danger" href="#" target="_blank"><i class="fas fa-power-off"></i><br>Shutdown System</button></center>';
        document.getElementById("printerManagerFooter").innerHTML =
          '<button id="savePrinterBtn" type="button" class="btn btn-success float-left">Save Changes</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>';

        let rolls = returnFilament();
        let filamentKeys = rolls.checked;

        let filamentSelect = document.getElementById(
          "filamentManagerFolderSelect"
        );
        filamentKeys.forEach((e, index) => {
          filamentSelect.insertAdjacentHTML(
            "beforeend",
            `  
                <option value="${e._id}">${e.roll.name} - ${e.roll.type[1]} - ${e.roll.colour} (${e.roll.manufacturer})</option>
            `
          );
        });
        filamentSelect.addEventListener("change", e => {
          chooseFilament(e.target, i);
        });
        if (
          typeof printer.selectedFilament != "undefined" &&
          printer.selectedFilament != null &&
          printer.selectedFilament.name != null
        ) {
          filamentSelect.value = printer.selectedFilament.id;
        }
        const printerPort = document.getElementById("printerPortDrop");
        const printerBaud = document.getElementById("printerBaudDrop");
        const printerProfile = document.getElementById("printerProfileDrop");
        const printerConnect = document.getElementById("printerConnect");

        printerPort.innerHTML =
          '<label for="dashboardSerialPort">Port:</label><select id="pmSerialPort" class="form-control inline"></select>';
        printerBaud.innerHTML =
          '<label for="dashboardBaudrate">Baudrate:</label><select id="pmBaudrate" class="form-control inline"></select>';
        printerProfile.innerHTML =
          '<label for="dashboardPrinterProfile">Profile:</label><select id="pmProfile" class="form-control inline"></select>';
        availableBaud.forEach(baud => {
          document
            .getElementById("pmBaudrate")
            .insertAdjacentHTML(
              "beforeend",
              `<option value="${baud}">${baud}</option>`
            );
        });
        if (preferedBaud != null) {
          document.getElementById("pmBaudrate").value = preferedBaud;
        }
        availablePort.forEach(port => {
          document
            .getElementById("pmSerialPort")
            .insertAdjacentHTML(
              "beforeend",
              `<option value="${port}">${port}</option>`
            );
        });
        if (preferedPort != null) {
          document.getElementById("pmSerialPort").value = preferedPort;
        }
        availableProfile.forEach(profile => {
          document
            .getElementById("pmProfile")
            .insertAdjacentHTML(
              "beforeend",
              `<option value="${profile.id}">${profile.name}</option>`
            );
        });
        if (preferedProfile != null) {
          document.getElementById("pmProfile").value = preferedProfile;
        }
        if (printer.state === "Closed") {
          printerConnect.innerHTML =
            '<center> <button id="pmConnect" class="btn btn-success inline" value="connect">Connect</button></center>';
        } else {
          printerConnect.innerHTML =
            '<center> <button id="pmConnect" class="btn btn-danger inline" value="disconnect">Disconnect</button></center>';
          document.getElementById("pmSerialPort").disabled = true;
          document.getElementById("pmBaudrate").disabled = true;
          document.getElementById("pmProfile").disabled = true;
        }
        let elements = PrinterManager.grabPage();
        elements.terminal.terminalWindow.innerHTML = "";
        let folder = document.getElementById("fileManagerFolderSelect");

        if (typeof printer.filesList != "undefined") {
          printer.filesList.files.forEach(file => {
            if (file.path === folder.options[folder.selectedIndex].text) {
              PrinterManager.drawFileList(
                file,
                elements.jobStatus.fileManagerFileList
              );
              PrinterManager.applyFileListeners(
                printer,
                file.name,
                file.fullPath
              );
            }
          });
          printer.filesList.folders.forEach(folder => {
            elements.jobStatus.fileManagerFolderSelect.insertAdjacentHTML(
              "beforeend",
              `
              <option value="${folder.name}">${folder.name}</option></select>
          `
            );
          });
        }
        PrinterManager.applyListeners(printer, elements);
      }
      PrinterManager.applyState(printer, job, progress);
      document.getElementById("printerManagerModal").style.overflow = "auto";
    }
  }
  static applyListeners(printer, elements) {
    let rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach(slider => {
      slider.addEventListener("input", e => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });
    if (printer.state != "Closed") {
      elements.connectPage.connectButton.addEventListener("click", e => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(
          elements.connectPage.connectButton.value,
          printer
        );
      });
    } else {
      elements.connectPage.connectButton.addEventListener("click", e => {
        elements.connectPage.connectButton.disabled = true;
        OctoPrintClient.connect(
          elements.connectPage.connectButton.value,
          printer
        );
      });
    }
    elements.jobStatus.fileManagerFolderSelect.addEventListener("change", e => {
      PrinterManager.changeFolder(
        printer,
        elements.jobStatus.fileManagerFileList,
        elements.jobStatus.fileManagerFolderSelect
      );
    });
    elements.jobStatus.fileSearch.addEventListener("keyup", e => {
      PrinterManager.search(printer, elements);
    });
    //Octoprint listeners, restart...
    elements.connectPage.restartButton.addEventListener("click", e => {
      OctoPrintClient.system(printer, "restart");
    });
    elements.connectPage.rebootButton.addEventListener("click", e => {
      OctoPrintClient.system(printer, "reboot");
    });
    elements.connectPage.shutdownButton.addEventListener("click", e => {
      OctoPrintClient.system(printer, "shutdown");
    });
    //Control Listeners... There's a lot!
    elements.printerControls.xPlus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "x");
    });
    elements.printerControls.xMinus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "x", "-");
    });
    elements.printerControls.yPlus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "y");
    });
    elements.printerControls.yMinus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "y", "-");
    });
    elements.printerControls.xyHome.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "home", ["x", "y"]);
    });
    elements.printerControls.zPlus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "z");
    });
    elements.printerControls.zMinus.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "jog", "z", "-");
    });
    elements.printerControls.zHome.addEventListener("click", e => {
      OctoPrintClient.move(e, printer, "home", ["z"]);
    });
    elements.printerControls.step01.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer.index,
        newSteps: "01"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step1.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer.index,
        newSteps: "1"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step10.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer.index,
        newSteps: "10"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step100.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer.index,
        newSteps: "100"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
    });
    elements.printerControls.e0Neg.addEventListener("click", e => {
      PrinterManager.incrementTemp(e, "-");
    });
    elements.printerControls.e0Pos.addEventListener("click", e => {
      PrinterManager.incrementTemp(e, "+");
    });
    elements.printerControls.bedNeg.addEventListener("click", e => {
      PrinterManager.incrementTemp(e, "-");
    });
    elements.printerControls.begPos.addEventListener("click", e => {
      PrinterManager.incrementTemp(e, "+");
    });
    elements.printerControls.e0Set.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-md btn-light m-0 px-3";
      };
      let value = e.target.parentNode.previousSibling.previousSibling.value;
      e.target.parentNode.previousSibling.previousSibling.value = "";
      if (value === "Off") {
        value = 0;
      }
      let opt = {
        command: "target",
        targets: {
          tool0: parseInt(value)
        }
      };
      let post = await OctoPrintClient.post(printer, "printer/tool", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-md btn-success m-0 px-3";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-md btn-success m-0 px-3";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.bedSet.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-md btn-light m-0 px-3";
      };
      let value = e.target.parentNode.previousSibling.previousSibling.value;
      e.target.parentNode.previousSibling.previousSibling.value = "";
      if (value === "Off") {
        value = 0;
      }
      let opt = {
        command: "target",
        target: parseInt(value)
      };
      let post = await OctoPrintClient.post(printer, "printer/bed", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-md btn-success m-0 px-3";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-md btn-success m-0 px-3";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.feedRate.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.feedRateValue.innerHTML;
      value = value.replace("%", "");
      OctoFarmClient.post("printers/feedChange", {
        printer: printer.index,
        newSteps: value
      });
      let opt = {
        command: "feedrate",
        factor: parseInt(value)
      };
      let post = await OctoPrintClient.post(printer, "printer/printhead", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.flowRate.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.flowRateValue.innerHTML;
      value = value.replace("%", "");
      OctoFarmClient.post("printers/flowChange", {
        printer: printer.index,
        newSteps: value
      });
      let opt = {
        command: "flowrate",
        factor: parseInt(value)
      };
      console.log(opt);
      let post = await OctoPrintClient.post(printer, "printer/tool", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.motorsOff.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      let opt = {
        commands: ["M18"]
      };
      let post = await OctoPrintClient.post(printer, "printer/command", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.fansOn.addEventListener("click", async e => {
      let fanspeed = elements.printerControls.fanPercent.innerHTML;
      fanspeed = fanspeed.replace("%", "");
      fanspeed = fanspeed / 100;
      fanspeed = 255 * fanspeed;
      fanspeed = Math.floor(fanspeed);

      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      let opt = {
        commands: [`M106 S${fanspeed}`]
      };
      let post = await OctoPrintClient.post(printer, "printer/command", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.fansOff.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      let opt = {
        commands: ["M107"]
      };
      let post = await OctoPrintClient.post(printer, "printer/command", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.printerControls.extrude.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      if (
        elements.printerControls.extruder.value != undefined &&
        elements.printerControls.extruder.value !== ""
      ) {
        let select = OctoPrintClient.selectTool(printer, "tool0");
        if (select) {
          let value = elements.printerControls.extruder.value;
          let opt = {
            command: "extrude",
            amount: parseInt(value)
          };
          let post = await OctoPrintClient.post(printer, "printer/tool", opt);
          if (post.status === 204) {
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
    elements.printerControls.retract.addEventListener("click", async e => {
      let flashReturn = function() {
        e.target.classList = "btn btn-light";
      };
      if (
        elements.printerControls.extruder.value != undefined &&
        elements.printerControls.extruder.value !== ""
      ) {
        let select = OctoPrintClient.selectTool(printer, "tool0");
        if (select) {
          let value = elements.printerControls.extruder.value;
          let opt = {
            command: "extrude",
            amount: parseInt(value)
          };
          let post = await OctoPrintClient.post(
            printer,
            "printer/command",
            opt
          );
          if (post.status === 204) {
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
    elements.printerControls.printStart.addEventListener("click", async e => {
      e.target.disabled = true;
      let opts = {
        command: "start"
      };
      OctoPrintClient.jobAction(printer, opts, e);
    });
    elements.printerControls.printPause.addEventListener("click", e => {
      e.target.disabled = true;
      let opts = {
        command: "pause",
        action: "pause"
      };
      OctoPrintClient.jobAction(printer, opts, e);
    });
    elements.printerControls.printRestart.addEventListener("click", e => {
      e.target.disabled = true;
      let opts = {
        command: "restart"
      };
      OctoPrintClient.jobAction(printer, opts, e);
    });
    elements.printerControls.printResume.addEventListener("click", e => {
      e.target.disabled = true;
      let opts = {
        command: "pause",
        action: "resume"
      };
      OctoPrintClient.jobAction(printer, opts, e);
    });
    elements.printerControls.fileUpload.addEventListener("change", function() {
      handleFiles(this.files, printer);
    });
    elements.printerControls.printStop.addEventListener("click", e => {
      bootbox.confirm({
        message: `${printer.index}.  ${printer.settingsAppearance.name}: <br>Are you sure you want to cancel the ongoing print?`,
        buttons: {
          cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            label: '<i class="fa fa-check"></i> Confirm'
          }
        },
        callback: function(result) {
          if (result) {
            e.target.disabled = true;
            let opts = {
              command: "cancel"
            };
            OctoPrintClient.jobAction(printer, opts, e);
          }
        }
      });
    });
    elements.terminal.sendBtn.addEventListener("click", async e => {
      let input = elements.terminal.input.value;
      elements.terminal.input.value = "";
      let flashReturn = function() {
        e.target.classList = "btn btn-secondary";
      };
      let opt = {
        commands: [input]
      };
      let post = await OctoPrintClient.post(printer, "printer/command", opt);
      if (post.status === 204) {
        e.target.classList = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
    elements.mainPage.saveBtn.addEventListener("click", e => {
      elements.mainPage.saveBtn.innerHTML =
        "<i class='fas fa-cog fa-spin'></i> Saving Changes";
      PrinterManager.saveOctoPrintSettings(printer, elements.mainPage.saveBtn);
    });
  }
  static changeFolder(printer, fileManagerFileList, fileManagerFolderSelect) {
    fileManagerFileList.innerHTML = "";
    printer.filesList.files.forEach(file => {
      if (fileManagerFolderSelect.value === file.path) {
        PrinterManager.drawFileList(file, fileManagerFileList);

        PrinterManager.applyFileListeners(printer, file.name, file.fullPath);
      }
    });
  }
  static drawFileList(file, fileManagerFileList) {
    fileManagerFileList.insertAdjacentHTML(
      "beforeend",
      `
      
      <li id="file-${
        file.fullPath
      }" class="list-group-item list-group-item-action flex-column align-items-start bg-secondary mb-1">
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">${file.display}</h5>
        <small><i class="fas fa-stopwatch"></i>${Calc.generateTime(
          file.time
        )}</small>
      </div>
          <small class="float-right"><button id="refresh-${
            file.name
          }" role="button" class="btn btn-dark btn-sm"><i class="fas fa-sync"></i></button>&nbsp;<button id="load-${
        file.name
      }" role="button" class="btn btn-primary btn-sm"><i class="fas fa-file-upload"></i></button>&nbsp;<button id="select-${
        file.name
      }" role="button" class="btn btn-success btn-sm"><i class="fas fa-print"></i></button>&nbsp;<button id="delete-${
        file.name
      }" role="button" class="btn btn-danger btn-sm"><i class="fa fa-trash" aria-hidden="true"></i></button><p></p></small>
      </li>

      `
    );
  }
  static applyFileListeners(printer, file, fullPath) {
    document.getElementById("load-" + file).addEventListener("click", e => {
      OctoPrintClient.file(printer, fullPath, "load");
    });
    document
      .getElementById("select-" + file)
      .addEventListener("click", async e => {
        OctoPrintClient.file(printer, fullPath, "print");
      });
    document.getElementById("delete-" + file).addEventListener("click", e => {
      bootbox.confirm({
        message: `Are you sure you want to delete ${fullPath}?`,
        buttons: {
          cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            label: '<i class="fa fa-check"></i> Confirm'
          }
        },
        callback: function(result) {
          if (result) {
            OctoPrintClient.file(printer, fullPath, "delete", file);
          }
        }
      });
    });
    let refreshBtn = document.getElementById("refresh-" + file);
    refreshBtn.addEventListener("click", async e => {
      refreshBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i>';
      let done = await OctoFarmClient.post("printers/resyncFile", {
        i: printer.index,
        fullPath: fullPath
      });

      let how = await done.json();
      PrinterManager.init(lastPrinter);
      refreshBtn.innerHTML = '<i class="fas fa-sync"></i>';
      let flashReturn = function() {
        e.target.classList = "btn btn-dark btn-sm";
      };

      if (how) {
        e.target.classList = "btn btn-sm btn-success";
        setTimeout(flashReturn, 500);
      } else {
        e.target.classList = "btn btn-sm btn-danger";
        setTimeout(flashReturn, 500);
      }
    });
  }
  static search(printer, elements) {
    let ul = elements.jobStatus.fileManagerFileList;
    ul.innerHTML = "";
    let input = elements.jobStatus.fileSearch;
    let filter = input.value.toUpperCase();
    if (input.value === "") {
      //No search term so reset view
      elements.jobStatus.fileManagerFolderSelect.value = "local";
      printer.filesList.files.forEach(file => {
        if (file.path === "local") {
          PrinterManager.drawFileList(file, ul);
          PrinterManager.applyFileListeners(printer, file.name, file.fullPath);
        }
      });
    } else {
      //No search term so reset view
      ul.innerHTML = "";
      elements.jobStatus.fileManagerFolderSelect.value = "local";
      printer.filesList.files.forEach(file => {
        PrinterManager.drawFileList(file, ul);
        PrinterManager.applyFileListeners(printer, file.name, file.fullPath);
      });
    }

    let button = ul.querySelectorAll('*[id^="file-"]');
    for (let i = 0; i < button.length; i++) {
      let file = button[i].id;
      filter = filter.replace(/ /g, "_");
      if (file.toUpperCase().indexOf(filter) > -1) {
        button[i].style.display = "";
      } else {
        button[i].style.display = "none";
      }
    }
  }
  static grabPage() {
    let printerManager = {
      mainPage: {
        title: document.getElementById("printerManagerTitle"),
        status: document.getElementById("pmStatus"),
        plugins: document.getElementById("printerManagerPlugins"),
        saveBtn: document.getElementById("savePrinterBtn")
      },
      jobStatus: {
        expectedTime: document.getElementById("pmExpectedTime"),
        remainingTime: document.getElementById("pmTimeRemain"),
        elapsedTime: document.getElementById("pmTimeElapsed"),
        currentZ: document.getElementById("pmCurrentZ"),
        fileName: document.getElementById("pmFileName"),
        progressBar: document.getElementById("pmProgress"),
        fileManagerFolderSelect: document.getElementById(
          "fileManagerFolderSelect"
        ),
        fileManagerFileList: document.getElementById("fileManagerFileList"),
        fileSearch: document.getElementById("fileSearch")
      },
      connectPage: {
        webButton: document.getElementById("printerWebInterfaceBtn"),
        restartButton: document.getElementById("printerRestartBtn"),
        rebootButton: document.getElementById("printerRebootBtn"),
        shutdownButton: document.getElementById("printerShutdownBtn"),
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
        e0Neg: document.getElementById("pcE0neg"),
        e0Target: document.getElementById("pcE0Target"),
        e0Actual: document.getElementById("pcE0Actual"),
        e0Pos: document.getElementById("pcE0pos"),
        bedNeg: document.getElementById("pcBedneg"),
        bedTarget: document.getElementById("pcBedTarget"),
        bedActual: document.getElementById("pcBedActual"),
        begPos: document.getElementById("pcBedpos"),
        e0Set: document.getElementById("pcE0set"),
        bedSet: document.getElementById("pcBedset"),
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
      menu: {
        printer: document.getElementById("printer-connection-btn"),
        control: document.getElementById("printer-control-btn"),
        terminal: document.getElementById("printer-terminal-btn"),
        plugins: document.getElementById("printer-plugins-btn"),
        gcode: document.getElementById("printer-gcode-btn"),
        settings: document.getElementById("printer-settings-btn")
      }
    };
    return printerManager;
  }
  static async applyState(printer, job, progress) {
    //Garbage collection for terminal
    let terminalCount = document.querySelectorAll(".logLine");
    let elements = await PrinterManager.grabPage();
    //init global info
    if (printer.settingsAppearance.name === "") {
      elements.mainPage.title.innerHTML = "Octoprint Manager:";
    } else {
      elements.mainPage.title.innerHTML =
        "Octoprint Manager: " +
        printer.index +
        ". " +
        printer.settingsAppearance.name;
    }

    elements.mainPage.status.innerHTML = printer.state;
    elements.mainPage.status.className = `btn btn-${printer.stateColour.name} mb-2`;

    //Check which view is active... hopefully save some CPU.

    if (
      elements.menu.printer.classList.contains("active") ||
      elements.menu.control.classList.contains("active")
    ) {
      elements.connectPage.restartButton.disabled = true;
      elements.connectPage.rebootButton.disabled = true;
      elements.connectPage.shutdownButton.disabled = true;

      elements.printerControls["step" + printer.stepRate].className =
        "btn btn-dark active";
      elements.jobStatus.progressBar.innerHTML =
        Math.round(progress.completion) + "%";
      elements.jobStatus.progressBar.style.width = progress.completion + "%";
      elements.jobStatus.expectedTime.innerHTML = Calc.generateTime(
        job.estimatedPrintTime
      );
      elements.jobStatus.remainingTime.innerHTML = Calc.generateTime(
        progress.printTimeLeft
      );
      elements.jobStatus.elapsedTime.innerHTML = Calc.generateTime(
        progress.printTime
      );
      elements.jobStatus.currentZ.innerHTML = printer.currentZ + "mm";
      elements.jobStatus.fileName.innerHTML = job.file.name;

      if (printer.stateColour.category === "Active") {
        if (
          typeof printer.temps != "undefined" &&
          typeof printer.temps[0].tool0 != "undefined" &&
          typeof printer.temps[0].tool0.target != "undefined"
        ) {
          elements.printerControls.e0Target.placeholder =
            printer.temps[0].tool0.target + "°C";
          elements.printerControls.e0Actual.innerHTML =
            "Actual: " + printer.temps[0].tool0.actual + "°C";
          elements.printerControls.bedTarget.placeholder =
            printer.temps[0].bed.target + "°C";
          elements.printerControls.bedActual.innerHTML =
            "Actual: " + printer.temps[0].bed.actual + "°C";
          if (
            printer.temps[0].tool0.actual >
              printer.temps[0].tool0.target - 0.5 &&
            printer.temps[0].tool0.actual < printer.temps[0].tool0.target + 0.5
          ) {
            elements.printerControls.e0Actual.classList =
              "input-group-text Complete";
          } else if (printer.temps[0].tool0.actual < 35) {
            elements.printerControls.e0Actual.classList = "input-group-text";
          } else {
            elements.printerControls.e0Actual.classList =
              "input-group-text Active";
          }
          if (
            printer.temps[0].bed.actual > printer.temps[0].bed.target - 0.5 &&
            printer.temps[0].bed.actual < printer.temps[0].bed.target + 0.5
          ) {
            elements.printerControls.bedActual.classList =
              "input-group-text Complete";
          } else if (printer.temps[0].bed.actual < 35) {
            elements.printerControls.bedActual.classList = "input-group-text";
          } else {
            elements.printerControls.bedActual.classList =
              "input-group-text Active";
          }
        }

        PrinterManager.controls(true, true);
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
        printer.stateColour.category === "Idle" ||
        printer.stateColour.category === "Complete"
      ) {
        PrinterManager.controls(false);
        elements.connectPage.restartButton.disabled = false;
        elements.connectPage.rebootButton.disabled = false;
        elements.connectPage.shutdownButton.disabled = false;
        elements.connectPage.connectButton.value = "disconnect";
        elements.connectPage.connectButton.innerHTML = "Disconnect";
        elements.connectPage.connectButton.classList = "btn btn-danger inline";
        elements.connectPage.connectButton.disabled = false;
        if (
          typeof printer.temps != "undefined" &&
          typeof printer.temps[0].tool0 != "undefined" &&
          typeof printer.temps[0].tool0.target != "undefined"
        ) {
          elements.printerControls.e0Target.placeholder =
            printer.temps[0].tool0.target + "°C";
          elements.printerControls.e0Actual.innerHTML =
            "Actual: " + printer.temps[0].tool0.actual + "°C";
          elements.printerControls.bedTarget.placeholder =
            printer.temps[0].bed.target + "°C";
          elements.printerControls.bedActual.innerHTML =
            "Actual: " + printer.temps[0].bed.actual + "°C";
        }
        elements.printerControls.e0Actual.classList = "input-group-text";
        elements.printerControls.bedActual.classList = "input-group-text";
        elements.connectPage.restartButton.disabled = false;
        elements.connectPage.rebootButton.disabled = false;
        elements.connectPage.shutdownButton.disabled = false;
        elements.connectPage.printerPort.disabled = true;
        elements.connectPage.printerBaud.disabled = true;
        elements.connectPage.printerProfile.disabled = true;
        if (
          typeof printer.job != "undefined" &&
          printer.job.filename === "No File Selected"
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
          if (printer.state === "Paused") {
            PrinterManager.controls(false);
            elements.printerControls.printStart.disabled = true;
            elements.printerControls.printStart.style.display = "none";
            elements.printerControls.printPause.disabled = true;
            elements.printerControls.printPause.style.display = "none";
            elements.printerControls.printStop.disabled = false;
            elements.printerControls.printStop.style.display = "inline-block";
            elements.printerControls.printRestart.disabled = false;
            elements.printerControls.printRestart.style.display =
              "inline-block";
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
      } else if (
        printer.stateColour.category === "Offline" ||
        printer.stateColour.category === "Closed"
      ) {
        elements.connectPage.connectButton.value = "connect";
        elements.connectPage.connectButton.innerHTML = "Connect";
        elements.connectPage.connectButton.classList = "btn btn-success inline";
        elements.connectPage.connectButton.disabled = false;
        elements.printerControls.e0Target.placeholder = 0 + "°C";
        elements.printerControls.e0Actual.innerHTML = "Actual: " + 0 + "°C";
        elements.printerControls.bedTarget.placeholder = 0 + "°C";
        elements.printerControls.bedActual.innerHTML = "Actual: " + 0 + "°C";
        elements.connectPage.restartButton.disabled = false;
        elements.connectPage.rebootButton.disabled = false;
        elements.connectPage.shutdownButton.disabled = false;
        elements.printerControls.e0Actual.classList = "input-group-text";
        elements.printerControls.bedActual.classList = "input-group-text";
        PrinterManager.controls(true);
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
        if (printer.stateColour.category === "Offline") {
          $("#printerManagerModal").modal("hide");
        }
      }
    }
    if (elements.menu.terminal.classList.contains("active")) {
      let isScrolledToBottom =
        elements.terminal.terminalWindow.scrollHeight -
          elements.terminal.terminalWindow.clientHeight <=
        elements.terminal.terminalWindow.scrollTop + 1;
      if (typeof printer.logs != "undefined") {
        //console.log(printer.logs);
        let logText = printer.logs.join("<br />");
        if (logText != previousLog) {
          elements.terminal.terminalWindow.insertAdjacentHTML(
            "beforeend",
            `<div id="logLine-${terminalCount.length}" class="logLine">${logText}</div>`
          );
          if (terminalCount.length > 15) {
            for (let i = 0; i < terminalCount.length - 5; i++) {
              terminalCount[i].remove();
            }
          }
        }

        if (isScrolledToBottom) {
          elements.terminal.terminalWindow.scrollTop =
            elements.terminal.terminalWindow.scrollHeight -
            elements.terminal.terminalWindow.clientHeight;
        }
      }
    }
  }
  static async controls(enable, printing) {
    let elements = await PrinterManager.grabPage();
    elements = elements.printerControls;
    if (typeof printing != "undefined" && printing) {
      elements.e0Neg.disabled = !printing;
      elements.e0Target.disabled = !printing;
      elements.e0Actual.disabled = !printing;
      elements.e0Pos.disabled = !printing;
      elements.bedNeg.disabled = !printing;
      elements.bedTarget.disabled = !printing;
      elements.begPos.disabled = !printing;
      elements.e0Set.disabled = !printing;
      elements.bedSet.disabled = !printing;
      elements.feedRate.disabled = !printing;
      elements.flowRate.disabled = !printing;
      elements.fansOn.disabled = !printing;
      elements.fansOff.disabled = !printing;
    } else {
      elements.e0Neg.disabled = enable;
      elements.e0Target.disabled = enable;
      elements.e0Actual.disabled = enable;
      elements.e0Pos.disabled = enable;
      elements.bedNeg.disabled = enable;
      elements.bedTarget.disabled = enable;
      elements.begPos.disabled = enable;
      elements.e0Set.disabled = enable;
      elements.bedSet.disabled = enable;
      elements.feedRate.disabled = enable;
      elements.flowRate.disabled = enable;
      elements.fansOn.disabled = enable;
      elements.fansOff.disabled = enable;
    }
    elements.xPlus.disabled = enable;
    elements.xMinus.disabled = enable;
    elements.yPlus.disabled = enable;
    elements.yMinus.disabled = enable;
    elements.xyHome.disabled = enable;
    elements.zPlus.disabled = enable;
    elements.zMinus.disabled = enable;
    elements.zHome.disabled = enable;
    elements.step01.disabled = enable;
    elements.step1.disabled = enable;
    elements.step10.disabled = enable;
    elements.step100.disabled = enable;

    elements.motorsOff.disabled = enable;
    elements.extrude.disabled = enable;
    elements.retract.disabled = enable;
  }
  static async updateIndex(newIndex) {
    currentIndex = newIndex;
  }
  static incrementTemp(e, dir) {
    if (dir === "-") {
      let current = e.target.parentNode.nextSibling.nextSibling;
      if (current.value === "" || current.value === "Off") {
        current.value = 0;
      }
      if (current.value < 1) {
        current.value = "Off";
      }
      if (current.value >= -1) {
        current.value = parseInt(current.value) - 1;
      }
    } else if (dir === "+") {
      let current = e.target.parentNode.previousSibling.previousSibling;
      if (current.value === "" || current.value === "Off") {
        current.value = 0;
      }
      if (current.value >= -1) {
        current.value = parseInt(current.value) + 1;
      }
    }
  }
  static async saveOctoPrintSettings(printer, saveBtn) {
    let settingsAfterPrinterConnected = document.getElementById(
      "settingsAfterPrinterConnected"
    ).value;
    let settingsAfterToolChange = document.getElementById(
      "settingsAfterToolChange"
    ).value;
    let settingsBeforeToolChange = document.getElementById(
      "settingsBeforeToolChange"
    ).value;
    let settingsBeforePrinterDisconnected = document.getElementById(
      "settingsBeforePrinterDisconnected"
    ).value;
    let settingsBeforePrinterStarted = document.getElementById(
      "settingsBeforePrinterStarted"
    ).value;
    let settingsAfterPrinterCancelled = document.getElementById(
      "settingsAfterPrinterCancelled"
    ).value;
    let settingsAfterPrinterDone = document.getElementById(
      "settingsAfterPrinterDone"
    ).value;
    let settingsAfterPrinterPaused = document.getElementById(
      "settingsAfterPrinterPaused"
    ).value;
    let settingsBeforePrinterResumed = document.getElementById(
      "settingsBeforePrinterResumed"
    ).value;
    let newPrinterCamURL = document.getElementById("newPrinterCamURL").value;
    let settingsRotatecam = document.getElementById("camRot90").checked;
    let settingsFlipH = document.getElementById("camFlipH").checked;
    let settingsFlipV = document.getElementById("camFlipV").checked;
    let printerNameChange = document.getElementById("newPrinterName").value;
    let opts = {
      scripts: {
        gcode: {
          afterPrintCancelled: settingsAfterPrinterCancelled,
          afterPrintDone: settingsAfterPrinterDone,
          afterPrintPaused: settingsAfterPrinterPaused,
          afterPrinterConnected: settingsAfterPrinterConnected,
          afterToolChange: settingsAfterToolChange,
          beforePrintResumed: settingsBeforePrinterResumed,
          beforePrintStarted: settingsBeforePrinterStarted,
          beforePrinterDisconnected: settingsBeforePrinterDisconnected,
          beforeToolChange: settingsBeforeToolChange
        }
      },
      appearance: {
        name: printerNameChange
      },
      webcam: {
        rotate90: settingsRotatecam,
        flipH: settingsFlipH,
        flipV: settingsFlipV
      }
    };
    let octoPost = await OctoPrintClient.post(printer, "settings", opts);
    if (octoPost.status === 200) {
      UI.createAlert(
        "success",
        `Printer: ${printer.index} OctoPrint has updated successfully`,
        3000,
        "click"
      );
    } else {
      UI.createAlert(
        "error",
        `Printer: ${printer.index} OctoPrint has failed to update...`,
        3000,
        "click"
      );
    }
    opts.camURL = newPrinterCamURL;
    let farmPost = await OctoFarmClient.post("printers/updateSettings", {
      index: printer.index,
      options: opts
    });
    if (farmPost.status === 200) {
      UI.createAlert(
        "success",
        `Printer: ${printer.index} OctoFarm has updated successfully`,
        3000,
        "click"
      );
    } else {
      UI.createAlert(
        "error",
        `Printer: ${printer.index} OctoFarm failed to update...`,
        3000,
        "click"
      );
    }
    saveBtn.innerHTML = "Save Changes";
  }
}
async function handleFiles(Afiles, printer) {
  Afiles = [...Afiles];
  let count = document.getElementById("fileCounts");
  count.innerHTML = " " + Afiles.length;

  UI.createAlert(
    "warning",
    "Your files are uploading, do not close the modal or refresh the page until complete.",
    5000,
    "Clicked"
  );

  for (let i = 0; i < Afiles.length; i++) {
    let file = await fileUpload(printer, Afiles[i]);
    file = JSON.parse(file);
    file.name = file.files.local.name;
    file.fullPath = file.files.local.path;
    file.display = file.name;
    file.index = currentIndex;
    let post = await OctoFarmClient.post("printers/newFiles", file);
    PrinterManager.drawFileList(
      file,
      document.getElementById("fileManagerFileList")
    );
    count.innerHTML = " " + parseInt(count.innerHTML - 1);

    PrinterManager.applyFileListeners(printer, file.name, file.fullPath);
  }
}
async function fileUpload(printerInfo, file) {
  return new Promise(function(resolve, reject) {
    //Grab folder location
    let currentFolder = document.getElementById("fileManagerFolderSelect");
    currentFolder = currentFolder.options[currentFolder.selectedIndex].text;
    //Grab Client Info
    let index = currentIndex;
    let loadingBar = document.getElementById("fileProgress");
    //XHR doesn't like posting without it been a form, can't use offical octoprint api way...
    //Create form data
    let formData = new FormData();
    let path = "";
    if (currentFolder.includes("local/")) {
      path = currentFolder.replace("local/", "");
    }
    formData.append("file", file);
    formData.append("path", path);
    let url =
      "http://" + printerInfo.ip + ":" + printerInfo.port + "/api/files/local";
    var xhr = new XMLHttpRequest();
    file = file;
    xhr.open("POST", url);
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        loadingBar.innerHTML = Math.floor((e.loaded / e.total) * 100) + "%";
        loadingBar.style.width = Math.floor((e.loaded / e.total) * 100) + "%";
      }
    };

    //xhr.setRequestHeader("Content-Type", "multipart/form-data");
    xhr.setRequestHeader("X-Api-Key", printerInfo.apikey);
    xhr.onloadstart = function(e) {
      loadingBar.className = "progress-bar progress-bar-striped bg-warning";
    };
    xhr.onloadend = async function(e) {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
        loadingBar.className = "progress-bar progress-bar-striped bg-success";
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
        loadingBar.className = "progress-bar progress-bar-striped bg-danger";
      }
    };
    xhr.onerror = function() {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    if (file.name.includes(".gcode")) {
      xhr.send(formData);
    } else {
      UI.createAlert(
        "error",
        `Sorry but ${file.name} is not a gcode file, not uploading.`,
        3000,
        ""
      );
    }
  });
}
