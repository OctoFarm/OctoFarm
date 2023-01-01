import UI from "../utils/ui"
import OctoPrintClient from "./octoprint/octoprint-client.service.js";
import OctoFarmClient from "./octofarm-client.service";
import {currentOperationsPrinterPanelTemplate} from "../templates/current-operations/printer-panel";

const warningBackgroundColour = getComputedStyle(document.documentElement).getPropertyValue('--bs-warning-border-subtle')
const successBackgroundColour = getComputedStyle(document.documentElement).getPropertyValue('--bs-success-border-subtle')
const warningBackgroundColourText = getComputedStyle(document.documentElement).getPropertyValue('--bs-warning-text')
const successBackgroundColourText = getComputedStyle(document.documentElement).getPropertyValue('--bs-success-text')
const NO_PRINTS = "Nothing is due to finish";

const resetFile = async function (id) {
  const printer = await OctoFarmClient.getPrinter(id);
  await OctoPrintClient.file(printer, printer.currentJob.filePath, "load");
};
const rePrint = async function (id) {
    const printer = await OctoFarmClient.getPrinter(id);
    await OctoPrintClient.file(printer, printer.currentJob.filePath, "print");
};

const cancelPrint = async function (id) {
    const printer = await OctoFarmClient.getPrinter(id);
    const opts = {
        command: "cancel",
    };
    await OctoPrintClient.jobAction(
        printer,
        opts
    );
};

const currentOperationsPage = window.location.pathname === "/mon/currentOp"

