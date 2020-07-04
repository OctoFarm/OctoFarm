import OctoFarmClient from "../octofarm.js";
import UI from "../functions/ui.js";
import Script from "./scriptCheck.js";
import Calc from "../functions/calc.js";

let currentIndex = 0;

let controlDropDown = false;

let currentPrinter = null;

// Close modal event listeners...
$("#PrinterSettingsModal").on("hidden.bs.modal", function (e) {
  // Fix for mjpeg stream not ending when element removed...
  document.getElementById("printerControlCamera").src = "";
});
$("#connectionModal").on("hidden.bs.modal", function (e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterSettings {
  static async init(index, printers, printerControlList) {
    if (index !== "") {
      currentIndex = index;
      const id = _.findIndex(printers, function (o) {
        return o._id == index;
      });
      currentPrinter = printers[id];
      // Load the printer dropdown
      if (!controlDropDown) {
        const printerDrop = document.getElementById("printerSelection");
        printerDrop.innerHTML = "";
        printerControlList.forEach((list) => {
          if (list.state.category !== "Offline") {
            printerDrop.insertAdjacentHTML(
              "beforeend",
              `
                  <option value="${list.printerID}" selected>${list.printerName}</option>
              `
            );
          }
        });
        printerDrop.value = currentPrinter._id;
        printerDrop.addEventListener("change", (event) => {
          if (document.getElementById("printerControls")) {
            document.getElementById("printerControls").innerHTML = "";
          }
          document.getElementById("pmStatus").innerHTML =
            '<i class="fas fa-spinner fa-spin"></i>';
          document.getElementById(
            "pmStatus"
          ).className = `btn btn-secondary mb-2`;
          // Load Connection Panel
          document.getElementById("printerPortDrop").innerHTML = "";
          document.getElementById("printerBaudDrop").innerHTML = "";
          document.getElementById("printerProfileDrop").innerHTML = "";
          document.getElementById("printerConnect").innerHTML = "";
        });
        controlDropDown = true;
      }
      const printerDefaultPort = document.getElementById("psDefaultPortDrop");
      const printerDefaultBaud = document.getElementById("psDefaultBaudDrop");
      const printerDefaultProfile = document.getElementById(
        "psDefaultProfileDrop"
      );

      printerDefaultPort.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultSerialPort"">Preferred Port:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultSerialPort"></select></div>
        `;
      printerDefaultBaud.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultBaudrate">Preferred Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultBaudrate"></select></div>
        `;
      printerDefaultProfile.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultProfile">Preferred Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultProfile"></select></div>
        `;
      currentPrinter.connectionOptions.baudrates.forEach((baud) => {
        document
          .getElementById("psDefaultBaudrate")
          .insertAdjacentHTML(
            "beforeend",
            `<option value="${baud}">${baud}</option>`
          );
      });
      if (currentPrinter.connectionOptions.baudratePreference === null) {
        document
          .getElementById("psDefaultBaudrate")
          .insertAdjacentHTML(
            "afterbegin",
            `<option value="0">No Preference</option>`
          );
      }
      currentPrinter.connectionOptions.ports.forEach((port) => {
        document
          .getElementById("psDefaultSerialPort")
          .insertAdjacentHTML(
            "beforeend",
            `<option value="${port}">${port}</option>`
          );
      });
      if (currentPrinter.connectionOptions.portPreference === null) {
        document
          .getElementById("psDefaultSerialPort")
          .insertAdjacentHTML(
            "afterbegin",
            `<option value="0">No Preference</option>`
          );
      }
      currentPrinter.connectionOptions.printerProfiles.forEach((profile) => {
        document
          .getElementById("psDefaultProfile")
          .insertAdjacentHTML(
            "beforeend",
            `<option value="${profile.id}">${profile.name}</option>`
          );
      });
      if (currentPrinter.connectionOptions.printerProfilePreference === null) {
        document
          .getElementById("psDefaultProfile")
          .insertAdjacentHTML(
            "afterbegin",
            `<option value="0">No Preference</option>`
          );
      }
      if (currentPrinter.connectionOptions.baudratePreference != null) {
        document.getElementById("psDefaultBaudrate").value =
          currentPrinter.connectionOptions.baudratePreference;
      } else {
        document.getElementById("psDefaultBaudrate").value = 0;
      }
      if (currentPrinter.connectionOptions.portPreference != null) {
        document.getElementById("psDefaultSerialPort").value =
          currentPrinter.connectionOptions.portPreference;
      } else {
        document.getElementById("psDefaultSerialPort").value = 0;
      }
      if (currentPrinter.connectionOptions.printerProfilePreference != null) {
        document.getElementById("psDefaultProfile").value =
          currentPrinter.connectionOptions.printerProfilePreference;
      } else {
        document.getElementById("psDefaultProfile").value = 0;
      }

      document.getElementById("psPrinterProfiles").innerHTML = `
            <div class="col-12">
                <button id="editProfileBtn" type="button" class="btn btn-warning">Edit</button></div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Printer</u></h6>
            <p class="mb-0"><b>Printer Name: </b><span id="printerName" contenteditable="false">${currentPrinter.printerName}</span></p>
            <p class="mb-0"><b>Printer Model: </b><span id="printerModel" contenteditable="false">${currentPrinter.model}</span></p>
            <h6 class="mb-1"><u>Axis</u></h6>
            <p class="mb-0"><b>E: </b><span id="printerEAxis" contenteditable="false">${currentPrinter.currentProfile.axes.e.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="eInverted" required>
                                                        <label class="custom-control-label" for="eInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>X: </b><span id="printerXAxis" contenteditable="false">${currentPrinter.currentProfile.axes.x.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="xInverted" required>
                                                        <label class="custom-control-label" for="xInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>Y: </b><span id="printerYAxis" contenteditable="false">${currentPrinter.currentProfile.axes.y.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="yInverted" required>
                                                        <label class="custom-control-label" for="yInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>Z: </b><span id="printerZAxis" contenteditable="false">${currentPrinter.currentProfile.axes.z.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="zInverted" required>
                                                        <label class="custom-control-label" for="zInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Extrusion</u></h6>
            <p class="mb-0"><b>Extruder Count: </b><span id="extruderCount" contenteditable="false">${currentPrinter.currentProfile.extruder.count}</span></p>
            <p class="mb-0"><b>Nozzle Size: </b><span id="nozzleDiameter" contenteditable="false">${currentPrinter.currentProfile.extruder.nozzleDiameter}</span></p>
          
            <p class="mb-0"><span><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="sharedNozzle" required>
                                                        <label class="custom-control-label" for="sharedNozzle">Shared Nozzle</label>
                                                    </div>
                                                </form></span></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Bed / Chamber</u></h6>
             <p class="mb-1"><b>Form Factor: </b><span id="extruderFormFactor" contenteditable="false">${currentPrinter.currentProfile.volume.formFactor}</span></p>                   
            <p class="mb-1"><b>Dimensions:</b>D: <span id="volumeDepth" contenteditable="false">${currentPrinter.currentProfile.volume.depth}</span>mm x H: <span id="volumeHeight" contenteditable="false">${currentPrinter.currentProfile.volume.height}</span>mm x W: <span id="volumeWidth" contenteditable="false">${currentPrinter.currentProfile.volume.width}</span>mm</p> 
               <p class="mb-1"><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="heatedBed" required>
                                                        <label class="custom-control-label" for="heatedBed">Heated Bed</label>
                                                    </div>
                                                </form></span></p>                  
            <p class="mb-1"><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="heatedChamber" required>
                                                        <label class="custom-control-label" for="heatedChamber">Heated Chamber</label>
                                                    </div>
                                                </form></span></p>  
            </div>
        `;
      document
        .getElementById("editProfileBtn")
        .addEventListener("click", (event) => {
          const profileEdits = document
            .getElementById("psPrinterProfiles")
            .querySelectorAll("[contenteditable=false]");
          profileEdits.forEach((element) => {
            element.classList.add("contentEditable");
            element.contentEditable = true;
          });
        });
      document.getElementById("eInverted").checked =
        currentPrinter.currentProfile.axes.e.inverted;
      document.getElementById("xInverted").checked =
        currentPrinter.currentProfile.axes.x.inverted;
      document.getElementById("yInverted").checked =
        currentPrinter.currentProfile.axes.y.inverted;
      document.getElementById("zInverted").checked =
        currentPrinter.currentProfile.axes.z.inverted;
      document.getElementById("sharedNozzle").checked =
        currentPrinter.currentProfile.extruder.sharedNozzle;
      document.getElementById("heatedBed").checked =
        currentPrinter.currentProfile.heatedBed;
      document.getElementById("heatedChamber").checked =
        currentPrinter.currentProfile.heatedChamber;

      let afterPrintCancelled = "";
      if (
        typeof currentPrinter.gcodeScripts.afterPrintCancelled !== "undefined"
      ) {
        afterPrintCancelled = currentPrinter.gcodeScripts.afterPrintCancelled;
      }
      let afterPrintDone = "";
      if (typeof currentPrinter.gcodeScripts.afterPrintDone !== "undefined") {
        afterPrintDone = currentPrinter.gcodeScripts.afterPrintDone;
      }
      let afterPrintPaused = "";
      if (typeof currentPrinter.gcodeScripts.afterPrintPaused !== "undefined") {
        afterPrintPaused = currentPrinter.gcodeScripts.afterPrintPaused;
      }
      let afterPrinterConnected = "";
      if (
        typeof currentPrinter.gcodeScripts.afterPrinterConnected !== "undefined"
      ) {
        afterPrinterConnected =
          currentPrinter.gcodeScripts.afterPrinterConnected;
      }
      let beforePrintResumed = "";
      if (
        typeof currentPrinter.gcodeScripts.beforePrintResumed !== "undefined"
      ) {
        beforePrintResumed = currentPrinter.gcodeScripts.beforePrintResumed;
      }
      let afterToolChange = "";
      if (typeof currentPrinter.gcodeScripts.afterToolChange !== "undefined") {
        afterToolChange = currentPrinter.gcodeScripts.afterToolChange;
      }
      let beforePrintStarted = "";
      if (
        typeof currentPrinter.gcodeScripts.beforePrintStarted !== "undefined"
      ) {
        beforePrintStarted = currentPrinter.gcodeScripts.beforePrintStarted;
      }
      let beforePrinterDisconnected = "";
      if (
        typeof currentPrinter.gcodeScripts.beforePrinterDisconnected !==
        "undefined"
      ) {
        beforePrinterDisconnected =
          currentPrinter.gcodeScripts.beforePrinterDisconnected;
      }
      let beforeToolChange = "";
      if (typeof currentPrinter.gcodeScripts.beforeToolChange !== "undefined") {
        beforeToolChange = currentPrinter.gcodeScripts.beforeToolChange;
      }
      document.getElementById("psGcodeManagerGcode").innerHTML = `
              <div class="form-group">
              <label for="settingsAfterPrinterCancelled">After Printing Cancelled</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterCancelled" rows="2">${afterPrintCancelled}</textarea>
              <small>Anything you put here will be executed after any lines in your files.</small>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterDone">After Printing Done</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterDone" rows="2">${afterPrintDone}</textarea>
               <small>Anything you put here will be executed after any lines in your files.</small>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterPaused">After Printing Paused</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterPaused" rows="2">${afterPrintPaused}</textarea>
               <small>Anything you put here will be executed after any lines in your files.</small>
              </div>
              <div class="form-group">
              <label for="settingsAfterPrinterConnected">After Printer Connected</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterPrinterConnected" rows="2">${afterPrinterConnected}</textarea>
               <small> Anything you put here will only be executed after the printer has established a connection.</small>
              </div>
              <div class="form-group">
              <label for="settingsAfterToolChange">After Tool Change</label>
              <textarea class="form-control bg-dark text-white" id="settingsAfterToolChange" rows="2">${afterToolChange}</textarea>
               <small>Anything you put here will be executed after any tool change commands <code>Tn</code>.</small>
              </div>
              <div class="form-group">
              <label for="settingsBeforePrinterResumed">Before Printing Resumed</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterResumed" rows="2">${beforePrintResumed}</textarea>
               <small>Anything you put here will be executed before any lines in your files.</small>
              </div>
              <div class="form-group">
              <label for="settingsBeforePrinterStarted">Before Printing Started</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterStarted" rows="2">${beforePrintStarted}</textarea>
               <small>Anything you put here will be executed before any lines in your files.</small>
              </div>
              <div class="form-group">
              <label for="settingsBeforePrinterDisconnected">Before Printer Disconnected</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforePrinterDisconnected" rows="2">${beforePrinterDisconnected}</textarea>
               <small> Anything you put here will only be executed when closing the connection actively. If the connection to the printer is suddenly lost nothing will be sent.</small>
              </div>
              <div class="form-group">
              <label for="settingsBeforeToolChange">Before Tool Change</label>
              <textarea class="form-control bg-dark text-white" id="settingsBeforeToolChange" rows="2">${beforeToolChange}</textarea>
               <small>Anything you put here will be executed before any tool change commands <code>Tn</code>.</small>
              </div>
        `;
      document.getElementById("cameraRotation").innerHTML = `
        <form class="was-validated">
        <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="camEnabled" required>
            <label class="custom-control-label" for="camEnabled">Enable Web Camera</label>
        </div>
        </form>
        <form class="was-validated">
        <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="camRot90" required>
            <label class="custom-control-label" for="camRot90">Rotate your camera by 90°</label>
        </div>
        </form>
        <form class="was-validated">
        <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="camFlipH" required>
            <label class="custom-control-label" for="camFlipH">Flip your camera horizontally</label>
        </div>
        </form>
        <form class="was-validated">
        <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="camFlipV" required>
            <label class="custom-control-label" for="camFlipV">Flip your camera vertically</label>
        </div>
        </form>
        <form class="was-validated">
        <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="camTimelapse" required>
            <label class="custom-control-label" for="camTimelapse">Enable Time lapse</label>
        </div>
        </form>
      `;

      document.getElementById("camEnabled").checked =
        currentPrinter.otherSettings.webCamSettings.webcamEnabled;
      document.getElementById("camTimelapse").checked =
        currentPrinter.otherSettings.webCamSettings.timelapseEnabled;
      document.getElementById("camRot90").checked =
        currentPrinter.otherSettings.webCamSettings.rotate90;
      document.getElementById("camFlipH").checked =
        currentPrinter.otherSettings.webCamSettings.flipH;
      document.getElementById("camFlipV").checked =
        currentPrinter.otherSettings.webCamSettings.flipV;
      let serverRestart = "N/A";
      let systemRestart = "N/A";
      let systemShutdown = "N/A";
      if (currentPrinter.powerSettings !== null) {
        if (
          currentPrinter.otherSettings.system.commands.serverRestartCommand ===
          ""
        ) {
          serverRestart = "N/A";
        } else {
          serverRestart =
            currentPrinter.otherSettings.system.commands.serverRestartCommand;
        }
        if (
          currentPrinter.otherSettings.system.commands.systemRestartCommand ===
          ""
        ) {
          systemRestart = "N/A";
        } else {
          systemRestart =
            currentPrinter.otherSettings.system.commands.systemRestartCommand;
        }
        if (
          currentPrinter.otherSettings.system.commands.systemShutdownCommand ===
          ""
        ) {
          systemShutdown = "N/A";
        } else {
          systemShutdown =
            currentPrinter.otherSettings.system.commands.systemShutdownCommand;
        }
      }
      document.getElementById("printerSettingsFooter").innerHTML = ``;
      document.getElementById("printerSettingsFooter").insertAdjacentHTML(
        "beforeend",
        `
                            <button type="button" class="btn btn-light" data-dismiss="modal">Close</button>
                           <button type="button" class="btn btn-success" id="savePrinterSettings">Save</button>
        `
      );
      document.getElementById("psPowerCommands").innerHTML = `
        <form>
          <div class="form-group">
            <label for="serverRestart">OctoPrint Server Restart</label>
            <input type="text" class="form-control" id="serverRestart" placeholder="${serverRestart}">
            <small id="passwordHelpBlock" class="form-text text-muted">
                Usually your OctoPrint hosts server restart command. i.e: <code>sudo service octoprint restart</code>
            </small>
          </div>
          <div class="form-group">
            <label for="systemRestart">OctoPrint System Restart</label>
            <input type="text" class="form-control" id="systemRestart" placeholder="${systemRestart}">
            <small id="passwordHelpBlock" class="form-text text-muted">
               Usually your OctoPrint hosts system restart command. i.e: <code>sudo shutdown -r now</code>
            </small>
          </div>
          <div class="form-group">
            <label for="systemShutdown">OctoPrint System Shutdown</label>
            <input type="text" class="form-control" id="systemShutdown" placeholder="${systemShutdown}">
            <small id="passwordHelpBlock" class="form-text text-muted">
              Usually your OctoPrint hosts system shutdown command. i.e: <code>sudo shutdown -h now</code>
            </small>
          </div>
          <h6><u>Custom Power Commands</u></h6>
          <p class="mb-0">Setup a custom POST request to an API endpoint, instructions for such will be in your plugin/device instructions. Setting this up will activate the power button toggle on all Views and allow Power On and Power Off selections in the dropdown.</p>
           <p class="mb-0">If you'd like to enter in a full URL command then leave the command blank and it will skip the requirement and just make a POST to the URL provided similar to CURL. You can use the following placeholders:</p>
          <p class="mb-0">Printer URL: <code>[PrinterURL]</code></p>
          <p class="mb-0">Printer api-key: <code>[PrinterAPI]</code></p
          <h6>Power On</h6>
           <div class="form-row">
              <div class="col-4">
                <input id="powerOnCommand"  type="text" class="form-control" placeholder="Command">
                 <small class="form-text text-muted">
                  This is usually an json object supplied in the following format <code>{"command":"turnOn"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input id="powerOnURL"  type="text" class="form-control" placeholder="URL">
                 <small class="form-text text-muted">
                  The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
           <h6>Power Off</h6>
            <div class="form-row">
              <div class="col-4">
                <input id="powerOffCommand" type="text" class="form-control" placeholder="Command">
                 <small class="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"turnOff"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input  id="powerOffURL" type="text" class="form-control" placeholder="URL">
                 <small class="form-text text-muted">
                   The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
            <h6>Power Toggle</h6>
            <div class="form-row">
              <div class="col-4">
                <input id="powerToggleCommand"  type="text" class="form-control" placeholder="Command">
                 <small vclass="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"toggle"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input id="powerToggleURL" type="text" class="form-control" placeholder="URL">
                 <small class="form-text text-muted">
                    The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
            <h6>Power Status</h6>
            <p class="mb-0">This must return a boolean value to work properly. When you enter this in your printer will show it's power state on the power button icon.</p>
            <div class="form-row">
              <div class="col-4">
                <input id="powerStateCommand" type="text" class="form-control" placeholder="Command">
                 <small class="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"state"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input id="powerStateURL" type="text" class="form-control" placeholder="URL">
                 <small class="form-text text-muted">
                    The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
        </form>
        `;
      if (serverRestart != "N/A") {
        document.getElementById("serverRestart").value = serverRestart;
      }
      if (systemRestart != "N/A") {
        document.getElementById("systemRestart").value = systemRestart;
      }
      if (systemShutdown != "N/A") {
        document.getElementById("systemShutdown").value = systemShutdown;
      }
      if (currentPrinter.powerSettings != null) {
        document.getElementById("powerOnCommand").value =
          currentPrinter.powerSettings.powerOnCommand;
        document.getElementById("powerOnURL").value =
          currentPrinter.powerSettings.powerOnURL;
        document.getElementById("powerOffCommand").value =
          currentPrinter.powerSettings.powerOffCommand;
        document.getElementById("powerOffURL").value =
          currentPrinter.powerSettings.powerOffURL;
        document.getElementById("powerToggleCommand").value =
          currentPrinter.powerSettings.powerToggleCommand;
        document.getElementById("powerToggleURL").value =
          currentPrinter.powerSettings.powerToggleURL;
        document.getElementById("powerStateCommand").value =
          currentPrinter.powerSettings.powerStatusCommand;
        document.getElementById("powerStateURL").value =
          currentPrinter.powerSettings.powerStatusURL;
      }
      document.getElementById("tempTriggers").innerHTML = `
           <div class="form-group">
              <label for="headtingVariation">Heating Variation</label>
              <input type="number" class="form-control" id="headtingVariation" placeholder="${currentPrinter.otherSettings.temperatureTriggers.heatingVariation}" step="0.01">
              <small id="passwordHelpBlock" class="form-text text-muted">
                  What temperature variation will trigger orange warning on the temperature display when a printer is Active. <code>Default is 1°C</code>
              </small>
            </div>
            <div class="form-group">
              <label for="coolDown">Cool Down Trigger</label>
              <input type="number" class="form-control" id="coolDown" placeholder="${currentPrinter.otherSettings.temperatureTriggers.coolDown}" step="0.01">
              <small id="passwordHelpBlock" class="form-text text-muted">
                  What temperature limit will trigger the blue status on the temperature display when a printer is Complete and cooling down. <code>Default is 30°C</code>
              </small>
            </div>
        `;
      document.getElementById("psPrinterCost").innerHTML = `
            <div class="col-6">
                   <h5>Operating Costs</h5>
                   <div class="form-group">
                    <label for="coolDown">Power Consumption</label>
                          <div class="input-group mb-2">
                                <input type="number" class="form-control" id="powerConsumption" placeholder="${currentPrinter.costSettings.powerConsumption}" step="0.01">
                                <div class="input-group-append">
                                     <div class="input-group-text">kW</div>
                                </div>
                          </div>
                    <small id="passwordHelpBlock" class="form-text text-muted">
                        The kW (kilowatt) usage of your printer. 
                    </small>
                  </div>
                  <div class="form-group">
                    <label for="coolDown">Electricity Costs</label>
                         <div class="input-group mb-2">
                            <input type="number" class="form-control" id="electricityCosts" placeholder="${currentPrinter.costSettings.electricityCosts}" step="0.01">
                                <div class="input-group-append">
                                     <div class="input-group-text"></div>
                                </div>
                          </div>
                    <small id="passwordHelpBlock" class="form-text text-muted">
                        What is your kWh (kilowatt hour) rate for your home electricity.
                    </small>
                  </div>
            </div>
            <div class="col-6">
                    <h5>Printer Costs</h5>
                    <div class="form-group">
                      <label for="coolDown">Purchase Price</label>
                         <div class="input-group mb-2">
                            <input type="number" class="form-control" id="purchasePrice" placeholder="${currentPrinter.costSettings.purchasePrice}" step="0.01">
                                <div class="input-group-append">
                                     <div class="input-group-text"></div>
                                </div>
                          </div>
                      
                      <small id="passwordHelpBlock" class="form-text text-muted">
                          What did you buy your printer for?
                      </small>
                    </div>
                    <div class="form-group">
                      <label for="coolDown">Estimated Life Span</label>
                           <div class="input-group mb-2">
                             <input type="number" class="form-control" id="estimatedLifespan" placeholder="${currentPrinter.costSettings.estimateLifespan}" step="0.01">
                                <div class="input-group-append">
                                     <div class="input-group-text">hours</div>
                                </div>
                          </div>
                      <small id="passwordHelpBlock" class="form-text text-muted">
                          How many hours total do you expect your printer to last?
                      </small>
                    </div>
                    <div class="form-group">
                      <label for="coolDown">Maintenance Costs</label>
                           <div class="input-group mb-2">
                             <input type="number" class="form-control" id="maintenanceCosts" placeholder="${currentPrinter.costSettings.maintenanceCosts}" step="0.01">
                                <div class="input-group-append">
                                     <div class="input-group-text"><i class="fas fa-wrench"></i> / hour</div>
                                </div>
                          </div>
                      <small id="passwordHelpBlock" class="form-text text-muted">
                          What are your printer maintenance costs? Worked out on an hourly basis.
                      </small>
                    </div>                                        
            </div>
        `;
      let scripts = await OctoFarmClient.get("scripts/get");
      scripts = await scripts.json();
      const printerScripts = [];
      scripts.alerts.forEach((script) => {
        if (
          script.printer === currentPrinter._id ||
          script.printer.length === 0
        ) {
          printerScripts.push({
            _id: script._id,
            active: script.active,
            message: script.message,
            scriptLocation: script.scriptLocation,
            trigger: script.trigger,
          });
        }
      });

      const alertsTable = document.getElementById("printerAltersTableBody");
      alertsTable.innerHTML = "";
      printerScripts.forEach(async (script) => {
        alertsTable.insertAdjacentHTML(
          "beforeend",
          `
              <tr>
                <td>
                <form class="was-validated">
                      <div class="custom-control custom-checkbox mb-3">
                            <input type="checkbox" class="custom-control-input" id="activePrinter-${script._id}" required="">
                            <label class="custom-control-label" for="activePrinter-${script._id}"></label>

                        </div>
                    </form>
                </td>
                <td> 
                <select class="custom-select" id="triggerPrinter-${script._id}" disabled>

                 </select>
                       </td>
                <td>${script.scriptLocation} </td>
                <td>${script.message}</td>
              </tr>
          
          `
        );
        document.getElementById(`activePrinter-${script._id}`).checked =
          script.active;
        const triggerSelect = document.getElementById(
          `triggerPrinter-${script._id}`
        );
        triggerSelect.innerHTML = await Script.alertsDrop();
        triggerSelect.value = script.trigger;
      });

      document.getElementById("powerConsumption").value = parseFloat(
        currentPrinter.costSettings.powerConsumption
      );
      document.getElementById("electricityCosts").value = parseFloat(
        currentPrinter.costSettings.electricityCosts
      );
      document.getElementById("purchasePrice").value = parseFloat(
        currentPrinter.costSettings.purchasePrice
      );
      document.getElementById("estimatedLifespan").value = parseFloat(
        currentPrinter.costSettings.estimateLifespan
      );
      document.getElementById("maintenanceCosts").value = parseFloat(
        currentPrinter.costSettings.maintenanceCosts
      );

      document
        .getElementById("savePrinterSettings")
        .addEventListener("click", async (event) => {
          const newValues = {
            printer: {
              printerURL: currentPrinter.printerURL,
              index: currentPrinter._id,
            },
            connection: {
              preferredPort: document.getElementById("psDefaultSerialPort")
                .value,
              preferredBaud: document.getElementById("psDefaultBaudrate").value,
              preferredProfile: document.getElementById("psDefaultProfile")
                .value,
            },
            profileID: currentPrinter.currentProfile.id,
            profile: {
              name: document.getElementById("printerName").innerHTML,
              color: "default",
              model: document.getElementById("printerModel").innerHTML,
              volume: {
                formFactor: document.getElementById("extruderFormFactor")
                  .innerHTML,
                width: parseInt(
                  document.getElementById("volumeWidth").innerHTML
                ),
                depth: parseInt(
                  document.getElementById("volumeDepth").innerHTML
                ),
                height: parseInt(
                  document.getElementById("volumeHeight").innerHTML
                ),
              },
              heatedBed: document.getElementById("heatedBed").checked,
              heatedChamber: document.getElementById("heatedChamber").checked,
              axes: {
                x: {
                  speed: parseInt(
                    document.getElementById("printerXAxis").innerHTML
                  ),
                  inverted: document.getElementById("xInverted").checked,
                },
                y: {
                  speed: parseInt(
                    document.getElementById("printerYAxis").innerHTML
                  ),
                  inverted: document.getElementById("yInverted").checked,
                },
                z: {
                  speed: parseInt(
                    document.getElementById("printerZAxis").innerHTML
                  ),
                  inverted: document.getElementById("zInverted").checked,
                },
                e: {
                  speed: parseInt(
                    document.getElementById("printerEAxis").innerHTML
                  ),
                  inverted: document.getElementById("eInverted").checked,
                },
              },
              extruder: {
                count: parseInt(
                  document.getElementById("extruderCount").innerHTML
                ),
                nozzleDiameter: parseFloat(
                  document.getElementById("nozzleDiameter").innerHTML
                ),
                sharedNozzle: document.getElementById("sharedNozzle").checked,
              },
            },
            systemCommands: {
              serverRestart: document.getElementById("serverRestart").value,
              systemRestart: document.getElementById("systemRestart").value,
              systemShutdown: document.getElementById("systemShutdown").value,
            },
            powerCommands: {
              powerOnCommand: document.getElementById("powerOnCommand").value,
              powerOnURL: document.getElementById("powerOnURL").value,
              powerOffCommand: document.getElementById("powerOffCommand").value,
              powerOffURL: document.getElementById("powerOffURL").value,
              powerToggleCommand: document.getElementById("powerToggleCommand")
                .value,
              powerToggleURL: document.getElementById("powerToggleURL").value,
              powerStatusCommand: document.getElementById("powerStateCommand")
                .value,
              powerStatusURL: document.getElementById("powerStateURL").value,
            },
            gcode: {
              afterPrintCancelled: document.getElementById(
                "settingsAfterPrinterCancelled"
              ).value,
              afterPrintDone: document.getElementById(
                "settingsAfterPrinterDone"
              ).value,
              afterPrintPaused: document.getElementById(
                "settingsAfterPrinterPaused"
              ).value,
              afterPrinterConnected: document.getElementById(
                "settingsAfterPrinterConnected"
              ).value,
              afterToolChange: document.getElementById(
                "settingsAfterToolChange"
              ).value,
              beforePrintResumed: document.getElementById(
                "settingsBeforePrinterResumed"
              ).value,
              beforePrintStarted: document.getElementById(
                "settingsBeforePrinterStarted"
              ).value,
              beforePrinterDisconnected: document.getElementById(
                "settingsBeforePrinterDisconnected"
              ).value,
              beforeToolChange: document.getElementById(
                "settingsBeforeToolChange"
              ).value,
            },
            other: {
              enableCamera: document.getElementById("camEnabled").checked,
              rotateCamera: document.getElementById("camRot90").checked,
              flipHCamera: document.getElementById("camFlipH").checked,
              flipVCamera: document.getElementById("camFlipV").checked,
              enableTimeLapse: document.getElementById("camTimelapse").checked,
              heatingVariation: document.getElementById("headtingVariation")
                .value,
              coolDown: document.getElementById("coolDown").value,
            },
            costSettings: {
              powerConsumption: parseFloat(
                document.getElementById("powerConsumption").value
              ),
              electricityCosts: parseFloat(
                document.getElementById("electricityCosts").value
              ),
              purchasePrice: parseFloat(
                document.getElementById("purchasePrice").value
              ),
              estimateLifespan: parseFloat(
                document.getElementById("estimatedLifespan").value
              ),
              maintenanceCosts: parseFloat(
                document.getElementById("maintenanceCosts").value
              ),
            },
          };
          const profileEdits = document
            .getElementById("psPrinterProfiles")
            .querySelectorAll("[contenteditable=true]");
          profileEdits.forEach((element) => {
            element.contentEditable = false;
            element.classList.remove("contentEditable");
          });
          let update = await OctoFarmClient.post(
            "printers/updateSettings",
            newValues
          );
          if (update.status === 200) {
            update = await update.json();
            UI.createAlert(
              "success",
              `OctoFarm successfully updated for ${currentPrinter.printerName}`,
              3000,
              "clicked"
            );
            if (update.status.profile === 200) {
              UI.createAlert(
                "success",
                `${currentPrinter.printerName}: profile successfully updated`,
                3000,
                "clicked"
              );
            } else {
              UI.createAlert(
                "error",
                `${currentPrinter.printerName}: profile failed to updated`,
                3000,
                "clicked"
              );
            }
            if (update.status.settings === 200) {
              UI.createAlert(
                "success",
                `${currentPrinter.printerName}: settings successfully updated`,
                3000,
                "clicked"
              );
            } else {
              UI.createAlert(
                "error",
                `${currentPrinter.printerName}: settings failed to updated`,
                3000,
                "clicked"
              );
            }
          } else {
            UI.createAlert(
              "error",
              `OctoFarm failed to update ${currentPrinter.printerName}`,
              3000,
              "clicked"
            );
          }
        });
      PrinterSettings.applyState(currentPrinter);
    } else {
      const id = _.findIndex(printers, function (o) {
        return o._id == currentIndex;
      });
      currentPrinter = printers[id];
      PrinterSettings.applyState(currentPrinter);
    } // END
  }

  static compareSave(printer, newValues) {}

  static grabPage() {
    const PrinterSettings = {
      mainPage: {
        title: document.getElementById("printerSettingsSelection"),
        status: document.getElementById("psStatus"),
        host: document.getElementById("psHost"),
        socket: document.getElementById("psWebSocket"),
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        portDropDown: document.getElementById("psSerialPort"),
        baudDropDown: document.getElementById("psBaudrate"),
        apiCheck: document.getElementById("apiCheck"),
        filesCheck: document.getElementById("filesCheck"),
        stateCheck: document.getElementById("stateCheck"),
        profileCheck: document.getElementById("profileCheck"),
        settingsCheck: document.getElementById("settingsCheck"),
        systemCheck: document.getElementById("systemCheck"),
        apiClean: document.getElementById("apiClean"),
        filesClean: document.getElementById("filesClean"),
        stateClean: document.getElementById("stateClean"),
      },
    };
    return PrinterSettings;
  }

  static async applyState(printer) {
    // Garbage collection for terminal
    const elements = await PrinterSettings.grabPage();
    console.log(printer);
    elements.mainPage.status.innerHTML = `<b>Printer Status</b><br>${printer.printerState.state}`;
    elements.mainPage.status.className = `btn btn-${printer.printerState.colour.name} mb-1 btn-block`;
    elements.mainPage.host.innerHTML = `<b>Host Status</b><br>${printer.hostState.state}`;
    elements.mainPage.host.className = `btn btn-${printer.hostState.colour.name} mb-1 btn-block`;
    elements.mainPage.socket.innerHTML = `<b>WebSocket Status</b><br>${printer.webSocketState.desc}`;
    elements.mainPage.socket.className = `btn btn-${printer.webSocketState.colour} mb-1 btn-block`;

    elements.connectPage.apiCheck.innerHTML = `<i class="fas fa-link"></i> <b>API Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.api.date
    )}`;
    elements.connectPage.apiCheck.className = `btn btn-${printer.systemChecks.scanning.api.status} mb-1 btn-block`;
    elements.connectPage.filesCheck.innerHTML = `<i class="fas fa-file-code"></i> <b>Files Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.files.date
    )}`;
    elements.connectPage.filesCheck.className = `btn btn-${printer.systemChecks.scanning.files.status} mb-1 btn-block`;
    elements.connectPage.stateCheck.innerHTML = `<i class="fas fa-info-circle"></i> <b>State Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.state.date
    )}`;
    elements.connectPage.stateCheck.className = `btn btn-${printer.systemChecks.scanning.state.status} mb-1 btn-block`;
    elements.connectPage.profileCheck.innerHTML = `<i class="fas fa-id-card"></i> <b>Profile Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.profile.date
    )}`;
    elements.connectPage.profileCheck.className = `btn btn-${printer.systemChecks.scanning.profile.status} mb-1 btn-block`;
    elements.connectPage.settingsCheck.innerHTML = `<i class="fas fa-cog"></i> <b>Settings Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.settings.date
    )}`;
    elements.connectPage.settingsCheck.className = `btn btn-${printer.systemChecks.scanning.settings.status} mb-1 btn-block`;
    elements.connectPage.systemCheck.innerHTML = `<i class="fas fa-server"></i> <b>System Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.scanning.system.date
    )}`;
    elements.connectPage.systemCheck.className = `btn btn-${printer.systemChecks.scanning.system.status} mb-1 btn-block`;

    elements.connectPage.apiClean.innerHTML = `<i class="fas fa-server"></i> <b>Printer Clean</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.cleaning.information.date
    )}`;
    elements.connectPage.apiClean.className = `btn btn-${printer.systemChecks.cleaning.information.status} mb-1 btn-block`;
    elements.connectPage.filesClean.innerHTML = `<i class="fas fa-server"></i> <b>File Clean</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.cleaning.file.date
    )}`;
    elements.connectPage.filesClean.className = `btn btn-${printer.systemChecks.cleaning.file.status} mb-1 btn-block`;
    elements.connectPage.stateClean.innerHTML = `<i class="fas fa-server"></i> <b>Job Clean</b><br><b>Last Checked: </b>${Calc.dateClean(
      printer.systemChecks.cleaning.job.date
    )}`;
    elements.connectPage.stateClean.className = `btn btn-${printer.systemChecks.cleaning.job.status} mb-1 btn-block`;

    if (
      printer.printerState.colour.category === "Offline" ||
      printer.printerState.colour.category === "Disconnected"
    ) {
      if (
        printer.printerState.state === "Offline" ||
        printer.printerState.state === "Shutdown" ||
        printer.printerState.state === "Searching..."
      ) {
        $("#PrinterSettingsModal").modal("hide");
      }
    }
  }
}
