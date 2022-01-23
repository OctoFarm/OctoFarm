let tickerMessageBox = document.getElementById("printerAlertsMessageBox");
let tickerMessageBoxStatus = document.getElementById("printerManagementAlertsLogStatus");

const currentAlerts = [];

/**
 * Checks if the ticker contains the loader element and removes it.
 * Also updates the tickers styling to remove the d-flex class.
 */
export function checkIfAlertsLoaderExistsAndRemove(noLogs = false) {
  const loader = document.getElementById("printerAlertsLoader");
  if (loader) {
    if (noLogs) {
      tickerMessageBox.innerText = "No logs received ❌";
      loader.remove();
      updateAlertsStatus();
    } else {
      tickerMessageBox.classList.remove("d-flex");
      loader.remove();

    }
  } else {
    if (!noLogs) {
      if (tickerMessageBox.classList.contains("d-flex")) {
        tickerMessageBox.classList.remove("d-flex");
      }
    }
  }
  updateAlertsStatus();
}

/**
 * Checks if the ticker line already exists
 */
function checkIfAlertsElementExistsInTicker(elementID) {
  return !document.getElementById(elementID);
}

/**
 * Updates the log lines element with log count
 */
function updateAlertsStatus() {
  tickerMessageBoxStatus.innerText = `${currentAlerts.length}`;
}

/**
 * Updates the printer ticker on printer manager
 */
export function updateAlertsLog(alert) {
  if(!currentAlerts.includes(alert.id)){
    currentAlerts.push(alert.id);
    tickerMessageBox.insertAdjacentHTML(
      "afterbegin",
      `<div id="${alert.id}" style="width: 100%; font-size:11px;" class="text-left ${alert.colour} text-wrap"><i class="pl-2 fas fa-exclamation-triangle"></i> ${alert.printerName} | ${alert.name}</div>`
    );
    updateAlertsStatus();
  }
}

export function removeAlertsLog(alert){
  if(currentAlerts.includes(alert.id)){
    const deleteIndex = currentAlerts.findIndex( (id) => id === alert.id )
    currentAlerts.splice(deleteIndex, 1);
    document.getElementById(alert.id).remove();
    updateAlertsStatus();
  }
}
