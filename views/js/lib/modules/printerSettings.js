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

  static async init(printers) {
    console.log(printers)
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
      console.log(printer)
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


        let elements = PrinterSettings.grabPage();
        elements.terminal.terminalWindow.innerHTML = "";

        PrinterSettings.applyListeners(printer, elements, printers);
        FileManager.drawFiles(printer)
      }
      PrinterSettings.applyState(printer, job, progress);
      document.getElementById("PrinterSettingsModal").style.overflow = "auto";
    }
  }

  static applyListeners(printer, elements, printers) {
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
      e.target.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step1.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "1"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step10.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step10.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "10"
      });
      e.target.className = "btn btn-dark active";
      elements.printerControls.step1.className = "btn btn-light";
      elements.printerControls.step01.className = "btn btn-light";
      elements.printerControls.step100.className = "btn btn-light";
    });
    elements.printerControls.step100.addEventListener("click", e => {
      OctoFarmClient.post("printers/stepChange", {
        printer: printer._id,
        newSteps: "100"
      });
      e.target.className = "btn btn-dark active";
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
      UI.createAlert("warning", "Your files for Printer: " + PrinterSettings.grabName(printer) + " has begun. Please do not navigate away from this page.", 3000, "Clicked")
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
    let PrinterSettings = {
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
        fileUpload: document.getElementById("PrinterSettingsUploadBtn"),
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
    return PrinterSettings;
  }

  static async applyState(printer, job, progress) {
    //Garbage collection for terminal
    let terminalCount = document.querySelectorAll(".logLine");
    let elements = await PrinterSettings.grabPage();

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
    elements.jobStatus.fileName.setAttribute('title', job.file.path)
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

      PrinterSettings.controls(true, true);
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
      PrinterSettings.controls(false);
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
          PrinterSettings.controls(false);
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
      PrinterSettings.controls(true);
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
        $("#PrinterSettingsModal").modal("hide");
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
    let elements = await PrinterSettings.grabPage();
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