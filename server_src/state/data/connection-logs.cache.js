const ErrorLog = require("../../models/ErrorLog");
const TempHistory = require("../../models/TempHistory");
const _ = require("lodash");

class ConnectionLogsCache {
  #currentLogs = [];
  #previousLogs = [];
  #printerConnectionLogs = {};

  #printerTickerStore;
  #printersStore;

  constructor({ printerTickerStore, printersStore }) {
    this.#printerTickerStore = printerTickerStore;
    this.#printersStore = printersStore;
  }

  // TODO line
  async sortTerminal(i, logs) {
    if (!!logs) {
      if (!this.#currentLogs[i]) {
        this.#currentLogs[i] = [];
      } else {
        if (logs.length === 1) {
          if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[0]) {
            this.#currentLogs[i].push(logs[0]);
          }
          if (this.#currentLogs[i].length >= 100) {
            this.#currentLogs[i].shift();
          }
        } else {
          for (let l = 0; l < logs.length; l++) {
            if (this.#currentLogs[i][this.#currentLogs[i].length - 1] !== logs[l]) {
              this.#currentLogs[i].push(logs[l]);
            }
            if (this.#currentLogs[i].length >= 100) {
              this.#currentLogs[i].shift();
            }
          }
          this.#previousLogs[i] = this.#currentLogs[i];
        }
      }
    } else {
      this.#currentLogs[i] = [];
    }
    return this.#currentLogs[i];
  }

  getPrinterConnectionLogs(printerId) {
    // Stub
    return this.#printerConnectionLogs[printerId];
  }

  async generateConnectionLogs(printerId) {
    const printerState = this.#printersStore.getPrinterState(printerId);

    let printerErrorLogs = await ErrorLog.find({});
    const printerName = printerState.getName();

    let currentErrorLogs = [];
    let currentOctoFarmLogs = [];
    let currentTempLogs = [];
    let currentOctoPrintLogs = [];
    for (let e = 0; e < printerErrorLogs.length; e++) {
      const errorLogEntry = !!printerErrorLogs[e].errorLog;
      if (errorLogEntry?.printerID === printerId) {
        let errorFormat = {
          date: errorLogEntry.endDate,
          message: errorLogEntry.reason,
          printer: printerName,
          state: "Offline"
        };
        currentErrorLogs.push(errorFormat);
      }
    }

    let currentIssues = await this.#printerTickerStore.getIssueList();
    for (let i = 0; i < currentIssues.length; i++) {
      if (currentIssues[i].printerID === printerId) {
        let errorFormat = {
          date: currentIssues[i].date,
          message: currentIssues[i].message,
          printer: currentIssues[i].printer,
          state: currentIssues[i].state
        };
        currentOctoFarmLogs.push(errorFormat);
      }
    }

    let octoPrintLogs = await this.#printerTickerStore.returnOctoPrintLogs();
    for (let i = 0; i < octoPrintLogs.length; i++) {
      const octoPrintLog = octoPrintLogs[i];
      if (octoPrintLog.printerId === printerId) {
        let octoFormat = {
          date: octoPrintLog.date,
          message: octoPrintLog.message,
          printer: octoPrintLog.printer,
          pluginDisplay: octoPrintLog.pluginDisplay,
          state: octoPrintLog.state
        };
        currentOctoPrintLogs.push(octoFormat);
      }
    }

    let tempHistory = await TempHistory.find({
      printer_id: printerId
    })
      .sort({ _id: -1 })
      .limit(500);
    if (!!tempHistory) {
      for (let h = 0; h < tempHistory.length; h++) {
        let hist = tempHistory[h].currentTemp;

        // create a new object to store full name.
        let keys = Object.keys(hist);
        let historyArray = [];

        for (let k = 0; k < keys.length; k++) {
          if (keys[k] !== "time") {
            let target = {};
            let actual = {};
            target = {
              name: keys[k] + "-target",
              data: []
            };
            actual = {
              name: keys[k] + "-actual",
              data: []
            };
            historyArray.push(target);
            historyArray.push(actual);
          }
        }

        currentTempLogs = historyArray;
      }

      if (currentTempLogs.length > 0) {
        for (let h = 0; h < tempHistory.length; h++) {
          let hist = tempHistory[h].currentTemp;
          let keys = Object.keys(hist);
          for (let k = 0; k < keys.length; k++) {
            if (keys[k] !== "time") {
              let actual = {
                x: hist["time"],
                y: hist[keys[k]].actual
              };
              let target = {
                x: hist["time"],
                y: hist[keys[k]].target
              };

              //get array position...
              let arrayTarget = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-target");
              let arrayActual = currentTempLogs
                .map(function (e) {
                  return e.name;
                })
                .indexOf(keys[k] + "-actual");
              if (currentTempLogs[arrayTarget].data.length <= tempHistory.length) {
                currentTempLogs[arrayTarget].data.push(target);
              }
              if (currentTempLogs[arrayActual].data.length <= tempHistory.length) {
                currentTempLogs[arrayActual].data.push(actual);
              }
            }
          }
        }
      }
    }

    currentErrorLogs = _.orderBy(currentErrorLogs, ["date"], ["desc"]);
    currentOctoFarmLogs = _.orderBy(currentOctoFarmLogs, ["date"], ["desc"]);
    currentTempLogs = _.orderBy(currentTempLogs, ["date"], ["desc"]);
    currentOctoPrintLogs = _.orderBy(currentOctoPrintLogs, ["date"], ["desc"]);

    return {
      currentErrorLogs,
      currentOctoFarmLogs,
      currentTempLogs,
      currentOctoPrintLogs
    };
  }
}

module.exports = ConnectionLogsCache;
