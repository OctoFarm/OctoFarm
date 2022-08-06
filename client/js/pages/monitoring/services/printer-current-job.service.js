import Calc from "../../../utils/calc";
import { setupClientSwitchDropDown } from "../../../services/modal-printer-select.service";
import { returnExpandedLayerDataDisplay } from "../../../services/octoprint/octoprint-display-layer-plugin.service";
import "../../../utils/cleanup-modals.util";
import {
  closePrinterManagerModalIfOffline,
  closePrinterManagerModalIfDisconnected,
  imageOrCamera,
} from "../../../utils/octofarm.utils";
import ApexCharts from "apexcharts";
import UI from "../../../utils/ui";
import {setupModalSwitcher} from "./modal-switcher.service";

let chart = null;
let chartTimer = 0;

const options = {
  chart: {
    id: "realtime",
    type: "line",
    width: "100%",
    height: "250px",
    animations: {
      enabled: false,
      easing: "linear",
      dynamicAnimation: {
        speed: 1000,
      },
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    background: "#303030",
  },
  dataLabels: {
    enabled: false,
  },
  colors: [
    "#3e0b0b",
    "#fc2929",
    "#003b28",
    "#00ffae",
    "#9b9300",
    "#fff200",
    "#190147",
    "#5900ff",
    "#5d0167",
    "#e600ff",
    "#5a4001",
    "#ffb700",
    "#2d4c0d",
    "#93fc29",
    "#450124",
    "#ff0084",
  ],
  stroke: {
    curve: "smooth",
    width: 2,
  },
  toolbar: {
    show: false,
  },
  markers: {
    size: 0,
  },
  theme: {
    mode: "dark",
  },
  noData: {
    text: "Loading...",
  },
  series: [],
  yaxis: [
    {
      title: {
        text: "Temperature",
      },
      labels: {
        formatter(value) {
          if (value !== null) {
            return `${value}°C`;
          }
        },
      },
    },
  ],
  xaxis: {
    //tickAmount: "dataPoints",
    type: "category",
    tickAmount: 10,
    labels: {
      formatter(value) {
        const date = new Date(value * 1000);
        return date.toLocaleTimeString("en-gb", { hour12: false });
      },
    },
  },
  legend: {
    show: true,
  },
  tooltip: {
    enabled: false,
  },
};

let currentIndex;
let currentPrinter;

export const initialiseCurrentJobPopover = (
  index,
  printers,
  printerControlList
) => {
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
    setupClientSwitchDropDown(
      currentPrinter._id,
      printerControlList,
      changeFunction,
      true
    );
    loadPrintersJobStatus(currentPrinter);
    const elements = returnPageElements();
    UI.addDisplayNoneToElement(elements.connectionRow);
    updateCurrentJobStatus(currentPrinter, elements);
    chartTimer = 0;
  } else {
    const id = _.findIndex(printers, function (o) {
      return o._id === currentIndex;
    });
    currentPrinter = printers[id];
    const elements = returnPageElements();
    updateCurrentJobStatus(currentPrinter, elements);
    document.getElementById("printerManagerModal").style.overflow = "auto";
  }
};

const resetChartData = (tempChartElement) => {
  if (chart !== null) {
    chart.destroy();
  }
  chart = null;
  options.series = [];
  if (!!tempChartElement) {
    chart = new ApexCharts(tempChartElement, options);
    chart.render();
  }
};

const createChartBase = function (tools) {
  // create a new object to store full name.
  let keys = Object.keys(tools[0]);
  let array = [];
  for (const element of keys) {
    if (element !== "time") {
      let target = {};
      let actual = {};
      target = {
        name: element + "-target",
        data: [].slice(),
      };
      actual = {
        name: element + "-actual",
        data: [].slice(),
      };
      array.push(target);
      array.push(actual);
    }
  }
  // return our new object.
  return array;
};

