import Calc from "../../../utils/calc.js";
import OctoFarmClient from "../../../services/octofarm-client.service";
import OctoPrintClient from "../../../services/octoprint/octoprint-client.service.js";
import ApexCharts from "apexcharts";
import UI from "../../../utils/ui";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import { ApplicationError } from "../../../exceptions/application-error.handler";

let chart = null;
let eventListener = false;
let updatedSeries = false;

const options = {
  chart: {
    type: "line",
    width: "100%",
    height: "500px",
    animations: {
      enabled: false,
    },
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
    background: "#303030",
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
    tickAmount: 10,
    type: "category",
    labels: {
      formatter(value) {
        const date = new Date(value * 1000);
        return date.toLocaleTimeString("en-gb", { hour12: false });
      },
    },
  },
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
const octoPrintPluginLogsMenu = document.getElementById(
  "system-octoprint-list"
);
const octoPrintPluginLogsTable = document.getElementById("octoprintLogsRows");
const octoPrintPluginLogsCount = document.getElementById("octoCount");
const octoPrintKlipperLogsMenu = document.getElementById(
  "system-octoprint-klipper-list"
);
const octoPrintKlipperLogsTable = document.getElementById(
  "klipperLogsTableRows"
);
const octoPrintKlipperLogsCount = document.getElementById("klipperCount");
const octoPrintTemperatureMenu = document.getElementById(
  "system-temperature-list"
);
const octoPrintTemperatureChart = document.getElementById("printerTempChart");
const octoPrintTemperatureCount = document.getElementById("tempCount");
const userActionLogsMenu = document.getElementById("system-action-list");
const userActionLogsTable = document.getElementById("actionLogsTableRow");
const userActionLogsCount = document.getElementById("actionCount");
const refreshMenuButton = document.getElementById("system-refresh-list");
const refreshMenuIcon = document.getElementById("refreshButtonIcon");

export default class PrinterLogsService {
  static setPageToLoading(printerName) {
    document.getElementById("printerLogsTitle").innerHTML =
      "Printer Logs: " + printerName;
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
    UI.addLoaderToElementsInnerHTML(userActionLogsCount);
    UI.addNotYetToElement(userActionLogsMenu);
    userActionLogsTable.innerHTML = "";
    UI.addDisplayNoneToElement(octoPrintPluginLogsMenu);
    UI.addLoaderToElementsInnerHTML(octoPrintPluginLogsCount);
    UI.addNotYetToElement(octoPrintPluginLogsMenu);
    octoPrintPluginLogsTable.innerHTML = "";
    UI.addDisplayNoneToElement(octoPrintKlipperLogsMenu);
    UI.addLoaderToElementsInnerHTML(octoPrintKlipperLogsCount);
    UI.addNotYetToElement(octoPrintKlipperLogsMenu);

    UI.addLoaderToElementsInnerHTML(octoPrintTemperatureCount);
    UI.addNotYetToElement(octoPrintTemperatureMenu);
    if (chart !== null) {
      chart.destroy();
    }
    chart = null;
    octoPrintTemperatureChart.innerHTML = "";
    octoPrintKlipperLogsTable.innerHTML = "";
    refreshMenuButton.disabled = true;
    UI.addFaSpinToElement(refreshMenuIcon);
    updatedSeries = false;
  }

  static loadOctoFarmLogs(octofarmLogs) {
    if (!octofarmLogs || octofarmLogs.length === 0) {
      octoFarmLogsCount.innerHTML = "(0)";
      return;
    }
    octoFarmLogsCount.innerHTML = `(${octofarmLogs.length})`;
    UI.removeLoaderFromElementInnerHTML(octoFarmLogsCount);
    UI.removeNotYetFromElement(octoFarmLogsMenu);

    octofarmLogs.forEach((log) => {
      octoFarmLogsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.message}</td>
            </tr>
        `
      );
    });
  }

  static loadUserActionLogs(userActionLogs) {
    if (!userActionLogs || userActionLogs.length === 0) {
      userActionLogsCount.innerHTML = "(0)";
      return;
    }
    userActionLogsCount.innerHTML = `(${userActionLogs.length})`;
    UI.removeLoaderFromElementInnerHTML(userActionLogsCount);
    UI.removeNotYetFromElement(userActionLogsMenu);

    userActionLogs.forEach((log) => {
      let prettyData = "";
      for (const key in log?.data) {
        prettyData += `${key}: ${log.data[key]}<br>`;
      }

      userActionLogsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr class="${log?.status}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.currentUser}</td>
              <td>${log.action}</td>
              <td><code>${prettyData}</code></td>
              <td>${log?.fullPath ? log.fullPath : ""}</td>
            </tr>
        `
      );
    });
  }
  static async drawOctoPrintLogs(printer, download) {
    octoPrintLogsTable.innerHTML = "";
    const octoPrintLogText = await this.parseOctoPrintLogs(printer, download);
    octoPrintLogText.forEach((log) => {
      octoPrintLogsTable.insertAdjacentHTML(
        "beforeend",
        `
                                  <tr class="${log.colour}">
                                    <th scope="row">${log.index}: ${log.text}</th>
                                  </tr>
                              `
      );
    });
  }
  static loadPrinterErrors(errorLogs) {
    if (!errorLogs || errorLogs.length === 0) {
      printerErrorsCount.innerHTML = "(0)";
      return;
    }
    UI.removeLoaderFromElementInnerHTML(printerErrorsCount);
    UI.removeNotYetFromElement(printerErrorsMenu);
    printerErrorsCount.innerHTML = `(${errorLogs.length})`;

    errorLogs.forEach((log) => {
      const resendsFormat = !!log?.resendStats
        ? `Count: ${log.resendStats.count} / Transmitted: ${log.resendStats.transmitted} (${log.resendStats.ratio}%)`
        : "No resend stats";

      let logsFormat = "No terminal logs";
      if (!!log.terminal) {
        let prettyTerminal = "";

        log.terminal.forEach((terminal, index) => {
          prettyTerminal += `<code><b>${
            index + 1
          }: </b>${terminal} <br></code>`;
        });

        logsFormat = `

        <div class="accordion" id="accordionExample-${log.id}">
          <div class="card">
            <div class="card-header" id="collapseOne">
              <h2 class="mb-0">
                <button class="btn btn-link btn-block text-left btn-sm" type="button" data-toggle="collapse" data-target="#collapseOne-${log.id}" aria-expanded="true" aria-controls="collapseOne-${log.id}">
                  Last ${log.terminal.length} terminal lines
                </button>
              </h2>
            </div>
        
            <div id="collapseOne-${log.id}" class="collapse" aria-labelledby="${log.id}-accordian-heading" data-parent="#accordionExample-${log.id}">
              <div class="card-body">
                ${prettyTerminal}
              </div>
            </div>
          </div>
      `;
      }

      printerErrorsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr class="${log.state}">
              <th class="text-wrap" scope="row">${Calc.dateClean(log.date)}</th>
              <td class="text-wrap" >${log.message}</td>
              <td class="text-wrap" >${resendsFormat}</td>
              <td> ${logsFormat} </td>
            </tr>
      `
      );
    });
  }
  static async loadPrinterTemperatures(printerTemperatures) {
    if (!printerTemperatures || printerTemperatures?.length === 0) {
      octoPrintTemperatureCount.innerHTML = "(0)";
      return;
    }
    octoPrintTemperatureCount.innerHTML = `(${printerTemperatures[0].data.length})`;
    UI.removeNotYetFromElement(octoPrintTemperatureMenu);
    chart = new ApexCharts(octoPrintTemperatureChart, options);
    await chart.render();
    await UI.delay(1000);
    if (!updatedSeries) {
      await chart.updateSeries(printerTemperatures);
    }
  }
  static fillChartData(printerTemperatures) {
    chart.updateSeries(printerTemperatures);
  }
  static async loadOctoPrintLogs(printer) {
    const octoPrintLogsList = await this.getOctoPrintLogsList(printer);
    if (!octoPrintLogsList || octoPrintLogsList?.files.length === 0) {
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
      },
    ]);

    for (const log of orderedSelectList) {
      octoPrintLogsSelect.insertAdjacentHTML(
        "beforeend",
        `
            <option value="${log.refs.download}">${log.name}</option>
          `
      );
    }

    octoPrintLogsSelect.value = octoPrintLogsList.files[mainLog].refs.download;
    await this.drawOctoPrintLogs(
      printer,
      octoPrintLogsList.files[mainLog].refs.download
    );
  }
  static loadPluginLogs(pluginLogs) {
    if (!pluginLogs || pluginLogs.length === 0) {
      octoPrintPluginLogsCount.innerHTML = "(0)";
      return;
    }

    UI.removeDisplayNoneFromElement(octoPrintPluginLogsMenu);
    UI.removeLoaderFromElementInnerHTML(octoPrintPluginLogsCount);
    UI.removeNotYetFromElement(octoPrintPluginLogsMenu);
    octoPrintPluginLogsCount.innerHTML = `(${pluginLogs.length})`;
    pluginLogs.forEach((log) => {
      octoPrintPluginLogsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.pluginDisplay}</td>
              <td>${log.message}</td>
            </tr>
      `
      );
    });
  }
  static async parseOctoPrintLogs(printer, url) {
    console.log(url)
    url = url.replace(printer.printerURL+"/", "")
    const octoPrintLogCall = await OctoPrintClient.getLogs(printer, url)

    if (octoPrintLogCall?.ok) {
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
            index: splitText.length - i,
          });
        }
      }
      return octoPrintLogTextParsed;
    } else {
      UI.createAlert(
        "error",
        "Unable to download OctoPrint log... please check the logs",
        3000,
        "Clicked"
      );
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Unable to download OctoPrint log... OctoPrintLogCall: ${octoPrintLogCall}`;
      throw new ApplicationError(errorObject);
    }
  }
  static async getOctoPrintLogsList(printer) {
    const octoPrintLogsCall = await OctoPrintClient.get(
      printer,
      "plugin/logging/logs"
    );

    if (octoPrintLogsCall?.ok) {
      return octoPrintLogsCall.json();
    } else {
      UI.createAlert(
        "error",
        "Unable to get OctoPrint logs list... please check the logs",
        3000,
        "Clicked"
      );
      const errorObject = ClientErrors.SILENT_ERROR;
      errorObject.message = `Unable to grab OctoPrint Logs List... OctoPrintLogsCall: ${octoPrintLogsCall}`;
      throw new ApplicationError(errorObject);
    }
  }
  static loadKlipperLogs(klipperLogs) {
    if (!klipperLogs || klipperLogs.length === 0) {
      octoPrintKlipperLogsCount.innerHTML = "(0)";
      return;
    }

    UI.removeDisplayNoneFromElement(octoPrintKlipperLogsMenu);
    UI.removeLoaderFromElementInnerHTML(octoPrintKlipperLogsCount);
    UI.removeNotYetFromElement(octoPrintKlipperLogsMenu);
    octoPrintKlipperLogsCount.innerHTML = `(${klipperLogs.length})`;
    klipperLogs.forEach((log) => {
      octoPrintKlipperLogsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.message}</td>
            </tr>
      `
      );
    });
  }

  static setupListeners(printer, printerTemperatures) {
    if (eventListener) {
      return;
    }

    octoPrintLogsSelect.addEventListener("change", async (e) => {
      await this.drawOctoPrintLogs(printer, e.target.value);
    });

    refreshMenuButton.addEventListener("click", async () => {
      UI.addFaSpinToElement(refreshMenuIcon);
      refreshMenuButton.disabled = true;
      let connectionLogs = await OctoFarmClient.get(
        "printers/connectionLogs/" + printer._id
      );
      await this.initialise(printer, connectionLogs);
    });

    octoPrintTemperatureMenu.addEventListener("click", async () => {
      if (!updatedSeries) {
        this.fillChartData(printerTemperatures);
        updatedSeries = true;
      }
    });

    eventListener = true;
  }

  static async initialise(printer, connectionLogs) {
    this.setPageToLoading(printer.printerName);

    const {
      currentErrorLogs,
      currentKlipperLogs,
      currentOctoFarmLogs,
      currentPluginManagerLogs,
      currentTempLogs,
      currentUserActionLogs,
    } = connectionLogs;

    this.loadOctoFarmLogs(currentOctoFarmLogs);

    this.loadUserActionLogs(currentUserActionLogs);

    this.loadPrinterErrors(currentErrorLogs);

    await this.loadOctoPrintLogs(printer);

    this.loadPluginLogs(currentPluginManagerLogs);

    this.loadKlipperLogs(currentKlipperLogs);

    this.loadPrinterTemperatures(currentTempLogs);

    this.setupListeners(printer, currentTempLogs);

    refreshMenuButton.disabled = false;
    UI.removeFaSpinFromElement(refreshMenuIcon);
  }
}
