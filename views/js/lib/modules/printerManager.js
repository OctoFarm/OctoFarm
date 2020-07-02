import OctoPrintClient from "../octoprint.js";
import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import FileManager from "./fileManager.js";
import Validate from "../functions/validate.js";
import {returnDropDown, selectFilament} from "../modules/filamentGrab.js";

let currentIndex = 0;

let previousLog = null;

let lastPrinter = null;

let printDropCheck = false;

//Close modal event listeners...
$("#printerManagerModal").on("hidden.bs.modal", function(e) {
  //Fix for mjpeg stream not ending when element removed...
  document.getElementById("printerControlCamera").src = "";
});
$("#connectionModal").on("hidden.bs.modal", function(e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterManager {
  static async init(printers) {
    let i = _.findIndex(printers, function (o) {
      return o._id == currentIndex;
    });
    let printer = null;
    if (typeof printers != "undefined" && printers != "") {
      if (typeof printers.length === "undefined") {
        printer = printers;
        lastPrinter = printers;
      } else {
        printer = printers[i];
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
      //Attempted printer pofile fix...
      let pProfile = null;
      if (typeof selectedProfile !== 'undefined' && typeof printer.profile[selectedProfile] !== 'undefined') {
        pProfile = printer.profile[selectedProfile];
      } else {
        pProfile = {
          model: "Couldn't grab...",
          volume: {
            height: "000",
            width: "000",
            depth: "000"
          },
          extruder: {
            count: "0",
            nozzleDiameter: "0",
          },
          heatedChamber: "Couldn't grab..."
        }
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
            name: "No File Selected",
            display: "No File Selected",
            path: "No File Selected"
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
          document.getElementById("printerIndex").innerHTML
      ) {
      } else {
        let camURL = "";
        if (typeof printer.camURL != "undefined" && printer.camURL.includes("http")) {
          camURL = printer.camURL;
        }else{
          camURL = "../../../images/noCamera.jpg";
        }


        let flipH = "";
        let flipV = "";
        let rotate90 = "";
        if (typeof printer.settingsWebcam != "undefined") {
          if (printer.settingsWebcam.flipH) {
            flipH = "rotateY(180deg)";
          }
          if (printer.settingsWebcam.flipV) {
            flipV = "rotateX(180deg)";
          }
          if (printer.settingsWebcam.rotate90) {
            rotate90 = "rotate(90deg)";
          }
        }
        let dateComplete = null;
        if (typeof printer.progress !== "undefined" && printer.progress.printTimeLeft !== null) {
          let currentDate = new Date();
          currentDate = currentDate.getTime();
          let futureDateString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toDateString()
          let futureTimeString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toTimeString()
          futureTimeString = futureTimeString.substring(0, 8);
          dateComplete = futureDateString + ": " + futureTimeString;
        } else {
          dateComplete = "No Active Print"
        }
        //Load the printer drop down...
        let printerDrop = document.getElementById("printerSelection");
        printerDrop.innerHTML = "";
        printers.forEach(printer => {
          let name = Validate.getName(printer);
          if(printer.stateColour.category !== "Offline"){
            printerDrop.insertAdjacentHTML('beforeend', `
                <option value="${printer._id}" selected>${name}</option>
            `)
          }
        })
        printerDrop.value = printer._id;
        if(!printDropCheck){
          printerDrop.addEventListener('change', event => {
            let newIndex = document.getElementById("printerSelection").value;
            PrinterManager.updateIndex(newIndex);
            PrinterManager.init(printers)
          });
          printDropCheck = true;
        }

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

        if (printer.state === "Disconnected") {
          printerConnect.innerHTML =
              '<center> <button id="pmConnect" class="btn btn-success inline" value="connect">Connect</button></center>';
        } else {
          printerConnect.innerHTML =
              '<center> <button id="pmConnect" class="btn btn-danger inline" value="disconnect">Disconnect</button></center>';
          document.getElementById("pmSerialPort").disabled = true;
          document.getElementById("pmBaudrate").disabled = true;
          document.getElementById("pmProfile").disabled = true;
        }

        document.getElementById("printerControls").innerHTML = `
        <div class="row">
            <div class="col-lg-3">
            
            </div>
            <div class="col-lg-3">
            
            </div>
            <div class="col-lg-3">
            
            </div>
        </div>

        <div class="row">
          <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-4">
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
                    <img style="transform: ${flipH} ${flipV} ${rotate90};" id="printerControlCamera" width="100%" src=""/>
                  </div>
              </div>
          </div>
          <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3">
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
          <hr>
          <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="filamentManagerFolderSelect">Filament:</label> </div> <select class="custom-select bg-secondary text-light" id="filamentManagerFolderSelect"><option value="" selected></option></select></div>
          <center>
          <button id="pmPrintStart" type="button" class="btn btn-success" role="button"><i class="fas fa-print"></i> Print</button>
          <button id="pmPrintPause" type="button" class="btn btn-light" role="button" disabled><i class="fas fa-pause"></i> Pause</button>
          <button id="pmPrintRestart" type="button" class="btn btn-danger" role="button"><i class="fas fa-undo"></i> Restart</button>
          <button id="pmPrintResume" type="button" class="btn btn-success" role="button"><i class="fas fa-redo"></i> Resume</button>
          <button id="pmPrintStop" type="button" class="btn btn-danger" disabled><i class="fas fa-square"></i> Cancel</button>
          </center></div>
          </div>
          </div>
          <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-2">
               <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Print Status</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                <div class="col-12">
                        <center>
                <b>Expected Completion Date: </b><p class="mb-1" id="pmExpectedCompletionDate">${dateComplete}</p>
                  <div class="progress mb-2">
                    <div id="pmProgress" class="progress-bar" role="progressbar progress-bar-striped" style="width:${
            progress.completion
        }%;" aria-valuenow="${
            progress.completion
        }%" aria-valuemin="0" aria-valuemax="100">${progress.completion}%
                    </div>
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
                  <b class="mb-1">File Name: </b><br><p title="${job.file.path}" class="tag mb-1" id="pmFileName">${
            job.file.name
        }</p></center>
                  </div>
              </div>
           </div>
                 <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3">
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
                          <div class="input-group">
                              <input id="pcExtruder" type="number" class="form-control" placeholder="0" aria-label="Recipient's username" aria-describedby="basic-addon2">
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
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Temperatures</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row">
                 <center>
                    <h5>Tool 0</h5>
                </center>
                <hr>
                <div class="md-form input-group mb-3">
                    <div class="input-group-prepend">
                        <span id="pcE0Actual" class="input-group-text">Actual: °C</span>
                    </div>
                    <input id="pcE0Target" type="number" class="form-control col-lg-12 col-xl-12" placeholder="0" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                    <div class="input-group-append">
                        <span class="input-group-text">°C</span>
                        <button class="btn btn-md btn-light m-0 p-1" type="button" id="pcE0set">Set</button>
                    </div>
                </div>
                <center>
                  <h5>Bed</h5>
              </center>
              <hr>
              <div class="md-form input-group mb-3">
                  <div class="input-group-prepend">
                      <span id="pcBedActual" class="input-group-text">Actual: °C</span>
                  </div>
                  <input id="pcBedTarget" type="number" class="form-control col-lg-12 col-xl-12" placeholder="0" aria-label="Recipient's username" aria-describedby="MaterialButton-addon2">
                  <div class="input-group-append">
                      <span class="input-group-text">°C</span>
                      <button class="btn btn-md btn-light m-0 p-1" type="button" id="pcBedset">Set</button>
                  </div>
              </div>
              </div>
      </div>
      <div class="col-12 col-sm-12 col-md-6 col-lg-12 col-xl-6">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Files</h5>
                      </center>
                      <hr>
                  </div>
              </div>
              <div class="row bg-secondary rounded-top">
              <div class="col-12">
                   <h5 class="float-left  mb-0">
                    <button id="printerFileCount" type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
                      <i class="fas fa-file"></i> ${printer.filesList.fileCount} <i class="fas fa-folder"></i> ${printer.filesList.folderCount}
                    </button>
                    <button id="printerStorage" type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
                     
                      <i class="fas fa-hdd"></i> ${Calc.bytes(printer.storage.free)} / ${Calc.bytes(printer.storage.total)}
                    </button>
                  </h5>
                  <h5 class="float-left mb-0">
                    <button type="button" class="btn btn-secondary float-right d-block" href="#" aria-expanded="false" disabled="">
                      <i class="fas fa-file-code"></i> Files: <span id="currentFolder">local</span>/
                    </button>
                  </h5>
                  <div class="btn btn-secondary form-group float-right  mb-0">
                    <form class="form-inline">
                      <div class="form-group">
                        <label for="searchFiles">
                          <i class="fas fa-search pr-1"></i>
                        </label>
                        <input id="searchFiles" type="text" placeholder="File Search..." class="search-control search-control-underlined">
                      </div>
                    </form>
                  </div>
                 </div>
                </div>
                <div class="row bg-secondary rounded-bottom">
                  <div class="col-lg-2">
                    <i class="fas fa-file-upload ml-2 mb-1"></i><span id="fileCounts-${printer._id}"> 0 </span>
                  </div>
                  <div class="col-lg-10">
                    <div class="progress">
                      <div id="fileProgress-${printer._id}" class="progress-bar progress-bar-striped bg-warning" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                        0%
                      </div>
                    </div>
                  </div>
                </div>
                <div class="row mb-1">
                    <div class="col-12">
                     <button id="fileBackBtn" type="button" class="btn btn-success float-right">
                      <i class="fas fa-chevron-left"></i> Back
                    </button>
                    <!-- Split dropright button -->
           <div class="dropdown mr-3 float-right"
                   data-jplist-control="dropdown-sort"
                   data-opened-class="show"
                   data-group="files"
                   data-name="data-file"
                   data-id="data-file">
                
                <button
                        data-type="panel"
                        class="btn btn-primary dropdown-toggle"
                        type="button">
                    Sort by
                </button>
                
                <div
                        data-type="content"
                        class="dropdown-menu"
                        aria-labelledby="dropdownMenuButton">
                
                    <a class="dropdown-item"
                       href="#"
                       data-path="default">Sort By</a>

                     <a class="dropdown-item"
                       data-path=".name"
                       data-order="asc"
                       data-type="text"
                       data-value="1"><i class="fas fa-sort-alpha-down"></i> File Name</a>
                
                    <a class="dropdown-item"
                       data-path=".name"
                       data-order="desc"
                       data-type="text"
                       data-value="2"><i class="fas fa-sort-alpha-up"></i> File Name</a>
                                       
                    <a class="dropdown-item"
                       data-path=".time"
                       data-order="asc"
                       data-type="number"
                       data-value="3"><i class="fas fa-sort-numeric-down"></i> Print Time</a>
                
                    <a class="dropdown-item"
                       data-path=".time"
                       data-order="desc"
                       data-type="number"
                       data-value="4"><i class="fas fa-sort-numeric-up"></i> Print Time</a>
                                       
                    <a class="dropdown-item"
                       data-path=".date"
                       data-order="asc"
                       data-type="number"
                       data-value="5"><i class="fas fa-sort-numeric-down"></i> Upload Date</a>
                
                    <a class="dropdown-item"
                       data-path=".date"
                       data-order="desc"
                       data-type="number"
                       data-value="6"><i class="fas fa-sort-numeric-up"></i> Upload Date</a>
                                                           

                                                           

                          
                </div>
            </div>
                      <label class="btn btn-success float-left mr-1 mb-0" for="fileUploadBtn"><i class="fas fa-file-import"></i> Upload File(s)</label>
                      <input id="fileUploadBtn" multiple accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left" id="uploadFileBtn">
                      <label class="btn btn-info float-left mr-1 mb-0" for="fileUploadPrintBtn"><i class="fas fa-file-import"></i> Upload and Print</label>
                      <input id="fileUploadPrintBtn" accept=".gcode,.gco,.g" type="file" class="btn btn-success float-left" id="uploadFileBtn">
                    <button
                      id="createFolderBtn"
                      type="button"
                      class="btn btn-warning float-left mr-1 mb-0"
                      data-toggle="collapse"
                      href="#createFolder"
                      role="button"
                      aria-expanded="false"
                      aria-controls="createFolder"
                    >
                      <i class="fas fa-folder-plus"></i> Create Folder
                    </button>
                    <button id="fileReSync" type="button" class="btn btn-primary mb-0">
                      <i class="fas fa-sync"></i> Re-Sync
                    </button>
                    </div>
                 
                </div>
             
                    <div id="fileList-${printer._id}" class="list-group" style="max-height:350px; overflow-y:scroll;" data-jplist-group="files">
            
                    </div>
      </div>
      <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3">
              <div class="row">
                  <div class="col-12">
                      <center>
                          <h5>Feed/Flow</h5>
                      </center>
                      <hr>
                  </div>
              </div>
                <div class="row">
                  <div class="col-10 col-lg-8 col-xl-8">
                      <label for="pcFeed">Feed Rate: <span id="pcFeedValue">${printer.feedRate}%</span></label>
                      <input type="range" class="octoRange custom-range" min="50" max="150" step="1" id="pcFeed" value="${printer.feedRate}">
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
        <div class="col-12 col-sm-12 col-md-6 col-lg-4 col-xl-3">
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
                    <input id="terminalInput" type="text" class="form-control" placeholder="" aria-label="" aria-describedby="basic-addon2">
                    <div class="input-group-append">
                      <button class="btn btn-secondary" id="terminalInputBtn" type="submit">Send</button>
                    </div>
                  </div>
              </div>
           </div>

          </div>
          `;
        document.getElementById("printerControlCamera").src = camURL;
        document.getElementById("printerIndex").innerHTML = printer._id;

        let filamentDropDown = await returnDropDown();
        let pmFilamentDrop = document.getElementById("filamentManagerFolderSelect")
        pmFilamentDrop.innerHTML = "";
        filamentDropDown.forEach(filament => {
          pmFilamentDrop.insertAdjacentHTML('beforeend', filament)
        })
        if(printer.selectedFilament != null){
          pmFilamentDrop.value = printer.selectedFilament._id
        }
        pmFilamentDrop.addEventListener('change', event => {
          selectFilament(printer._id, event.target.value)
        });


        let elements = PrinterManager.grabPage();
        elements.terminal.terminalWindow.innerHTML = "";
        elements.printerControls["step" + printer.stepRate].className =
            "btn btn-dark active";
        PrinterManager.applyListeners(printer, elements, printers, filamentDropDown);
        FileManager.drawFiles(printer)
      }
      PrinterManager.applyState(printer, job, progress);
      document.getElementById("printerManagerModal").style.overflow = "auto";
    }

  }

  static applyListeners(printer, elements, printers, filamentDropDown) {
    let rangeSliders = document.querySelectorAll("input.octoRange");
    rangeSliders.forEach(slider => {
      slider.addEventListener("input", e => {
        e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
      });
    });
    if (printer.state != "Disconnected") {
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
        printer: printer._id,
        newSteps: "01"
      });
      elements.printerControls.step01.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step1.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "1"
      });
      elements.printerControls.step1.className = "btn btn-dark active";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step10.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "10"
      });
      elements.printerControls.step10.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step100.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "100"
      });
      elements.printerControls.step100.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
    });

    let e0Set = async function (e) {
      let flashReturn = function () {
        elements.printerControls.e0Set.className = "btn btn-md btn-light m-0 p-1";
      };
      let value = elements.printerControls.e0Target.value;
      elements.printerControls.e0Target.value = "";
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
        elements.printerControls.e0Set.className = "btn btn-md btn-success m-0 p-1";
        setTimeout(flashReturn, 500);
      } else {
        elements.printerControls.e0Set.className = "btn btn-md btn-danger m-0 p-1";
        setTimeout(flashReturn, 500);
      }
    }
    elements.printerControls.e0Target.addEventListener("change", async e => {
      if (elements.printerControls.e0Target.value <= 0) {
        elements.printerControls.e0Target.value = "0"
      }
    });
    elements.printerControls.e0Target.addEventListener("keypress", async e => {
      if (e.key === 'Enter') {
        e0Set(e);
      }
    });
    elements.printerControls.e0Set.addEventListener("click", async e => {
      e0Set(e);
    });

    let bedSet = async function (e) {
      let flashReturn = function () {
        elements.printerControls.bedSet.classList = "btn btn-md btn-light m-0 p-1";
      };
      let value = elements.printerControls.bedTarget.value;

      elements.printerControls.bedTarget.value = "";
      if (value === "Off") {
        value = 0;
      }
      let opt = {
        command: "target",
        target: parseInt(value)
      };
      let post = await OctoPrintClient.post(printer, "printer/bed", opt);
      if (post.status === 204) {
        elements.printerControls.bedSet.className = "btn btn-md btn-success m-0 p-1";
        setTimeout(flashReturn, 500);
      } else {
        elements.printerControls.bedSet.className = "btn btn-md btn-success m-0 p-1";
        setTimeout(flashReturn, 500);
      }
    }
    elements.printerControls.bedTarget.addEventListener("change", async e => {
      if (elements.printerControls.bedTarget.value <= 0) {
        elements.printerControls.bedTarget.value = "0"
      }
    });
    elements.printerControls.bedTarget.addEventListener("keypress", async e => {
      if (e.key === 'Enter') {
        bedSet(e);
      }
    });
    elements.printerControls.bedSet.addEventListener("click", async e => {
      bedSet(e);
    });
    elements.printerControls.feedRate.addEventListener("click", async e => {
      let flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.feedRateValue.innerHTML;
      value = value.replace("%", "");
      OctoFarmClient.post("printers/feedChange", {
        printer: printer._id,
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
      let flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      let value = elements.printerControls.flowRateValue.innerHTML;
      value = value.replace("%", "");
      OctoFarmClient.post("printers/flowChange", {
        printer: printer._id,
        newSteps: value
      });
      let opt = {
        command: "flowrate",
        factor: parseInt(value)
      };
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
      let flashReturn = function () {
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

      let flashReturn = function () {
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
      let flashReturn = function () {
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
      let flashReturn = function () {
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
      let flashReturn = function () {
        e.target.classList = "btn btn-light";
      };
      if (
          elements.printerControls.extruder.value != undefined &&
          elements.printerControls.extruder.value !== ""
      ) {
        let select = OctoPrintClient.selectTool(printer, "tool0");
        if (select) {
          let value = elements.printerControls.extruder.value;
          value = "-" + value;
          let opt = {
            command: "extrude",
            amount: parseInt(value)
          };
          let post = await OctoPrintClient.post(
              printer,
              "printer/tool",
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
    elements.printerControls.printStop.addEventListener("click", e => {
      bootbox.confirm({
        message: `${printer._id}.  ${printer.settingsAppearance.name}: <br>Are you sure you want to cancel the ongoing print?`,
        buttons: {
          cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            label: '<i class="fa fa-check"></i> Confirm'
          }
        },
        callback: function (result) {
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
    let submitTerminal = async function (e) {
      let input = elements.terminal.input.value;
      input = input.toUpperCase();
      elements.terminal.input.value = "";
      let flashReturn = function () {
        elements.terminal.sendBtn = "btn btn-secondary";
      };
      let opt = {
        commands: [input]
      };
      let post = await OctoPrintClient.post(printer, "printer/command", opt);
      if (post.status === 204) {
        elements.terminal.sendBtn = "btn btn-success";
        setTimeout(flashReturn, 500);
      } else {
        elements.terminal.sendBtn = "btn btn-danger";
        setTimeout(flashReturn, 500);
      }
    }
    elements.terminal.input.addEventListener("keypress", async e => {
      if (e.key === 'Enter') {
        submitTerminal(e);
      }
    });
    elements.terminal.sendBtn.addEventListener("click", async e => {
      submitTerminal(e);
    });
    elements.fileManager.uploadFiles.addEventListener('change', function() {
      UI.createAlert("warning", "Your files for Printer: " + Validate.getName(printer) + " has begun. Please do not navigate away from this page.", 3000, "Clicked")
      FileManager.handleFiles(this.files, printer);
    });
    elements.fileManager.createFolderBtn.addEventListener("click", e => {
      FileManager.createFolder(printer)
    });
    elements.fileManager.fileSearch.addEventListener("keyup", e => {
      FileManager.search(printer._id);
    });
    elements.fileManager.uploadPrintFile.addEventListener("change", function() {
      FileManager.handleFiles(this.files, printer, "print")
    });
    elements.fileManager.back.addEventListener("click", e => {
      FileManager.openFolder(undefined, undefined, printer);
    });
    elements.fileManager.syncFiles.addEventListener('click', e => {
      FileManager.reSyncFiles(e, printer);
    });

  }


  static grabPage() {
    let printerManager = {
      mainPage: {
        title: document.getElementById("printerSelection"),
        status: document.getElementById("pmStatus"),
      },
      jobStatus: {
        expectedCompletionDate: document.getElementById("pmExpectedCompletionDate"),
        expectedTime: document.getElementById("pmExpectedTime"),
        remainingTime: document.getElementById("pmTimeRemain"),
        elapsedTime: document.getElementById("pmTimeElapsed"),
        currentZ: document.getElementById("pmCurrentZ"),
        fileName: document.getElementById("pmFileName"),
        progressBar: document.getElementById("pmProgress")
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
      fileManager: {
        printerStorage: document.getElementById("printerStorage"),
        fileFolderCount: document.getElementById("printerFileCount"),
        fileSearch: document.getElementById("searchFiles"),
        uploadFiles: document.getElementById("fileUploadBtn"),
        uploadPrintFile: document.getElementById("fileUploadPrintBtn"),
        syncFiles: document.getElementById("fileReSync"),
        back: document.getElementById("fileBackBtn"),
        createFolderBtn: document.getElementById("createFolderBtn")
      }
    };
    return printerManager;
  }

  static async applyState(printer, job, progress) {
    //Garbage collection for terminal
    let terminalCount = document.querySelectorAll(".logLine");
    let elements = await PrinterManager.grabPage();

    elements.fileManager.fileFolderCount.innerHTML = `<i class="fas fa-file"></i> ${printer.filesList.fileCount} <i class="fas fa-folder"></i> ${printer.filesList.folderCount}`;
    elements.fileManager.printerStorage.innerHTML = `<i class="fas fa-hdd"></i> ${Calc.bytes(printer.storage.free)} / ${Calc.bytes(printer.storage.total)}`
    elements.mainPage.status.innerHTML = printer.state;
    elements.mainPage.status.className = `btn btn-${printer.stateColour.name} mb-2`;
    let dateComplete = null;
    if (typeof printer.progress !== "undefined" && printer.progress.printTimeLeft !== null) {

      let currentDate = new Date();

      if(printer.progress.completion === 100){
        dateComplete = "Print Ready for Harvest"
      }else{
        currentDate = currentDate.getTime();
        let futureDateString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toDateString()
        let futureTimeString = new Date(currentDate + printer.progress.printTimeLeft * 1000).toTimeString()
        futureTimeString = futureTimeString.substring(0, 8);
        dateComplete = futureDateString + ": " + futureTimeString;
      }
    } else {
      dateComplete = "No Active Print"
    }


    elements.jobStatus.expectedCompletionDate.innerHTML = dateComplete;


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
    if(typeof printer.job === 'undefined'){
      elements.jobStatus.fileName.setAttribute('title', 'No File Selected')
      let fileName = 'No File Selected'
      elements.jobStatus.fileName.innerHTML = fileName;

    }else{
      elements.jobStatus.fileName.setAttribute('title', printer.job.file.path)
      let fileName = printer.job.file.display;
      if (fileName.length > 49) {
        fileName = fileName.substring(0, 49) + "...";
      }
      elements.jobStatus.fileName.innerHTML = fileName;

    }

    if (printer.stateColour.category === "Active") {
      elements.printerControls.filamentDrop.disabled = true;
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
      elements.printerControls.filamentDrop.disabled = false;
      PrinterManager.controls(false);
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
        printer.stateColour.category === "Disconnected"
    ) {
      elements.printerControls.filamentDrop.disabled = false;
      elements.connectPage.connectButton.value = "connect";
      elements.connectPage.connectButton.innerHTML = "Connect";
      elements.connectPage.connectButton.classList = "btn btn-success inline";
      elements.connectPage.connectButton.disabled = false;
      elements.printerControls.e0Target.placeholder = 0 + "°C";
      elements.printerControls.e0Actual.innerHTML = "Actual: " + 0 + "°C";
      elements.printerControls.bedTarget.placeholder = 0 + "°C";
      elements.printerControls.bedActual.innerHTML = "Actual: " + 0 + "°C";
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
      if (printer.state === "Offline" || printer.state === "Shutdown" || printer.state === "Searching...") {
        $("#printerManagerModal").modal("hide");
      }
    }

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
        if (terminalCount.length > 20) {
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

  static async controls(enable, printing) {
    let elements = await PrinterManager.grabPage();
    elements = elements.printerControls;
    if (typeof printing != "undefined" && printing) {
      elements.e0Target.disabled = !printing;
      elements.e0Actual.disabled = !printing;
      elements.bedTarget.disabled = !printing;
      elements.e0Set.disabled = !printing;
      elements.bedSet.disabled = !printing;
      elements.feedRate.disabled = !printing;
      elements.flowRate.disabled = !printing;
      elements.fansOn.disabled = !printing;
      elements.fansOff.disabled = !printing;
    } else {
      elements.e0Target.disabled = enable;
      elements.e0Actual.disabled = enable;
      elements.bedTarget.disabled = enable;
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
}