const formatChartData = (tools) => {
  if (!!tools) {
    if (options.series.length === 0) {
      options.series = createChartBase(tools);
    } else {
      let keys = Object.keys(tools[0]);
      for (const element of keys) {
        if (element !== "time") {
          let actual = {
            x: tools[0]["time"],
            y: tools[0][element].actual,
          };
          let target = {
            x: tools[0]["time"],
            y: tools[0][element].target,
          };

          //get array position...
          let arrayTarget = options.series
            .map(function (e) {
              return e.name;
            })
            .indexOf(element + "-target");
          let arrayActual = options.series
            .map(function (e) {
              return e.name;
            })
            .indexOf(element + "-actual");
          if (options.series[arrayTarget].data.length <= 30) {
            options.series[arrayTarget].data.push(target);
          } else {
            options.series[arrayTarget].data.shift();
          }
          if (options.series[arrayActual].data.length <= 30) {
            options.series[arrayActual].data.push(actual);
          } else {
            options.series[arrayActual].data.shift();
          }
        }
      }
    }
  }
};

const updateChartData = () => {
  if (chart !== null) {
    chart.updateSeries(options.series);
  }
};

const returnPageElements = () => {
  return {
    connectionRow: document.getElementById("connectionRow"),
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
    expectededElectricityCosts: document.getElementById(
      "pmExpectedElectricity"
    ),
    expectededMaintainanceCosts: document.getElementById(
      "pmExpectedMaintainance"
    ),
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
    status: document.getElementById("pmStatus"),
    temperatureChart: document.getElementById("temperatureChart"),
    pmUserPrinting: document.getElementById("pmUserPrinting"),
  };
};

const loadPrintersJobStatus = (printer) => {
  let thumbnailClass = "d-none";
  let hideCamera = false;
  let hideCameraDisplay = "";
  let thumbnailElement = "";
  let printStatusClass;
  let cameraClass;
  // let temperatureClass = "col-md-8 text-center";
  if (printer?.currentJob?.thumbnail !== null) {
    printStatusClass = "col-lg-6 text-center";
    thumbnailClass = "col-lg-2 text-center";
    // temperatureClass = "col-md-9 text-center";
    thumbnailElement = `<img width="100%" src="${printer.printerURL}/${printer.currentJob.thumbnail}">`;
    cameraClass = "col-lg-4";
  } else {
    printStatusClass = "col-lg-8 text-center";
    cameraClass = "col-lg-4";
  }
  if (printer.camURL === "") {
    printStatusClass = "col-lg-4 text-center";
    thumbnailClass = "col-lg-4 text-center";
    hideCamera = true;
    hideCameraDisplay = "d-none";
  }

  document.getElementById("printerControls").innerHTML = `
        <div class="row">
            <div class="col-lg-10 text-center">
               <h5>File</h5><hr>
               <p title="Loading..." id="pmFileName" class="mb-0 text-wrap">Loading...</p>
   
            </div>
            <div class="col-lg-2 text-center">
               <h5>User Printing</h5><hr>
               <p title="Loading..." id="pmUserPrinting" class="mb-0 text-wrap">Loading...</p>
   
            </div>
        </div>
        <div class="row">
        <!-- Camera --> 
        <div class="${cameraClass} text-center ${hideCameraDisplay}">
          <h5>Camera</h5><hr>
          <span id="cameraRow">  
            <div class="row">
               <div class="col-12">
                    ${imageOrCamera(printer, hideCamera, "Modal")}
                </div>
            </div>
          </span>
        </div>
        <!-- Print Status -->  
        <div class="${printStatusClass}">    
            <h5>Status</h5><hr>   
               <div class="progress mb-1">
                     <div id="pmProgress" class="progress-bar" role="progressbar progress-bar-striped" style="width:100%" aria-valuenow="100%" aria-valuemin="0" aria-valuemax="100">Loading... </div>
               </div>     
               <div class="row">
                 <div class="col-md-4 col-lg-4">
                        <b>Time Elapsed: </b><p class="mb-1" id="pmTimeElapsed">Loading...</p>
                 </div>
                 <div class="col-md-4 col-lg-4">
                    <b>Completion Date: </b><p class="mb-1" id="pmExpectedCompletionDate">Loading...</p>
                 </div>
                    <div class="col-md-4 col-lg-4">
                        <b>Expected Time: </b><p class="mb-1" id="pmExpectedTime">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-4">
                        <b>Time Remaining: </b><p class="mb-1" id="pmTimeRemain">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-4">                             
                      <b>Current Z: </b><p class="mb-1" id="pmCurrentZ">Loading...</p>
                    </div>
                    <div class="col-md-4 col-lg-4">
                      <b id="resentTitle" class="mb-1 d-none">Resend Statistics: </b><br><p title="Current job resend ratio" class="tag mb-1 d-none" id="printerResends">Loading...</p>                          
                    </div>
               </div>
           </div>   
        <div id="fileThumbnail" class="${thumbnailClass}">
           <h5>Thumbnail</h5><hr>
            ${thumbnailElement}
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
                 <h5>Estimated Costs (Used / Total)</h5><hr> 
        </div>   
          <div class="col-md-4 col-lg-3 text-center"><b class="mb-1">Units: </b><br><p class="tag mb-1" id="pmExpectedWeight">Loading...</p></div>
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Materials: </b><br><p class="tag mb-1" id="pmExpectedFilamentCost">Loading...</p></div>  
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Electricity: </b><br><p class="tag mb-1" id="pmExpectedElectricity">Loading...</p></div>
          <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Maintainance: </b><br><p class="tag mb-1" id="pmExpectedMaintainance">Loading...</p></div>
           <div class="col-md-4 col-lg-2 text-center"><b class="mb-1">Total Printer: </b><br><p class="tag mb-1" id="pmExpectedPrinterCost">Loading...</p></div>
          <div class="col-md-4 col-lg-1 text-center"><b>Total Job: </b><p class="mb-1" id="pmJobCosts">Loading...</p></center></div>
           
        </div>

    `;
  setupModalSwitcher("info", printer);
};

