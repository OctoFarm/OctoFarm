import Calc from "../utils/calc.js";
import OctoFarmClient from "./octofarm-client.service";
import OctoPrintClient from "./octoprint-client.service.js";
import ApexCharts from "apexcharts";
import UI from "../utils/ui"
import {ClientErrors} from "../exceptions/octofarm-client.exceptions";
import {ApplicationError} from "../exceptions/application-error.handler";

let chart = null;
let eventListener = false;

let currentPrinter = null;

const options = {
  chart: {
    type: "line",
    width: "100%",
    height: "500px",
    animations: {
      enabled: false
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: false
    },
    background: "#303030"
  },
  colors: [
    "#fc2929",
    "#3e0b0b",
    "#00ffae",
    "#003b28",
    "#fff200",
    "#9b9300",
    "#5900ff",
    "#190147",
    "#e600ff",
    "#5d0167",
    "#ffb700",
    "#5a4001",
    "#93fc29",
    "#2d4c0d",
    "#ff0084",
    "#450124"
  ],
  stroke: {
    curve: "smooth"
  },
  toolbar: {
    show: false
  },
  theme: {
    mode: "dark"
  },
  noData: {
    text: "Loading..."
  },
  series: [],
  yaxis: [
    {
      title: {
        text: "Temperature"
      },
      labels: {
        formatter(value) {
          if (value !== null) {
            return `${value}°C`;
          }
        }
      }
    }
  ],
  xaxis: {
    //tickAmount: "dataPoints",
    type: "category",
    labels: {
      formatter(value) {
        const date = new Date(value * 1000);
        var weekday = new Array(7);
        weekday[0] = "Sun";
        weekday[1] = "Mon";
        weekday[2] = "Tue";
        weekday[3] = "Wed";
        weekday[4] = "Thu";
        weekday[5] = "Fri";
        weekday[6] = "Sat";
        return (
            weekday[date.getDay()] + " " + date.getDate() + " " + date.toLocaleTimeString()
        );
      }
    }
  }
};


const octoFarmLogsMenu = document.getElementById("system-logs-list");
const octoFarmLogsTable = document.getElementById("printerConnectionLogRows");
const octoFarmLogsCount = document.getElementById("logCount");
const printerErrorsMenu = document.getElementById("system-error-list");
const printerErrorsTable = document.getElementById("printerErrorLogRows");
const printerErrorsCount = document.getElementById("errorCount");
const octoPrintLogsMenu = document.getElementById("system-octologs-list");
const octoPrintLogsTable = document.getElementById("octologsLogsTable");
const octoPrintLogsCount = document.getElementById("octoPrintCount");
const octoPrintLogsSelect = document.getElementById("octoPrintLogsSelect");
const octoPrintPluginLogsMenu = document.getElementById("system-octoprint-list");
const octoPrintPluginLogsTable = document.getElementById("octoprintLogsRows");
const octoPrintPluginLogsCount = document.getElementById("octoCount");
const octoPrintKlipperLogsMenu = document.getElementById("system-octoprint-klipper-list");
const octoPrintKlipperLogsTable = document.getElementById("klipperLogsTableRows");
const octoPrintKlipperLogsCount = document.getElementById("octoPrintLogsSelect");
const octoPrintTemperatureMenu = document.getElementById("system-temperature-list");
const octoPrintTemperatureChart = document.getElementById("printerTempChart");
const octoPrintTemperatureCount = document.getElementById("tempCount");
const refreshMenuButton = document.getElementById("system-refresh-list");
const refreshMenuIcon = document.getElementById("refreshButtonIcon");

export default class PrinterLogsService {
  static setPageToLoading(printerName) {
    document.getElementById("printerLogsTitle").innerHTML = "Printer Logs: " + printerName;
    UI.addLoaderToElementsInnerHTML(octoFarmLogsCount);
    UI.addNotYetToElement(octoFarmLogsMenu);
    octoFarmLogsTable.innerHTML = "";
    UI.addLoaderToElementsInnerHTML(printerErrorsCount);
    UI.addNotYetToElement(printerErrorsMenu);
    printerErrorsTable.innerHTML = "";
    UI.addLoaderToElementsInnerHTML(octoPrintLogsCount);
    UI.addNotYetToElement(octoPrintLogsMenu);
    octoPrintLogsTable.innerHTML = "";
    octoPrintLogsSelect.innerHTML = "";
    UI.addDisplayNoneToElement(octoPrintPluginLogsMenu);
    UI.addLoaderToElementsInnerHTML(octoPrintPluginLogsCount);
    UI.addNotYetToElement(octoPrintPluginLogsMenu);
    octoPrintPluginLogsTable.innerHTML = "";
    UI.addDisplayNoneToElement(octoPrintKlipperLogsMenu);
    UI.addLoaderToElementsInnerHTML(octoPrintKlipperLogsCount);
    UI.addNotYetToElement(octoPrintKlipperLogsMenu);

    UI.addLoaderToElementsInnerHTML(octoPrintTemperatureCount);
    UI.addNotYetToElement(octoPrintTemperatureMenu);
    if(chart !== null){
      chart.destroy();
    }
    chart = null;
    octoPrintTemperatureChart.innerHTML = "";
    octoPrintKlipperLogsTable.innerHTML = "";
    refreshMenuButton.disabled = true;
    UI.addFaSpinToElement(refreshMenuIcon)
  }

