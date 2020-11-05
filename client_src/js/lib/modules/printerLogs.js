import Calc from "../functions/calc.js";

let chart = null;

export default class PrinterLogs {
  static loadLogs(printer, connectionLogs) {
    console.log(connectionLogs);
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

    logCount.innerHTML = "(0)";
    errorCount.innerHTML = "(0)";
    tempCount.innerHTML = "(0)";
    octoCount.innerHTML = "(0)";
    octoPrintCount.innerHTML = "(0)";

    printerRows.innerHTML = "";
    printerErrorRows.innerHTML = "";
    octoprintLogsRows.innerHTML = "";
    octologsLogsRows.innerHTML = "";
    //tempChart.innerHTML = "";
    fetch(`${printer.printerURL}/downloads/logs/octoprint.log`)
      .then(async (resp) => resp.blob())
      .then(async (blob) => blob.text())
      .then(async (text) => {
        let splitText = text.split(/(\r\n|\n|\r)/gm);
        octoPrintCount.innerHTML = "(" + splitText.length / 2 + ")";
        for (let i = 0; i < splitText.length; i++) {
          const isFourthIteration = i % 2 === 0;

          if (isFourthIteration) {
            let line = splitText[i].split(" - ");
            let colour = null;
            if (line[2] === "INFO") {
              colour = "Info";
            } else if (line[2] === "WARNING") {
              colour = "Active";
            } else {
              colour = "Offline";
            }
            //Filter the unneeded lines at the top of the log file...
            if (
              line[0][0] !== "|" &&
              line[0][0] !== "P" &&
              line[0][0] !== " " &&
              line[0][0] !== "T" &&
              line[0][0] !== "D" &&
              line[0][0] !== "u" &&
              line[0][0] !== "s"
            ) {
              octologsLogsRows.insertAdjacentHTML(
                "beforeend",
                `
                          <tr class="${colour}">
                            <th scope="row">${line[0]}</th>
                            <td>${line[1]}</td>
                            <td>${line[2]}</td>
                            <td>${line[3]}</td>
                          </tr>
                      `
              );
            }
          }
        }
      });

    if (typeof connectionLogs.currentOctoFarmLogs === "object") {
      logCount.innerHTML = `(${connectionLogs.currentOctoFarmLogs.length})`;
      errorCount.innerHTML = `(${connectionLogs.currentErrorLogs.length})`;
      octoCount.innerHTML = `(${connectionLogs.currentOctoPrintLogs.length})`;

      tempCount.innerHTML = "(0)";
      connectionLogs.currentOctoPrintLogs.forEach((log) => {
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
      });
      connectionLogs.currentOctoFarmLogs.forEach((log) => {
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
      });
      connectionLogs.currentErrorLogs.forEach((log) => {
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
      });
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
            type: "datetime",
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
      }
    }
  }
}