const updateCurrentJobStatus = (printer, elements) => {
  if (
    closePrinterManagerModalIfOffline(printer) ||
    closePrinterManagerModalIfDisconnected(printer)
  ) {
    return;
  }

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
    const {
      layerData,
      heightData,
      averageLayerDuration,
      lastLayerTime,
      currentFanSpeed,
      currentFeedRate,
    } = returnExpandedLayerDataDisplay(printer.layerData);
    elements.dlpLayerProgress.innerHTML = layerData;
    elements.dlpHeightProgress.innerHTML = heightData;
    elements.dlpAvgLayerDuration.innerHTML = averageLayerDuration;
    elements.dlpLastLayerTime.innerHTML = lastLayerTime;
    elements.dlpFanSpeed.innerHTML = currentFanSpeed;
    elements.dlpFanSpeed.innerHTML = currentFanSpeed;
    elements.dlpFeedRate.innerHTML = currentFeedRate;
  }

  if (
    typeof printer.currentJob !== "undefined" &&
    printer.currentJob.progress !== null
  ) {
    elements.progressBar.innerHTML =
      printer.currentJob.progress.toFixed(0) + "%";
    elements.progressBar.style.width =
      printer.currentJob.progress.toFixed(2) + "%";
    if (
      !elements.progressBar.classList.contains("bg-warning") &&
      printer.currentJob.progress < 100
    ) {
      elements.progressBar.classList.add("bg-warning");
      elements.progressBar.classList.add("text-dark");
      if (elements.progressBar.classList.contains("bg-success")) {
        elements.progressBar.classList.remove("bg-success");
      }
    }
    if (!elements.progressBar.classList.contains("bg-success")) {
      elements.progressBar.classList.add("bg-success");
    }
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

  elements.pmUserPrinting.innerHTML = `<i class="fa-solid fa-user-tie"></i> ${
    printer?.activeControlUser
      ? printer.activeControlUser
      : "OctoPrint: " + printer.currentUser
  }`;

  if (typeof printer.currentJob === "undefined") {
    elements.fileName.setAttribute("title", "No File Selected");
    elements.fileName.innerHTML = "No File Selected";
  } else {
    elements.fileName.setAttribute("title", printer.currentJob.filePath);
    let fileName = printer.currentJob.fileDisplay;

    elements.fileName.innerHTML = fileName;
    let usageDisplay = "";
    let filamentCost = "";
    if (!!printer?.currentJob?.expectedTotals) {
      if (printer?.currentJob?.expectedFilamentCosts.length > 1) {
        usageDisplay += `<p class="mb-0"><b>Total: </b>${percentOfDisplay(
          printer.currentJob.expectedTotals.totalLength,
          printer.currentJob.progress
        )}m / ${percentOfDisplay(
          printer.currentJob.expectedTotals.totalWeight,
          printer.currentJob.progress
        )}g</p>`;
      }
      elements.expectedTotalCosts.innerHTML = percentOfDisplay(
        printer.currentJob.expectedTotals.totalCost,
        printer.currentJob.progress
      );
    } else {
      usageDisplay = "No File Selected";
      elements.expectedTotalCosts.innerHTML = "No File Selected";
    }
    if (typeof printer.currentJob.expectedFilamentCosts === "object") {
      if (printer.currentJob.expectedFilamentCosts !== null) {
        printer.currentJob.expectedFilamentCosts.forEach((unit) => {
          const firstKey = Object.keys(unit)[0];
          let theLength = parseFloat(unit[firstKey]?.length);
          let theWeight = parseFloat(unit[firstKey]?.weight);
          usageDisplay += `<p class="mb-0"><b>${
            unit[firstKey].toolName
          }: </b>${percentOfDisplay(
            theLength,
            printer.currentJob.progress
          )}m | ${percentOfDisplay(
            theWeight,
            printer.currentJob.progress
          )}g</p>`;
        });

        if (printer?.currentJob?.expectedFilamentCosts.length > 1) {
          filamentCost += `<p class="mb-0"><b>Total2: </b>${percentOfDisplay(
            printer.currentJob.expectedTotals.spoolCost,
            printer.currentJob.progress
          )}</p>`;
        }

        printer?.currentJob?.expectedFilamentCosts.forEach((unit) => {
          const firstKey = Object.keys(unit)[0];
          filamentCost += `<p class="mb-0"><b>${
            unit[firstKey].toolName
          }: </b>${percentOfDisplay(
            unit[firstKey].cost,
            printer.currentJob.progress
          )}</p>`;
        });
      } else {
        filamentCost = "No length estimate";
      }
    } else {
      filamentCost = "No File Selected";
    }

    elements.expectedWeight.innerHTML = usageDisplay;

    elements.expectedFilamentCost.innerHTML = filamentCost;

    elements.expectedPrinterCost.innerHTML = percentOfDisplay(
      printer.currentJob.expectedPrinterCosts,
      printer.currentJob.progress
    );

    elements.expectededMaintainanceCosts.innerHTML = percentOfDisplay(
      printer.currentJob.expectedMaintenanceCosts,
      printer.currentJob.progress
    );

    elements.expectededElectricityCosts.innerHTML = percentOfDisplay(
      printer.currentJob.expectedElectricityCosts,
      printer.currentJob.progress
    );
  }
};

const percentOfDisplay = (value, percent) => {
  return `${Calc.percentOf(
    parseFloat(value),
    parseFloat(percent)
  )} / ${Calc.toFixed(parseFloat(value), 2)}`;
};

const applyTemps = (printer, elements) => {
  if (printer?.tools !== null) {
    const currentTemp = printer.tools[0];
    elements.temperatures.tempTime.innerHTML =
      "Updated: <i class=\"far fa-clock\"></i> " +
      new Date().toTimeString().substring(1, 8);
    if (currentTemp.bed.actual !== null) {
      elements.temperatures.bed[0].innerHTML = currentTemp.bed.actual + "°C";
      elements.temperatures.bed[1].placeholder = currentTemp.bed.target + "°C";
    }
    if (currentTemp.chamber.actual !== null) {
      elements.temperatures.chamber[0].innerHTML =
        currentTemp.chamber.actual + "°C";
      elements.temperatures.chamber[1].placeholder =
        currentTemp.chamber.target + "°C";
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
};
