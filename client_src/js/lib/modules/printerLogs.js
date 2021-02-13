import Calc from "../functions/calc.js";
import OctoFarmClient from "../octofarm.js";
import OctoPrintClient from "../octoprint.js";

let chart = null;
let eventListener = false;
let currentPrinter = null;

export default class PrinterLogs {
  static async parseLogs(printer, url) {
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey,
        Range: "bytes=-500000",
      },
    })
      .then(async (resp) => resp.blob())
      .then(async (blob) => blob.text())
      .then(async (text) => {
        let octoPrintCount = document.getElementById("octoPrintCount");
        let splitText = await text.split(/(\r\n|\n|\r)/gm);
        splitText = splitText.reverse();
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
            octologsLogsRows.insertAdjacentHTML(
              "beforeend",
              `
                                <tr class="${colour}">
                                  <th scope="row">${splitText.length - i}: ${
                splitText[i]
              }</th>
                                </tr>
                            `
            );
          }
        }
        octoPrintCount.innerHTML =
          "(" + (splitText.length / 2).toFixed(0) + ")";
      });
  }
  static loadLogs(printer, connectionLogs) {
    currentPrinter = printer;
    document.getElementById("printerLogsLabel").innerHTML =
      "Printer Logs: " + printer.printerName;
    let printerRows = document.getElementById("printerConnectionLogRows");
    let printerErrorRows = document.getElementById("printerErrorLogRows");
    let octoprintLogsRows = document.getElementById("octoprintLogsRows");
    let octologsLogsRows = document.getElementById("octologsLogsRows");
    let logCount = document.getElementById("logCount");
    let octoCount = document.getElementById("octoCount");
    let errorCount = document.getElementById("errorCount");
    let octoPrintCount = document.getElementById("octoPrintCount");
    let tempCount = document.getElementById("tempCount");
    let tempChart = document.getElementById("printerTempChart");
    let logSelect = document.getElementById("octoPrintLogsSelect");

    logCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";
    errorCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";
    tempCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";
    octoCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";
    octoPrintCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";

    printerRows.innerHTML = "";
    printerErrorRows.innerHTML = "";
    octoprintLogsRows.innerHTML = "";
    octologsLogsRows.innerHTML = "";
    //tempChart.innerHTML = "";
    OctoPrintClient.get(printer, "/plugin/logging/logs")
      .then(async (res) => res.json())
      .then(async (res) => {
        let mainLog = _.findIndex(res.files, function (o) {
          return o.name === "octoprint.log";
        });
        let orderedSelect = _.sortBy(res.files, [
          function (o) {
            return o.name;
          },
        ]);
        logSelect.innerHTML = "";
        for (let i = 0; i < orderedSelect.length; i++) {
          logSelect.insertAdjacentHTML(
            "beforeend",
            `
            <option value="${orderedSelect[i].refs.download}">${orderedSelect[i].name}</option>
          `
          );
        }

        logSelect.value = res.files[mainLog].refs.download;
        PrinterLogs.parseLogs(printer, res.files[mainLog].refs.download);
      })
      .catch((e) => {
        console.log(e);
      });

    if (typeof connectionLogs.currentOctoFarmLogs === "object") {
      for (let i = 0; i < connectionLogs.currentOctoPrintLogs.length; i++) {
        tempCount.innerHTML = "(0)";
        let log = connectionLogs.currentOctoPrintLogs[i];
        octoprintLogsRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.printer}</td>
              <td>${log.pluginDisplay}</td>
              <td>${log.message}</td>
            </tr>
        `
        );
      }
      octoCount.innerHTML = `(${connectionLogs.currentOctoPrintLogs.length})`;
      for (let i = 0; i < connectionLogs.currentOctoFarmLogs.length; i++) {
        let log = connectionLogs.currentOctoFarmLogs[i];
        printerRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${Calc.dateClean(log.date)}</th>
              <td>${log.printer}</td>
              <td>${log.message}</td>
            </tr>
      `
        );
      }
      logCount.innerHTML = `(${connectionLogs.currentOctoFarmLogs.length})`;
      for (let i = 0; i < connectionLogs.currentErrorLogs.length; i++) {
        let log = connectionLogs.currentErrorLogs[i];
        printerErrorRows.insertAdjacentHTML(
          "beforeend",
          `
            <tr class="${log.state}">
              <th scope="row">${log.date}</th>
              <td>${log.printer}</td>
              <td>${log.message}</td>
            </tr>
      `
        );
      }
      errorCount.innerHTML = `(${connectionLogs.currentErrorLogs.length})`;
      tempCount.innerHTML = "(0)";
      if (
        typeof connectionLogs.currentTempLogs !== "undefined" &&
        connectionLogs.currentTempLogs.length > 0
      ) {
        tempCount.innerHTML = `(${connectionLogs.currentTempLogs[0].data.length})`;
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
            "#450124",
          ],
          stroke: {
            curve: "smooth",
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
            //tickAmount: "dataPoints",
            type: "category",
            labels: {
              formatter(value) {
                const date = new Date(value);
                var weekday = new Array(7);
                weekday[0] = "Sun";
                weekday[1] = "Mon";
                weekday[2] = "Tue";
                weekday[3] = "Wed";
                weekday[4] = "Thu";
                weekday[5] = "Fri";
                weekday[6] = "Sat";
                return (
                  weekday[date.getDay()] +
                  " " +
                  date.getDate() +
                  " " +
                  date.toLocaleTimeString()
                );
              },
            },
          },
        };
        if (connectionLogs.currentTempLogs.length === 0) {
          tempChart.innerHTML = "<div class=''>No Records to Show</div>";
        }
        if (chart !== null) {
          chart.destroy();
          chart = new ApexCharts(tempChart, options);
          chart.render();
          chart.updateSeries(connectionLogs.currentTempLogs);
        } else {
          chart = new ApexCharts(tempChart, options);
          chart.render();
          chart.updateSeries(connectionLogs.currentTempLogs);
        }
      } else {
        tempChart.innerHTML = "<div class=''>No Records to Show</div>";
      }
    }

    if (!eventListener) {
      logSelect.addEventListener("change", (e) => {
        octologsLogsRows.innerHTML = "";

        octoPrintCount.innerHTML = "(<i class=\"fas fa-spinner fa-spin\"></i>)";
        PrinterLogs.parseLogs(printer, e.target.value);
      });
      document
        .getElementById("system-refresh-list")
        .addEventListener("click", async (e) => {
          console.log("Refresh!", currentPrinter.printerURL);
          let connectionLogs = await OctoFarmClient.get(
            "printers/connectionLogs/" + currentPrinter._id
          );
          connectionLogs = await connectionLogs.json();
          PrinterLogs.loadLogs(currentPrinter, connectionLogs);
        });
      eventListener = true;
    }
  }
  static async returnPrinterStatsTemplate(stats) {
    return `

            <div class="col-md-6 col-lg-3">
            <h5>Printer Usage</h5>
             <span><i class="fas fa-square text-success"></i> <b>Active Hours: </b> <br> ${Calc.generateTime(
               stats.activeTimeTotal / 1000
             )}</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Idle Hours: </b> <br> ${Calc.generateTime(
                stats.idleTimeTotal / 1000
              )}</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Offline Hours: </b><br> ${Calc.generateTime(
                stats.offlineTimeTotal / 1000
              )}</span>
            </div>
            <div class="col-md-6 col-lg-3">
                <h5>Print Totals for Today</h5>
               <span><i class="fas fa-square text-success"></i> <b>Successful Prints Today: </b> <br> ${
                 stats.printSuccessDay
               }</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Cancelled Prints Today : </b> <br> ${
                stats.printCancelDay
              }</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed Prints Today: </b><br> ${
                stats.printErrorDay
              }</span>
            
            </div>
            <div class="col-md-6 col-lg-3">
                            <h5>Print Totals for Last Seven Days</h5>
               <span><i class="fas fa-square text-success"></i> <b>Successful Prints Today: </b> <br> ${
                 stats.printerSuccessWeek
               }</span>
                        <br>
                        <span><i class="fas fa-square text-secondary"></i> <b>Cancelled Prints Today : </b> <br> ${
                          stats.printerCancelWeek
                        }</span>
                        <br>
                        <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed Prints Today: </b><br> ${
                          stats.printerErrorWeek
                        }</span>
            
            </div>
            <div class="col-md-6 col-lg-3">
                                        <h5>Print Totals All Time</h5>
               <span><i class="fas fa-square text-success"></i> <b>Successful Prints Today: </b> <br> ${
                 stats.printSuccessTotal
               }</span>
                <br>
                <span><i class="fas fa-square text-secondary"></i> <b>Cancelled Prints Today : </b> <br> ${
                  stats.printCancelTotal
                }</span>
                <br>
                <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed Prints Today: </b><br> ${
                  stats.printErrorTotal
                }</span>
                        
            </div>
    
    
    `;
  }
  static async loadStatistics(id) {
    let get = await OctoFarmClient.get("history/statistics/" + id);
    get = await get.json();
    console.log(get);
    let printerStatsWrapper = document.getElementById("printerStatistics");
    printerStatsWrapper.innerHTML = "";
    printerStatsWrapper.innerHTML = await this.returnPrinterStatsTemplate(get);
    document.getElementById("printerStatisticsTitle").innerHTML =
      "Printer Statistics: " + get.printerName;
  }
}
