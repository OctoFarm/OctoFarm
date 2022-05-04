import Calc from "../../../utils/calc";
import bulkActionsStates from "../bulk-actions.constants";

const EL = {
  MESSAGE: document.getElementById("bulkActionInfoMessage"),
  PROGRESS_BAR: document.getElementById("bulkActionProgressBar"),
  TABLE: document.getElementById("bulkActionResultsTable"),
  COMPLETE_COUNT: document.getElementById("bulkActionCompleteCount"),
  SKIPPED_COUNT: document.getElementById("bulkActionSkipped"),
  ERROR_COUNT: document.getElementById("bulkActionError"),
  WARNING_COUNT: document.getElementById("bulkActionWarning"),
};

const INITIAL_MESSAGE =
  '<i class="fas fa-info"></i> Please wait whilst OctoFarm runs through your action!';
const COMPLETE_MESSAGE =
  '<i class="fas fa-info"></i> Actions complete! You may check the results below.';

const SKIPPED = '<i class="fas fa-forward text-warning"></i>';
const WARNING = '<i class="fas fa-exclamation-triangle text-warning"></i>';
const ERROR = '<i class="fas fa-times text-danger"></i>';
const SUCCESS = '<i class="fas fa-check text-success"></i>';

function tableRowTemplate(info) {
  return `
    <tr>
      <th scope="row">${info.index}</th>
      <td>${info.printerName}</td>
      <td id="result-${info._id}"><i class="fas fa-circle-notch fa-spin text-warning"></i></td>
      <td id="message-${info._id}"></td>
    </tr>
  `;
}

export function generateTableRows(printers) {
  EL.ERROR_COUNT.innerHTML = 0;
  EL.SKIPPED_COUNT.innerHTML = 0;
  EL.COMPLETE_COUNT.innerHTML = 0;
  EL.WARNING_COUNT.innerHTML = 0;
  EL.TABLE.innerHTML = "";
  printers.forEach((printer, index) => {
    printer.index = index;
    EL.TABLE.insertAdjacentHTML("beforeend", tableRowTemplate(printer));
  });
  $("#bulkActionProgressModal").modal("handleUpdate");
}

export function updateTableRow(id, status, message, noBreak) {
  const resultElement = document.getElementById("result-" + id);
  const messageElement = document.getElementById("message-" + id);
  if (status === bulkActionsStates.SKIPPED) {
    if (!resultElement.innerHTML.includes("fa-spin")) {
      resultElement.innerHTML = resultElement.innerHTML + "<br>" + SKIPPED;
    } else {
      resultElement.innerHTML = SKIPPED;
    }

    EL.SKIPPED_COUNT.innerHTML = parseInt(EL.SKIPPED_COUNT.innerHTML) + 1;
  } else if (status === bulkActionsStates.ERROR) {
    if (!resultElement.innerHTML.includes("fa-spin")) {
      resultElement.innerHTML = resultElement.innerHTML + "<br>" + ERROR;
    } else {
      resultElement.innerHTML = ERROR;
    }
    EL.ERROR_COUNT.innerHTML = parseInt(EL.ERROR_COUNT.innerHTML) + 1;
  } else if (status === bulkActionsStates.SUCCESS) {
    if (!resultElement.innerHTML.includes("fa-spin")) {
      resultElement.innerHTML = resultElement.innerHTML + "<br>" + SUCCESS;
    } else {
      resultElement.innerHTML = SUCCESS;
    }
    EL.COMPLETE_COUNT.innerHTML = parseInt(EL.COMPLETE_COUNT.innerHTML) + 1;
  } else if (status === bulkActionsStates.WARNING) {
    if (!resultElement.innerHTML.includes("fa-spin")) {
      resultElement.innerHTML = resultElement.innerHTML + "<br>" + WARNING;
    } else {
      resultElement.innerHTML = WARNING;
    }
    EL.WARNING_COUNT.innerHTML = parseInt(EL.WARNING_COUNT.innerHTML) + 1;
  }
  if (messageElement.innerHTML.length !== 0) {
    if (noBreak) {
      messageElement.innerHTML = messageElement.innerHTML + message;
    } else {
      messageElement.innerHTML = messageElement.innerHTML + "<br>" + message;
    }
  } else {
    messageElement.innerHTML = message;
  }
}

export function showBulkActionsModal() {
  EL.MESSAGE.innerHTML = INITIAL_MESSAGE;
  $("#bulkActionProgressModal").modal("show");
}

export function updateBulkActionsProgress(done, total) {
  if (done < total) EL.PROGRESS_BAR.classList = "progress-bar bg-warning";
  if (done === total) {
    EL.MESSAGE.innerHTML = COMPLETE_MESSAGE;
    EL.PROGRESS_BAR.classList = "progress-bar bg-success";
    EL.MESSAGE.classList = "alert alert-success text-dark";
  }
  const currentPercent = Calc.getPercentage(done, total);
  EL.PROGRESS_BAR.style.width = currentPercent + "%";
  EL.PROGRESS_BAR.innerHTML = currentPercent + "%";
}
