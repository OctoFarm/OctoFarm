import Calc from "../../utils/calc";
import { ChartsManager } from "../charts/charts.manager";
import {
  humidityLabel,
  iaqLabel,
  pressureLabel,
  temperatureLabel,
} from "../charts/chart.utils";

let environmentDataChartExists = false;
let cameraCarouselExists = false;
let cameraInterval = false;

let cameraIndex = -1;
let currentSlidesArray = [];

function advanceCameraItem() {
  ++cameraIndex;
  if (cameraIndex >= currentSlidesArray.length) {
    cameraIndex = 0;
  }
  document.getElementById("cameraCarouselBody").style = `
        height:auto; 
        width: 100%; 
        background-image: url('${encodeURI(currentSlidesArray[cameraIndex])}');
        background-repeat:no-repeat;
        background-size:cover;
        background-position:center;
        `;
}

export class DashUpdate {
  static insertIterable(elementId, data) {
    const element = document.getElementById(elementId);
    element.innerHTML = "";
    for (const dat of data) {
      element.insertAdjacentHTML("beforeend", dat);
    }
  }

  static printerStatus(data) {
    this.insertIterable("currentStatus", data);
  }

  static printerProgress(data) {
    this.insertIterable("currentProgress", data);
  }

  static printerTemps(data) {
    this.insertIterable("currentTemps", data);
  }

  static printerUptime(data) {
    this.insertIterable("currentUptime", data);
  }

  static updateHtml(element, value) {
    document.getElementById(element).innerHTML = value;
  }

  static updateTime(element, value) {
    this.updateHtml(element, Calc.generateTime(value));
  }

  static updateProgress(element, value, rounding = 2) {
    this.updateHtml(element, Calc.perc(value, rounding));
    document.getElementById(element).style.width = Calc.perc(value);
  }

  static updateTemp(element, temp) {
    const fixedTemp = Calc.toFixed(temp);
    this.updateHtml(element, `${fixedTemp} °C`);
  }

  static cameraCarousel(cameraList) {
    if(cameraList.length !== currentSlidesArray.length){
      currentSlidesArray = cameraList;
    }
    if (!cameraCarouselExists) {
      cameraCarouselExists = true;
      if (!cameraInterval) {
        document.getElementById("cameraCarouselBody").style = `
        height:auto; 
        width: 100%; 
        background-image: url('${encodeURI(currentSlidesArray[currentSlidesArray.length-1])}');
        background-repeat:no-repeat;
        background-size:cover;
        background-position:center;
        `;
        cameraInterval = setInterval(() => {
          advanceCameraItem()
        }, 10000)
      }
    }
  }
  static farmInformation(
    {
      averageEstimated: avgEstim,
      averageRemaining: avgRemain,
      averageElapsed: avgElapsed,
      averagePercent: avgPerc,
      averagePercentRemaining: avgPercRemain,
      cumulativePercent: cumPerc,
      cumulativePercentRemaining: cumPercRemain,
      totalElapsed: totElapsed,
      totalEstimated: totEstim,
      totalFarmTemp: totalFTemp,
      totalRemaining: totalRemain,
    },
    heatMap,
    temperatureGraph,
    dashboardSettings
  ) {
    if (dashboardSettings.farmActivity.averageTimes) {
      this.updateTime("avgEstimatedTime", avgEstim);
      this.updateTime("avgRemainingTime", avgRemain);
      this.updateTime("avgElapsedTime", avgElapsed);
      this.updateProgress("avgRemainingProgress", avgPercRemain);
      this.updateProgress("avgElapsed", avgPerc);
    }

    if (dashboardSettings.farmActivity.cumulativeTimes) {
      this.updateTime("cumEstimatedTime", totEstim);
      this.updateTime("cumRemainingTime", totalRemain);
      this.updateTime("cumElapsedTime", totElapsed);
      this.updateProgress("cumRemainingProgress", cumPercRemain);
      this.updateProgress("cumElapsed", cumPerc);
    }

    if (dashboardSettings.historical.hourlyTotalTemperatures) {
      ChartsManager.updateHourlyTotalTemperatureChart(temperatureGraph);
      this.updateTemp("totalTemp", totalFTemp);
    }
    if (dashboardSettings.historical.weeklyUtilisation) {
      ChartsManager.updateWeeklyUtilisationPerDayHeatMapChart(heatMap);
    }
  }

