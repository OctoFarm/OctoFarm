import Calc from "./utils/calc.js";
import UI from "./utils/ui.js";
import {
  returnBigFilamentSelectorTemplate,
  drawHistoryDropDown, findBigFilamentDropDowns
} from "./services/printer-filament-selector.service";
import * as ApexCharts from "apexcharts";
import OctoFarmClient from "./services/octofarm-client.service";
import {ELEMENTS, HISTORY_CONSTANTS, SORT_CONSTANTS} from "./constants/history.constants";
import {
    returnHistoryFilterDefaultSelected,
    returnHistoryPagination,
    returnHistoryTableRow
} from "./pages/history/history.templates";
import {daysBetweenTwoDates, getFirstDayOfLastMonth} from "./utils/date.utils";
import Litepicker from "litepicker";
import {dashboardOptions} from "./pages/charts/dashboard.options";

// Setup history listeners
document.getElementById("historyTable").addEventListener("click", (e) => {
  // Remove from UI
  e.preventDefault();
  History.delete(e);
});
document.getElementById("historyTable").addEventListener("click", (e) => {
  // Remove from UI
  e.preventDefault();
  History.edit(e);
});

$("#historyModal").on("hidden.bs.modal", function (e) {
  document.getElementById("historySaveBtn").remove();
  document.getElementById("historyUpdateCostBtn").remove();
});

// $("#currentStatistics").on("show.bs.modal", function (e) {});

class History {
  static historyList;
  static completionByDay;
  static overTimeGraph;
  static monthlySuccessRateGraph;
  static monthlyCompetionByDay;
  static datePicker;
  static totalSpark;
  static completeSpark;
  static cancelledSpark;
  static failedSpark;
  static listenersApplied;

