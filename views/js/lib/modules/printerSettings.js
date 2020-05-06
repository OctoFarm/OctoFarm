import OctoPrintClient from "../octoprint.js";
import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import FileManager from "./fileManager.js";

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

        printerPort.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardSerialPort">Port:</label> </div> <select class="custom-select bg-secondary text-light" id="psSerialPort"></select></div>
        `;
        printerBaud.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardBaudrate">Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="psBaudrate"></select></div>
        `;
        printerProfile.innerHTML = `
        <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardPrinterProfile">Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="psProfile"></select></div>
        `;
        availableBaud.forEach(baud => {
          document
              .getElementById("psBaudrate")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${baud}">${baud}</option>`
              );
        });
        if (preferedBaud != null) {
          document.getElementById("psBaudrate").value = preferedBaud;
        }
        availablePort.forEach(port => {
          document
              .getElementById("psSerialPort")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${port}">${port}</option>`
              );
        });
        if (preferedPort != null) {
          document.getElementById("psSerialPort").value = preferedPort;
        }
        availableProfile.forEach(profile => {
          document
              .getElementById("psProfile")
              .insertAdjacentHTML(
                  "beforeend",
                  `<option value="${profile.id}">${profile.name}</option>`
              );
        });
        if (preferedProfile != null) {
          document.getElementById("psProfile").value = preferedProfile;
        }

        if (printer.state === "Disconnected") {
          printerConnect.innerHTML =
              '<center> <button id="psConnectBtn" class="btn btn-success inline" value="connect">Connect</button></center>';
        } else {
          printerConnect.innerHTML =
              '<center> <button id="psConnectBtn" class="btn btn-danger inline" value="disconnect">Disconnect</button></center>';
          document.getElementById("psSerialPort").disabled = true;
          document.getElementById("psBaudrate").disabled = true;
          document.getElementById("psProfile").disabled = true;
        }

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
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Printer</u></h6>
            <p class="mb-0"><b>Printer Name: </b><span>${PrinterSettings.grabName(printer)}<span></p>
            <p class="mb-0"><b>Printer Model: </b><span contenteditable="false">${pProfile.model}</span></p>
            <h6 class="mb-1"><u>Axis</u></h6>
            <p class="mb-0"><b>E: </b><span contenteditable="false">${pProfile.axes.e.speed}mm/min | Inverted: ${PrinterSettings.grabThumb(pProfile.axes.e.inverted)}</span></p>
            <p class="mb-0"><b>X: </b><span contenteditable="false">${pProfile.axes.x.speed}mm/min | Inverted: ${PrinterSettings.grabThumb(pProfile.axes.x.inverted)}</span></p>
            <p class="mb-0"><b>Y: </b><span contenteditable="false">${pProfile.axes.y.speed}mm/min | Inverted: ${PrinterSettings.grabThumb(pProfile.axes.y.inverted)}</span></p>
            <p class="mb-0"><b>Z: </b><span contenteditable="false">${pProfile.axes.z.speed}mm/min | Inverted: ${PrinterSettings.grabThumb(pProfile.axes.z.inverted)}</span></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Extrusion</u></h6>
            <p class="mb-0"><b>Extruder Count: </b><span contenteditable="false">${pProfile.extruder.count}</span></p>
            <p class="mb-0"><b>Nozzle Size: </b><span contenteditable="false">${pProfile.extruder.nozzleDiameter}</span></p>
            <p class="mb-0"><b>Nozzle Offsets: </b><span>X: ${pProfile.extruder.offsets[0][0]}mm | Y: ${pProfile.extruder.offsets[0][0]}mm</span></p>
            <p class="mb-0"><b>Shared Nozzle:  </b><span contenteditable="false">${PrinterSettings.grabThumb(pProfile.extruder.sharedNozzle)}</span></p>
            </div>
            <div class="col-12 col-lg-4">
            <h6 class="mb-1"><u>Bed / Chamber</u></h6>
            <p class="mb-1"><b>Heated Bed: </b><span contenteditable="false">${PrinterSettings.grabThumb(pProfile.heatedBed)}</span></p>  
             <p class="mb-1"><b>Form Factor: </b><span contenteditable="false">${pProfile.volume.formFactor}</span></p>                   
            <p class="mb-1"><b>Dimensions:</b><span contenteditable="false"> D: ${pProfile.volume.depth}mm x H: ${pProfile.volume.height}mm x W: ${pProfile.volume.width}</span></p>                 
            <p class="mb-1"><b>Heated Chamber: </b><span contenteditable="false">${PrinterSettings.grabThumb(pProfile.heatedChamber)}</span></p>  
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
        document.getElementById("psGcodeManagerGcode").innerHTML = `
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
        document.getElementById("cameraRotation").innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="camEnabled">
          <label class="form-check-label" for="camRot90">
            Enable Web Camera
          </label>
        </div> 
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
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="camTimelapse">
          <label class="form-check-label" for="camRot90">
            Enable Time lapse
          </label>
        </div>
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
        console.log(printer)
        let serverRestart = null;
        let systemRestart = null;
        let systemShutdown = null;
        if(printer.settingsServer.commands.serverRestartCommand === null){
          serverRestart = "N/A";
        }else{
          serverRestart = printer.settingsServer.commands.serverRestartCommand
        }
        if(printer.settingsServer.commands.systemRestartCommand === null){
          systemRestart = "N/A";
        }else{
          systemRestart = printer.settingsServer.commands.systemRestartCommand
        }
        if(printer.settingsServer.commands.systemShutdownCommand === null){
          systemShutdown = "N/A";
        }else{
          systemShutdown = printer.settingsServer.commands.systemShutdownCommand
        }

        document.getElementById("psPowerCommands").innerHTML = `
        <form>
          <div class="form-group">
            <label for="formGroupExampleInput">OctoPrint Server Restart</label>
            <input type="text" class="form-control" id="formGroupExampleInput" placeholder="${serverRestart}">
            <small id="passwordHelpBlock" class="form-text text-muted">
                Usually your OctoPrint hosts server restart command. i.e: <code>sudo service octoprint restart</code>
            </small>
          </div>
          <div class="form-group">
            <label for="formGroupExampleInput2">OctoPrint System Restart</label>
            <input type="text" class="form-control" id="formGroupExampleInput2" placeholder="${systemRestart}">
            <small id="passwordHelpBlock" class="form-text text-muted">
               Usually your OctoPrint hosts system restart command. i.e: <code>sudo shutdown -r now</code>
            </small>
          </div>
          <div class="form-group">
            <label for="formGroupExampleInput2">OctoPrint System Shutdown</label>
            <input type="text" class="form-control" id="formGroupExampleInput2" placeholder="${systemShutdown}">
            <small id="passwordHelpBlock" class="form-text text-muted">
              Usually your OctoPrint hosts system shutdown command. i.e: <code>sudo shutdown -h now</code>
            </small>
          </div>
          <h6><u>Custom Power Commands</u></h6>
          <p class="mb-0">The below allows your to setup a custom POST request to an API endpoint, instructions for such will be in your plugin/device instructions. You can use the following placeholders:</p>
          <p>If you'd like to enter in a full URL command then leave the command blank and it will skip the requirement and just make a POST to the URL provided similar to CURL.</p>
          <p class="mb-0">Printer URL: <code>[PrinterURL]</code></p>
          <p class="mb-0">Printer api-key: <code>[PrinterAPI]</code></p
          <h6>Power On</h6>
           <div class="form-row">
              <div class="col-4">
                <input type="text" class="form-control" placeholder="Command">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                  This is usually an json object supplied in the following format <code>{"command":"turnOn"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input type="text" class="form-control" placeholder="URL">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                  The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
           <h6>Power Off</h6>
            <div class="form-row">
              <div class="col-4">
                <input type="text" class="form-control" placeholder="Command">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"turnOff"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input type="text" class="form-control" placeholder="URL">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                   The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
            <h6>Power Toggle</h6>
            <div class="form-row">
              <div class="col-4">
                <input type="text" class="form-control" placeholder="Command">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"turnOff"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input type="text" class="form-control" placeholder="URL">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                    The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
            <h6>Power Status</h6>
            <p class="mb-0">This must return a boolean value to work properly. When you enter this in your printer will show it's power state on the power button icon.</p>
            <div class="form-row">
              <div class="col-4">
                <input type="text" class="form-control" placeholder="Command">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                   This is usually an json object supplied in the following format <code>{"command":"state"}</code>
                 </small>
              </div>
              <div class="col-8">
                <input type="text" class="form-control" placeholder="URL">
                 <small id="passwordHelpBlock" class="form-text text-muted">
                    The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
                 </small>
              </div>
            </div>
        </form>
        `

        //let elements = PrinterSettings.grabPage();

        //PrinterSettings.applyListeners(printer, elements, printers);
      }
      PrinterSettings.applyState(printer, job, progress);
    }
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
        connectButton: document.getElementById("psConnectBtn"),
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
      elements.connectPage.connectButton.value = "disconnect";
      elements.connectPage.connectButton.innerHTML = "Disconnect";
      elements.connectPage.connectButton.classList = "btn btn-danger inline";
      elements.connectPage.connectButton.disabled = false;
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

  // static async controls(enable, printing) {
  //   let elements = await PrinterSettings.grabPage();
  //   elements = elements.printerControls;
  //   if (typeof printing != "undefined" && printing) {
  //     elements.e0Target.disabled = !printing;
  //     elements.e0Actual.disabled = !printing;
  //     elements.bedTarget.disabled = !printing;
  //     elements.e0Set.disabled = !printing;
  //     elements.bedSet.disabled = !printing;
  //     elements.feedRate.disabled = !printing;
  //     elements.flowRate.disabled = !printing;
  //     elements.fansOn.disabled = !printing;
  //     elements.fansOff.disabled = !printing;
  //   } else {
  //     elements.e0Target.disabled = enable;
  //     elements.e0Actual.disabled = enable;
  //     elements.bedTarget.disabled = enable;
  //     elements.e0Set.disabled = enable;
  //     elements.bedSet.disabled = enable;
  //     elements.feedRate.disabled = enable;
  //     elements.flowRate.disabled = enable;
  //     elements.fansOn.disabled = enable;
  //     elements.fansOff.disabled = enable;
  //   }
  //   elements.xPlus.disabled = enable;
  //   elements.xMinus.disabled = enable;
  //   elements.yPlus.disabled = enable;
  //   elements.yMinus.disabled = enable;
  //   elements.xyHome.disabled = enable;
  //   elements.zPlus.disabled = enable;
  //   elements.zMinus.disabled = enable;
  //   elements.zHome.disabled = enable;
  //   elements.step01.disabled = enable;
  //   elements.step1.disabled = enable;
  //   elements.step10.disabled = enable;
  //   elements.step100.disabled = enable;
  //
  //   elements.motorsOff.disabled = enable;
  //   elements.extrude.disabled = enable;
  //   elements.retract.disabled = enable;
  // }  // static async controls(enable, printing) {
  //   let elements = await PrinterSettings.grabPage();
  //   elements = elements.printerControls;
  //   if (typeof printing != "undefined" && printing) {
  //     elements.e0Target.disabled = !printing;
  //     elements.e0Actual.disabled = !printing;
  //     elements.bedTarget.disabled = !printing;
  //     elements.e0Set.disabled = !printing;
  //     elements.bedSet.disabled = !printing;
  //     elements.feedRate.disabled = !printing;
  //     elements.flowRate.disabled = !printing;
  //     elements.fansOn.disabled = !printing;
  //     elements.fansOff.disabled = !printing;
  //   } else {
  //     elements.e0Target.disabled = enable;
  //     elements.e0Actual.disabled = enable;
  //     elements.bedTarget.disabled = enable;
  //     elements.e0Set.disabled = enable;
  //     elements.bedSet.disabled = enable;
  //     elements.feedRate.disabled = enable;
  //     elements.flowRate.disabled = enable;
  //     elements.fansOn.disabled = enable;
  //     elements.fansOff.disabled = enable;
  //   }
  //   elements.xPlus.disabled = enable;
  //   elements.xMinus.disabled = enable;
  //   elements.yPlus.disabled = enable;
  //   elements.yMinus.disabled = enable;
  //   elements.xyHome.disabled = enable;
  //   elements.zPlus.disabled = enable;
  //   elements.zMinus.disabled = enable;
  //   elements.zHome.disabled = enable;
  //   elements.step01.disabled = enable;
  //   elements.step1.disabled = enable;
  //   elements.step10.disabled = enable;
  //   elements.step100.disabled = enable;
  //
  //   elements.motorsOff.disabled = enable;
  //   elements.extrude.disabled = enable;
  //   elements.retract.disabled = enable;
  // }

  static async updateIndex(newIndex) {
    currentIndex = newIndex;
  }
}