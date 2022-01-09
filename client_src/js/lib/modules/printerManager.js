import OctoPrintClient from "../octoprint";
import OctoFarmClient from "../../services/octofarm-client.service";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import { createFilamentSelector } from "../../services/filament-manager-plugin.service";
import CustomGenerator from "./customScripts.js";
import { setupClientSwitchDropDown } from "../../services/client-modal.service";

let currentIndex = 0;

let controlDropDown = false;

let currentPrinter = null;

let filamentManager = false;

$("#connectionModal").on("hidden.bs.modal", function (e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterManager {
  static async init(index, printers, printerControlList) {
    try {
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
          PrinterManager.init(value, printers, printerControlList);
        };
        setupClientSwitchDropDown(currentPrinter._id, printerControlList, changeFunction, true);
        await PrinterManager.loadPrinter(currentPrinter, printerControlList);
        const elements = PrinterManager.grabPage();
        elements.printerControls["step" + currentPrinter.stepRate].className =
          "btn btn-dark active";
        PrinterManager.applyState(currentPrinter, elements);
        PrinterManager.applyTemps(currentPrinter, elements);
        PrinterManager.applyListeners(elements, printers);
      } else {
        const id = _.findIndex(printers, function (o) {
          return o._id == currentIndex;
        });
        currentPrinter = printers[id];
        const elements = await PrinterManager.grabPage();
        PrinterManager.applyState(currentPrinter, elements);
        PrinterManager.applyTemps(currentPrinter, elements);
        document.getElementById("printerManagerModal").style.overflow = "auto";
      }
    } catch (e) {
      UI.createAlert(
        "danger",
        "The volatility of this is astounding... Error:" + JSON.stringify(e),
        0,
        "Clicked"
      );
    }
  }

  static async loadPrinter(printer, printerControlList) {
    //Load Connection Panel

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
          '<center> <button id="pmConnect" class="btn btn-success inline" value="connect">Connect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
          printer.printerURL +
          '" role="button"><i class="fas fa-globe-europe"></i></a><div id="powerBtn-' +
          printer._id +
          '" class="btn-group ml-1"></div></center>';
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      } else {
        printerConnect.innerHTML =
          '<center> <button id="pmConnect" class="btn btn-danger inline" value="disconnect">Disconnect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
          printer.printerURL +
          '" role="button"><i class="fas fa-globe-europe"></i></a><div id="pmPowerBtn-' +
          printer._id +
          '" class="btn-group ml-1"></div></center>';
        document.getElementById("pmSerialPort").disabled = true;
        document.getElementById("pmBaudrate").disabled = true;
        document.getElementById("pmProfile").disabled = true;
      }
      //setup power btn
      // await PowerButton.applyBtn(printer, "pmPowerBtn-");

      let flipH = "";
      let flipV = "";
      let rotate90 = "";
      if (printer.otherSettings !== null) {
        if (printer.otherSettings.webCamSettings.flipH) {
          flipH = "rotateY(180deg)";
        }
        if (printer.otherSettings.webCamSettings.flipV) {
          flipV = "rotateX(180deg)";
        }
        if (printer.otherSettings.webCamSettings.rotate90) {
          rotate90 = "rotate(90deg)";
        }
      }

      let clientSettings = await OctoFarmClient.getClientSettings();
      let serverSettings = await OctoFarmClient.getServerSettings();
      filamentManager = serverSettings.filamentManager;
      let controlSettings = clientSettings.controlSettings;

      let thumbnailClass = "d-none";
      if (!!printer?.currentJob?.thumbnail) {
        thumbnailClass = "col-md-12 col-lg-4";
      }

      //Load tools

      document.getElementById("printerControls").innerHTML = `



            <div class="row">
                <!-- Camera -->
                <div class="col-md-4 col-lg-3 text-center">
                  <span id="cameraRow">  
                    <h5>Camera</h5><hr>
                    <div class="row">
                       <div class="col-12">
                          <img style="transform: ${flipH} ${flipV} ${rotate90};" id="printerControlCamera" width="100%" src=""/>
                        </div>
                    </div>
                  </span>
                  <h5>Operation</h5><hr>
                  <button id="pmPrintStart" type="button" class="btn btn-success" role="button"><i class="fas fa-print"></i> Print</button>
                  <button id="pmPrintPause" type="button" class="btn btn-light" role="button" disabled><i class="fas fa-pause"></i> Pause</button>
                  <button id="pmPrintRestart" type="button" class="btn btn-danger" role="button"><i class="fas fa-undo"></i> Restart</button>
                  <button id="pmPrintResume" type="button" class="btn btn-success" role="button"><i class="fas fa-redo"></i> Resume</button>
                  <button id="pmPrintStop" type="button" class="btn btn-danger" disabled><i class="fas fa-square"></i> Cancel</button>
                  <span id="customGcodeCommandsArea" class="d-none">
                     <h5 class="mt-2">Custom Gcode</h5><hr>
                  </span>
                </div>
                <!-- Print Status -->
                <div class="col-md-4 col-lg-6 text-center">
                    <h5>Print Status</h5><hr>                               
                    <div class="row">
                       <div class="col-12">       
                           <div class="progress mb-2">
                             <div id="pmProgress" class="progress-bar" role="progressbar progress-bar-striped" style="width:100%" aria-valuenow="100%" aria-valuemin="0" aria-valuemax="100">Loading... </div>
                           </div>
                           <div class="row">
                             <div class="col-md-6 col-lg-8">
                                 <b class="mb-1">File Name: </b><br><p title="Loading..." class="tag mb-1" id="pmFileName">Loading...</p>
                             </div>
                             <div class="col-md-6 col-lg-4">
                                <b>Expected Completion Date: </b><p class="mb-1" id="pmExpectedCompletionDate">Loading...</p>
                             </div>
                           </div>
                  
                       </div>    
                    </div>
                    <div class="row">
                        <div id="fileThumbnail" class="${thumbnailClass}">
  
                        </div>
                        <div class="col">
                            <div class="row">
                                <div class="col-md-4 col-lg-4">
                                    <b>Expected Time: </b><p class="mb-1" id="pmExpectedTime">Loading...</p>
                                </div>
                                <div class="col-md-4 col-lg-4">
                                    <b>Time Elapsed: </b><p class="mb-1" id="pmTimeElapsed">Loading...</p>
                                </div>
                                <div class="col-md-4 col-lg-4">
                                    <b>Time Remaining: </b><p class="mb-1" id="pmTimeRemain">Loading...</p>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4 col-lg-4">                             
                                  <b>Current Z: </b><p class="mb-1" id="pmCurrentZ">Loading...</p>
                                </div>
                                <div class="col-md-4 col-lg-4">
                                  <b id="resentTitle" class="mb-1 d-none">Resend Statistics: </b><br><p title="Current job resend ratio" class="tag mb-1 d-none" id="printerResends">Loading...</p>                          
                                </div>
                                <div class="col-md-4 col-lg-4">                    
                                  <b id="dlpPluginDataTitle" class="mb-1 d-none">Layer Progress: </b><br><p title="Current job resend ratio" class="tag mb-1 d-none" id="dlpPluginDataData">Loading...</p>            
                                </div>
                            </div>
                        </div>
                    </div>    
                    <h5>Expected Costs</h5><hr>        
                    <div class="row">
                      <div class="col-md-2 col-lg-3">
                        <b>Job Cost: </b><p class="mb-1" id="pmJobCosts">Loading...</p></center>          
                      </div>
                      <div class="col-md-4 col-lg-3"><b class="mb-1">Units Consumed: </b><br><p class="tag mb-1" id="pmExpectedWeight">Loading...</p></div>
                      <div class="col-md-2 col-lg-3"><b class="mb-1">Printer Costs: </b><br><p class="tag mb-1" id="pmExpectedPrinterCost">Loading...</p></div>
                      <div class="col-md-3 col-lg-3"><b class="mb-1">Material Costs: </b><br><p class="tag mb-1" id="pmExpectedFilamentCost">Loading...</p></div>
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
                    <h5>Extrusion</h5><hr>
                    <div class="row">
                    <div class="col-4">
                            <div class="input-group">
                                <input id="pcExtruder" type="number" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="basic-addon2">
                                <div class="input-group-append">
                                    <span class="input-group-text" id="basic-addon2">mm</span>
                                </div>
                            </div>
                    </div>
                     <div class="col-8">
                      <div class="btn-group" role="group" aria-label="Basic example">
                        <button id="pcExtrude" class="btn btn-light"><i class="fas fa-redo"></i> Extrude</button> 
                        <button id="pcRetract" class="btn btn-light"><i class="fas fa-undo"></i> Retract</button>
                      </div>
            </div>
            </div>
                </div>
                <!-- Control -->
                <div class="col-md-4 col-lg-4 text-center">
                    <h5>Control</h5><hr>    
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
                  </div>
                <!-- Feed/Flow -->
                <div class="col-md-4 col-lg-4 text-center">
                  <h5>Feed/Flow Rate</h5><hr>
                  <div class="row">
                      <div class="col-10 col-lg-8 col-xl-8">
                          <label for="pcFeed">Feed Rate: <span id="pcFeedValue">${printer.feedRate}%</span></label>
                          <input type="range" class="octoRange custom-range" min="10" max="300" step="1" id="pcFeed" value="${printer.feedRate}">
                      </div>
                      <div class="col-2 col-lg-4 col-xl-4">
                          <button id="pcFeedRate" type="button" class="btn btn-light">Update</button>
                      </div>
                  </div>
                  <div class="row">
                      <div class="col-10 col-lg-8 col-xl-8">
                          <label for="pcFlow">Flow Rate: <span id="pcFlowValue">${printer.flowRate}%</span></label>
                          <input type="range" class="octoRange custom-range" min="75" max="125" step="1" id="pcFlow" value="${printer.flowRate}">
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

            </div>
            `;

      let camURL = "";
      if (typeof printer.camURL !== "undefined" && printer.camURL.includes("http")) {
        camURL = printer.camURL;
      } else {
        camURL = "../../../images/noCamera.jpg";
      }
      //Load camera
      const camTitle = document.getElementById("cameraRow");
      if (printer.otherSettings.webCamSettings.webcamEnabled) {
        document.getElementById("printerControlCamera").src = camURL;
        if (camTitle.classList.contains("d-none")) {
          camTitle.classList.remove("d-none");
        }
      } else {
        if (!camTitle.classList.contains("d-none")) {
          camTitle.classList.add("d-none");
        }
      }
      const printerToolTemps = document.getElementById("pmToolTemps");
      document.getElementById("pmOtherTemps").innerHTML = "";
      printerToolTemps.innerHTML = "";

      if (typeof printer.currentProfile !== "undefined" && printer.currentProfile !== null) {
        const keys = Object.keys(printer.currentProfile);
        for (let t = 0; t < keys.length; t++) {
          if (keys[t].includes("extruder")) {
            for (let i = 0; i < printer.currentProfile[keys[t]].count; i++) {
              printerToolTemps.insertAdjacentHTML(
                "beforeend",
                `
                                <div class="col-8">
                                   <div class="md-form input-group mb-3">
       
                                      <div title="Actual Tool temperature" class="input-group-prepend">
                                          <span class="input-group-text"><span>${i}: </span><span id="tool${i}Actual"> 0°C</span></span>
                                      </div>
                                      <input title="Set your target Tool temperature" id="tool${i}Target" type="number" class="form-control col" placeholder="0°C" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                                      <div class="input-group-append">
                                          <button class="btn btn-md btn-light m-0 p-1" type="button" id="tool${i}Set">Set</button>
                                      </div>
                                  </div>
                                </div>
                                <div class="col-4">
                                 <div class="input-group mb-1"> <select class="custom-select bg-secondary text-light" id="tool${i}FilamentManagerFolderSelect"><option value="" selected></option></select></div>
                                </div>
                                `
              );
              const pmFilamentDrop = document.getElementById(`tool${i}FilamentManagerFolderSelect`);
              await createFilamentSelector(pmFilamentDrop, printer, i);
            }
          } else if (keys[t].includes("heatedBed")) {
            if (printer.currentProfile[keys[t]]) {
              document.getElementById("pmOtherTemps").insertAdjacentHTML(
                "beforeend",
                `
                           <div class="col">
                          <center>
                              <h5>Bed</h5>
                          </center>
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
          } else if (keys[t].includes("heatedChamber")) {
            if (printer.currentProfile[keys[t]]) {
              document.getElementById("pmOtherTemps").insertAdjacentHTML(
                "beforeend",
                `
                         <div class="col">
                          <center>
                              <h5>Chamber</h5>
                          </center>
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
    }
  }

  static applyListeners(elements, printers) {
    const rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach((slider) => {
      slider.addEventListener("input", (e) => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });
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

    //Control Listeners... There's a lot!
    elements.printerControls.xPlus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "x");
    });
    elements.printerControls.xMinus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "x", "-");
    });
    elements.printerControls.yPlus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "y");
    });
    elements.printerControls.yMinus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "y", "-");
    });
    elements.printerControls.xyHome.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "home", ["x", "y"]);
    });
    elements.printerControls.zPlus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "z");
    });
    elements.printerControls.zMinus.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "jog", "z", "-");
    });
    elements.printerControls.zHome.addEventListener("click", (e) => {
      OctoPrintClient.move(e, currentPrinter, "home", ["z"]);
    });
    elements.printerControls.step01.addEventListener("click", (e) => {
      OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "01"
      });
      elements.printerControls.step01.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step1.addEventListener("click", (e) => {
      OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "1"
      });
      elements.printerControls.step1.className = "btn btn-dark active";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step10.addEventListener("click", (e) => {
      OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "10"
      });
      elements.printerControls.step10.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step100.addEventListener("click", (e) => {
      OctoFarmClient.post("printers/stepChange", {
        printer: currentPrinter._id,
        newSteps: "100"
      });
      elements.printerControls.step100.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
    });

    if (currentPrinter.currentProfile !== null) {
      const keys = Object.keys(currentPrinter.currentProfile);
      for (let t = 0; t < keys.length; t++) {
        if (keys[t].includes("extruder")) {
          for (let i = 0; i < currentPrinter.currentProfile[keys[t]].count; i++) {
            const toolSet = async function (e) {
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
                  ["tool" + i]: parseInt(value)
                }
              };
              const post = await OctoPrintClient.post(currentPrinter, "printer/tool", opt);
              if (post.status === 204) {
                document.getElementById("tool" + i + "Set").className =
                  "btn btn-md btn-success m-0 p-1";
                setTimeout(flashReturn, 500);
              } else {
                document.getElementById("tool" + i + "Set").className =
                  "btn btn-md btn-danger m-0 p-1";
                setTimeout(flashReturn, 500);
              }
            };
            document.getElementById("tool" + i + "Target").addEventListener("change", async (e) => {
              if (document.getElementById("tool" + i + "Target").value <= 0) {
                document.getElementById("tool" + i + "Target").value = "0";
              }
            });
            document
              .getElementById("tool" + i + "Target")
              .addEventListener("keypress", async (e) => {
                if (e.key === "Enter") {
                  toolSet(e);
                }
              });
            document.getElementById("tool" + i + "Set").addEventListener("click", async (e) => {
              toolSet(e);
            });
          }
        } else if (keys[t].includes("heatedBed")) {
          if (currentPrinter.currentProfile[keys[t]]) {
            const bedSet = async function (e) {
              const flashReturn = function () {
                elements.temperatures.bed[2].classList = "btn btn-md btn-light m-0 p-1";
              };
              let { value } = elements.temperatures.bed[1];

              elements.temperatures.bed[1].value = "";
              if (value === "Off") {
                value = 0;
              }
              const opt = {
                command: "target",
                target: parseInt(value)
              };
              const post = await OctoPrintClient.post(currentPrinter, "printer/bed", opt);
              if (post.status === 204) {
                elements.temperatures.bed[2].className = "btn btn-md btn-success m-0 p-1";
                elements.temperatures.bed[2].value = "";
                setTimeout(flashReturn, 500);
              } else {
                elements.temperatures.bed[2].className = "btn btn-md btn-success m-0 p-1";
                elements.temperatures.bed[2].value = "";
                setTimeout(flashReturn, 500);
              }
            };
            if (elements.temperatures.bed[1]) {
              elements.temperatures.bed[1].addEventListener("change", async (e) => {
                if (elements.temperatures.bed[1].value <= 0) {
                  elements.temperatures.bed[1].value = "";
                }
              });
            }

            elements.temperatures.bed.forEach((node) => {
              if (node.id.includes("Target")) {
                if (node) {
                  node.addEventListener("keypress", async (e) => {
                    if (e.key === "Enter") {
                      bedSet(e);
                    }
                  });
                }
              }
              if (node.id.includes("Set")) {
                if (node) {
                  node.addEventListener("click", async (e) => {
                    bedSet(e);
                  });
                }
              }
            });
          }
        } else if (keys[t].includes("heatedChamber")) {
          if (currentPrinter.currentProfile[keys[t]]) {
            const chamberSet = async function (e) {
              const flashReturn = function () {
                elements.temperatures.chamber[2].classList = "btn btn-md btn-light m-0 p-1";
              };
              let { value } = elements.temperatures.chamber[1];

              elements.temperatures.chamber[1].value = "";
              if (value === "Off") {
                value = 0;
              }
              const opt = {
                command: "target",
                target: parseInt(value)
              };
              const post = await OctoPrintClient.post(currentPrinter, "printer/chamber", opt);
              if (post.status === 204) {
                elements.temperatures.chamber[2].className = "btn btn-md btn-success m-0 p-1";
                setTimeout(flashReturn, 500);
              } else {
                elements.temperatures.chamber[2].className = "btn btn-md btn-success m-0 p-1";
                setTimeout(flashReturn, 500);
              }
            };
            if (elements.temperatures.chamber[1]) {
              elements.temperatures.chamber[1].addEventListener("change", async (e) => {
                if (elements.temperatures.chamber[1].value <= 0) {
                  elements.temperatures.chamber[1].value = "";
                }
              });
            }

            elements.temperatures.chamber.forEach((node) => {
              if (node.id.includes("Target")) {
                if (node) {
                  node.addEventListener("keypress", async (e) => {
                    if (e.key === "Enter") {
                      chamberSet(e);
                    }
                  });
                }
              }
              if (node.id.includes("Set")) {
                if (node) {
                  node.addEventListener("click", async (e) => {
                    chamberSet(e);
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
      OctoFarmClient.post("printers/feedChange", {
        printer: currentPrinter._id,
        newSteps: value
      });
      const opt = {
        command: "feedrate",
        factor: parseInt(value)
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/printhead", opt);
      if (post.status === 204) {
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
      OctoFarmClient.post("printers/flowChange", {
        printer: currentPrinter._id,
        newSteps: value
      });
      const opt = {
        command: "flowrate",
        factor: parseInt(value)
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/tool", opt);
      if (post.status === 204) {
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
        commands: ["M18"]
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/command", opt);
      if (post.status === 204) {
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
      fanspeed = Math.floor(fanspeed);

      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      const opt = {
        commands: [`M106 S${fanspeed}`]
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/command", opt);
      if (post.status === 204) {
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
        commands: ["M107"]
      };
      const post = await OctoPrintClient.post(currentPrinter, "printer/command", opt);
      if (post.status === 204) {
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
        elements.printerControls.extruder.value != undefined &&
        elements.printerControls.extruder.value !== ""
      ) {
        const select = OctoPrintClient.selectTool(currentPrinter, "tool0");
        if (select) {
          const { value } = elements.printerControls.extruder;
          const opt = {
            command: "extrude",
            amount: parseInt(value)
          };
          const post = await OctoPrintClient.post(currentPrinter, "printer/tool", opt);
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
    elements.printerControls.retract.addEventListener("click", async (e) => {
      const flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      if (
        elements.printerControls.extruder.value != undefined &&
        elements.printerControls.extruder.value !== ""
      ) {
        const select = OctoPrintClient.selectTool(currentPrinter, "tool0");
        if (select) {
          let { value } = elements.printerControls.extruder;
          value = "-" + value;
          const opt = {
            command: "extrude",
            amount: parseInt(value)
          };
          const post = await OctoPrintClient.post(currentPrinter, "printer/tool", opt);
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
    elements.printerControls.printStart.addEventListener("click", async (e) => {
      e.target.disabled = true;
      const opts = {
        command: "start"
      };

      OctoPrintClient.jobAction(currentPrinter, opts, e);
    });
    elements.printerControls.printPause.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "pause"
      };
      OctoPrintClient.jobAction(currentPrinter, opts, e);
    });
    elements.printerControls.printRestart.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "restart"
      };
      OctoPrintClient.jobAction(currentPrinter, opts, e);
    });
    elements.printerControls.printResume.addEventListener("click", (e) => {
      e.target.disabled = true;
      const opts = {
        command: "pause",
        action: "resume"
      };
      OctoPrintClient.jobAction(currentPrinter, opts, e);
    });
    elements.printerControls.printStop.addEventListener("click", (e) => {
      bootbox.confirm({
        message: `${currentPrinter.printerName}: <br>Are you sure you want to cancel the ongoing print?`,
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
            e.target.disabled = true;
            const opts = {
              command: "cancel"
            };
            OctoPrintClient.jobAction(currentPrinter, opts, e);
          }
        }
      });
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
    elements.mainPage.status.innerHTML = printer.printerState.state;
    elements.mainPage.status.className = `btn btn-${printer.printerState.colour.name} mb-2`;
    let dateComplete = null;
    const camField = document.getElementById("fileThumbnail");
    if (typeof printer.currentJob !== "undefined" && printer.currentJob.thumbnail != null) {
      if (
        camField.innerHTML !==
        `<center><img width="100%" src="${printer.printerURL}/${printer.currentJob.thumbnail}"></center>`
      ) {
        camField.innerHTML = `<center><img width="100%" src="${printer.printerURL}/${printer.currentJob.thumbnail}"></center>`;
      }
    } else {
      if (camField.innerHTML !== "") {
        camField.innerHTML = "";
      }
    }
    if (
      typeof printer.currentJob !== "undefined" &&
      printer.currentJob.printTimeRemaining !== null
    ) {
      let currentDate = new Date();

      if (printer.currentJob.progress === 100) {
        dateComplete = "Print Ready for Harvest";
      } else {
        currentDate = currentDate.getTime();
        const futureDateString = new Date(
          currentDate + printer.currentJob.printTimeRemaining * 1000
        ).toDateString();
        let futureTimeString = new Date(
          currentDate + printer.currentJob.printTimeRemaining * 1000
        ).toTimeString();
        futureTimeString = futureTimeString.substring(0, 8);
        dateComplete = futureDateString + ": " + futureTimeString;
      }
    } else {
      dateComplete = "No Active Print";
    }

    elements.jobStatus.expectedCompletionDate.innerHTML = dateComplete;

    if (typeof printer.resends !== "undefined" && printer.resends !== null) {
      if (elements.jobStatus.printerResends.classList.contains("d-none")) {
        elements.jobStatus.printerResends.classList.remove("d-none");
        elements.jobStatus.resendTitle.classList.remove("d-none");
      }
      elements.jobStatus.printerResends.innerHTML = `
      ${printer.resends.count} / ${
        printer.resends.transmitted / 1000
      }K (${printer.resends.ratio.toFixed(0)})
      `;
    }

    if (printer?.layerData) {
      if (elements.jobStatus.dlpPluginDataTitle.classList.contains("d-none")) {
        elements.jobStatus.dlpPluginDataTitle.classList.remove("d-none");
        elements.jobStatus.dlpPluginDataData.classList.remove("d-none");
      }
      elements.jobStatus.dlpPluginDataData.innerHTML = `${printer.layerData.currentLayer} / ${printer.layerData.totalLayers} (${printer.layerData.percentComplete}%)`;
    }

    if (typeof printer.currentJob !== "undefined" && printer.currentJob.progress !== null) {
      elements.jobStatus.progressBar.innerHTML = printer.currentJob.progress.toFixed(0) + "%";
      elements.jobStatus.progressBar.style.width = printer.currentJob.progress.toFixed(2) + "%";
    } else {
      elements.jobStatus.progressBar.innerHTML = 0 + "%";
      elements.jobStatus.progressBar.style.width = 0 + "%";
    }

    elements.jobStatus.expectedTime.innerHTML = Calc.generateTime(
      printer.currentJob.expectedPrintTime
    );
    elements.jobStatus.remainingTime.innerHTML = Calc.generateTime(
      printer.currentJob.printTimeRemaining
    );
    elements.jobStatus.elapsedTime.innerHTML = Calc.generateTime(
      printer.currentJob.printTimeElapsed
    );
    if (printer.currentJob.currentZ === null) {
      elements.jobStatus.currentZ.innerHTML = "No Active Print";
    } else {
      elements.jobStatus.currentZ.innerHTML = printer.currentJob.currentZ + "mm";
    }

    if (typeof printer.currentJob === "undefined") {
      elements.jobStatus.fileName.setAttribute("title", "No File Selected");
      const fileName = "No File Selected";
      elements.jobStatus.fileName.innerHTML = fileName;
    } else {
      elements.jobStatus.fileName.setAttribute("title", printer.currentJob.filePath);
      let fileName = printer.currentJob.fileDisplay;
      if (fileName.length > 49) {
        fileName = fileName.substring(0, 49) + "...";
      }

      elements.jobStatus.fileName.innerHTML = printer.currentJob.fileDisplay;
      let usageDisplay = "";
      let filamentCost = "";
      if (printer.currentJob.expectedTotals !== null) {
        usageDisplay += `<p class="mb-0"><b>Total: </b>${printer.currentJob.expectedTotals.totalLength.toFixed(
          2
        )}m / ${printer.currentJob.expectedTotals.totalWeight.toFixed(2)}g</p>`;
        elements.jobStatus.expectedTotalCosts.innerHTML =
          printer.currentJob.expectedTotals.totalCost;
      } else {
        usageDisplay = "No File Selected";
        elements.jobStatus.expectedTotalCosts.innerHTML = "No File Selected";
      }
      if (typeof printer.currentJob.expectedFilamentCosts === "object") {
        if (printer.currentJob.expectedFilamentCosts !== null) {
          printer.currentJob.expectedFilamentCosts.forEach((unit) => {
            const firstKey = Object.keys(unit)[0];
            let theLength = parseFloat(unit[firstKey].length);
            let theWeight = parseFloat(unit[firstKey].weight);
            usageDisplay += `<p class="mb-0"><b>${unit[firstKey].toolName}: </b>${theLength.toFixed(
              2
            )}m / ${theWeight.toFixed(2)}g</p>`;
          });

          filamentCost += `<p class="mb-0"><b>Total: </b>${printer.currentJob.expectedTotals.spoolCost.toFixed(
            2
          )}</p>`;
          printer.currentJob.expectedFilamentCosts.forEach((unit) => {
            const firstKey = Object.keys(unit)[0];
            filamentCost += `<p class="mb-0"><b>${unit[firstKey].toolName}: </b>${unit[firstKey].cost}</p>`;
          });
        } else {
          filamentCost = "No length estimate";
        }
      } else {
        filamentCost = "No File Selected";
      }

      elements.jobStatus.expectedWeight.innerHTML = usageDisplay;

      elements.jobStatus.expectedFilamentCost.innerHTML = filamentCost;

      const printCost = printer.currentJob.expectedPrinterCosts;

      elements.jobStatus.expectedPrinterCost.innerHTML = printCost;
    }

    if (printer.printerState.colour.category === "Active") {
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
      printer.printerState.colour.category === "Idle" ||
      printer.printerState.colour.category === "Complete"
    ) {
      PrinterManager.controls(false);
      elements.connectPage.connectButton.value = "disconnect";
      elements.connectPage.connectButton.innerHTML = "Disconnect";
      elements.connectPage.connectButton.classList = "btn btn-danger inline";
      elements.connectPage.connectButton.disabled = false;
      elements.connectPage.printerPort.disabled = true;
      elements.connectPage.printerBaud.disabled = true;
      elements.connectPage.printerProfile.disabled = true;
      if (typeof printer.job !== "undefined" && printer.job.filename === "No File Selected") {
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
          PrinterManager.controls(false);
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
    } else if (
      printer.printerState.colour.category === "Offline" ||
      printer.printerState.colour.category === "Disconnected"
    ) {
      if (printer.printerState.state === "Error!") {
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      }
      elements.connectPage.connectButton.value = "connect";
      elements.connectPage.connectButton.innerHTML = "Connect";
      elements.connectPage.connectButton.classList = "btn btn-success inline";
      elements.connectPage.connectButton.disabled = false;
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
      if (
        printer.printerState.state.category === "Offline" ||
        printer.state === "Shutdown" ||
        printer.state === "Searching..."
      ) {
        $("#printerManagerModal").modal("hide");
      }
    }
  }

  static async applyTemps(printer, elements) {
    if (printer.tools !== null) {
      const currentTemp = printer.tools[0];
      elements.temperatures.tempTime.innerHTML =
        'Updated: <i class="far fa-clock"></i> ' + new Date().toTimeString().substring(1, 8);
      if (currentTemp.bed.actual !== null) {
        elements.temperatures.bed[0].innerHTML = currentTemp.bed.actual + "°C";
        elements.temperatures.bed[1].placeholder = currentTemp.bed.target + "°C";
      }
      if (currentTemp.chamber.actual !== null) {
        elements.temperatures.chamber[0].innerHTML = currentTemp.chamber.actual + "°C";
        elements.temperatures.chamber[1].placeholder = currentTemp.chamber.target + "°C";
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
    let elements = await PrinterManager.grabPage();
    const { filamentDrops } = elements;
    elements = elements.printerControls;
    let spool = true;
    if (!filamentManager) {
      spool = false;
    }

    if (typeof printing !== "undefined" && printing) {
      elements.feedRate.disabled = !printing;
      elements.flowRate.disabled = !printing;
      elements.fansOn.disabled = !printing;
      elements.fansOff.disabled = !printing;
      filamentDrops.forEach((drop) => {
        drop.disabled = spool;
      });
    } else {
      elements.feedRate.disabled = enable;
      elements.flowRate.disabled = enable;
      elements.fansOn.disabled = enable;
      elements.fansOff.disabled = enable;
      filamentDrops.forEach((drop) => {
        drop.disabled = enable;
      });
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
}
