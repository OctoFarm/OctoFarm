import Calc from "../utils/calc.js";
import OctoPrintClient from "./octoprint/octoprint-client.service.js";
import OctoFarmClient from "./octofarm-client.service";

const resetFile = async function (id) {
  const printer = await OctoFarmClient.getPrinter(id);
  await OctoPrintClient.file(printer, printer.currentJob.filePath, "load");
};
const rePrint = async function (id) {
    const printer = await OctoFarmClient.getPrinter(id);
    await OctoPrintClient.file(printer, printer.currentJob.filePath, "print");
};
const currentOperationsSorting = document.getElementById(
  "currentOperationsSort"
);

const currentOperationsPage = window.location.pathname === "/mon/currentOp"


if (currentOperationsSorting) {
  OctoFarmClient.getCurrentOpState()
    .then((res) => {
      // Apply state
      const { currentIterie, currentOrder } = res;
      if (currentIterie === "progress" && currentOrder === "desc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-progress-down").innerHTML;
      }
      if (currentIterie === "progress" && currentOrder === "asc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-progress-up").innerHTML;
      }
      if (currentIterie === "timeRemaining" && currentOrder === "desc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-time-down").innerHTML;
      }
      if (currentIterie === "timeRemaining" && currentOrder === "asc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-time-up").innerHTML;
      }
      if (currentIterie === "fileName" && currentOrder === "desc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-file-down").innerHTML;
      }
      if (currentIterie === "fileName" && currentOrder === "asc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-file-up").innerHTML;
      }
      if (currentIterie === "sortIndex" && currentOrder === "desc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-index-down").innerHTML;
      }
      if (currentIterie === "sortIndex" && currentOrder === "asc") {
        currentOperationsSorting.innerHTML =
          document.getElementById("ci-index-up").innerHTML;
      }
      document
        .getElementById("ci-progress-up")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-progress-up").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "progress",
            order: "asc",
          });
        });
      document
        .getElementById("ci-progress-down")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-progress-down").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "progress",
            order: "desc",
          });
        });
      document
        .getElementById("ci-time-up")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-time-up").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "timeRemaining",
            order: "asc",
          });
        });
      document
        .getElementById("ci-time-down")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-time-down").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "timeRemaining",
            order: "desc",
          });
        });
      document
        .getElementById("ci-file-up")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-file-up").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "fileName",
            order: "asc",
          });
        });
      document
        .getElementById("ci-file-down")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-file-down").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "fileName",
            order: "desc",
          });
        });
      document
        .getElementById("ci-index-up")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-index-up").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "sortIndex",
            order: "asc",
          });
        });
      document
        .getElementById("ci-index-down")
        .addEventListener("click", async () => {
          currentOperationsSorting.innerHTML =
            document.getElementById("ci-index-down").innerHTML;
          await OctoFarmClient.updateCurrentOpState({
            iterie: "sortIndex",
            order: "desc",
          });
        });
    })
    .catch((e) => {
      console.error("Current Operations error!", e.toString())
    });
}