export default function currentOperationsPanelService(
  currentOperations,
  currentOperationsCount
) {
  const currentOperationsPanel = document.getElementById("currentOperationsBody");
  if(!currentOperationsPanel){
      return;
  }
  //


  if(!!currentOperations) {
      currentOperations.forEach((current, index) => {
          // Generate future time
          let currentDate = new Date();
          currentDate = currentDate.getTime();
          const futureDateString = new Date(
              currentDate + current.timeRemaining * 1000
          ).toDateString();
          let futureTimeString = new Date(
              currentDate + current.timeRemaining * 1000
          ).toTimeString();
          futureTimeString = futureTimeString.substring(0, 5);
          const dateComplete = futureDateString + ": " + futureTimeString;
          const finishedPrint = `<button id='currentHarvest-${current.index}' type='button' title="Clear your finished print from current operations" class='tag btn btn-success btn-sm mt-0 pt-0 pb-0'>Print Harvested?</button>`;
          const restartPrint = `<button id='restartCurrentPrint-${current.index}' type='button' title="Restart your current selected print" class='tag btn btn-warning btn-sm mt-0 pt-0 pb-0'>Restart Print</button>`;
          let fileName = null;
          if (typeof current.fileName !== undefined) {
              fileName = current.fileName.replace(".gcode", "");
              if (fileName.length > 40) {
                  fileName = fileName.substring(0, 40) + "..."
              }
          }

          // check if exists, create if not....
          if (!!document.getElementById(`co-card-${current.index}`)) {
              // if (current.progress === 100) {
              //     document
              //         .getElementById("finishedPrint-" + current.index)
              //         .classList.remove("d-none");
              //     document
              //         .getElementById("futureDate-" + current.index)
              //         .classList.add("d-none");
              //     document
              //         .getElementById("currentRestart-" + current.index)
              //         .classList.remove("d-none");
              //     document
              //         .getElementById("currentTime-" + current.index)
              //         .classList.add("d-none");
              //     document
              //         .getElementById("currentProgressMain-" + current.index)
              //         .classList.add("d-none");
              // } else {
              //     document
              //         .getElementById("finishedPrint-" + current.index)
              //         .classList.add("d-none");
              //     document
              //         .getElementById("futureDate-" + current.index)
              //         .classList.remove("d-none");
              //     document
              //         .getElementById("currentRestart-" + current.index)
              //         .classList.add("d-none");
              //     document
              //         .getElementById("currentTime-" + current.index)
              //         .classList.remove("d-none");
              //     document
              //         .getElementById("currentProgressMain-" + current.index)
              //         .classList.remove("d-none");
              // }
              // const progress = document.getElementById(
              //     "currentProgress-" + current.index
              // );
              // document.getElementById("currentOpFile-"+current.index).innerHTML = fileName
              // document.getElementById("currentTime-" + current.index).innerHTML =
              //     Calc.generateTime(current.timeRemaining);
              // document.getElementById("futureDate-" + current.index).innerHTML = dateComplete
              // progress.style = `width: ${current.progress}%`;
              // progress.innerHTML = current.progress + "%";
              // progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
          } else {
              let cardClass = "card card-block text-white bg-secondary d-inline-block  text-truncate";
              let cardStyle = "min-width: 200px; max-width: 200px;";
              if(currentOperationsPage){
                  cardClass = "col-sm-12 col-md-4 col-lg-3 col-xl-2 card card-block text-white bg-secondary d-inline-block  text-truncate";
                  cardStyle = "";
              }

              document.getElementById("currentOperationsBody").insertAdjacentHTML(
                  "beforeend",
                  `
                    ${currentOperationsPrinterPanelTemplate({id: current.index})}
                `
              );

              // <div id="coCard-${current.index}"
              //      className="${cardClass}"
              //      style="${cardStyle}"
              // >
              //     <div className="card-header pb-1 pt-1 pl-2 pr-2">
              //         ${current.name}</div>
              //     <div className="card-body  pb-0 pt-2 pl-2 pr-2">
              //         <h6 id="currentOpFile-${
              //         current.index
              //     }" className="pb-0 text-center" style="font-size:0.6rem;"> ${fileName} </h6>
              //         <h6 id="currentRestart-${
              //         current.index
              //     }" className="pb-0 text-center d-none" style="font-size:0.6rem;">${restartPrint}</h6>
              //         <h6 id="currentTime-${
              //         current.index
              //     }" className="pb-0 text-center" style="font-size:0.6rem;">${Calc.generateTime(
              //             current.timeRemaining
              //         )}</h6>
              //         <h6 id="futureDate-${
              //         current.index
              //     }" className="pb-0 text-center" style="font-size:0.6rem;"> ${dateComplete} </h6>
              //         <h6 id="finishedPrint-${
              //         current.index
              //     }" className="pb-0 text-center d-none" style="font-size:0.6rem;"> ${finishedPrint} </h6>
              //         <div id="currentProgressMain-${
              //         current.index
              //     }" className="progress">
              //             <div id="currentProgress-${current.index}"
              //                  className="progress-bar progress-bar-striped bg-${
              //         current.progressColour
              //     }"
              //                  role="progressbar"
              //                  style="width: ${current.progress}%"
              //                  aria-valuenow="${current.progress}"
              //                  aria-valuemin="0"
              //                  aria-valuemax="100"
              //             >
              //                 ${current.progress}%
              //             </div>
              //         </div>
              //     </div>
              // </div>/
              // document
              //     .getElementById("currentHarvest-" + current.index)
              //     .addEventListener("click", async () => {
              //         await resetFile(current.index);
              //     });
              // document
              //     .getElementById("restartCurrentPrint-" + current.index)
              //     .addEventListener("click", async () => {
              //         await rePrint(current.index);
              //     });
          }

          document.getElementById("co-card-" + current.index).style.order =
              index;
      });


  }

}

const updateGlobalElements = (activeCount, completeCount) => {
    const activePrintElement = document.getElementById("co-active-print-count");
    UI.doesElementNeedUpdating(activeCount, activePrintElement, "innerHTML");
    const completePrintElement = document.getElementById("co-complete-print-count");
    UI.doesElementNeedUpdating(completeCount, completePrintElement, "innerHTML");
}

