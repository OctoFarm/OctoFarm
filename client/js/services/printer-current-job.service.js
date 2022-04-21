import Calc from "../utils/calc";
import {setupClientSwitchDropDown} from "./modal-printer-select.service";
import {
    returnExpandedLayerDataDisplay
} from "./octoprint/octoprint-display-layer-plugin.service";
import {setupConnectButton, setupConnectButtonListeners, updateConnectButtonState} from "./connect-button.service";
import "../utils/cleanup-modals.util"
import {
    closePrinterManagerModalIfOffline,
    imageOrCamera
} from "../utils/octofarm.utils";

let currentIndex;
let currentPrinter;

export const initialiseCurrentJobPopover = (index, printers, printerControlList) => {
    //clear camera

        if (index !== "") {
            currentIndex = index;
            const id = _.findIndex(printers, function (o) {
                return o._id === index;
            });
            currentPrinter = printers[id];

            const changeFunction = function (value) {
                initialiseCurrentJobPopover(value, printers, printerControlList);
            };
            setupClientSwitchDropDown(currentPrinter._id, printerControlList, changeFunction, true);
            loadPrintersJobStatus(currentPrinter);
            const elements = returnPageElements();
            applyListeners(currentPrinter, elements);
            updateCurrentJobStatus(currentPrinter, elements);
            // applyTemps(currentPrinter, elements)
        } else {
            const id = _.findIndex(printers, function (o) {
                return o._id === currentIndex;
            });
            currentPrinter = printers[id];
            const elements = returnPageElements();
            updateCurrentJobStatus(currentPrinter, elements);
            document.getElementById("printerManagerModal").style.overflow = "auto";
        }
}

const returnPageElements = () => {
    return {
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
            expectededElectricityCosts: document.getElementById("pmExpectedElectricity"),
            expectededMaintainanceCosts: document.getElementById("pmExpectedMaintainance"),
            printerResends: document.getElementById("printerResends"),
            resendTitle: document.getElementById("resentTitle"),
            dlpPluginDataTitle: document.getElementById("dlpPluginDataTitle"),
            dlpLayerProgress: document.getElementById("dlpLayerProgress"),
            dlpHeightProgress: document.getElementById("dlpHeightProgress"),
            dlpAvgLayerDuration: document.getElementById("dlpAvgLayerDuration"),
            dlpLastLayerTime: document.getElementById("dlpLastLayerTime"),
            dlpFanSpeed: document.getElementById("dlpFanSpeed"),
            dlpFeedRate: document.getElementById("dlpFeedRate"),
            connectButton: document.getElementById("pmConnect"),
            printerPortDrop: document.getElementById("printerPortDrop"),
            printerBaudDrop: document.getElementById("printerBaudDrop"),
            printerProfileDrop: document.getElementById("printerProfileDrop"),
            status: document.getElementById("pmStatus")
    }
}

const applyListeners = (printer, elements) => {
    setupConnectButtonListeners(printer, elements.connectButton)
}

