export default function currentOperations(farmInfo) {
    document.getElementById("completeCount").innerHTML =
      "Complete: " + farmInfo.complete;
    document.getElementById("idleCount").innerHTML = "Idle: " + farmInfo.idle;
    document.getElementById("activeCount").innerHTML =
      "Active: " + farmInfo.active;
    document.getElementById("offlineCount").innerHTML =
      "Offline: " + farmInfo.offline;

    document.getElementById("farmProgress").innerHTML = farmInfo.farmProgress + "%";
    document.getElementById("farmProgress").style = `width: ${farmInfo.farmProgress}%`;
    document.getElementById("farmProgress").classList = `progress-bar progress-bar-striped bg-${farmInfo.farmProgressColour}`;
      
    farmInfo.currentOperations = _.orderBy(
      farmInfo.currentOperations,
      ["progress"],
      ["desc"]
    );

    farmInfo.currentOperations.forEach((current, index) => {
      //check if exists, create if not....
      if (document.getElementById("currentOpCard-" + current.index)) {
        let progress = document.getElementById(
          "currentProgress-" + current.index
        );
        progress.style = `width: ${current.progress}%`;
        progress.innerHTML = current.progress + "%";
        progress.className = `progress-bar progress-bar-striped bg-${current.progressColour}`;
      } else {
        document.getElementById("currentOperationsBody").insertAdjacentHTML(
          "beforeend",
          `
                <div id="currentOpCard-${current.index}"
                class="card card-block text-white bg-secondary d-inline-block"
                style="min-width: 200px; height:65px;"
              >
                  <div class="card-header pb-1 pt-1 pl-2 pr-2">${current.index}. ${current.name}</div>
                  <div class="card-body  pb-0 pt-2 pl-2 pr-2">
                    <div class="progress">
                      <div id="currentProgress-${current.index}"
                        class="progress-bar progress-bar-striped bg-${current.progressColour}"
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
    });
  }