export const updateCurrentOperationsState = async (currentOperations) => {
    // Guard against running on a page where the element doesn't exist
    const currentOperationsPanel = document.getElementById("currentOperationsBody");
    if(!currentOperationsPanel){
        return;
    }

    for(const op of currentOperations){
        if(!!document.getElementById(`co-card-${op.id}`)){
            updatePrinterState(op);
            updateButtonState(op);
        }else{
            drawMissingPrinter(op);
            addPrinterButtonListeners(op);
        }
    }

    updateGlobalElements(currentOperations.filter(e => e.progressColour === "warning").length, currentOperations.filter(e => e.progressColour === "success").length);
    cleanUpCards(currentOperations)
    calculateStatisticPanel(currentOperations)
}
const drawMissingPrinter = (op) => {
    document.getElementById("currentOperationsBody").insertAdjacentHTML(
        "beforeend",
        `${currentOperationsPrinterPanelTemplate(op)}`
    );
}

const updateButtonState = ({ id, progressColour }) => {
    const harvestPrintBtn = document.getElementById(`co-harvest-print-${id}`)
    const restartPrintBtn = document.getElementById(`co-restart-print-${id}`)
    const cancelPrintBtn = document.getElementById(`co-cancel-print-${id}`)

    if(progressColour === "warning"){
        UI.doesElementNeedUpdating(true, restartPrintBtn, "disabled")
        UI.doesElementNeedUpdating(true, harvestPrintBtn, "disabled")
        UI.doesElementNeedUpdating(false, cancelPrintBtn, "disabled")
    }else{
        UI.doesElementNeedUpdating(false, restartPrintBtn, "disabled")
        UI.doesElementNeedUpdating(false, harvestPrintBtn, "disabled")
        UI.doesElementNeedUpdating(true, cancelPrintBtn, "disabled")
    }
}

const updatePrinterState = ({id, timeRemaining, name, fileName, progressColour, progress}) => {
    const timeStringElement = document.getElementById(`co-time-remaining-${id}`)
    const nameElement = document.getElementById(`co-printer-name-${id}`)
    const fileNameElement = document.getElementById(`co-file-name-${id}`)
    const stateElement = document.getElementById(`co-print-state-${id}`);
    const stateElementIcon = document.getElementById(`co-icon-state-${id}`);
    const progressElement = document.getElementById(`co-progress-${id}`)

    const finishTime = calculateFinishTimeString({timeRemaining, progress});
    UI.doesElementNeedUpdating(finishTime, timeStringElement, "innerHTML");

    UI.doesElementNeedUpdating(name, nameElement, "innerHTML")
    UI.doesElementNeedUpdating(fileName, fileNameElement, "innerHTML");


    if(progressColour === "warning"){
        stateElement.style.fill = warningBackgroundColour;
        stateElementIcon.style.fill = warningBackgroundColourText;
        return;
    }
    stateElement.style.fill = successBackgroundColour;
    stateElementIcon.style.fill = successBackgroundColourText;
}

const daysTill = ({timeRemaining}) => {
    let currentDate = new Date();
    currentDate = currentDate.getTime();
    const futureDate = new Date(
        currentDate + timeRemaining * 1000
    )
    // TODO move this to a time util and re-use across the interface
    const difference = currentDate - futureDate.getTime()
    // miliseconds difference / ms convert * 1 hour in ms * 1 day in hours
    return Math.ceil(difference / (1000 * 3600 * 24));
}

const getTimeOfFinish = ({timeRemaining}) => {
    let currentDate = new Date();
    currentDate = currentDate.getTime();
    const futureDate = new Date(
        currentDate + timeRemaining * 1000
    )
    return futureDate.toLocaleTimeString().substring(0, futureDate.toLocaleTimeString().length - 3);;
}

