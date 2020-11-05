import PowerButton from "../powerButton.js";

function printerControlBtn(id) {
  return `
    <button  
         title="Control Your Printer"
         id="printerButton-${id}"
         type="button"
         class="tag btn btn-primary btn-sm"
         data-toggle="modal"
         data-target="#printerManagerModal" disabled
         >
            <i class="fas fa-print"></i>
    </button>
    `;
}
function printerWebBtn(id, webURL) {
  return `
            <a title="Open OctoPrint"
               id="printerWeb-${id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${webURL}" role="button"><i class="fas fa-globe-europe"></i></a>
    `;
}
function printerReSyncBtn(id) {
  return `
            <button  
                     title="Re-Sync your printer"
                     id="printerSyncButton-${id}"
                     type="button"
                     class="tag btn btn-success btn-sm"
            >
                <i class="fas fa-sync"></i>
            </button>
    `;
}

function printerQuickConnect(id) {
  return `
    <button  
         title="Quickly connect/disconnect your printer"
         id="printerQuickConnect-${id}"
         type="button"
         class="tag btn btn-danger btn-sm"
         >
            <i class="fas fa-toggle-off"></i>
    </button>
    `;
}
function powerBtnHolder(id) {
  return `
      <div class="btn-group" id="powerBtn-${id}">
      
      </div>
  `;
}

function printerQuickConnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-on"></i>';
  connectBtn.classList.remove("btn-danger");
  connectBtn.classList.add("btn-success");
  connectBtn.title = "Press to connect your printer!";
}
function printerQuickDisconnected(id) {
  let connectBtn = document.getElementById("printerQuickConnect-" + id);
  connectBtn.innerHTML = '<i class="fas fa-toggle-off"></i>';
  connectBtn.classList.remove("btn-success");
  connectBtn.classList.add("btn-danger");
  connectBtn.title = "Press to connect your printer!";
}

async function init(printer, element) {
  document.getElementById(element).innerHTML = `
    ${printerControlBtn(printer._id)}  
    ${printerWebBtn(printer._id, printer.printerURL)}  
    ${printerReSyncBtn(printer._id)}  
    ${printerQuickConnect(printer._id)}  
    ${powerBtnHolder(printer._id)}  
  `;
  await PowerButton.applyBtn(printer, "powerBtn-");
  if (
    printer.currentConnection != null &&
    printer.currentConnection.port != null &&
    printer.printerState.colour.category != "Offline"
  ) {
    printerQuickConnected(printer._id);
  } else {
    printerQuickDisconnected(printer._id);
  }
  if (printer.printerState.colour.category === "Offline") {
    document.getElementById(
      "printerQuickConnect-" + printer._id
    ).disabled = true;
  } else {
    document.getElementById(
      "printerQuickConnect-" + printer._id
    ).disabled = false;
  }
  return true;
}

export { init, printerQuickConnected, printerQuickDisconnected };