  static loadNoData() {
    ELEMENTS.historyTable.innerHTML = `<tr><td>NO DATA</td></tr>`;
    ELEMENTS.historyPagination.innerHTML = "";
    const paginationZero = {
      itemCount: 0,
      perPage: 0,
      pageCount: 0,
      currentPage: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prev: null,
      next: null
    };
    if (paginationZero) {
      ELEMENTS.historyPagination.insertAdjacentHTML(
        "beforeend",
        returnHistoryPagination(paginationZero)
      );
    }
    ELEMENTS.printTimeTotal.innerHTML = "No Time";
    ELEMENTS.filamentUsageTotal.innerHTML = `0m / 0g`;
    ELEMENTS.filamentCostTotal.innerHTML = 0;
    ELEMENTS.printerCostTotal.innerHTML = 0;
    ELEMENTS.totalCost.innerHTML = 0;
    ELEMENTS.averageCostPerHour.innerHTML = 0;
  }
  static getHistoryRequestURL(pageNumber) {
    let lastDay = new Date().toISOString();
    let firstDay = getFirstDayOfLastMonth();
    if (this?.datePicker) {
      lastDay = this.datePicker.getEndDate().dateInstance;
      firstDay = this.datePicker.getDate().dateInstance;
    }

    let url = `history/get?${HISTORY_CONSTANTS.currentPage}${pageNumber}&${
      HISTORY_CONSTANTS.perPage
    }${ELEMENTS.itemsPerPage.value}&${HISTORY_CONSTANTS.sort}${
      SORT_CONSTANTS[ELEMENTS.sort.value]
    }&${HISTORY_CONSTANTS.dateBefore}${lastDay}&${HISTORY_CONSTANTS.dateAfter}${firstDay}`;

    if (ELEMENTS.printerNamesFilter.value !== "Filter") {
      url += "&printerNameFilter=" + ELEMENTS.printerNamesFilter.value.replace(/ /g, "-");
    }

    if (ELEMENTS.printerGroupsFilter.value !== "Filter") {
      url +=
        "&printerGroupFilter=" +
        ELEMENTS.printerGroupsFilter.value.replace(/[^\w\-]+/g, "-").toLowerCase();
    }

    if (ELEMENTS.fileFilter.value !== "Filter") {
      url += "&fileFilter=" + ELEMENTS.fileFilter.value + ".gcode";
    }

    if (ELEMENTS.pathFilter.value !== "Filter") {
      url += "&pathFilter=" + ELEMENTS.pathFilter.value;
    }

    if (ELEMENTS.spoolManuFilter.value !== "Filter") {
      url += "&spoolManuFilter=" + ELEMENTS.spoolManuFilter.value.replace(/ /g, "-");
    }

    if (ELEMENTS.spoolMatFilter.value !== "Filter") {
      url += "&spoolMatFilter=" + ELEMENTS.spoolMatFilter.value.replace(/ /g, "-");
    }

    if (ELEMENTS.fileSearch.value !== "") {
      url += "&fileSearch=" + ELEMENTS.fileSearch.value.replace(/ /g, "-");
    }

    if (ELEMENTS.printerSearch.value !== "") {
      url += "&printerSearch=" + ELEMENTS.printerSearch.value.replace(/ /g, "-");
    }

    if (ELEMENTS.spoolSearch.value !== "") {
      url += "&spoolSearch=" + ELEMENTS.spoolSearch.value.replace(/ /g, "-");
    }

    return url;
  }
  static drawHistoryTable(records) {
    const historyTable = document.getElementById("historyTable");
    historyTable.innerHTML = "";

    if (records) {
      for (let r = 0; r < records.length; r++) {
        historyTable.insertAdjacentHTML("beforeend", returnHistoryTableRow(records[r]));
      }
    }
  }
  static addHistoryFilterListeners(pagination) {
    const paginationElementsList = document.querySelectorAll('*[id^="changePage"]');
    paginationElementsList.forEach((element) => {
      element.addEventListener("click", (e) => {
        const split = e.target.id.split("-");

        this.get(split[1]);
      });
    });

    document.getElementById("firstPage").addEventListener("click", () => {
      this.get(1, true);
    });

    document.getElementById("previousPage").addEventListener("click", () => {
      this.get(pagination.prev, true);
    });

    document.getElementById("nextPage").addEventListener("click", () => {
      this.get(pagination.next, true);
    });

    document.getElementById("lastPage").addEventListener("click", () => {
      this.get(pagination.pageCount, true);
    });

    // if (forceFilterRedraw) {
    //   this.listenersApplied = false;
    // }

    if (!this?.listenersApplied) {
      this.datePicker.on("selected", async (date1, date2) => {
        const daysBetweenDates = daysBetweenTwoDates(
          new Date(date1.dateInstance),
          new Date(date2.dateInstance)
        );
        if (daysBetweenDates > 50) {
          bootbox.confirm({
            message: `You are trying to load ${daysBetweenDates} of your records, this could be very slow! are you sure?`,
            buttons: {
              confirm: {
                label: "Yes",
                className: "btn-success"
              },
              cancel: {
                label: "No",
                className: "btn-danger"
              }
            },
            callback: async (result) => {
              if (result) {
                const datesElements = document.querySelectorAll('[id^="dateRange-"]');
                datesElements.forEach((element) => {
                  element.innerHTML =
                    new Date(date1.dateInstance).toLocaleDateString() +
                    " <-> " +
                    new Date(date2.dateInstance).toLocaleDateString();
                });
                await this.get(undefined, true);
              }
            }
          });
        } else {
          const datesElements = document.querySelectorAll('[id^="dateRange-"]');
          datesElements.forEach((element) => {
            element.innerHTML =
              new Date(date1.dateInstance).toLocaleDateString() +
              " <-> " +
              new Date(date2.dateInstance).toLocaleDateString();
          });
          await this.get(undefined, true);
        }
      });
      ELEMENTS.sort.addEventListener("change", async () => {
        await this.get();
      });
      ELEMENTS.itemsPerPage.addEventListener("change", async () => {
        if (ELEMENTS.itemsPerPage.value === "9007199254740991") {
          bootbox.confirm({
            message:
              "You are trying to load ALL of your records, this could be very slow! are you sure?",
            buttons: {
              confirm: {
                label: "Yes",
                className: "btn-success"
              },
              cancel: {
                label: "No",
                className: "btn-danger"
              }
            },
            callback: async (result) => {
              if (result) {
                this.get(undefined, true);
              }
            }
          });
        } else {
          this.get(undefined, true);
        }
      });
      ELEMENTS.fileFilter.addEventListener("change", async () => {
        await this.get();
      });
      ELEMENTS.pathFilter.addEventListener("change", async () => {
        await this.get();
      });

      ELEMENTS.spoolManuFilter.addEventListener("change", async () => {
        await this.get();
      });

      ELEMENTS.spoolMatFilter.addEventListener("change", async () => {
        await this.get();
      });

      ELEMENTS.printerNamesFilter.addEventListener("change", async () => {
        await this.get();
      });

      ELEMENTS.printerGroupsFilter.addEventListener("change", async () => {
        await this.get();
      });

      ELEMENTS.fileSearch.addEventListener("keyup", async () => {
        await this.get();
      });

      ELEMENTS.spoolSearch.addEventListener("keyup", async () => {
        await this.get();
      });

      ELEMENTS.printerSearch.addEventListener("keyup", async () => {
        await this.get();
      });

      this.listenersApplied = true;
    }
  }
  static drawHistoryFilters(pagination, filterData, forceFilterRedraw) {
    ELEMENTS.historyPagination.innerHTML = "";
    if (pagination) {
      ELEMENTS.historyPagination.insertAdjacentHTML(
        "beforeend",
        returnHistoryPagination(pagination)
      );
    }
    if (!this?.datePicker) {
      this.datePicker = new Litepicker({
        element: document.getElementById("historyDateRange"),
        singleMode: false,
        numberOfMonths: 2,
        numberOfColumns: 2,
        resetButton: true,
        tooltipText: {
          one: "night",
          other: "nights"
        },
        tooltipNumber: (totalDays) => {
          return totalDays - 1;
        }
      });
      this.datePicker.setDateRange(getFirstDayOfLastMonth(), Calc.lastDayOfMonth());
      const datesElements = document.querySelectorAll('[id^="dateRange-"]');
      datesElements.forEach((element) => {
        element.innerHTML =
          new Date(getFirstDayOfLastMonth()).toLocaleDateString() +
          " <-> " +
          new Date(Calc.lastDayOfMonth()).toLocaleDateString();
      });
    }
    if (forceFilterRedraw) {
      ELEMENTS.printerGroupsFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.printerGroups.forEach((group) => {
        ELEMENTS.printerNamesFilter.insertAdjacentHTML(
          "beforeend",
          `<option value="${group.replace(/[^\w\-]+/g, "-").toLowerCase()}${group} </option>`
        );
      });

      ELEMENTS.printerNamesFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.printerNames.forEach((printer) => {
        ELEMENTS.printerNamesFilter.insertAdjacentHTML(
          "beforeend",
          `<option value="${printer.replace(/ /g, "_")}"> ${printer} </option>`
        );
      });

      ELEMENTS.fileFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.fileNames.forEach((file) => {
        ELEMENTS.fileFilter.insertAdjacentHTML(
          "beforeend",
          `<option value="${file.replace(/ /g, "_")}"> ${file} </option>`
        );
      });
      ELEMENTS.pathFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.pathList.forEach((path) => {
        ELEMENTS.pathFilter.insertAdjacentHTML(
          "beforeend",
          `<option value="${path.replace(/ /g, "_")}"> ${path} </option>`
        );
      });
      ELEMENTS.spoolManuFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.spoolsManu.forEach((manu) => {
        if (manu !== "") {
          ELEMENTS.spoolManuFilter.insertAdjacentHTML(
            "beforeend",
            `<option value="${manu}"> ${manu} </option>`
          );
        }
      });
      ELEMENTS.spoolMatFilter.innerHTML = returnHistoryFilterDefaultSelected();
      filterData.spoolsMat.forEach((mat) => {
        if (mat !== "") {
          ELEMENTS.spoolMatFilter.insertAdjacentHTML(
            "beforeend",
            `<option value="${mat}"> ${mat} </option>`
          );
        }
      });
    }
  }
  static drawMonthlyStatistics(statistics) {
    const monthArray = [];
    statistics.forEach((stat) => {
      monthArray.push(stat.month);
    });

    let successRateList = statistics.map((stat) => {
      const currentRate = parseInt(stat.statistics.completedPercent);
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseFloat(currentRate.toFixed(0));
      }
    });
    let failureRateList = statistics.map((stat) => {
      const currentRate =
        parseInt(stat.statistics.cancelledPercent) + parseInt(stat.statistics.failedPercent);
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseFloat(currentRate.toFixed(0));
      }
    });

    const historyGraphOptions = {
      chart: {
        type: "bar",
        stacked: true,
        stackedPercent: true,
        width: "100%",
        height: "250px",
        animations: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },
      colors: ["#00bc8c", "#e74c3c", "#f39c12"],
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9
        }
      },
      // colors: ["#295efc", "#37ff00", "#ff7700", "#ff1800", "#37ff00", "#ff1800"],
      toolbar: {
        show: false
      },
      stroke: {
        width: 4,
        curve: "smooth"
      },
      theme: {
        mode: "dark"
      },
      noData: {
        text: "Loading..."
      },
      series: [
        {
          name: "Success Percent",
          data: successRateList
        },
        {
          name: "Failed Percent",
          data: failureRateList
        }
      ],
      yaxis: [
        {
          title: {
            text: "Success Percent"
          },
          min: 0,
          max: 100,
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0) + "%";
              }
            }
          }
        },
        {
          title: {
            text: "Count"
          },
          seriesName: "Failed Percent",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        }
      ],
      xaxis: {
        categories: monthArray
      }
    };

    if (!this?.monthlySuccessRateGraph) {
      this.monthlySuccessRateGraph = new ApexCharts(
        document.querySelector("#monthlySuccessRate"),
        historyGraphOptions
      );
      this.monthlySuccessRateGraph.render();
    }
    this.monthlySuccessRateGraph.updateSeries([
      {
        name: "Success Percent",
        data: successRateList
      },
      {
        name: "Failed Percent",
        data: failureRateList
      }
    ]);

    let printerLists = statistics.map((stat) => {
      return { month: stat.month, data: stat.statistics.sortedTopPrinterList };
    });
    let printerSuccessLists = statistics.map((stat) => {
      return { month: stat.month, data: stat.statistics.sortedTopSuccessPrinterList };
    });
    const topPrinterPerMonth = document.getElementById("monthlyMostUtilisedPrinter");
    topPrinterPerMonth.innerHTML = "";
    topPrinterPerMonth.insertAdjacentHTML(
      "beforeend",
      `
        <li class="list-group-item m-0 p-0 row d-flex"><small class="col-lg-1 text-center">Month</small><small class="col-lg-3 text-center">Printer</small><small class="text-center col-lg-2">Time</small><small class="col-lg-2 text-center">Count</small><small class="col-lg-4 text-center">Success Rate</small></li>
      `
    );
    printerLists.forEach((item) => {
      if (item?.data) {
        const total =
          item.data[0].failedCount + item.data[0].cancelledCount + item.data[0].successCount;
        const failedPercent = (item.data[0].failedCount * 100) / total;
        const cancelledPercent = (item.data[0].cancelledCount * 100) / total;
        const successPercent = (item.data[0].successCount * 100) / total;

        topPrinterPerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="col-lg-1 text-center text-truncate">${
          item.month
        }</small><small class="col-lg-3 text-center text-truncate">${
            item.data[0].printerName
          }</small><small class="text-center col-lg-2">${Calc.generateTime(
            item.data[0].time
          )}</small><small class="col-lg-2 text-center">${
            item.data[0].prints
          }</small><small class="col-lg-4 text-center">            <div class="progress mb-0" style="width: 100%;">
            <div
        id="totalSuccessPercent"
        class="progress-bar progress-bar-striped bg-success"
        role="progressbar"
        style="width: ${successPercent}%"
        aria-valuenow="0%"
        aria-valuemin="0"
        aria-valuemax="100"
        >${successPercent.toFixed(2)}%
      </div>
        <div
            id="totalCancelledPercent"
            class="progress-bar progress-bar-striped bg-warning"
            role="progressbar"
            style="width: ${cancelledPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${cancelledPercent.toFixed(2)}%
        </div>
        <div
            id="totalFailurePercent"
            class="progress-bar progress-bar-striped bg-danger"
            role="progressbar"
            style="width: ${failedPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${failedPercent.toFixed(2)}%
        </div>
      </div>
      </small></li>
      `
        );
      } else {
      }
    });
    const monthlyMostSuccessPrinter = document.getElementById("monthlyMostSuccessPrinter");
    monthlyMostSuccessPrinter.innerHTML = "";
    monthlyMostSuccessPrinter.insertAdjacentHTML(
      "beforeend",
      `
        <li class="list-group-item m-0 p-0 row d-flex"><small class="col-lg-1 text-center">Month</small><small class="col-lg-3 text-center">Printer</small><small class="text-center col-lg-2">Time</small><small class="col-lg-2 text-center">Count</small><small class="col-lg-4 text-center">Success Rate</small></li>
      `
    );
    printerSuccessLists.forEach((item) => {
      if (item?.data) {
        const total =
          item.data[0].failedCount + item.data[0].cancelledCount + item.data[0].successCount;
        const failedPercent = (item.data[0].failedCount * 100) / total;
        const cancelledPercent = (item.data[0].cancelledCount * 100) / total;
        const successPercent = (item.data[0].successCount * 100) / total;

        monthlyMostSuccessPrinter.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="col-lg-1 text-center text-truncate">${
          item.month
        }</small><small class="col-lg-3 text-center text-truncate">${
            item.data[0].printerName
          }</small><small class="text-center col-lg-2">${Calc.generateTime(
            item.data[0].time
          )}</small><small class="col-lg-2 text-center">${
            item.data[0].prints
          }</small><small class="col-lg-4 text-center">            <div class="progress mb-0" style="width: 100%;">
            <div
        id="totalSuccessPercent"
        class="progress-bar progress-bar-striped bg-success"
        role="progressbar"
        style="width: ${successPercent}%"
        aria-valuenow="0%"
        aria-valuemin="0"
        aria-valuemax="100"
        >${successPercent.toFixed(2)}%
      </div>
        <div
            id="totalCancelledPercent"
            class="progress-bar progress-bar-striped bg-warning"
            role="progressbar"
            style="width: ${cancelledPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${cancelledPercent.toFixed(2)}%
        </div>
        <div
            id="totalFailurePercent"
            class="progress-bar progress-bar-striped bg-danger"
            role="progressbar"
            style="width: ${failedPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${failedPercent.toFixed(2)}%
        </div>
      </div>
      </small></li>
      `
        );
      } else {
      }
    });
    let fileLists = statistics.map((stat) => {
      return { month: stat.month, data: stat.statistics.sortedTopFilesList };
    });
    const topFilePerMonth = document.getElementById("monthlyMostPrintedFile");
    topFilePerMonth.innerHTML = "";
    topFilePerMonth.insertAdjacentHTML(
      "beforeend",
      `
        <li class="list-group-item m-0 p-0 row d-flex"><small class="col-lg-1 text-center">Month</small><small class="col-lg-3 text-center">File</small><small class="text-center col-lg-2">Time</small><small class="col-lg-2 text-center">Count</small><small class="col-lg-4 text-center">Success Rate</small></li>
      `
    );
    fileLists.forEach((item) => {
      if (item?.data) {
        const total =
          item.data[0].failedCount + item.data[0].cancelledCount + item.data[0].successCount;
        const failedPercent = (item.data[0].failedCount * 100) / total;
        const cancelledPercent = (item.data[0].cancelledCount * 100) / total;
        const successPercent = (item.data[0].successCount * 100) / total;

        topFilePerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="col-lg-1 text-center text-truncate">${
          item.month
        }</small><small class="col-lg-3 text-center text-truncate">${item.data[0].file.replace(
            ".gcode",
            ""
          )}</small><small class="text-center col-lg-2">${UI.generateTime(
            item.data[0].sumOfPrintTime
          )} </small><small class="text-center col-lg-2">${
            item.data[0].prints
          } </small><small class="col-lg-4 text-center">            <div class="progress mb-0" style="width: 100%;">
            <div
        id="totalSuccessPercent"
        class="progress-bar progress-bar-striped bg-success"
        role="progressbar"
        style="width: ${successPercent}%"
        aria-valuenow="0%"
        aria-valuemin="0"
        aria-valuemax="100"
        >${successPercent.toFixed(0)}%
      </div>
        <div
            id="totalCancelledPercent"
            class="progress-bar progress-bar-striped bg-warning"
            role="progressbar"
            style="width: ${cancelledPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${cancelledPercent.toFixed(2)}%
        </div>
        <div
            id="totalFailurePercent"
            class="progress-bar progress-bar-striped bg-danger"
            role="progressbar"
            style="width: ${failedPercent}%"
            aria-valuenow="0%"
            aria-valuemin="0"
            aria-valuemax="100"
        >
          ${failedPercent.toFixed(2)}%
        </div>
      </div>
      </small></li>
      `
        );
      }
    });

    let successPercentList = statistics.map((stat) => {
      const total = stat.statistics.cancelled + stat.statistics.failed + stat.statistics.completed;
      const currentRate = (stat.statistics.completed * 100) / total;
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseInt(currentRate);
      }
    });
    let failedPercentList = statistics.map((stat) => {
      const total = stat.statistics.cancelled + stat.statistics.failed + stat.statistics.completed;
      const currentRate = (stat.statistics.failed * 100) / total;
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseInt(currentRate);
      }
    });
    let cancelledPercentList = statistics.map((stat) => {
      const total = stat.statistics.cancelled + stat.statistics.failed + stat.statistics.completed;
      const currentRate = (stat.statistics.cancelled * 100) / total;
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseInt(currentRate);
      }
    });

    let successCountList = statistics.map((stat) => {
      const total = stat.statistics.completed;

      if (isNaN(total)) {
        return 0;
      } else {
        return parseInt(total);
      }
    });
    let failedCountList = statistics.map((stat) => {
      const total = stat.statistics.failed;
      if (isNaN(total)) {
        return 0;
      } else {
        return parseInt(total);
      }
    });
    let cancelledCountList = statistics.map((stat) => {
      const total = stat.statistics.cancelled;

      if (isNaN(total)) {
        return 0;
      } else {
        return parseInt(total);
      }
    });
    let totalPrintCountList = statistics.map((stat) => {
      const calculation =
        stat.statistics.complete + stat.statistics.failed + stat.statistics.cancelled;
      if (isNaN(calculation)) {
        return 0;
      } else {
        return parseInt(calculation);
      }
    });

    let totalPrintTimeList = statistics.map((stat) => {
      if (isNaN(stat.statistics.totalPrintTime)) {
        return 0;
      } else {
        return parseInt(stat.statistics.totalPrintTime);
      }
    });

    const printRateGraphOptions = {
      chart: {
        type: "line",
        width: "100%",
        height: "250px",
        animations: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },
      colors: ["#00bc8c", "#e74c3c", "#f39c12", "#12d1f3"],
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9
        }
      },
      // colors: ["#295efc", "#37ff00", "#ff7700", "#ff1800", "#37ff00", "#ff1800"],
      toolbar: {
        show: false
      },
      stroke: {
        width: 4,
        curve: "smooth"
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
            text: "Count"
          },

          seriesName: "Success Count",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          }
        },
        {
          title: {
            text: "Count"
          },
          seriesName: "Success Count",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        },
        {
          title: {
            text: "Count"
          },
          seriesName: "Success Count",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        },
        {
          title: {
            text: "Total"
          },
          seriesName: "Success Count",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            }
          },
          show: false
        }
      ],
      xaxis: {
        categories: monthArray
      }
    };
    if (!this?.monthlyCompetionByDay) {
      this.monthlyCompetionByDay = new ApexCharts(
        document.querySelector("#monthlyPrintRate"),
        printRateGraphOptions
      );
      this.monthlyCompetionByDay.render();
    }

    this.monthlyCompetionByDay.updateSeries([
      {
        name: "Success Count",
        data: successCountList
      },
      {
        name: "Failed Count",
        data: failedCountList
      },
      {
        name: "Cancelled Count",
        data: cancelledCountList
      },
      { name: "Total Count", data: totalPrintCountList }
    ]);

    const sparkOptions = dashboardOptions.historySparkLineOptions;

    sparkOptions.series[0].data = totalPrintTimeList;
    sparkOptions.tooltip.x.formatter = function (value) {
      return monthArray[value - 1]; // The formatter function overrides format property
    };
    if (!this?.totalSpark) {
      this.totalSpark = new ApexCharts(document.querySelector("#totalSpark"), sparkOptions);
      this.totalSpark.render();
    }

    const totalDays = UI.milisecondsToDays(totalPrintTimeList[totalPrintTimeList.length - 1]);
    document.getElementById("totalSparkLast").innerHTML = totalDays.toFixed(0) + " Days";

    sparkOptions.colors = ["#00bc8c"];
    sparkOptions.series[0].data = successPercentList;
    sparkOptions.tooltip.y.formatter = function (value) {
      return value + "%";
    };
    sparkOptions.tooltip.y.title.formatter = (seriesName) => "Success: ";
    if (!this?.completeSpark) {
      this.completeSpark = new ApexCharts(document.querySelector("#successSpark"), sparkOptions);
      this.completeSpark.render();
    }

    document.getElementById("successSparkLast").innerHTML =
      successPercentList[successPercentList.length - 1] + "%";

    sparkOptions.colors = ["#f39c12"];
    sparkOptions.series[0].data = cancelledPercentList;
    sparkOptions.tooltip.y.title.formatter = (seriesName) => "Cancelled: ";
    if (!this?.cancelledSpark) {
      this.cancelledSpark = new ApexCharts(document.querySelector("#cancelledSpark"), sparkOptions);
      this.cancelledSpark.render();
    }

    document.getElementById("cancelledSparkLast").innerHTML =
      cancelledPercentList[cancelledPercentList.length - 1] + "%";

    sparkOptions.colors = ["#e74c3c"];
    sparkOptions.series[0].data = failedPercentList;
    sparkOptions.tooltip.y.title.formatter = (seriesName) => "Failed: ";
    if (!this?.failedSpark) {
      this.failedSpark = new ApexCharts(document.querySelector("#failedSpark"), sparkOptions);
      this.failedSpark.render();
    }

    document.getElementById("failedSparkLast").innerHTML =
      failedPercentList[failedPercentList.length - 1] + "%";
  }

  static drawStatisticsTotals(statistics) {
    // Load graphs
    let historyGraphData = statistics.historyByDay;
    let historyUsageOverTimeData = statistics.totalOverTime;

    if (!this?.competionByDay) {
      this.competionByDay = new ApexCharts(
        document.querySelector("#printCompletionByDay"),
        dashboardOptions.printSuccessRatePerDay
      );
      this.competionByDay.render();
    }

    this.competionByDay.updateSeries(historyUsageOverTimeData);

    if (!this?.overTimeGraph) {
      this.overTimeGraph = new ApexCharts(
        document.querySelector("#printCompletionOverTime"),
        dashboardOptions.printCompletionByDayChartOptions
      );
      this.overTimeGraph.render();
    }
    this.overTimeGraph.updateSeries(historyGraphData);
  }
  static async get(pageNumber = 1, forceFilterRedraw = false) {
    const { history, statisticsClean, pagination, monthlyStatistics, historyFilterData } =
      await OctoFarmClient.get(this.getHistoryRequestURL(pageNumber));

    if (!history || !statisticsClean || !pagination) {
      this.loadNoData();
      return;
    }

    // REFACTOR: Load statistics EJS renders currently, want's to be dynamic as well.
    //this.updateStatistics(statisticsClean);
    this.historyList = history;
    // Load history filters
    this.drawHistoryFilters(pagination, historyFilterData, forceFilterRedraw);
    this.addHistoryFilterListeners(pagination, forceFilterRedraw);

    // Load history table...
    this.drawHistoryTable(history);

    // Load monthly statistics
    this.drawMonthlyStatistics(monthlyStatistics);

    //Update totals
    this.updateTotals(history);

    // Load statistics totals
    this.drawStatisticsTotals(statisticsClean);
  }

  static async edit(e) {
    function SelectHasValue(select, value) {
      const obj = document.getElementById(select);
      if (obj !== null) {
        return obj.innerHTML.indexOf(`value="${value}"`) > -1;
      }
      return false;
    }

    if (e.target.classList.contains("historyEdit")) {
      document.getElementById("saveHistoryBtns").innerHTML =
        ' <button id="historyUpdateCostBtn" type="button" class="btn btn-warning" data-dismiss="modal">\n        Update Cost\n      </button>\n      <button id="historySaveBtn" type="button" class="btn btn-success" data-dismiss="modal">\n        Save Changes\n      </button>';
      document.getElementById("historySaveBtn").addEventListener("click", (f) => {
        History.save(e.target.id);
      });
      document.getElementById("historyUpdateCostBtn").addEventListener("click", (f) => {
        History.updateCost(e.target.id);
      });
      // Grab elements
      const printerName = document.getElementById("printerName");
      const fileName = document.getElementById("fileName");
      const status = document.getElementById("printStatus");
      const printerCost = document.getElementById("printerCost");
      const actualPrintTime = document.getElementById("printerTime");
      const printTimeAccuracy = document.getElementById("printTimeAccuracy");

      const startDate = document.getElementById("startDate");
      const printTime = document.getElementById("printTime");
      const endDate = document.getElementById("endDate");

      const notes = document.getElementById("notes");

      const uploadDate = document.getElementById("dateUploaded");
      const path = document.getElementById("path");
      const size = document.getElementById("size");

      const estimatedPrintTime = document.getElementById("estimatedPrintTime");
      const averagePrintTime = document.getElementById("averagePrintTime");
      const lastPrintTime = document.getElementById("lastPrintTime");
      const viewTable = document.getElementById("viewTable");
      const jobCosting = document.getElementById("jobCosting");
      const jobHourlyCost = document.getElementById("jobHourlyCost");
      const resendStats = document.getElementById("resendStats");

      viewTable.innerHTML = "";
      printerName.innerHTML = " - ";
      fileName.innerHTML = " - ";
      status.innerHTML = " - ";
      printerCost.placeholder = " - ";
      actualPrintTime.placeholder = " - ";
      printTimeAccuracy.placeholder = " - ";
      startDate.innerHTML = " - ";
      printTime.innerHTML = " - ";
      endDate.innerHTML = " - ";
      notes.placeholder = "";
      uploadDate.placeholder = " - ";
      path.value = " - ";
      size.value = " - ";
      estimatedPrintTime.placeholder = " - ";
      averagePrintTime.placeholder = " - ";
      lastPrintTime.placeholder = " - ";
      jobCosting.placeholder = " - ";
      jobHourlyCost.placeholder = " - ";
      resendStats.placeholder = " - ";

      const thumbnail = document.getElementById("thumbnails");
      const thumbnailIndicators = document.getElementById("thumbnails-indicators");
      thumbnail.innerHTML = "";
      thumbnailIndicators.innerHTML = "";
      const split = e.target.id.split("-");
      const index = _.findIndex(this.historyList, function (o) {
        return o._id == split[1];
      });
      const current = this.historyList[index];
      printerName.innerHTML = current.printer;
      fileName.innerHTML = current.file.name;
      if (typeof current.resend !== "undefined" && current.resend !== null) {
        resendStats.placeholder = `${current.resend.count} / ${
          current.resend.transmitted / 1000
        }K (${current.resend.ratio.toFixed(0)})`;
        if (document.getElementById("resendsTitle").classList.contains("d-none")) {
          document.getElementById("resendsTitle").classList.remove("d-none");
        }
      } else {
        if (!document.getElementById("resendsTitle").classList.contains("d-none")) {
          document.getElementById("resendsTitle").classList.add("d-none");
        }
      }

      let thbs = false;
      let counter = 0;
      let active = "active";

      if (
        typeof current.snapshot !== "undefined" &&
        current.snapshot !== "" &&
        current.snapshot !== null
      ) {
        thumbnailIndicators.insertAdjacentHTML(
          "beforeend",
          `
           <li data-target="#carouselExampleIndicators" data-slide-to="${counter}" class="${active}"></li>
        `
        );
        thumbnail.insertAdjacentHTML(
          "beforeend",
          `
              <div class="carousel-item ${active} text-center" style="height:200px; background-image: url('${current.snapshot}')">
                  <div class="carousel-caption d-none d-md-block">
                    <h6>Camera Snapshot</h6>
                  </div>
                </div>
          `
        );
        thbs = true;
        counter = counter + 1;
        active = "";
      }

      if (
        typeof current.thumbnail !== "undefined" &&
        current.thumbnail != null &&
        current.thumbnail != ""
      ) {
        thumbnailIndicators.insertAdjacentHTML(
          "beforeend",
          `
           <li data-target="#carouselExampleIndicators" data-slide-to="${counter}" class="${active}"></li>
        `
        );
        thumbnail.insertAdjacentHTML(
          "beforeend",
          `
              <div class="carousel-item ${active}  text-center" style="height:200px; background-image: url('${current.thumbnail}')">
                  <div class="carousel-caption d-none d-md-block">
                    <h6>Slicer Thumbnail</h6>
                  </div>
                </div>
          `
        );
        thbs = true;
        active = "";
        counter = counter + 1;
      }
      if (
        typeof current.timelapse !== "undefined" &&
        current.timelapse !== "" &&
        current.timelapse !== null
      ) {
        thumbnailIndicators.insertAdjacentHTML(
          "beforeend",
          `
           <li data-target="#carouselExampleIndicators" data-slide-to="${counter}" class="${active}"></li>
        `
        );
        thumbnail.insertAdjacentHTML(
          "beforeend",
          `
            <div class="carousel-item ${active} text-center" style="height:200px;">
                <video autobuffer="autobuffer" autoplay="autoplay" loop="loop" controls="controls" style="height:350px;">
                    <source src='${current.timelapse}'>
                </video>
                  <div class="carousel-caption d-none d-md-block">
                    <h6>Timelapse</h6>
                  </div>
            </div>
          `
        );
        thbs = true;
        active = "";
        counter = counter + 1;
      }
      if (thbs) {
        document.getElementById("galleryElements").style.display = "block";
      } else {
        document.getElementById("galleryElements").style.display = "none";
      }

      startDate.innerHTML = `<b>Started</b><hr>${new Date(
        current.startDate
      ).toLocaleDateString()} - ${new Date(current.startDate).toLocaleTimeString()}`;
      printTime.innerHTML = `<b>Duration</b><hr>${Calc.generateTime(current.printTime)}`;
      endDate.innerHTML = `<b>Finished</b><hr>${new Date(
        current.endDate
      ).toLocaleDateString()} - ${new Date(current.endDate).toLocaleTimeString()}`;
      printerCost.value = current.printerCost;
      jobHourlyCost.value = current.costPerHour;
      notes.value = current.notes;
      actualPrintTime.value = Calc.generateTime(current.printTime);
      status.innerHTML = `${current.state}`;
      if (typeof current.job !== "undefined" && current.job !== null) {
        estimatedPrintTime.value = Calc.generateTime(current.job.estimatedPrintTime);
        printTimeAccuracy.value = `${current.job.printTimeAccuracy.toFixed(0) / 100}%`;
      }
      jobCosting.value = current.totalCost;
      let upDate = new Date(current.file.uploadDate * 1000);
      upDate = `${upDate.toLocaleDateString()} ${upDate.toLocaleTimeString()}`;
      uploadDate.value = upDate;
      path.value = current.file.path;
      size.value = Calc.bytes(current.file.size).replace("<i class=\"fas fa-hdd\"></i> ", "");
      averagePrintTime.value = Calc.generateTime(current.file.averagePrintTime);
      lastPrintTime.value = Calc.generateTime(current.file.lastPrintTime);
      const toolsArray = [];
      for(const [i, spool] of current.spools.entries()){
        const sp = Object.keys(spool)[0];
        const spoolSelector = returnBigFilamentSelectorTemplate(i);
        toolsArray.push(sp);
        console.log(spool[sp])
        viewTable.insertAdjacentHTML(
            "beforeend",
            `
          <tr>
              <td>
                ${spoolSelector}
              </td>
              <td>
              ${spool[sp].volume}m3
              </td>
              <td>
              ${spool[sp].length}m
              </td>
              <td>
                 ${spool[sp].weight}g
              </td>
              <td>
                 ${spool[sp].cost}
              </td>
              </tr>
          </tr>
        `
        );
        await drawHistoryDropDown(document.getElementById(`tool-${i}-bigFilamentSelect`), spool[sp].spoolId);
      }
      for (let i = 0; i < toolsArray.length; i++) {
        const currentToolDropDown = document.getElementById(`tool-${index}-bigFilamentSelect`);
        // currentToolDropDown.innerHTML = ;
        // if (current.spools[i][toolsArray[i]].spoolId !== null) {
        //   if (SelectHasValue(currentToolDropDown.id, current.spools[i][toolsArray[i]].spoolId)) {
        //     currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
        //   } else {
        //     currentToolDropDown.insertAdjacentHTML(
        //       "afterbegin",
        //       `
        //       <option value="${current.spools[i][toolsArray[i]].spoolId}">${
        //         current.spools[i][toolsArray[i]].spoolName
        //       }</option>
        //   `
        //     );
        //     currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
        //   }
        // } else {
        //   currentToolDropDown.value = 0;
        // }
      }

      viewTable.insertAdjacentHTML(
        "beforeend",
        `
        <tr style="background-color:#303030;">
        <td>
        Totals
        </td>
        <td>
        ${current.totalVolume.toFixed(2)}m3
        </td>
        <td>
        ${(current.totalLength / 1000).toFixed(2)}m
        </td>
        <td>
        ${current.totalWeight.toFixed(2)}g
        </td>
        <td>
        ${current.spoolCost}
        </td>
        </tr>
      `
      );
    }
  }

  static async updateCost(id) {
    const split = id.split("-");
    const update = {
      id: split[1]
    };
    let post = await OctoFarmClient.post("history/updateCostMatch", update);
    if (post) {
      UI.createAlert(
        "success",
        "Successfully added your printers cost to history.",
        3000,
        "clicked"
      );
    } else {
      UI.createAlert(
        "warning",
        "Printer no longer exists in database, default cost applied.",
        3000,
        "clicked"
      );
    }
  }

  static async save(id) {
    const filamentDrops = findBigFilamentDropDowns()
    const filamentID = [];
    filamentDrops.forEach((drop) => {
      filamentID.push(drop.value);
    });
    const split = id.split("-");
    const update = {
      id: split[1],
      note: document.getElementById("notes").value,
      filamentId: filamentID
    };

    const post = await OctoFarmClient.post("history/update", update);

    if (post) {
      UI.createAlert("success", "Successfully updated your history entry...", 3000, "clicked");
    }
  }

  static async delete(e) {
    if (e.target.classList.value.includes("historyDelete")) {
      bootbox.confirm({
        message: "Are you sure you'd like to delete this entry? this is not reversible.",
        buttons: {
          confirm: {
            label: "Yes",
            className: "btn-success"
          },
          cancel: {
            label: "No",
            className: "btn-danger"
          }
        },
        async callback(result) {
          if (result) {
            const split = e.target.id.split("-");
            const histID = {
              id: split[1]
            };
            const post = await OctoFarmClient.post("history/delete", histID);
            if (post) {
              e.target.parentElement.parentElement.remove();
              UI.createAlert("success", "Your history entry has been deleted...", 3000, "clicked");
            } else {
              UI.createAlert(
                "error",
                "Hmmmm seems we couldn't contact the server to delete... is it online?",
                3000,
                "clicked"
              );
            }
          }
        }
      });
    }
  }

  static updateTotals(history) {
    const statesCancelled = [];
    const statesFailed = [];
    const statesSuccess = [];
    const printTimeTotal = [];
    const filamentUsageGrams = [];
    const filamentUsageLength = [];
    const filamentCost = [];
    const printerCostTotal = [];
    const fullCostTotal = [];
    const costPerHour = [];

    history.forEach((record) => {
      if (record.state.includes("Success")) {
        statesSuccess.push(1);
      } else if (record.state.includes("Cancelled")) {
        statesCancelled.push(1);
      } else {
        statesFailed.push(1);
      }

      printTimeTotal.push(parseInt(record.printTime));
      filamentUsageGrams.push(parseInt(record.totalWeight));
      filamentUsageLength.push(parseInt(record.totalLength));
      filamentCost.push(parseInt(record.spoolCost));
      printerCostTotal.push(parseInt(record.printerCost));
      fullCostTotal.push(parseInt(record.totalCost));
      costPerHour.push(parseInt(record.costPerHour));
    });

    const totalHourCost = costPerHour.reduce((a, b) => a + b, 0);

    const avgHourCost = totalHourCost / costPerHour.length;

    const total = statesCancelled.length + statesFailed.length + statesSuccess.length;
    const cancelledPercent = (statesCancelled.length / total) * 100;
    const failurePercent = (statesFailed.length / total) * 100;
    const successPercent = (statesSuccess.length / total) * 100;
    const failure = document.getElementById("totalFailurePercent");
    failure.style.width = `${failurePercent.toFixed(2)}%`;
    failure.innerHTML = `${failurePercent.toFixed(2)}%`;
    const success = document.getElementById("totalSuccessPercent");
    success.style.width = `${successPercent.toFixed(2)}%`;
    success.innerHTML = `${successPercent.toFixed(2)}%`;
    const cancelled = document.getElementById("totalCancelledPercent");
    cancelled.style.width = `${cancelledPercent.toFixed(2)}%`;
    cancelled.innerHTML = `${cancelledPercent.toFixed(2)}%`;

    ELEMENTS.printTimeTotal.innerHTML = Calc.generateTime(
      printTimeTotal.reduce((a, b) => a + b, 0)
    );
    ELEMENTS.filamentUsageTotal.innerHTML = `${filamentUsageLength
      .reduce((a, b) => a + b, 0)
      .toFixed(2)}m / ${filamentUsageGrams.reduce((a, b) => a + b, 0).toFixed(2)}g`;
    ELEMENTS.filamentCostTotal.innerHTML = filamentCost.reduce((a, b) => a + b, 0).toFixed(2);
    ELEMENTS.printerCostTotal.innerHTML = printerCostTotal.reduce((a, b) => a + b, 0).toFixed(2);
    ELEMENTS.totalCost.innerHTML = fullCostTotal.reduce((a, b) => a + b, 0).toFixed(2);
    ELEMENTS.averageCostPerHour.innerHTML = avgHourCost.toFixed(2);
  }
}
History.get(1, true);