  static loadOctoFarmLogs(octofarmLogs) {
    if (!octofarmLogs || octofarmLogs.length === 0) {
      octoFarmLogsCount.innerHTML = "(0)";
      return;
    }
    octoFarmLogsCount.innerHTML = `(${octofarmLogs.length})`;
    UI.removeLoaderFromElementInnerHTML(octoFarmLogsCount);
    UI.removeNotYetFromElement(octoFarmLogsMenu);

    octofarmLogs.forEach(log => {
      octoFarmLogsTable.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.message}</td>
            </tr>
        `
      );
    })
  }
  static async drawOctoPrintLogs(printer, download){
    octoPrintLogsTable.innerHTML = "";
    const octoPrintLogText = await this.parseOctoPrintLogs(printer, download);
    octoPrintLogText.forEach(log => {
      octoPrintLogsTable.insertAdjacentHTML(
          "beforeend",
          `
                                  <tr class="${log.colour}">
                                    <th scope="row">${log.index}: ${log.text}</th>
                                  </tr>
                              `
      );
    })
  }
  static loadPrinterErrors(errorLogs){
    if(!errorLogs || errorLogs.length === 0){
      printerErrorsCount.innerHTML = "(0)";
      return;
    }
    UI.removeLoaderFromElementInnerHTML(printerErrorsCount);
    UI.removeNotYetFromElement(printerErrorsMenu);
    printerErrorsCount.innerHTML = `(${errorLogs.length})`;

    errorLogs.forEach(log => {
      printerErrorsTable.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${log.date}</th>
              <td>${log.message}</td>
            </tr>
      `
      );
    })
  }
  //TODO Move to views... make much much much much faster loading tho
  static loadPrinterTemperatures(printerTemperatures){
    if(!printerTemperatures || printerTemperatures?.length === 0){
      octoPrintTemperatureMenu.innerHTML = "(0)";
      return;
    }
    octoPrintTemperatureCount.innerHTML = `(${printerTemperatures[0].data.length})`;
    UI.removeNotYetFromElement(octoPrintTemperatureMenu);
    chart = new ApexCharts(octoPrintTemperatureChart, options);
    chart.render();
    if(octoPrintTemperatureMenu.classList.contains("active")){
      this.fillChartData(printerTemperatures);
    }
  }
  static fillChartData(printerTemperatures){
    chart.updateSeries(printerTemperatures);
  }
  static async loadOctoPrintLogs(printer){
    const octoPrintLogsList = await this.getOctoPrintLogsList(printer);
    if(!octoPrintLogsList || octoPrintLogsList?.files.length === 0){
      octoPrintLogsCount.innerHTML = "(0)";
      return;
    }
    UI.removeLoaderFromElementInnerHTML(octoPrintLogsCount);
    UI.removeNotYetFromElement(octoPrintLogsMenu);
    octoPrintLogsCount.innerHTML = `(${octoPrintLogsList.files.length})`;

    const mainLog = _.findIndex(octoPrintLogsList.files, function (o) {
      return o.name === "octoprint.log";
    });
    const orderedSelectList = _.sortBy(octoPrintLogsList.files, [
      function (o) {
        return o.name;
      }
    ]);

    for(const log of orderedSelectList){
      octoPrintLogsSelect.insertAdjacentHTML(
          "beforeend",
          `
            <option value="${log.refs.download}">${log.name}</option>
          `
      );
    }

    octoPrintLogsSelect.value = octoPrintLogsList.files[mainLog].refs.download;
    await this.drawOctoPrintLogs(printer, octoPrintLogsList.files[mainLog].refs.download)

  }
  static loadPluginLogs(pluginLogs){
    if(!pluginLogs || pluginLogs.length === 0){
      octoPrintPluginLogsCount.innerHTML = "(0)";
      return;
    }

    UI.removeDisplayNoneFromElement(octoPrintPluginLogsMenu);
    UI.removeLoaderFromElementInnerHTML(octoPrintPluginLogsCount);
    UI.removeNotYetFromElement(octoPrintPluginLogsMenu);
    octoPrintPluginLogsCount.innerHTML = `(${pluginLogs.length})`;
    pluginLogs.forEach(log => {
      octoPrintPluginLogsTable.insertAdjacentHTML("beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${log.date}</th>
              <td>${log.pluginDisplay}</td>
              <td>${log.message}</td>
            </tr>
      `);
    })
  }
  static async parseOctoPrintLogs(printer, url) {
    const octoPrintLogCall = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey,
        Range: "bytes=-500000"
      }
    })

    if(octoPrintLogCall?.ok){
      const octoPrintLogBlob = await octoPrintLogCall.blob();
      const octoPrintLogTextUnparsed = await octoPrintLogBlob.text();
      const octoPrintLogTextParsed = [];
      let splitText = octoPrintLogTextUnparsed.split(/(\r\n|\n|\r)/gm);
      splitText = splitText.reverse();
      splitText = splitText.slice(0, 1000);
      for (let i = 0; i < splitText.length; i++) {
        let colour = null;
        if (splitText[i].includes("INFO")) {
          colour = "Info";
        } else if (splitText[i].includes("WARNING")) {
          colour = "Active";
        } else if (splitText[i].includes("DEBUG")) {
          colour = "Offline";
        } else {
          colour = "Idle";
        }
        //Skip blank rows
        if (splitText[i].length > 1 && splitText[i] !== " ") {
          octoPrintLogTextParsed.push({
            colour,
            text: splitText[i],
            index: splitText.length - i
          })
        }
      }
      return octoPrintLogTextParsed;
    }else{
      UI.createAlert("error", "Unable to download OctoPrint log... please check the logs", 3000, "Clicked");
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message =  `Unable to download OctoPrint log... OctoPrintLogCall: ${octoPrintLogCall}`
      throw new ApplicationError(errorObject)
    }
  }
  static async getOctoPrintLogsList(printer){
    const octoPrintLogsCall = await OctoPrintClient.get(printer, "/plugin/logging/logs")

    if(octoPrintLogsCall?.ok){
      return octoPrintLogsCall.json();
    }else{
      UI.createAlert("error", "Unable to get OctoPrint logs list... please check the logs", 3000, "Clicked");
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message =  `Unable to grab OctoPrint Logs List... OctoPrintLogsCall: ${octoPrintLogsCall}`
      throw new ApplicationError(errorObject)
    }
  }
  static loadKlipperLogs(klipperLogs){
    if(!klipperLogs || klipperLogs.length === 0){
      octoPrintKlipperLogsCount.innerHTML = "(0)";
      return;
    }

    UI.removeDisplayNoneFromElement(octoPrintKlipperLogsMenu);
    UI.removeLoaderFromElementInnerHTML(octoPrintKlipperLogsCount);
    UI.removeNotYetFromElement(octoPrintKlipperLogsMenu);
    octoPrintKlipperLogsCount.innerHTML = `(${klipperLogs.length})`;
    klipperLogs.forEach(log => {
        octoPrintPluginLogsTable.insertAdjacentHTML("beforeend",
            `
            <tr class="${log.state}">
              <th scope="row">${log.date}</th>
              <td>${log.message}</td>
            </tr>
      `);
      })
  }

  static setupListeners(printer, printerTemperatures){
    if(eventListener){
      return;
    }

    octoPrintLogsSelect.addEventListener("change", async (e) => {
      await this.drawOctoPrintLogs(printer,  e.target.value)
    })


    refreshMenuButton.addEventListener("click", async () => {
      UI.addFaSpinToElement(refreshMenuIcon);
      refreshMenuButton.disabled = true;
      let connectionLogs = await OctoFarmClient.get(
          "printers/connectionLogs/" + printer._id
      );
      await this.initialise(printer, connectionLogs);

    })

    octoPrintTemperatureMenu.addEventListener("click", async () => {
      this.fillChartData(printerTemperatures);
    })

    eventListener = true;
  }

  static async initialise(printer, connectionLogs) {

    this.setPageToLoading(printer.printerName);

    const { currentErrorLogs, currentKlipperLogs, currentOctoFarmLogs, currentPluginManagerLogs, currentTempLogs } = connectionLogs;

    this.loadOctoFarmLogs(currentOctoFarmLogs);

    this.loadPrinterErrors(currentErrorLogs);

    await this.loadOctoPrintLogs(printer);

    this.loadPluginLogs(currentPluginManagerLogs);

    this.loadKlipperLogs(currentKlipperLogs);

    this.loadPrinterTemperatures(currentTempLogs);

    this.setupListeners(printer, currentTempLogs);

    refreshMenuButton.disabled = false;
    UI.removeFaSpinFromElement(refreshMenuIcon)
  }
}
