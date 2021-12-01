import Calc from "./lib/functions/calc.js";
import UI from "./lib/functions/ui.js";
import { returnDropDown } from "./services/filament-manager-plugin.service";
import * as ApexCharts from "apexcharts";
import OctoFarmClient from "./services/octofarm-client.service";
import { ELEMENTS, HISTORY_CONSTANTS, SORT_CONSTANTS } from "./constants/history.constants";
import {
  returnHistoryPagination,
  returnHistoryTableRow,
  returnHistoryFilterDefaultSelected
} from "./pages/history/history.templates";
import { getFirstDayOfLastMonth } from "./utils/date.utils";
import Litepicker from "litepicker";

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

class History {
  static historyGraph;
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
        console.log(e.target.id);
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
        await this.get(undefined, true);
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
    }
    if (forceFilterRedraw) {
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
      const currentRate =
        (stat.statistics.totalSuccessPrintTimes * 100) / stat.statistics.totalPrintTime;
      if (isNaN(currentRate)) {
        return 0;
      } else {
        return parseFloat(currentRate.toFixed(0));
      }
    });
    let failureRateList = statistics.map((stat) => {
      const currentRate = (stat.statistics.currentFailed * 100) / stat.statistics.totalPrintTime;
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
      series: [],
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
    const topPrinterPerMonth = document.getElementById("monthlyMostUtilisedPrinter");
    topPrinterPerMonth.innerHTML = "";
    printerLists.forEach((item) => {
      if (item?.data) {
        topPrinterPerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="bg-dark col-lg-1 text-truncate">${
          item.month
        }</small><small class="bg-dark col-lg-4 text-truncate">${
            item.data[0].printerName
          }</small><small class="text-center bg-primary col-lg-2">${Calc.generateTime(
            item.data[0].time
          )}</small><small class="bg-info col-lg-2 text-center">Prints: ${
            item.data[0].prints
          }</small><small class="bg-success col-lg-1 text-center">${
            item.data[0].successCount
          } </small><small class="bg-warning text-dark col-lg-1 text-center">${
            item.data[0].cancelledCount
          }</small><small class="bg-danger col-lg-1 text-center">${
            item.data[0].failedCount
          }</small> </li>
      `
        );
      } else {
        topPrinterPerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="bg-dark col-lg-1 text-truncate">${item.month}</small><small class="bg-dark col-lg-4 text-truncate"></small><small class="text-center bg-primary col-lg-2"></small><small class="bg-info col-lg-2 text-center">Prints: </small><small class="bg-success col-lg-1 text-center"> </small><small class="bg-warning text-dark col-lg-1 text-center"></small><small class="bg-danger col-lg-1 text-center"></small> </li>
      `
        );
      }
    });
    let fileLists = statistics.map((stat) => {
      return { month: stat.month, data: stat.statistics.sortedTopFilesList };
    });
    const topFilePerMonth = document.getElementById("monthlyMostPrintedFile");
    topFilePerMonth.innerHTML = "";
    fileLists.forEach((item) => {
      if (item?.data) {
        topFilePerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="bg-dark col-lg-1 text-truncate">${
          item.month
        }</small><small class="bg-dark col-lg-6 text-truncate">${item.data[0].file.replace(
            ".gcode",
            ""
          )}</small><small class="text-center bg-info col-lg-2">Prints: ${
            item.data[0].prints
          } </small><small class="bg-success text-center col-lg-1">${
            item.data[0].successCount
          } </small><small class="bg-warning text-dark text-center col-lg-1">${
            item.data[0].cancelledCount
          }</small><small class="bg-danger col-lg-1 text-center">${
            item.data[0].failedCount
          }</small> </li>
      `
        );
      } else {
        topFilePerMonth.insertAdjacentHTML(
          "beforeend",
          `
        <li class="list-group-item list-group-item-action m-0 p-0 row d-flex"><small class="bg-dark col-lg-1 text-truncate">${item.month}</small><small class="bg-dark col-lg-6 text-truncate"></small><small class="text-center bg-info col-lg-2">Prints:  </small><small class="bg-success text-center col-lg-1"></small><small class="bg-warning text-dark text-center col-lg-1"></small><small class="bg-danger col-lg-1 text-center"></small> </li>
      `
        );
      }
    });

    let successCountList = statistics.map((stat) => {
      if (isNaN(stat.statistics.completed)) {
        return 0;
      } else {
        return parseInt(stat.statistics.completed);
      }
    });
    let failedCountList = statistics.map((stat) => {
      if (isNaN(stat.statistics.failed)) {
        return 0;
      } else {
        return parseInt(stat.statistics.failed);
      }
    });
    let cancelledCountList = statistics.map((stat) => {
      if (isNaN(stat.statistics.cancelled)) {
        return 0;
      } else {
        return parseInt(stat.statistics.cancelled);
      }
    });

    let totalPrintList = statistics.map((stat) => {
      if (isNaN(stat.statistics.cancelled + stat.statistics.failed + stat.statistics.completed)) {
        return 0;
      } else {
        return parseInt(
          stat.statistics.cancelled + stat.statistics.failed + stat.statistics.completed
        );
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
          max: Math.max(...successCountList) + Math.max(...totalPrintList),
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
      { name: "Total Count", data: totalPrintList }
    ]);

    const options1 = {
      series: [
        {
          data: totalPrintList
        }
      ],
      chart: {
        type: "line",
        width: "100%",
        height: 85,
        sparkline: {
          enabled: true
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },

      theme: {
        mode: "dark"
      },
      noData: {
        text: "Loading..."
      },
      colors: ["#3498db"],
      tooltip: {
        fixed: {
          enabled: false
        },
        x: {
          show: true,
          formatter: function (value) {
            return monthArray[value - 1]; // The formatter function overrides format property
          }
        },
        y: {
          title: {
            formatter: (seriesName) => "Total: "
          }
        },
        marker: {
          show: false
        }
      }
    };

    if (!this?.totalSpark) {
      this.totalSpark = new ApexCharts(document.querySelector("#totalSpark"), options1);
      this.totalSpark.render();
    }

    document.getElementById("totalSparkLast").innerHTML = totalPrintList[totalPrintList.length - 1];

    options1.colors = ["#00bc8c"];
    options1.series[0].data = successCountList;
    options1.tooltip.y.title.formatter = (seriesName) => "Success: ";
    if (!this?.completeSpark) {
      this.completeSpark = new ApexCharts(document.querySelector("#successSpark"), options1);
      this.completeSpark.render();
    }

    document.getElementById("successSparkLast").innerHTML =
      successCountList[successCountList.length - 1];

    options1.colors = ["#f39c12"];
    options1.series[0].data = cancelledCountList;
    options1.tooltip.y.title.formatter = (seriesName) => "Cancelled: ";
    if (!this?.cancelledSpark) {
      this.cancelledSpark = new ApexCharts(document.querySelector("#cancelledSpark"), options1);
      this.cancelledSpark.render();
    }

    document.getElementById("cancelledSparkLast").innerHTML =
      cancelledCountList[cancelledCountList.length - 1];

    options1.colors = ["#e74c3c"];
    options1.series[0].data = failedCountList;
    options1.tooltip.y.title.formatter = (seriesName) => "Failed: ";
    if (!this?.failedSpark) {
      this.failedSpark = new ApexCharts(document.querySelector("#failedSpark"), options1);
      this.failedSpark.render();
    }

    document.getElementById("failedSparkLast").innerHTML =
      failedCountList[failedCountList.length - 1];
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

    if (ELEMENTS.fileSearch.value !== "Filter") {
      url += "&fileSearch=" + ELEMENTS.fileSearch.value.replace(/ /g, "-");
    }

    if (ELEMENTS.spoolSearch.value !== "Filter") {
      url += "&spoolSearch=" + ELEMENTS.spoolSearch.value.replace(/ /g, "-");
    }

    return url;
  }
  static async get(pageNumber = 1, forceFilterRedraw = false) {
    const { history, statisticsClean, pagination, monthlyStatistics, historyFilterData } =
      await OctoFarmClient.get(this.getHistoryRequestURL(pageNumber));

    console.log(history, statisticsClean, pagination, monthlyStatistics, historyFilterData);

    if (!history || !statisticsClean || !pagination) {
      this.loadNoData();
      return;
    }

    // TODO: Load statistics EJS renders currently, want's to be dynamic as well.
    //this.updateStatistics(statisticsClean);

    // Load history filters
    this.drawHistoryFilters(pagination, historyFilterData, forceFilterRedraw);
    this.addHistoryFilterListeners(pagination, forceFilterRedraw);

    // Load history table...
    this.drawHistoryTable(history);
    // TODO: Add Listeners

    // Load monthly statistics
    this.drawMonthlyStatistics(monthlyStatistics);

    //Update totals
    this.updateTotals(history);

    // Load graphs
    let historyGraphData = statisticsClean.historyByDay;
    let historyUsageOverTimeData = statisticsClean.totalOverTime;
    //TODO Move out, same as dashboards

    let yAxisSeries = [];
    historyUsageOverTimeData.forEach((usage, index) => {
      let obj = null;
      if (index === 0) {
        obj = {
          title: {
            text: "Count"
          },
          seriesName: historyUsageOverTimeData[0].name,
          labels: {
            formatter: function (val) {
              if (!!val) {
                return val.toFixed(0);
              }
            }
          }
        };
      } else {
        obj = {
          show: false,
          seriesName: historyUsageOverTimeData[0].name,
          labels: {
            formatter: function (val) {
              if (!!val) {
                return val.toFixed(0);
              }
            }
          }
        };
      }

      yAxisSeries.push(obj);
    });
    const filamentUsageOverTimeChartOptions = {
      chart: {
        type: "bar",
        stacked: true,
        width: "100%",
        height: "200px",
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
          seriesName: "Success",
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
          seriesName: "Success",
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
          seriesName: "Success",
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
        type: "datetime",
        tickAmount: 10,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(timestamp);
            return dae.toLocaleDateString(); // The formatter function overrides format property
          }
        }
      }
    };
    filamentUsageOverTimeChartOptions.yaxis = yAxisSeries;
    if (!this?.competionByDay) {
      this.competionByDay = new ApexCharts(
        document.querySelector("#printCompletionByDay"),
        filamentUsageOverTimeChartOptions
      );
      this.competionByDay.render();
    }

    this.competionByDay.updateSeries(historyGraphData);

    const historyGraphOptions = {
      chart: {
        type: "line",
        width: "100%",
        height: "200px",
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
      series: [],
      yaxis: [
        {
          title: {
            text: "Count"
          },
          seriesName: "Success",
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
          seriesName: "Success",
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
          seriesName: "Success",
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
        type: "datetime",
        tickAmount: 10,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(timestamp);
            return dae.toLocaleDateString(); // The formatter function overrides format property
          }
        }
      }
    };

    if (!this?.overTimeGraph) {
      this.overTimeGraph = new ApexCharts(
        document.querySelector("#printCompletionOverTime"),
        historyGraphOptions
      );
      this.overTimeGraph.render();
    }
    this.overTimeGraph.updateSeries(historyUsageOverTimeData);
  }

  static async edit(e) {
    function SelectHasValue(select, value) {
      const obj = document.getElementById(select);
      if (obj !== null) {
        return obj.innerHTML.indexOf(`value="${value}"`) > -1;
      }
      return false;
    }
    if (e.target.classList.value.includes("historyEdit")) {
      document.getElementById("historySave").insertAdjacentHTML(
        "afterbegin",
        `
      <button id="historyUpdateCostBtn" type="button" class="btn btn-warning" data-dismiss="modal">
        Update Cost
      </button>
      <button id="historySaveBtn" type="button" class="btn btn-success" data-dismiss="modal">
        Save Changes
      </button>
    `
      );
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
      const index = _.findIndex(historyList.history, function (o) {
        return o._id == e.target.id;
      });
      const current = historyList.history[index];
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

      startDate.innerHTML = `<b>Started</b><hr>${current.startDate.replace(" - ", "<br>")}`;
      printTime.innerHTML = `<b>Duration</b><hr>${Calc.generateTime(current.printTime)}`;
      endDate.innerHTML = `<b>Finished</b><hr>${current.endDate.replace(" - ", "<br>")}`;
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
      size.value = Calc.bytes(current.file.size);
      averagePrintTime.value = Calc.generateTime(current.file.averagePrintTime);
      lastPrintTime.value = Calc.generateTime(current.file.lastPrintTime);
      const toolsArray = [];
      current.spools.forEach((spool) => {
        const sp = Object.keys(spool)[0];
        toolsArray.push(sp);
        viewTable.insertAdjacentHTML(
          "beforeend",
          `
          <tr>
            <td>
              <b>${spool[sp].toolName}</b>
              </td>
              <td>
              <div class="input-group mb-3">
                  <select id="filament-${sp}" class="custom-select">
                  </select>
                  </div>
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
      });
      for (let i = 0; i < toolsArray.length; i++) {
        const currentToolDropDown = document.getElementById(`filament-${toolsArray[i]}`);
        const filamentList = await returnDropDown();
        filamentList.forEach((list) => {
          currentToolDropDown.insertAdjacentHTML("beforeend", list);
        });
        if (current.spools[i][toolsArray[i]].spoolId !== null) {
          if (SelectHasValue(currentToolDropDown.id, current.spools[i][toolsArray[i]].spoolId)) {
            currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
          } else {
            currentToolDropDown.insertAdjacentHTML(
              "afterbegin",
              `
              <option value="${current.spools[i][toolsArray[i]].spoolId}">${
                current.spools[i][toolsArray[i]].spoolName
              }</option>
          `
            );
            currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
          }
        } else {
          currentToolDropDown.value = 0;
        }
      }

      viewTable.insertAdjacentHTML(
        "beforeend",
        `
        <tr style="background-color:#303030;">
        <td>
        Totals
        </td>
        <td>

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
    const update = {
      id
    };
    let post = await OctoFarmClient.post("history/updateCostMatch", update);
    if (post) {
      UI.createAlert(
        "success",
        "Successfully added your printers cost to history.",
        3000,
        "clicked"
      );
      document.getElementById(`printerCost-${id}`).innerHTML = Calc.returnPrintCost(
        post.costSettings,
        post.printTime
      );
    } else {
      UI.createAlert(
        "warning",
        "Printer no longer exists in database, default cost applied.",
        3000,
        "clicked"
      );
      document.getElementById(`printerCost-${id}`).innerHTML = Calc.returnPrintCost(
        post.costSettings,
        post.printTime
      );
    }
  }

  static async save(id) {
    const filamentDrops = document.querySelectorAll("[id^='filament-tool']");
    const filamentID = [];
    filamentDrops.forEach((drop) => {
      filamentID.push(drop.value);
    });

    const update = {
      id,
      note: document.getElementById("notes").value,
      filamentId: filamentID
    };

    const post = await OctoFarmClient.post("history/update", update);

    if (post) {
      UI.createAlert("success", "Successfully updated your history entry...", 3000, "clicked");
      document.getElementById(`note-${id}`).innerHTML = update.note;
      document.getElementById(`spool-${id}`).innerHTML = update.filamentId;
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
            const histID = {
              id: e.target.id
            };
            const post = await OctoFarmClient.post("history/delete", histID);
            if (post) {
              e.target.parentElement.parentElement.parentElement.remove();
              // jplist.resetContent(function () {
              //   // remove element with id = el1
              //
              // });
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
