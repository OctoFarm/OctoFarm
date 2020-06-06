
import OctoFarmClient from "../octofarm.js";
import UI from "../functions/ui.js";
import Validate from "../functions/validate.js";
import Script from "./scriptCheck.js"

let currentIndex = 0;

let previousLog = null;

let lastPrinter = null;

let printDropCheck = false;

//Close modal event listeners...
$("#PrinterSettingsModal").on("hidden.bs.modal", function(e) {
  //Fix for mjpeg stream not ending when element removed...
  document.getElementById("printerControlCamera").src = "";
});
$("#connectionModal").on("hidden.bs.modal", function(e) {
  if (document.getElementById("connectionAction")) {
    document.getElementById("connectionAction").remove();
  }
});

export default class PrinterSettings {
  static grabName(printer){
    let name = "";
    if (typeof printer.settingsAppearance != "undefined") {
      if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
        name = printer.printerURL;
      } else {
        name = printer.settingsAppearance.name;
      }
    } else {
      name = printer.printerURL;
    }
    return name;
  }
  static grabThumb(value){
    if(value === true){
      return "<i class=\"text-success fas fa-thumbs-up\"></i>"
    }else{
      return "<i class=\"text-danger fas fa-thumbs-down\"></i>"
    }
  }
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
          heatedChamber: false,
        }
      }

      if (
          currentIndex ===
          document.getElementById("printerSettingsIndex").innerHTML
      ) {
      } else {
        //Load the printer drop down...
        let printerDrop = document.getElementById("printerSettingsSelection");
        printerDrop.innerHTML = "";
        printers.forEach(printer => {
          let name = PrinterSettings.grabName(printer);
          if(printer.stateColour.category !== "Offline"){
            printerDrop.insertAdjacentHTML('beforeend', `
                <option value="${printer._id}" selected>${name}</option>
            `)
          }
        })
        printerDrop.value = printer._id;
        if(!printDropCheck){
          printerDrop.addEventListener('change', event => {
            let newIndex = document.getElementById("printerSettingsSelection").value;
            PrinterSettings.updateIndex(newIndex);
            PrinterSettings.init(printers)
          });
          printDropCheck = true;
        }
        //Setup page
        const printerPort = document.getElementById("psPortDrop");
        const printerBaud = document.getElementById("psBaudDrop");
        const printerProfile = document.getElementById("psProfileDrop");
        const printerConnect = document.getElementById("psConnect");

        // printerPort.innerHTML = `
        // <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardSerialPort">Port:</label> </div> <select class="custom-select bg-secondary text-light" id="psSerialPort"></select></div>
        // `;
        // printerBaud.innerHTML = `
        // <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardBaudrate">Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="psBaudrate"></select></div>
        // `;
        // printerProfile.innerHTML = `
        // <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardPrinterProfile">Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="psProfile"></select></div>
        // `;
        // availableBaud.forEach(baud => {
        //   document
        //       .getElementById("psBaudrate")
        //       .insertAdjacentHTML(
        //           "beforeend",
        //           `<option value="${baud}">${baud}</option>`
        //       );
        // });
        // if (preferedBaud != null) {
        //   document.getElementById("psBaudrate").value = preferedBaud;
        // }
        // availablePort.forEach(port => {
        //   document
        //       .getElementById("psSerialPort")
        //       .insertAdjacentHTML(
        //           "beforeend",
        //           `<option value="${port}">${port}</option>`
        //       );
        // });
        // if (preferedPort != null) {
        //   document.getElementById("psSerialPort").value = preferedPort;
        // }
        // availableProfile.forEach(profile => {
        //   document
        //       .getElementById("psProfile")
        //       .insertAdjacentHTML(
        //           "beforeend",
        //           `<option value="${profile.id}">${profile.name}</option>`
        //       );
        // });
        // if (preferedProfile != null) {
        //   document.getElementById("psProfile").value = preferedProfile;
        // }
        //
        // if (printer.state === "Disconnected") {
        //   printerConnect.innerHTML =
        //       '<center> <button id="psConnectBtn" class="btn btn-success inline" value="connect">Connect</button></center>';
        // } else {
        //   printerConnect.innerHTML =
        //       '<center> <button id="psConnectBtn" class="btn btn-danger inline" value="disconnect">Disconnect</button></center>';
        //   document.getElementById("psSerialPort").disabled = true;
        //   document.getElementById("psBaudrate").disabled = true;
        //   document.getElementById("psProfile").disabled = true;
        // }

        const printerDefaultPort = document.getElementById("psDefaultPortDrop");
        const printerDefaultBaud = document.getElementById("psDefaultBaudDrop");
        const printerDefaultProfile = document.getElementById("psDefaultProfileDrop");

        printerDefaultPort.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultSerialPort"">Preferred Port:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultSerialPort"></select></div>
        `;
        printerDefaultBaud.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultBaudrate">Preferred Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultBaudrate"></select></div>
        `;
        printerDefaultProfile.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="psDefaultProfile">Preferred Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="psDefaultProfile"></select></div>
        `;
        document.getElementById("printerSettingsIndex").innerHTML = printer._id;
        availableBaud.forEach(baud => {
          document
              .getElementById("psDefaultBaudrate")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${baud}">${baud}</option>`
              );
        });
        if(preferedBaud === null) {
          document
              .getElementById("psDefaultBaudrate")
              .insertAdjacentHTML(
                  "afterbegin",
                  `<option value="0">No Preference</option>`);
        }
        availablePort.forEach(port => {
          document
              .getElementById("psDefaultSerialPort")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${port}">${port}</option>`
              );
        });
        if(preferedPort === null) {
          document
              .getElementById("psDefaultSerialPort")
              .insertAdjacentHTML(
                  "afterbegin",
                  `<option value="0">No Preference</option>`);
        }
        availableProfile.forEach(profile => {
          document
              .getElementById("psDefaultProfile")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${profile.id}">${profile.name}</option>`
              );
        });
        if(preferedProfile === null) {
          document
              .getElementById("psDefaultProfile")
              .insertAdjacentHTML(
                  "afterbegin",
                  `<option value="0">No Preference</option>`);
        }
        if (preferedBaud != null) {

          document.getElementById("psDefaultBaudrate").value = preferedBaud;
        }else{
          document.getElementById("psDefaultBaudrate").value = 0;
        }
        if (preferedPort != null) {

          document.getElementById("psDefaultSerialPort").value = preferedPort;
        }else{
          document.getElementById("psDefaultSerialPort").value = 0;
        }
        if (preferedProfile != null) {
          document.getElementById("psDefaultProfile").value = preferedProfile;
        }else{
          document.getElementById("psDefaultProfile").value = 0;
        }

        document.getElementById("psPrinterProfiles").innerHTML = `
            <div class="col-12">
                <button id="editProfileBtn" type="button" class="btn btn-warning">Edit</button></div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Printer</u></h6>
            <p class="mb-0"><b>Printer Name: </b><span id="printerName" contenteditable="false">${PrinterSettings.grabName(printer)}</span></p>
            <p class="mb-0"><b>Printer Model: </b><span id="printerModel" contenteditable="false">${pProfile.model}</span></p>
            <h6 class="mb-1"><u>Axis</u></h6>
            <p class="mb-0"><b>E: </b><span id="printerEAxis" contenteditable="false">${pProfile.axes.e.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="eInverted" required>
                                                        <label class="custom-control-label" for="eInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>X: </b><span id="printerXAxis" contenteditable="false">${pProfile.axes.x.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="xInverted" required>
                                                        <label class="custom-control-label" for="xInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>Y: </b><span id="printerYAxis" contenteditable="false">${pProfile.axes.y.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="yInverted" required>
                                                        <label class="custom-control-label" for="yInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            <p class="mb-0"><b>Z: </b><span id="printerZAxis" contenteditable="false">${pProfile.axes.z.speed}</span>mm/min<br><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="zInverted" required>
                                                        <label class="custom-control-label" for="zInverted">Inverted</label>
                                                    </div>
                                                </form></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Extrusion</u></h6>
            <p class="mb-0"><b>Extruder Count: </b><span id="extruderCount" contenteditable="false">${pProfile.extruder.count}</span></p>
            <p class="mb-0"><b>Nozzle Size: </b><span id="nozzleDiameter" contenteditable="false">${pProfile.extruder.nozzleDiameter}</span></p>
          
            <p class="mb-0"><span><form class="was-validated">
                                                    <div class="custom-control custom-checkbox mb-3">
                                                        <input type="checkbox" class="custom-control-input" id="sharedNozzle" required>
                                                        <label class="custom-control-label" for="sharedNozzle">Shared Nozzle</label>
                                                    </div>
                                                </form></span></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Bed / Chamber</u></h6>
             <p class="mb-1"><b>Form Factor: </b><span id="extruderFormFactor" contenteditable="false">${pProfile.volume.formFactor}</span></p>                   
            <p class="mb-1"><b>Dimensions:</b>D: <span id="volumeDepth" contenteditable="false">${pProfile.volume.depth}</span>mm x H: <span id="volumeHeight" contenteditable="false">${pProfile.volume.height}</span>mm x W: <span id="volumeWidth" contenteditable="false">${pProfile.volume.width}</span>mm</p> 
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
        document.getElementById("editProfileBtn").addEventListener('click', event => {
          let profileEdits = document.getElementById("psPrinterProfiles").querySelectorAll('[contenteditable=false]')
          profileEdits.forEach(element => {
            element.classList.add("Active");
            element.contentEditable = true;
          })
        });
        document.getElementById("eInverted").checked = pProfile.axes.e.inverted;
        document.getElementById("xInverted").checked = pProfile.axes.x.inverted;
        document.getElementById("yInverted").checked = pProfile.axes.y.inverted;
        document.getElementById("zInverted").checked = pProfile.axes.z.inverted;
        document.getElementById("sharedNozzle").checked = pProfile.extruder.sharedNozzle;
        document.getElementById("heatedBed").checked = pProfile.heatedBed;
        document.getElementById("heatedChamber").checked = pProfile.heatedChamber;

        let afterPrintCancelled = "";
        if (typeof printer.gcode.gcode.afterPrintCancelled != "undefined") {
          afterPrintCancelled = printer.gcode.gcode.afterPrintCancelled;
        }
        let afterPrintDone = "";
        if (typeof printer.gcode.gcode.afterPrintDone != "undefined") {
          afterPrintDone = printer.gcode.gcode.afterPrintDone;
        }
        let afterPrintPaused = "";
        if (typeof printer.gcode.gcode.afterPrintPaused != "undefined") {
          afterPrintPaused = printer.gcode.gcode.afterPrintPaused;
        }
        let afterPrinterConnected = "";
        if (typeof printer.gcode.gcode.afterPrinterConnected != "undefined") {
          afterPrinterConnected = printer.gcode.gcode.afterPrinterConnected;
        }
        let beforePrintResumed = "";
        if (typeof printer.gcode.gcode.beforePrintResumed != "undefined") {
          beforePrintResumed = printer.gcode.gcode.beforePrintResumed;
        }
        let afterToolChange = "";
        if (typeof printer.gcode.gcode.afterToolChange != "undefined") {
          afterToolChange = printer.gcode.gcode.afterToolChange;
        }
        let beforePrintStarted = "";
        if (typeof printer.gcode.gcode.beforePrintStarted != "undefined") {
          beforePrintStarted = printer.gcode.gcode.beforePrintStarted;
        }
        let beforePrinterDisconnected = "";
        if (typeof printer.gcode.gcode.beforePrinterDisconnected != "undefined") {
          beforePrinterDisconnected = printer.gcode.gcode.beforePrinterDisconnected;
        }
        let beforeToolChange = "";
        if (typeof printer.gcode.gcode.beforeToolChange != "undefined") {
          beforeToolChange = printer.gcode.gcode.beforeToolChange;
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
            printer.settingsWebcam.webcamEnabled;
        document.getElementById("camTimelapse").checked =
            printer.settingsWebcam.timelapseEnabled;
        document.getElementById("camRot90").checked =
            printer.settingsWebcam.rotate90;
        document.getElementById("camFlipH").checked =
            printer.settingsWebcam.flipH;
        document.getElementById("camFlipV").checked =
            printer.settingsWebcam.flipV;
        let serverRestart = null;
        let systemRestart = null;
        let systemShutdown = null;
        if(printer.settingsServer.commands.serverRestartCommand === null || printer.settingsServer.commands.serverRestartCommand === ""){
          serverRestart = "N/A";
        }else{
          serverRestart = printer.settingsServer.commands.serverRestartCommand
        }
        if(printer.settingsServer.commands.systemRestartCommand === null || printer.settingsServer.commands.systemRestartCommand === ""){
          systemRestart = "N/A";
        }else{
          systemRestart = printer.settingsServer.commands.systemRestartCommand
        }
        if(printer.settingsServer.commands.systemShutdownCommand === null || printer.settingsServer.commands.systemShutdownCommand === ""){
          systemShutdown = "N/A";
        }else{
          systemShutdown = printer.settingsServer.commands.systemShutdownCommand
        }

        document.getElementById("printerSettingsFooter").innerHTML = ``;
        document.getElementById("printerSettingsFooter").insertAdjacentHTML('beforeend', `
                            <button type="button" class="btn btn-light" data-dismiss="modal">Close</button>
                           <button type="button" class="btn btn-success" id="savePrinterSettings">Save</button>
        `)
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
        if(serverRestart != "N/A"){
          document.getElementById("serverRestart").value = serverRestart;
        }
        if(systemRestart != "N/A"){
          document.getElementById("systemRestart").value = systemRestart;
        }
        if(systemShutdown != "N/A"){
          document.getElementById("systemShutdown").value = systemShutdown;
        }
        if(printer.powerSettings != null){
          document.getElementById("powerOnCommand").value = printer.powerSettings.powerOnCommand;
          document.getElementById("powerOnURL").value = printer.powerSettings.powerOnURL;
          document.getElementById("powerOffCommand").value = printer.powerSettings.powerOffCommand;
          document.getElementById("powerOffURL").value = printer.powerSettings.powerOffURL;
          document.getElementById("powerToggleCommand").value = printer.powerSettings.powerToggleCommand;
          document.getElementById("powerToggleURL").value = printer.powerSettings.powerToggleURL;
          document.getElementById("powerStateCommand").value = printer.powerSettings.powerStatusCommand;
          document.getElementById("powerStateURL").value = printer.powerSettings.powerStatusURL;
        }
        document.getElementById("tempTriggers").innerHTML = `
           <div class="form-group">
              <label for="headtingVariation">Heating Variation</label>
              <input type="number" class="form-control" id="headtingVariation" placeholder="${printer.tempTriggers.heatingVariation}" step="0.01">
              <small id="passwordHelpBlock" class="form-text text-muted">
                  What temperature variation will trigger orange warning on the temperature display when a printer is Active. <code>Default is 1°C</code>
              </small>
            </div>
            <div class="form-group">
              <label for="coolDown">Cool Down Trigger</label>
              <input type="number" class="form-control" id="coolDown" placeholder="${printer.tempTriggers.coolDown}" step="0.01">
              <small id="passwordHelpBlock" class="form-text text-muted">
                  What temperature limit will trigger the blue status on the temperature display when a printer is Complete and cooling down. <code>Default is 30°C</code>
              </small>
            </div>
        `
        document.getElementById("psPrinterCost").innerHTML = `
            <div class="col-6">
                   <h5>Operating Costs</h5>
                   <div class="form-group">
                    <label for="coolDown">Power Consumption</label>
                          <div class="input-group mb-2">
                                <input type="number" class="form-control" id="powerConsumption" placeholder="${printer.costSettings.powerConsumption}" step="0.01">
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
                            <input type="number" class="form-control" id="electricityCosts" placeholder="${printer.costSettings.electricityCosts}" step="0.01">
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
                            <input type="number" class="form-control" id="purchasePrice" placeholder="${printer.costSettings.purchasePrice}" step="0.01">
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
                             <input type="number" class="form-control" id="estimatedLifespan" placeholder="${printer.costSettings.estimateLifespan}" step="0.01">
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
                             <input type="number" class="form-control" id="maintenanceCosts" placeholder="${printer.costSettings.maintenanceCosts}" step="0.01">
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
        let printerScripts = [];
        scripts.alerts.forEach(script => {
          if(script.printer === printer._id || script.printer.length === 0){
            console.log(script)
            printerScripts.push({_id: script._id, active: script.active, message: script.message, scriptLocation: script.scriptLocation, trigger: script.trigger})
          }
        })

        let alertsTable = document.getElementById("printerAltersTableBody")
        alertsTable.innerHTML = "";
        printerScripts.forEach(async script => {
          alertsTable.insertAdjacentHTML('beforeend', `
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
          
          `)
          document.getElementById("activePrinter-"+script._id).checked = script.active;
          let triggerSelect = document.getElementById("triggerPrinter-"+script._id)
          triggerSelect.innerHTML = await Script.alertsDrop();
          triggerSelect.value = script.trigger;
        })

        document.getElementById("powerConsumption").value = parseFloat(printer.costSettings.powerConsumption);
        document.getElementById("electricityCosts").value = parseFloat(printer.costSettings.electricityCosts);
        document.getElementById("purchasePrice").value = parseFloat(printer.costSettings.purchasePrice);
        document.getElementById("estimatedLifespan").value = parseFloat(printer.costSettings.estimateLifespan);
        document.getElementById("maintenanceCosts").value = parseFloat(printer.costSettings.maintenanceCosts);

        document.getElementById("savePrinterSettings").addEventListener('click', async event => {
          let newValues = {
            printer: {
              printerURL: printer.printerURL,
              index: printer._id,
            },
            connection: {
              preferredPort: document.getElementById("psDefaultSerialPort").value,
              preferredBaud: document.getElementById("psDefaultBaudrate").value,
              preferredProfile: document.getElementById("psDefaultProfile").value,
            },
            profileID: selectedProfile,
            profile: {
              "name": document.getElementById("printerName").innerHTML,
              "color": "default",
              "model": document.getElementById("printerModel").innerHTML,
              "volume": {
                "formFactor": document.getElementById("extruderFormFactor").innerHTML,
                "width": parseInt(document.getElementById("volumeWidth").innerHTML),
                "depth": parseInt(document.getElementById("volumeDepth").innerHTML),
                "height": parseInt(document.getElementById("volumeHeight").innerHTML)
              },
              "heatedBed": document.getElementById("heatedBed").checked,
              "heatedChamber": document.getElementById("heatedChamber").checked,
              "axes": {
                "x": {
                  "speed": parseInt(document.getElementById("printerXAxis").innerHTML),
                  "inverted": document.getElementById("xInverted").checked
                },
                "y": {
                  "speed": parseInt(document.getElementById("printerYAxis").innerHTML),
                  "inverted": document.getElementById("yInverted").checked
                },
                "z": {
                  "speed": parseInt(document.getElementById("printerZAxis").innerHTML),
                  "inverted": document.getElementById("zInverted").checked
                },
                "e": {
                  "speed": parseInt(document.getElementById("printerEAxis").innerHTML),
                  "inverted": document.getElementById("eInverted").checked
                }
              },
              "extruder": {
                "count": parseInt(document.getElementById("extruderCount").innerHTML),
                "nozzleDiameter": parseFloat(document.getElementById("nozzleDiameter").innerHTML),
                "sharedNozzle": document.getElementById("sharedNozzle").checked,
              }
            },
            systemCommands: {
              serverRestart: document.getElementById("serverRestart").value,
              systemRestart: document.getElementById("systemRestart").value,
              systemShutdown: document.getElementById("systemShutdown").value,
            },
            powerCommands:{
              powerOnCommand: document.getElementById("powerOnCommand").value,
              powerOnURL: document.getElementById("powerOnURL").value,
              powerOffCommand: document.getElementById("powerOffCommand").value,
              powerOffURL: document.getElementById("powerOffURL").value,
              powerToggleCommand: document.getElementById("powerToggleCommand").value,
              powerToggleURL: document.getElementById("powerToggleURL").value,
              powerStatusCommand: document.getElementById("powerStateCommand").value,
              powerStatusURL: document.getElementById("powerStateURL").value,
            },
            gcode:{
              afterPrintCancelled: document.getElementById("settingsAfterPrinterCancelled").value,
              afterPrintDone: document.getElementById("settingsAfterPrinterDone").value,
              afterPrintPaused: document.getElementById("settingsAfterPrinterPaused").value,
              afterPrinterConnected: document.getElementById("settingsAfterPrinterConnected").value,
              afterToolChange: document.getElementById("settingsAfterToolChange").value,
              beforePrintResumed: document.getElementById("settingsBeforePrinterResumed").value,
              beforePrintStarted: document.getElementById("settingsBeforePrinterStarted").value,
              beforePrinterDisconnected: document.getElementById("settingsBeforePrinterDisconnected").value,
              beforeToolChange: document.getElementById("settingsBeforeToolChange").value,
            },
            other: {
              enableCamera: document.getElementById("camEnabled").checked,
              rotateCamera: document.getElementById("camRot90").checked,
              flipHCamera: document.getElementById("camFlipH").checked,
              flipVCamera: document.getElementById("camFlipV").checked,
              enableTimeLapse: document.getElementById("camTimelapse").checked,
              heatingVariation: document.getElementById("headtingVariation").value,
              coolDown: document.getElementById("coolDown").value,
            },
            costSettings: {
              powerConsumption: parseFloat(document.getElementById("powerConsumption").value),
              electricityCosts: parseFloat(document.getElementById("electricityCosts").value),
              purchasePrice: parseFloat(document.getElementById("purchasePrice").value),
              estimateLifespan: parseFloat(document.getElementById("estimatedLifespan").value),
              maintenanceCosts: parseFloat(document.getElementById("maintenanceCosts").value)
            }
          }
            let profileEdits = document.getElementById("psPrinterProfiles").querySelectorAll('[contenteditable=true]')
            profileEdits.forEach(element => {
              element.contentEditable = false;
              element.classList.remove("Active");
            })
          let update = await OctoFarmClient.post("printers/updateSettings", newValues);
          if(update.status === 200){
            update = await update.json();
            UI.createAlert("success", "OctoFarm successfully updated for " + Validate.getName(printer), 3000, "clicked")
            if(update.status.profile === 200){
              UI.createAlert("success", Validate.getName(printer) + ": profile successfully updated", 3000, "clicked")
            }else{
              UI.createAlert("error", Validate.getName(printer) + ": profile failed to updated", 3000, "clicked")
            }
            if(update.status.settings === 200){
              UI.createAlert("success", Validate.getName(printer) + ": settings successfully updated", 3000, "clicked")
            }else{
              UI.createAlert("error", Validate.getName(printer) + ": settings failed to updated", 3000, "clicked")
            }
          }else{
            UI.createAlert("error", "OctoFarm failed to update " + Validate.getName(printer), 3000, "clicked")
          }


        });


        //let elements = PrinterSettings.grabPage();

        //PrinterSettings.applyListeners(printer, elements, printers);
      }
      PrinterSettings.applyState(printer);
    }
  }
  static compareSave(printer, newValues){

  }
  // static applyListeners(printer, elements, printers) {
  //   let rangeSliders = document.querySelectorAll("input.octoRange");
  //   rangeSliders.forEach(slider => {
  //     slider.addEventListener("input", e => {
  //       e.target.previousSibling.previousSibling.lastChild.innerHTML = `${e.target.value}%`;
  //     });
  //   });
  //   if (printer.state != "Disconnected") {
  //     elements.connectPage.connectButton.addEventListener("click", e => {
  //       elements.connectPage.connectButton.disabled = true;
  //       OctoPrintClient.connect(
  //           elements.connectPage.connectButton.value,
  //           printer
  //       );
  //     });
  //   } else {
  //     elements.connectPage.connectButton.addEventListener("click", e => {
  //       elements.connectPage.connectButton.disabled = true;
  //       OctoPrintClient.connect(
  //           elements.connectPage.connectButton.value,
  //           printer
  //       );
  //     });
  //   }
  //
  //   //Control Listeners... There's a lot!
  //   elements.printerControls.xPlus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "x");
  //   });
  //   elements.printerControls.xMinus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "x", "-");
  //   });
  //   elements.printerControls.yPlus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "y");
  //   });
  //   elements.printerControls.yMinus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "y", "-");
  //   });
  //   elements.printerControls.xyHome.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "home", ["x", "y"]);
  //   });
  //   elements.printerControls.zPlus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "z");
  //   });
  //   elements.printerControls.zMinus.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "jog", "z", "-");
  //   });
  //   elements.printerControls.zHome.addEventListener("click", e => {
  //     OctoPrintClient.move(e, printer, "home", ["z"]);
  //   });
  //   elements.printerControls.step01.addEventListener("click", e => {
  //     OctoFarmClient.post("printers/stepChange", {
  //       printer: printer._id,
  //       newSteps: "01"
  //     });
  //     e.target.className = "btn btn-dark active";
  //     elements.printerControls.step1.className = "btn btn-light";
  //     elements.printerControls.step10.className = "btn btn-light";
  //     elements.printerControls.step100.className = "btn btn-light";
  //   });
  //   elements.printerControls.step1.addEventListener("click", e => {
  //     OctoFarmClient.post("printers/stepChange", {
  //       printer: printer._id,
  //       newSteps: "1"
  //     });
  //     e.target.className = "btn btn-dark active";
  //     elements.printerControls.step01.className = "btn btn-light";
  //     elements.printerControls.step10.className = "btn btn-light";
  //     elements.printerControls.step100.className = "btn btn-light";
  //   });
  //   elements.printerControls.step10.addEventListener("click", e => {
  //     OctoFarmClient.post("printers/stepChange", {
  //       printer: printer._id,
  //       newSteps: "10"
  //     });
  //     e.target.className = "btn btn-dark active";
  //     elements.printerControls.step1.className = "btn btn-light";
  //     elements.printerControls.step01.className = "btn btn-light";
  //     elements.printerControls.step100.className = "btn btn-light";
  //   });
  //   elements.printerControls.step100.addEventListener("click", e => {
  //     OctoFarmClient.post("printers/stepChange", {
  //       printer: printer._id,
  //       newSteps: "100"
  //     });
  //     e.target.className = "btn btn-dark active";
  //     elements.printerControls.step1.className = "btn btn-light";
  //     elements.printerControls.step10.className = "btn btn-light";
  //     elements.printerControls.step01.className = "btn btn-light";
  //   });
  //
  //   let e0Set = async function (e) {
  //     let flashReturn = function () {
  //       elements.printerControls.e0Set.className = "btn btn-md btn-light m-0 p-1";
  //     };
  //     let value = elements.printerControls.e0Target.value;
  //     elements.printerControls.e0Target.value = "";
  //     if (value === "Off") {
  //       value = 0;
  //     }
  //     let opt = {
  //       command: "target",
  //       targets: {
  //         tool0: parseInt(value)
  //       }
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/tool", opt);
  //     if (post.status === 204) {
  //       elements.printerControls.e0Set.className = "btn btn-md btn-success m-0 p-1";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       elements.printerControls.e0Set.className = "btn btn-md btn-danger m-0 p-1";
  //       setTimeout(flashReturn, 500);
  //     }
  //   }
  //   elements.printerControls.e0Target.addEventListener("change", async e => {
  //     if (elements.printerControls.e0Target.value <= 0) {
  //       elements.printerControls.e0Target.value = "0"
  //     }
  //   });
  //   elements.printerControls.e0Target.addEventListener("keypress", async e => {
  //     if (e.key === 'Enter') {
  //       e0Set(e);
  //     }
  //   });
  //   elements.printerControls.e0Set.addEventListener("click", async e => {
  //     e0Set(e);
  //   });
  //
  //   let bedSet = async function (e) {
  //     let flashReturn = function () {
  //       elements.printerControls.bedSet.classList = "btn btn-md btn-light m-0 p-1";
  //     };
  //     let value = elements.printerControls.bedTarget.value;
  //
  //     elements.printerControls.bedTarget.value = "";
  //     if (value === "Off") {
  //       value = 0;
  //     }
  //     let opt = {
  //       command: "target",
  //       target: parseInt(value)
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/bed", opt);
  //     if (post.status === 204) {
  //       elements.printerControls.bedSet.className = "btn btn-md btn-success m-0 p-1";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       elements.printerControls.bedSet.className = "btn btn-md btn-success m-0 p-1";
  //       setTimeout(flashReturn, 500);
  //     }
  //   }
  //   elements.printerControls.bedTarget.addEventListener("change", async e => {
  //     if (elements.printerControls.bedTarget.value <= 0) {
  //       elements.printerControls.bedTarget.value = "0"
  //     }
  //   });
  //   elements.printerControls.bedTarget.addEventListener("keypress", async e => {
  //     if (e.key === 'Enter') {
  //       bedSet(e);
  //     }
  //   });
  //   elements.printerControls.bedSet.addEventListener("click", async e => {
  //     bedSet(e);
  //   });
  //   elements.printerControls.feedRate.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     let value = elements.printerControls.feedRateValue.innerHTML;
  //     value = value.replace("%", "");
  //     OctoFarmClient.post("printers/feedChange", {
  //       printer: printer._id,
  //       newSteps: value
  //     });
  //     let opt = {
  //       command: "feedrate",
  //       factor: parseInt(value)
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/printhead", opt);
  //     if (post.status === 204) {
  //       e.target.classList = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       e.target.classList = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   });
  //   elements.printerControls.flowRate.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     let value = elements.printerControls.flowRateValue.innerHTML;
  //     value = value.replace("%", "");
  //     OctoFarmClient.post("printers/flowChange", {
  //       printer: printer._id,
  //       newSteps: value
  //     });
  //     let opt = {
  //       command: "flowrate",
  //       factor: parseInt(value)
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/tool", opt);
  //     if (post.status === 204) {
  //       e.target.classList = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       e.target.classList = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   });
  //   elements.printerControls.motorsOff.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     let opt = {
  //       commands: ["M18"]
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/command", opt);
  //     if (post.status === 204) {
  //       e.target.classList = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       e.target.classList = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   });
  //   elements.printerControls.fansOn.addEventListener("click", async e => {
  //     let fanspeed = elements.printerControls.fanPercent.innerHTML;
  //     fanspeed = fanspeed.replace("%", "");
  //     fanspeed = fanspeed / 100;
  //     fanspeed = 255 * fanspeed;
  //     fanspeed = Math.floor(fanspeed);
  //
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     let opt = {
  //       commands: [`M106 S${fanspeed}`]
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/command", opt);
  //     if (post.status === 204) {
  //       e.target.classList = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       e.target.classList = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   });
  //   elements.printerControls.fansOff.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     let opt = {
  //       commands: ["M107"]
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/command", opt);
  //     if (post.status === 204) {
  //       e.target.classList = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       e.target.classList = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   });
  //   elements.printerControls.extrude.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     if (
  //         elements.printerControls.extruder.value != undefined &&
  //         elements.printerControls.extruder.value !== ""
  //     ) {
  //       let select = OctoPrintClient.selectTool(printer, "tool0");
  //       if (select) {
  //         let value = elements.printerControls.extruder.value;
  //         let opt = {
  //
  //           command: "extrude",
  //           amount: parseInt(value)
  //         };
  //         let post = await OctoPrintClient.post(printer, "printer/tool", opt);
  //         if (post.status === 204) {
  //           e.target.classList = "btn btn-success";
  //           setTimeout(flashReturn, 500);
  //         } else {
  //           e.target.classList = "btn btn-danger";
  //           setTimeout(flashReturn, 500);
  //         }
  //       }
  //     } else {
  //       UI.createAlert(
  //           "error",
  //           "You haven't told octoprint how much you'd like to extrude...",
  //           3000,
  //           "clicked"
  //       );
  //     }
  //   });
  //   elements.printerControls.retract.addEventListener("click", async e => {
  //     let flashReturn = function () {
  //       e.target.classList = "btn btn-light";
  //     };
  //     if (
  //         elements.printerControls.extruder.value != undefined &&
  //         elements.printerControls.extruder.value !== ""
  //     ) {
  //       let select = OctoPrintClient.selectTool(printer, "tool0");
  //       if (select) {
  //         let value = elements.printerControls.extruder.value;
  //         value = "-" + value;
  //         let opt = {
  //           command: "extrude",
  //           amount: parseInt(value)
  //         };
  //         let post = await OctoPrintClient.post(
  //             printer,
  //             "printer/tool",
  //             opt
  //         );
  //         if (post.status === 204) {
  //           e.target.classList = "btn btn-success";
  //           setTimeout(flashReturn, 500);
  //         } else {
  //           e.target.classList = "btn btn-danger";
  //           setTimeout(flashReturn, 500);
  //         }
  //       }
  //     } else {
  //       UI.createAlert(
  //           "error",
  //           "You haven't told octoprint how much you'd like to retract...",
  //           3000,
  //           "clicked"
  //       );
  //     }
  //   });
  //   elements.printerControls.printStart.addEventListener("click", async e => {
  //     e.target.disabled = true;
  //     let opts = {
  //       command: "start"
  //     };
  //     OctoPrintClient.jobAction(printer, opts, e);
  //   });
  //   elements.printerControls.printPause.addEventListener("click", e => {
  //     e.target.disabled = true;
  //     let opts = {
  //       command: "pause",
  //       action: "pause"
  //     };
  //     OctoPrintClient.jobAction(printer, opts, e);
  //   });
  //   elements.printerControls.printRestart.addEventListener("click", e => {
  //     e.target.disabled = true;
  //     let opts = {
  //       command: "restart"
  //     };
  //     OctoPrintClient.jobAction(printer, opts, e);
  //   });
  //   elements.printerControls.printResume.addEventListener("click", e => {
  //     e.target.disabled = true;
  //     let opts = {
  //       command: "pause",
  //       action: "resume"
  //     };
  //     OctoPrintClient.jobAction(printer, opts, e);
  //   });
  //   elements.printerControls.printStop.addEventListener("click", e => {
  //     bootbox.confirm({
  //       message: `${printer._id}.  ${printer.settingsAppearance.name}: <br>Are you sure you want to cancel the ongoing print?`,
  //       buttons: {
  //         cancel: {
  //           label: '<i class="fa fa-times"></i> Cancel'
  //         },
  //         confirm: {
  //           label: '<i class="fa fa-check"></i> Confirm'
  //         }
  //       },
  //       callback: function (result) {
  //         if (result) {
  //           e.target.disabled = true;
  //           let opts = {
  //             command: "cancel"
  //           };
  //           OctoPrintClient.jobAction(printer, opts, e);
  //         }
  //       }
  //     });
  //   });
  //   let submitTerminal = async function (e) {
  //     let input = elements.terminal.input.value;
  //     input = input.toUpperCase();
  //     elements.terminal.input.value = "";
  //     let flashReturn = function () {
  //       elements.terminal.sendBtn = "btn btn-secondary";
  //     };
  //     let opt = {
  //       commands: [input]
  //     };
  //     let post = await OctoPrintClient.post(printer, "printer/command", opt);
  //     if (post.status === 204) {
  //       elements.terminal.sendBtn = "btn btn-success";
  //       setTimeout(flashReturn, 500);
  //     } else {
  //       elements.terminal.sendBtn = "btn btn-danger";
  //       setTimeout(flashReturn, 500);
  //     }
  //   }
  //   elements.terminal.input.addEventListener("keypress", async e => {
  //     if (e.key === 'Enter') {
  //       submitTerminal(e);
  //     }
  //   });
  //   elements.terminal.sendBtn.addEventListener("click", async e => {
  //     submitTerminal(e);
  //   });
  //   elements.fileManager.uploadFiles.addEventListener('change', function() {
  //     UI.createAlert("warning", "Your files for Printer: " + PrinterSettings.grabName(printer) + " has begun. Please do not navigate away from this page.", 3000, "Clicked")
  //     FileManager.handleFiles(this.files, printer);
  //   });
  //   elements.fileManager.createFolderBtn.addEventListener("click", e => {
  //     FileManager.createFolder(printer)
  //   });
  //   elements.fileManager.fileSearch.addEventListener("keyup", e => {
  //     FileManager.search(printer._id);
  //   });
  //   elements.fileManager.uploadPrintFile.addEventListener("change", function() {
  //     FileManager.handleFiles(this.files, printer, "print")
  //   });
  //   elements.fileManager.back.addEventListener("click", e => {
  //     FileManager.openFolder(undefined, undefined, printer);
  //   });
  //   elements.fileManager.syncFiles.addEventListener('click', e => {
  //     FileManager.reSyncFiles(e, printer);
  //   });
  //
  // }
  //
  //
  static grabPage() {
    let PrinterSettings = {
      mainPage: {
        title: document.getElementById("printerSettingsSelection"),
        status: document.getElementById("psStatus"),
      },
      connectPage: {
        printerPort: document.getElementById("printerPortDrop"),
        printerBaud: document.getElementById("printerBaudDrop"),
        printerProfile: document.getElementById("printerProfileDrop"),
        printerConnect: document.getElementById("printerConnect"),
        portDropDown: document.getElementById("psSerialPort"),
        baudDropDown: document.getElementById("psBaudrate"),
        profileDropDown: document.getElementById("psProfile")
      },

    };
    return PrinterSettings;
  }

  static async applyState(printer) {
    //Garbage collection for terminal
    let elements = await PrinterSettings.grabPage();


    elements.mainPage.status.innerHTML = printer.state;
    elements.mainPage.status.className = `btn btn-${printer.stateColour.name} mb-2`;


    if (printer.stateColour.category === "Active") {

    } else if (
        printer.stateColour.category === "Idle" ||
        printer.stateColour.category === "Complete"
    ) {
      if (
          typeof printer.temps != "undefined" &&
          typeof printer.temps[0].tool0 != "undefined" &&
          typeof printer.temps[0].tool0.target != "undefined"
      ) {

      }

      elements.connectPage.printerPort.disabled = true;
      elements.connectPage.printerBaud.disabled = true;
      elements.connectPage.printerProfile.disabled = true;
      if (
          typeof printer.job != "undefined" &&
          printer.job.filename === "No File Selected"
      ) {

      } else {
        if (printer.state === "Paused") {

        } else {

        }
      }
    } else if (
        printer.stateColour.category === "Offline" ||
        printer.stateColour.category === "Disconnected"
    ) {

      if (printer.state === "Offline" || printer.state === "Shutdown" || printer.state === "Searching...") {
        $("#PrinterSettingsModal").modal("hide");
      }
    }
  }


  static async updateIndex(newIndex) {
    currentIndex = newIndex;
  }
}