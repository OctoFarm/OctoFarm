import Calc from "../../../utils/calc";
import OctoFarmClient from "../../../services/octofarm-client.service";
import ApexCharts from "apexcharts";

let historyBarChart = null;
let historyPieChart = null;

export default class PrinterStatisticsService {
  static async returnPrinterStatsTemplate(stats) {
    let display = "";
    let noHistoryMessage = "";
    let safeModeCheck = "";

    let printerFirmware = "Unknown";
    let octoPrintVersion = "Unknown";
    let pythonVersion = "Unknown";
    let pythonPip = "Unknown";
    let osPlatform = "Unknown";
    let hardwareCores = "Unknown";
    let hardwareRam = "Unknown";

    printerFirmware = !!stats.printerFirmware;

    if (stats.octoPrintSystemInfo) {
      pythonVersion = stats.octoPrintSystemInfo["env.python.version"];

      pythonPip = stats.octoPrintSystemInfo["env.python.pip"];

      osPlatform = stats.octoPrintSystemInfo["env.os.platform"];

      hardwareCores = stats.octoPrintSystemInfo["env.hardware.cores"];

      hardwareRam = stats.octoPrintSystemInfo["env.hardware.ram"];

      if (stats.octoPrintSystemInfo["octoprint.safe_mode"]) {
        safeModeCheck = `
        <i title="You are not in safe mode, all is fine" class="fas fa-thumbs-down text-success"></i>
      `;
      } else {
        safeModeCheck = `
        <i title=\"Something maybe wrong with your system? Detecting safe mode\" class=\"fas fa-thumbs-up text-success\"></i>
      `;
      }
      if (
        typeof stats?.octoPrintSystemInfo["printer.firmware"] !== "undefined"
      ) {
        printerFirmware = stats.octoPrintSystemInfo["printer.firmware"];
      }
    }
    if (stats.historyByDay.length === 0) {
      noHistoryMessage = `<div class='row'>
                    <div class="col-12"><h5>Sorry but your printer currently has no history captured. Please run some prints to generate information here.</h5></div>
                </div>`;
      display = "d-none";
    }
    return `
            <div class="col-md-12 col-lg-4">
              <div class="card text-white bg-dark mb-3" >
                              <div class="card-header">Information</div>
                              <div class="card-body">
                              <p class="card-text">
                              <div class="row">
                                <div class="col-md-12 col-lg-6">
                                   <small><b>OctoPrint Version:</b> ${octoPrintVersion}</small><br>
                                    <small><b>Printer Firmware:</b> ${printerFirmware}</small><br>
                                    <small><b>Python Version:</b> ${pythonVersion}</small>   <br>     
                                       <small><b>pip Version:</b> ${pythonPip}</small>        <br>                          
                                </div>
                                  <div class="col-md-12 col-lg-6">
                                   <small><b>OS Platform:</b> ${osPlatform}</small><br>
                                   <small><b>OS Cores:</b> ${hardwareCores}</small><br>
                                    <small><b>OS ram:</b> ${Calc.bytes(
                                      hardwareRam
                                    )}</small><br>
                                     <small><b>Safe Mode Check:</b> ${safeModeCheck} </small><br>
                                </div>
                              </div>
     
                                </p>
                </div>
              </div>
            </div>
            <div class="col-md-12 col-lg-4">
              <div class="card text-white bg-dark mb-3" >
                              <div class="card-header">Utilisation</div>
                              <div class="card-body">
                                <div class='card-text' id='printerUtilisationGraph'></div>
                </div>
              </div>
            </div>
            <div class="col-md-12 col-lg-4">
                <div class="card text-white bg-dark mb-3">
                              <div class="card-header">Printer Issues</div>
                           
                              <div class="card-body">
                                  <div class="row">
                                        <div class="col-6">
                                                    
                              <p class="card-text">
                                <span><i class="fas fa-square text-success"></i> <b>Todays Errors</b> <br> ${
                                  stats.printErrorDay
                                } </span>
                                <br>
                                <span><i class="fas fa-square text-secondary"></i> <b>Previous Weeks Errors</b> <br> ${
                                  stats.printerErrorWeek
                                }</span>
                                <br>
                                <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Total Errors</b><br> ${
                                  stats.printErrorTotal
                                }</span>
                                </p>
                                        </div>
                                        <div class="col-6">
                                                
                                      <p class="card-text">
                                        <span><i class="fas fa-square text-success"></i> <b>Todays Resends % </b> <br> ${
                                          stats.printerResendRatioDaily
                                        } </span>
                                        <br>
                                        <span><i class="fas fa-square text-secondary"></i> <b>Previous Weeks Resends %</b> <br> ${
                                          stats.printerResendRatioWeekly
                                        }</span>
                                        <br>
                                        <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Total Resends %</b><br> ${
                                          stats.printerResendRatioTotal
                                        }</span>
                                        </p>
                                        </div>
                                  </div>
                          
                </div>
              </div>
            </div>

            <div class="col-md-6 col-lg-3">
              <div class="card text-white bg-dark mb-3">
                <div class="card-header">Age</div>
                <div class="card-body">
                  <p class="card-text">${Calc.generateTime(
                    stats.timeTotal / 1000
                  )}</p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
              <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Cost</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.printerCostTotal
                  )}</p>
                </div>
              </div>

            
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Filament Usage (g)</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.filamentUsedWeightTotal
                  )}</p>
                </div>
              </div>

            </div>
            <div class="col-md-6 col-lg-3">
                               <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Total Filament Usage (m)</div>
                <div class="card-body">
                  <p class="card-text">                ${Calc.generateCost(
                    stats.filamentUsedLengthTotal
                  )}</p>
                </div>
              </div>
            </div>
            <div class="col-12">
                ${noHistoryMessage}
                <div class="${display}" id='historyGraph'></div>
            </div>
            <div class="col-md-6 col-lg-3">
            
              <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Printer Usage</div>
                <div class="card-body">
                  <p class="card-text">    <span><i class="fas fa-square text-success"></i> <b>Active Hours </b> <br> ${Calc.generateTime(
                    stats.activeTimeTotal / 1000
                  )}</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Idle Hours </b> <br> ${Calc.generateTime(
                stats.idleTimeTotal / 1000
              )}</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Offline Hours </b><br> ${Calc.generateTime(
                stats.offlineTimeTotal / 1000
              )}</span></p>
                </div>
              </div>
            
         
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals for Today</div>
                <div class="card-body">
                  <p class="card-text">    <span><i class="fas fa-square text-success"></i> <b>Successful</b> <br> ${
                    stats.printSuccessDay
                  }</span>
              <br>
              <span><i class="fas fa-square text-secondary"></i> <b>Cancelled</b> <br> ${
                stats.printCancelDay
              }</span>
              <br>
              <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed</b><br> ${
                stats.printErrorDay
              }</span>
            </p>
                </div>
              </div>
            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals for Last Seven Days</div>
                <div class="card-body">
                  <p class="card-text"> 
                 <span><i class="fas fa-square text-success"></i> <b>Successful </b> <br> ${
                   stats.printerSuccessWeek
                 }</span>

                        <br>
                        <span><i class="fas fa-square text-secondary"></i> <b>Cancelled </b> <br> ${
                          stats.printerCancelWeek
                        }</span>
                        <br>
                        <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed </b><br> ${
                          stats.printerErrorWeek
                        }</span>
            
                  </p>
                </div>
              </div>

            </div>
            <div class="col-md-6 col-lg-3">
                          <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Print Totals All Time</div>
                <div class="card-body">
                  <p class="card-text">  
                                 <span><i class="fas fa-square text-success"></i> <b>Successful</b> <br> ${
                                   stats.printSuccessTotal
                                 }</span>
                <br>
                <span><i class="fas fa-square text-secondary"></i> <b>Cancelled</b> <br> ${
                  stats.printCancelTotal
                }</span>
                <br>
                <span class="pb-4"><i class="fas fa-square text-danger"></i> <b>Failed</b><br> ${
                  stats.printErrorTotal
                }</span>
                        
                   </p>
                </div>
              </div>


            </div>
    
            <div class="col-md-6 col-lg-3">

            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
              <div class="card-header">Filament Usage Today</div>
              <div class="card-body">
                    <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostDay
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentLengthDay
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentWeightDay
                      )}</span>g
                              
                         </p>
              </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
              <div class="card-header">Filament Usage Last Seven Days</div>
              <div class="card-body">
                                    <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostWeek
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentLengthWeek
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentWeightWeek
                      )}</span>g
                              
                         </p>
              </div>
            </div>
            </div>
            <div class="col-md-6 col-lg-3">
            <div class="card text-white bg-dark mb-3" >
                <div class="card-header">Filament Usage All Time</div>
                <div class="card-body">
                                      <p class="card-text">  
                        <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Cost </b> <br> ${Calc.generateCost(
                          stats.filamentCostTotal
                        )}</span>
                      <br>
                      <span><i class="fas fa-toilet-paper text-secondary"></i> <b>Length </b> <br> ${Calc.generateCost(
                        stats.filamentUsedLengthTotal
                      )}</span>m
                      <br>
                      <span class="pb-4"><i class="fas fa-toilet-paper text-secondary"></i> <b>Weight </b><br> ${Calc.generateCost(
                        stats.filamentUsedWeightTotal
                      )}</span>g
                              
                         </p>
                </div>
              </div>
     
            </div>
    `;
  }
  static async loadStatistics(id) {
    historyBarChart = null;
    historyPieChart = null;
    let get = await OctoFarmClient.get("history/statistics/" + id);
    //Setup page
    let printerStatsWrapper = document.getElementById("printerStatistics");
    printerStatsWrapper.innerHTML = "";
    printerStatsWrapper.innerHTML = await this.returnPrinterStatsTemplate(get);
    document.getElementById("printerStatisticsTitle").innerHTML =
      "Printer Statistics: " + get.printerName;
    //Check if graph is on DOM...
    const printerHistoryOptions = {
      chart: {
        type: "bar",
        width: "100%",
        height: "250px",
        stacked: true,
        stroke: {
          show: true,
          curve: "smooth",
          lineCap: "butt",
          width: 1,
          dashArray: 0,
        },
        animations: {
          enabled: true,
        },
        plotOptions: {
          bar: {
            horizontal: false,
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
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9,
        },
        formatter: function (val, opts) {
          if (val !== null) {
            return val.toFixed(0) + "g";
          }
        },
      },
      colors: [
        "#00bc8c",
        "#f39c12",
        "#e74c3c",
        "#88ff00",
        "#00ff88",
        "#00b7ff",
        "#4400ff",
        "#8000ff",
        "#ff00f2",
      ],
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
            text: "Count",
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            },
          },
        },
        {
          title: {
            text: "Count",
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            },
          },
          show: false,
        },
        {
          title: {
            text: "Count",
          },
          seriesName: "Success",
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0);
              }
            },
          },
          show: false,
        },
      ],
      xaxis: {
        type: "datetime",
        tickAmount: 10,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(timestamp);
            return dae.toLocaleDateString(); // The formatter function overrides format property
          },
        },
      },
    };
    if (historyBarChart !== null) {
      historyBarChart.destroy();
      historyBarChart = new ApexCharts(
        document.querySelector("#historyGraph"),
        printerHistoryOptions
      );
      historyBarChart.render();
      historyBarChart.updateSeries(get.historyByDay);
    } else {
      historyBarChart = new ApexCharts(
        document.querySelector("#historyGraph"),
        printerHistoryOptions
      );
    }
    const optionsUtilisation = {
      chart: {
        type: "donut",
        width: "100%",
        height: "100%",
        animations: {
          enabled: true,
        },
        background: "#303030",
      },
      theme: {
        mode: "dark",
      },
      plotOptions: {
        pie: {
          expandOnClick: false,
          dataLabels: {
            offset: 10,
            minAngleToShowLabel: 15,
          },
        },
      },
      stroke: {
        show: false,
      },
      tooltip: {
        y: {
          formatter(val) {
            return `${Math.round(val * 10) / 10}%`;
          },
        },
      },
      noData: {
        text: "Loading...",
      },
      dataLabels: {
        enabled: false,
      },
      series: [],
      labels: ["Active", "Idle", "Offline"],
      colors: ["#00bc8c", "#444", "#e74c3c"],
      legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: "bottom",
        horizontalAlign: "center",
        floating: false,
        fontSize: "11px",
        fontFamily: "Helvetica, Arial",
        fontWeight: 400,
        formatter: undefined,
        inverseOrder: false,
        width: undefined,
        height: undefined,
        tooltipHoverFormatter: undefined,
        offsetX: -25,
        offsetY: 0,
        labels: {
          colors: undefined,
          useSeriesColors: false,
        },
        markers: {
          width: 9,
          height: 9,
          strokeWidth: 0,
          strokeColor: "#fff",
          fillColors: undefined,
          radius: 1,
          customHTML: undefined,
          onClick: undefined,
          offsetX: 0,
          offsetY: 0,
        },
        itemMargin: {
          horizontal: 1,
          vertical: 0,
        },
        onItemClick: {
          toggleDataSeries: false,
        },
        onItemHover: {
          highlightDataSeries: false,
        },
      },
    };
    if (historyPieChart !== null) {
      historyPieChart.destroy();
      historyPieChart = new ApexCharts(
        document.querySelector("#printerUtilisationGraph"),
        optionsUtilisation
      );
      historyPieChart.render();
      historyPieChart.updateSeries(get.printerUtilisation);
    } else {
      historyPieChart = new ApexCharts(
        document.querySelector("#printerUtilisationGraph"),
        optionsUtilisation
      );
    }
    historyPieChart.render();
    historyPieChart.updateSeries(get.printerUtilisation);
    historyBarChart.render();
    historyBarChart.updateSeries(get.historyByDay);
  }
}