  /**
   * Update the two related charts
   * @param currentStatus
   * @param currentActivity
   * @param settingsActivity
   * @param settingsUtilisation
   */
  static currentStatusAndUtilisation(
    currentStatus,
    currentActivity,
    settingsActivity,
    settingsUtilisation
  ) {
    if (settingsUtilisation) {
      ChartsManager.updateCurrentUtilisation(currentStatus);
    }

    if (settingsActivity) {
      ChartsManager.updateCurrentStatus(currentActivity);
    }
  }

  static farmUtilisation(stats) {
    this.updateTime("activeHours", stats.activeHours / 1000);
    this.updateTime("idleHours", stats.idleHours / 1000);
    this.updateTime("failedHours", stats.failedHours / 1000);
    this.updateTime("offlineHours", stats.offlineHours / 1000);

    this.updateProgress("activeProgress", stats.activeHoursPercent, 0);
    this.updateProgress("idleProgress", stats.idleHoursPercent, 0);
    this.updateProgress("failedProgress", stats.failedHoursPercent, 0);
    this.updateProgress("offlineProgress", stats.offlineHoursPercent, 0);
  }

  static dateAndTime() {
    const currentDate = new Date();
    document.getElementById("timeAndDateBody").innerHTML = `
    <div class="d-flex justify-content-center flex-column align-self-center">
      <h1 class="mb-0 mt-4">${currentDate.toLocaleTimeString()}</h1>
      <h3 class="mb-0 mt-2">${currentDate.toLocaleDateString()}</h3>
    </div>

    `;
  }

  static async environmentalData(datadata) {
    let analyzedLabels = [];
    if (!environmentDataChartExists) {
      for (const data of datadata.length) {
        if (data.data.length !== 0) {
          if (data.name === "Temperature") {
            analyzedLabels.push(temperatureLabel);
          }
          if (data.name === "Humidity") {
            analyzedLabels.push(humidityLabel);
          }
          if (data.name === "Pressure") {
            analyzedLabels.push(pressureLabel);
          }
          if (data.name === "IAQ") {
            analyzedLabels.push(iaqLabel);
          }
        }
      }
      environmentDataChartExists = true;
    }

    if (analyzedLabels.length !== 0) {
      ChartsManager.updateEnvironmentDataChart(data);

      let state = null;
      let impact = "";
      let suggestedActions = "";
      const airQualityElement = document.getElementById(
        "indoorAirQualityAlert"
      );
      if (data[3].data.length > 0) {
        const lastValue = data[3].data[data[3].data.length - 1].y;
        if (airQualityElement.classList.contains("d-none")) {
          airQualityElement.classList.remove("d-none");
        }
        if (Calc.isBetween(lastValue, 0, 50)) {
          state = "<i class=\"fas fa-check-circle textComplete\"></i> Excellent";
          impact = "Pure air; best for well-being";
        }
        if (Calc.isBetween(lastValue, 51, 100)) {
          state = "<i class=\"fas fa-check-circle\"></i> Good";
          impact = "No irritation or impact on well-being";
        }
        if (Calc.isBetween(lastValue, 101, 150)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Lightly Polluted";
          impact = "Reduction of well-being possible";
          suggestedActions = "Ventilation suggested";
        }
        if (Calc.isBetween(lastValue, 151, 200)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Moderately Polluted";
          impact = "More significant irritation possible";
          suggestedActions = "Increase ventilation with clean air";
        }
        if (Calc.isBetween(lastValue, 201, 250)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Heavily Polluted";
          impact =
            "Exposition might lead to effects like headache depending on type of VOCs";
          suggestedActions = "Optimize ventilation";
        }
        if (Calc.isBetween(lastValue, 251, 350)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Severely Polluted";
          impact = "More severe health issue possible if harmful VOC present";
          suggestedActions =
            "Contamination should be identified if level is reached even w/o presence of people; maximize ventilation & reduce attendance";
        }
        if (Calc.isBetween(lastValue, 350, 500)) {
          state =
            "<i class=\"fas fa-exclamation-triangle\"></i>  Extremely Polluted";
          impact = "Headaches, additional neurotoxic effects possible";
          suggestedActions =
            "Contamination needs to be identified; avoid presence in room and maximize ventilation";
        }
        airQualityElement.innerHTML = `Indoor Air Quality: ${lastValue} ${state}`;
        airQualityElement.title = `${impact}: ${suggestedActions}`;
      }
    } else {
      console.debug(
        "No environmental statistics and alerts to render. Environmental History Chart will be empty."
      );
    }
  }
}