const loadPrintersJobStatus = (printer) => {
    let thumbnailClass = "d-none";
    let hideCamera = false;
    let hideCameraDisplay = "";
    let thumbnailElement = "";
    let printStatusClass = "col-md-9 col-lg-10 text-center";
    if (!!printer?.currentJob?.thumbnail) {
        printStatusClass = "col-12 text-center";
        thumbnailClass = "col-md-3 col-lg-3";
        thumbnailElement = `<img width="100%" src="${printer.printerURL}/${printer.currentJob.thumbnail}">`
        hideCamera = true;
        hideCameraDisplay = "d-none"
    }

    setupConnectButton(printer);

    //setup power btn
    // await PrinterPowerService.applyBtn(printer, "pmPowerBtn-");

    document.getElementById("printerControls").innerHTML = `
        <div class="row">
        <!-- Camera --> 
          <div class="col-md-3 col-lg-2 text-center ${hideCameraDisplay}">
          <h5>Camera</h5><hr>
          <span id="cameraRow">  
            <div class="row">
               <div class="col-12">
                    ${imageOrCamera(printer, hideCamera)}
                </div>
            </div>
          </span>
        </div>
        <!-- Print Status -->  
        <div class="${printStatusClass}">       
            <h5>Print Status</h5><hr>    
               <div class="progress mb-2">
                 <div id="pmProgress" class="progress-bar" role="progressbar progress-bar-striped" style="width:100%" aria-valuenow="100%" aria-valuemin="0" aria-valuemax="100">Loading... </div>
               </div>
               <div class="row">
                 <div id="fileThumbnail" class="${thumbnailClass}">${thumbnailElement}</div>
                 <div class="col-md-4 col-lg-4">
                     <b class="mb-1">File Name: </b><br><p title="Loading..." class="tag mb-1" id="pmFileName">Loading...</p>
                 </div>
                 <div class="col-md-3 col-lg-2">
                        <b>Time Elapsed: </b><p class="mb-1" id="pmTimeElapsed">Loading...</p>
                 </div>
                 <div class="col-md-3 col-lg-3">
                    <b>Expected Completion Date: </b><p class="mb-1" id="pmExpectedCompletionDate">Loading...</p>
                 </div>

               </div>
                <div class="row text-center">
                    <div class="col-md-4 col-lg-3">
                        <b>Expected Time: </b><p class="mb-1" id="pmExpectedTime">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-3">
                        <b>Time Remaining: </b><p class="mb-1" id="pmTimeRemain">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-3">                             
                      <b>Current Z: </b><p class="mb-1" id="pmCurrentZ">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-3">
                      <b id="resentTitle" class="mb-1 d-none">Resend Statistics: </b><br><p title="Current job resend ratio" class="tag mb-1 d-none" id="printerResends">Loading...</p>                          
                    </div>
                </div>
           </div>   
                <div class="col-12 text-center d-none" id="dlpPluginDataTitle">
              <h5>Additional Information</h5><hr>               
              <div class="row">
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Layer Progress: </b><br><p title="Current layer progress" class="tag mb-1" id="dlpLayerProgress">Loading...</p>
                </div>
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Height Progress: </b><br><p title="Current height progress" class="tag mb-1e" id="dlpHeightProgress">Loading...</p>
                </div>
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Average Layer Duration: </b><br><p title="Average duration of layers" class="tag mb-1" id="dlpAvgLayerDuration">Loading...</p>
                </div>
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Last Layer Time: </b><br><p title="Time to complete last layer" class="tag mb-1" id="dlpLastLayerTime">Loading...</p>
                </div>
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Current Fan Speed: </b><br><p title="Current fan speed" class="tag mb-1" id="dlpFanSpeed">Loading...</p>
                </div>
                <div class="col-sm-3 col-lg-2">
                    <b class="mb-1">Current Feed Rate: </b><br><p title="Current feed rate" class="tag mb-1" id="dlpFeedRate">Loading...</p>
                </div>
              </div>
        </div> 
        <div class="col-lg-12 text-center">
                 <h5>Expected Costs</h5><hr> 
        </div>   
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Units Consumed: </b><br><p class="tag mb-1" id="pmExpectedWeight">Loading...</p></div>
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Materials: </b><br><p class="tag mb-1" id="pmExpectedFilamentCost">Loading...</p></div>  
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Electricity: </b><br><p class="tag mb-1" id="pmExpectedElectricity">Loading...</p></div>
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Maintainance: </b><br><p class="tag mb-1" id="pmExpectedMaintainance">Loading...</p></div>
           <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Total Printer: </b><br><p class="tag mb-1" id="pmExpectedPrinterCost">Loading...</p></div>
          <div class="col-md-4 col-lg-2 text-center"><b>Total Job: </b><p class="mb-1" id="pmJobCosts">Loading...</p></center></div>
           
        </div>

    `
}

