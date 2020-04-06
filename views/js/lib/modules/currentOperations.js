import Calc from "../functions/calc.js";

export default function currentOperations(
  currentOperations,
  currentOperationsCount
) {

  if(currentOperations.length === 0){
    let currentCards = document.querySelectorAll("[id^='currentOpCard-']");
    currentCards.forEach(card => {
      card.remove();
    })
  }
  currentOperationsCount = currentOperationsCount;
  document.getElementById("completeCount").innerHTML =
    "Complete: " + currentOperationsCount.complete;
  document.getElementById("idleCount").innerHTML =
    "Idle: " + currentOperationsCount.idle;
  document.getElementById("activeCount").innerHTML =
    "Active: " + currentOperationsCount.active;
  document.getElementById("offlineCount").innerHTML =
    "Offline: " + currentOperationsCount.offline;

  document.getElementById("farmProgress").innerHTML =
    currentOperationsCount.farmProgress + "%";
  document.getElementById(
    "farmProgress"
  ).style = `width: ${currentOperationsCount.farmProgress}%`;
  document.getElementById(
    "farmProgress"
  ).classList = `progress-bar progress-bar-striped bg-${currentOperationsCount.farmProgressColour}`;

  currentOperations = _.orderBy(currentOperations, ["progress"], ["desc"]);

  currentOperations.forEach((current, index) => {
    //Generate future time
    let currentDate = new Date(); 
    currentDate = currentDate.getTime(); 
    let futureDateString = new Date(currentDate + current.timeRemaining * 1000).toDateString()
    let futureTimeString = new Date(currentDate + current.timeRemaining * 1000).toTimeString()
    futureTimeString = futureTimeString.substring(0, 8); 
    let dateComplete = futureDateString + ": " + futureTimeString;
     if(current.timeRemaining === 0){ 
       dateComplete = "Harvest Your Print!"; 
     } 
    //check if exists, create if not....
    if (document.getElementById("currentOpCard-" + current.index)) {
      let progress = document.getElementById(
        "currentProgress-" + current.index
      );
      progress.style = `width: ${current.progress}%`;
      progress.innerHTML = current.progress + "%";
      progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
      document.getElementById("futureDate-" + current.index).innerHTML = dateComplete;
      document.getElementById(
        "currentTime-" + current.index
      ).innerHTML = Calc.generateTime(current.timeRemaining);
    } else {
      document.getElementById("currentOperationsBody").insertAdjacentHTML(
        "beforeend",
        `
                <div id="currentOpCard-${current.index}"
                class="card card-block text-white bg-secondary d-inline-block"
                style="min-width: 200px; height:85px;"
              >
                  <div class="card-header pb-1 pt-1 pl-2 pr-2">${
                    current.index
                  }. ${current.name}</div>
                  <div class="card-body  pb-0 pt-2 pl-2 pr-2">
                  <h6 id="currentTime-${
                    current.index
                  }" class="pb-0 text-center" style="font-size:0.6rem;">${Calc.generateTime(
          current.timeRemaining
        )}</h6>
        <h6 id="futureDate-${current.index}" class="pb-0 text-center" style="font-size:0.6rem;">${dateComplete}</h6>
                    <div class="progress">
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
    }
    document.getElementById(
      "currentOpCard-" + current.index
    ).style.order = index;
    let currentCards = document.querySelectorAll("[id^='currentOpCard-']");
    let curr = [];
    currentOperations.forEach(cur => {
      curr.push(cur.index);
    });
    let cards = [];
    currentCards.forEach(card => {
      let ca = card.id.split("-");
      cards.push(parseInt(ca[1]));
    });
    let remove = _.difference(cards, curr);
    remove.forEach(rem => {
      document.getElementById("currentOpCard-" + rem).remove();
    });

  });
}