const calculateFinishTimeString = ({timeRemaining, progress}) => {
    if(progress === 100){
        return "Print finished..."
    }

    let currentDate = new Date();
    currentDate = currentDate.getTime();
    const futureDate = new Date(
        currentDate + timeRemaining * 1000
    )
    // TODO move this to a time util and re-use across the interface
    const totalDays = daysTill({timeRemaining});
    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    let returnTimeString = ""
    const formattedTime = getTimeOfFinish({timeRemaining});
    if(totalDays < 1){
        returnTimeString = "Today @ " + formattedTime;
    }else if(totalDays > 1 && totalDays < 2){
        returnTimeString = "Tomorrow @ " + formattedTime;
    }else if(totalDays >= 2 && totalDays <= 7){
        returnTimeString = weekday[futureDate.getDay()] + " @ " + formattedTime;
    }else {
        returnTimeString = "A really long time..."
    }
    return returnTimeString
}

const addPrinterButtonListeners = ({id}) => {
    document.getElementById(`co-harvest-print-${id}`).addEventListener("click", async () => {
        await resetFile(id)
    })
    document.getElementById(`co-restart-print-${id}`).addEventListener("click", async () => {
        await rePrint(id)
    })
    document.getElementById(`co-cancel-print-${id}`).addEventListener("click", async () => {
        await cancelPrint(id)
    })
}

const calculateStatisticPanel = (currentOperations) => {
    const finishTodayList = currentOperations.filter((op) => {
        const days = daysTill(op);
        return days <= 1;
    })
    const finishTomorrowList = currentOperations.filter((op) => {
        const days = daysTill(op);
        return days > 1 && days <= 2;
    })

    drawStatistics(finishTodayList, finishTomorrowList)
}

const createStatisticsRow = (stat) => {
    return `<div style="width: 100%; font-size:11px;"> ${calculateFinishTimeString(stat)} | ${stat.name}: ${stat.fileName} </div>`
}

const drawTomorrowStats = (tomorrow) => {
    let tomorrowElements = "";
    for (const stat of tomorrow) {
        tomorrowElements += createStatisticsRow(stat)
    }
    if(tomorrow.length < 1) {
        tomorrowElements = NO_PRINTS;
        document.getElementById("co-finish-tomorrow-list").innerHTML = tomorrowElements;
        return;
    };
    document.getElementById("co-finish-tomorrow-list").innerHTML = tomorrowElements;
    const tomorrowTime = tomorrow.reduce((a, b) => (a.timeRemaining > b.timeRemaining ? a : b))
    document.getElementById("co-latest-finish-time-tomorrow").innerHTML = `@ ${calculateFinishTimeString(tomorrowTime).replace("Today @", "")}`;
}

const drawTodayStats = (today) => {
    let todayElements = "";
    for (const stat of today) {
        todayElements += createStatisticsRow(stat)
    }
    if(today.length < 1) {
        todayElements = NO_PRINTS;
        document.getElementById("co-finish-today-list").innerHTML = todayElements;
        return;
    };
    document.getElementById("co-finish-today-list").innerHTML = todayElements;
    const latestTime = today.reduce((a, b) => (a.timeRemaining > b.timeRemaining ? a : b))
    document.getElementById("co-latest-finish-time-today").innerHTML = `@ ${calculateFinishTimeString(latestTime).replace("Today @", "")}`;
}


const drawStatistics = (today, tomorrow) => {
    drawTodayStats(today);
    drawTomorrowStats(tomorrow);
}

const cleanUpCards = (currentOperations) => {
    // Nothing in current operations remove all cards
    const currentCards = document.querySelectorAll("[id^='co-card-']");
    if (!currentOperations || currentOperations.length === 0) {
      currentCards.forEach((card) => {
        card.remove();
      });
    }
    // Compare screen current operations to server current operations
    // Remove values that don't exist
    const curr = [];
    currentOperations.forEach((cur) => {
        curr.push(cur.id);
    });
    const cards = [];
    currentCards.forEach((card) => {
        const ca = card.id.split("-");
        cards.push(ca[2]);
    });
    const remove = _.difference(cards, curr);
    remove.forEach((rem) => {
        document.getElementById("co-card-" + rem).remove();
    });
}