const updateCurrentJobStatus = (printer, elements) => {
    if(closePrinterManagerModalIfOffline(printer)){
        return
    }

    updateConnectButtonState(printer, elements.status, elements.connectButton, elements.printerPortDrop, elements.printerBaudDrop, elements.printerProfileDrop)

    let dateComplete;
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

    elements.expectedCompletionDate.innerHTML = dateComplete;

    if (typeof printer.resends !== "undefined" && printer.resends !== null) {
        if (elements.printerResends.classList.contains("d-none")) {
            elements.printerResends.classList.remove("d-none");
            elements.resendTitle.classList.remove("d-none");
        }
        elements.printerResends.innerHTML = `
      ${printer.resends.count} / ${
            printer.resends.transmitted / 1000
        }K (${printer.resends.ratio.toFixed(0)})
      `;
    }

    if (!!printer?.layerData) {
        if (elements.dlpPluginDataTitle.classList.contains("d-none")) {
            elements.dlpPluginDataTitle.classList.remove("d-none");
        }
        const { layerData,
            heightData,
            averageLayerDuration,
            lastLayerTime,
            currentFanSpeed,
            currentFeedRate } = returnExpandedLayerDataDisplay(printer.layerData);
            elements.dlpLayerProgress.innerHTML = layerData;
            elements.dlpHeightProgress.innerHTML = heightData;
            elements.dlpAvgLayerDuration.innerHTML = averageLayerDuration;
            elements.dlpLastLayerTime.innerHTML = lastLayerTime;
            elements.dlpFanSpeed.innerHTML = currentFanSpeed;
            elements.dlpFanSpeed.innerHTML = currentFanSpeed;
            elements.dlpFeedRate.innerHTML = currentFeedRate;
    }

    if (typeof printer.currentJob !== "undefined" && printer.currentJob.progress !== null) {
        elements.progressBar.innerHTML = printer.currentJob.progress.toFixed(0) + "%";
        elements.progressBar.style.width = printer.currentJob.progress.toFixed(2) + "%";
    } else {
        elements.progressBar.innerHTML = 0 + "%";
        elements.progressBar.style.width = 0 + "%";
    }
    elements.expectedTime.innerHTML = Calc.generateTime(
        printer.currentJob.expectedPrintTime
    );
    elements.remainingTime.innerHTML = Calc.generateTime(
        printer.currentJob.printTimeRemaining
    );
    elements.elapsedTime.innerHTML = Calc.generateTime(
        printer.currentJob.printTimeElapsed
    );
    if (printer.currentJob.currentZ === null) {
        elements.currentZ.innerHTML = "No Active Print";
    } else {
        elements.currentZ.innerHTML = printer.currentJob.currentZ + "mm";
    }

    if (typeof printer.currentJob === "undefined") {
        elements.fileName.setAttribute("title", "No File Selected");
        elements.fileName.innerHTML = "No File Selected";
    } else {
        elements.fileName.setAttribute("title", printer.currentJob.filePath);
        let fileName = printer.currentJob.fileDisplay;
        if (fileName.length > 49) {
            fileName = fileName.substring(0, 49) + "...";
        }

        elements.fileName.innerHTML = fileName;
        let usageDisplay = "";
        let filamentCost = "";
        if (printer.currentJob.expectedTotals !== null) {
            usageDisplay += `<p class="mb-0"><b>Total: </b>${printer.currentJob.expectedTotals.totalLength.toFixed(
                2
            )}m / ${printer.currentJob.expectedTotals.totalWeight.toFixed(2)}g</p>`;
            elements.expectedTotalCosts.innerHTML =
                printer.currentJob.expectedTotals.totalCost;
        } else {
            usageDisplay = "No File Selected";
            elements.expectedTotalCosts.innerHTML = "No File Selected";
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

        elements.expectedWeight.innerHTML = usageDisplay;

        elements.expectedFilamentCost.innerHTML = filamentCost;

        elements.expectedPrinterCost.innerHTML = printer.currentJob.expectedPrinterCosts.toFixed(2);

        elements.expectededMaintainanceCosts.innerHTML = printer.currentJob.expectedMaintenanceCosts.toFixed(2);

        elements.expectededElectricityCosts.innerHTML = printer.currentJob.expectedElectricityCosts.toFixed(2);
    }
}

const applyTemps = (printer, elements) => {
    if(printer?.tools !== null) {
        const currentTemp = printer.tools[0];
        elements.temperatures.tempTime.innerHTML =
            "Updated: <i class=\"far fa-clock\"></i> " + new Date().toTimeString().substring(1, 8);
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
    }
}