export default function currentOperationsPanelService(
  currentOperations,
  currentOperationsCount
) {
  const currentOperationsPanel = document.getElementById("currentOperationsPanel");
  if(!currentOperationsPanel){
      return;
  }

  if (!currentOperations || currentOperations.length === 0) {
    const currentCards = document.querySelectorAll("[id^='coCard-']");
    currentCards.forEach((card) => {
      card.remove();
    });
  }

  document.getElementById("completeCount").innerHTML =
    currentOperationsCount?.complete ? "Complete: " + currentOperationsCount.complete : "Complete: " + 0;
  document.getElementById("idleCount").innerHTML =
    currentOperationsCount?.idle ? "Idle: " + currentOperationsCount.idle : "Idle: " + 0;
  document.getElementById("activeCount").innerHTML =
    currentOperationsCount?.active ? "Active: " + currentOperationsCount.active : "Active: " + 0;
  document.getElementById("disconCount").innerHTML =
    currentOperationsCount?.disconnected ? "Disconnected: " + currentOperationsCount.disconnected : "Disconnected: " + 0;

  document.getElementById("offlineCount").innerHTML =
    currentOperationsCount?.offline ? "Offline: " + currentOperationsCount.offline : "Offline: " + 0;

  document.getElementById("farmProgress").innerHTML =
    currentOperationsCount?.farmProgress ? currentOperationsCount.farmProgress + "%" : 0 + "%";
  document.getElementById(
    "farmProgress"
  ).style = `width: ${currentOperationsCount?.farmProgress ? currentOperationsCount.farmProgress : 0}%`;
  document.getElementById(
    "farmProgress"
  ).classList = `progress-bar progress-bar-striped bg-${currentOperationsCount?.farmProgressColour}`;

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
          if (!!document.getElementById(`coCard-${current.index}`)) {
              if (current.progress === 100) {
                  document
                      .getElementById("finishedPrint-" + current.index)
                      .classList.remove("d-none");
                  document
                      .getElementById("futureDate-" + current.index)
                      .classList.add("d-none");
                  document
                      .getElementById("currentRestart-" + current.index)
                      .classList.remove("d-none");
                  document
                      .getElementById("currentTime-" + current.index)
                      .classList.add("d-none");
                  document
                      .getElementById("currentProgressMain-" + current.index)
                      .classList.add("d-none");
              } else {
                  document
                      .getElementById("finishedPrint-" + current.index)
                      .classList.add("d-none");
                  document
                      .getElementById("futureDate-" + current.index)
                      .classList.remove("d-none");
                  document
                      .getElementById("currentRestart-" + current.index)
                      .classList.add("d-none");
                  document
                      .getElementById("currentTime-" + current.index)
                      .classList.remove("d-none");
                  document
                      .getElementById("currentProgressMain-" + current.index)
                      .classList.remove("d-none");
              }
              const progress = document.getElementById(
                  "currentProgress-" + current.index
              );
              document.getElementById("currentOpFile-"+current.index).innerHTML = fileName
              document.getElementById("currentTime-" + current.index).innerHTML =
                  Calc.generateTime(current.timeRemaining);
              document.getElementById("futureDate-" + current.index).innerHTML = dateComplete
              progress.style = `width: ${current.progress}%`;
              progress.innerHTML = current.progress + "%";
              progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
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
                <div id="coCard-${current.index}"
                class="${cardClass}"
                style="${cardStyle}"
              >
                  <div class="card-header pb-1 pt-1 pl-2 pr-2">
                     ${current.name}</div>
                  <div class="card-body  pb-0 pt-2 pl-2 pr-2">
                  <h6 id="currentOpFile-${
                      current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;"> ${fileName} </h6>
                  <h6 id="currentRestart-${
                      current.index
                  }" class="pb-0 text-center d-none" style="font-size:0.6rem;">${restartPrint}</h6>
                  <h6 id="currentTime-${
                      current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;">${Calc.generateTime(
                      current.timeRemaining
                  )}</h6>
        <h6 id="futureDate-${
                      current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;"> ${dateComplete} </h6>
        <h6 id="finishedPrint-${
                      current.index
                  }" class="pb-0 text-center d-none" style="font-size:0.6rem;"> ${finishedPrint} </h6>
                    <div id="currentProgressMain-${
                      current.index
                  }" class="progress">
                      <div id="currentProgress-${current.index}"
                        class="progress-bar progress-bar-striped bg-${
                      current.progressColour
                  }"
                        role="progressbar"
                        style="width: ${current.progress}%"
                        aria-valuenow="${current.progress}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                      ${current.progress}%
                      </div>
                    </div>
                  </div>
                </div>
                `
              );
              document
                  .getElementById("currentHarvest-" + current.index)
                  .addEventListener("click", async () => {
                      await resetFile(current.index);
                  });
              document
                  .getElementById("restartCurrentPrint-" + current.index)
                  .addEventListener("click", async () => {
                      await rePrint(current.index);
                  });
          }

          document.getElementById("coCard-" + current.index).style.order =
              index;
      });

      const currentCards = document.querySelectorAll("[id^='coCard-']");
      const curr = [];
      currentOperations.forEach((cur) => {
          curr.push(cur.index);
      });
      const cards = [];
      currentCards.forEach((card) => {
          const ca = card.id.split("-");
          cards.push(ca[1]);
      });
      const remove = _.difference(cards, curr);
      remove.forEach((rem) => {
          document.getElementById("coCard-" + rem).remove();
      });
  }

}
