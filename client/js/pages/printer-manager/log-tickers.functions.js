const currentAlerts = [];

/**
 * Checks if the ticker contains the loader element and removes it.
 * Also updates the tickers styling to remove the d-flex class.
 */
export function clearConnectionLoader(loader, messageBox, count) {
  if (loader) {
    loader.remove();
    if (count === 0) {
      messageBox.innerText = "No logs received ❌";
    } else {
      if (messageBox.innerText.includes("No logs")) {
        messageBox.innerText = "";
      }
      if (messageBox.classList.contains("d-flex")) {
        messageBox.classList.remove("d-flex");
      }
    }
  }
}

/**
 * Checks if the ticker line already exists
 */
function checkIfElementExistsInTicker(elementID) {
  return !document.getElementById(elementID);
}

/**
 * Updates the log lines element with log count
 */
function updateStatus(countElement, lineLength) {
  countElement.innerText = `${lineLength}`;
}

/**
 * Updates the printer ticker on printer manager
 */
export function updateActionLog(list, messageBox, countElement, loaderElement) {
  clearConnectionLoader(loaderElement, messageBox, list.length);
  updateStatus(countElement, list.length);
  list.forEach((e) => {
    if (checkIfElementExistsInTicker(e.id)) {
      messageBox.insertAdjacentHTML("afterbegin", createActionsLogString(e));
    }
  });
}

export function updateConnectionLog(
  list,
  messageBox,
  countElement,
  loaderElement
) {
  clearConnectionLoader(loaderElement, messageBox, list.length);
  updateStatus(countElement, list.length);
  list.forEach((e) => {
    if (checkIfElementExistsInTicker(e.id)) {
      messageBox.insertAdjacentHTML("afterbegin", createConnectionLogString(e));
    }
  });
}

export function updateAlertsLog(messageBox, countElement, loaderElement) {
  clearConnectionLoader(loaderElement, messageBox, currentAlerts.length);
  updateStatus(countElement, currentAlerts.length);
}

export function updateLogLine(id, messageBox, string) {
  if (!currentAlerts.includes(id)) {
    currentAlerts.push(id);
  }
  if (checkIfElementExistsInTicker(id)) {
    messageBox.insertAdjacentHTML("afterbegin", string);
  }
}

export function createConnectionLogString(data) {
  const date = new Date(data.date).toLocaleString();
  return `<div id="${data.id}" style="width: 100%; font-size:11px;" class="text-left text${data.state} text-wrap"> ${date} | ${data.printer} | ${data.message}</div>`;
}

export function createActionsLogString(data) {
  const date = new Date(data.date).toLocaleString();
  return `<div title="See printer logs for more information!" id="${
    data.id
  }" style="width: 100%; font-size:11px;" class="text-left ${
    data.state
  } text-wrap text${data?.status}"> ${date} | ${
    data.currentUser
  } | ${data.printerName.slice(0, 6)}... | ${data.action}</div>`;
}

export function createAlertsLogString(data) {
  return `<div id="${data.id}" style="width: 100%; font-size:11px;" class="text-left text${data.colour} text-wrap"><i class="pl-2 fas fa-exclamation-triangle"></i> ${data.printerName} | ${data.name}</div>`;
}

export function removeLogLine(data) {
  if (!checkIfElementExistsInTicker(data.id)) {
    document.getElementById(data.id).remove();
  }
  if (currentAlerts.includes(data.id)) {
    const deleteIndex = currentAlerts.findIndex((id) => id === alert.id);
    currentAlerts.splice(deleteIndex, 1);
  }
}
