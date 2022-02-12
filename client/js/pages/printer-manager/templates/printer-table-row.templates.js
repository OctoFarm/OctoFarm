const returnAlerts = (id) => {
  return `
    <button title="No OctoPrint updates available!" id="octoprintUpdate-${id}"
            class='tag btn btn-outline-info btn-sm d-none' ><i class="fab fa-raspberry-pi"></i></button>
    <button title="No OctoPrint plugin updates available" id="octoprintPluginUpdate-${id}"
            class='tag btn btn-outline-success btn-sm d-none' ><i class="fas fa-plug"></i></button>
    <button title="No issue from scanning OctoPrints API"
            id="scanningIssues-${id}"
            type="button"
            class="tag btn btn-outline-danger btn-sm d-none"
            
    >
        <i class="fas fa-exclamation-triangle"></i>
    </button>
    <button title="No current printer health issues!"
            id="healthIssues-${id}"
            type="button"
            class="tag btn btn-outline-warning btn-sm d-none"
            data-toggle="modal"
            data-target="#healthChecksModal"
    >
        <i class="fas fa-heartbeat"></i>
    </button>
    <button title="A restart is required on your OctoPrint instance!"
            type="button"
            class="tag btn btn-outline-danger btn-sm d-none"
            id="restartRequired-${id}"  
    >
        <i class="fas fa-power-off"></i>
    </button>
    <button title="Multiple user issue detected! Please open settings and choose one..."
            type="button"
            class="tag btn btn-outline-primary btn-sm d-none"
            id="multiUserIssue-${id}"
    >
        <i class="fas fa-users"></i>
    </button>
    <button title="CORS is not enable on OctoPrint!"
            type="button"
            class="tag btn btn-outline-info btn-sm d-none"
            id="corsIssue-${id}" 
    >
        <i class="fas fa-crosshairs"></i>
    </button>
    <button  title="Offline Rescan planned"
                 id="printerAPIScanning-${id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm d-none"
                >
               <span id="apiReScanIcon-${id}"><i class="fas fa-redo fa-sm"></i></span><span id="apiReScanText-${id}"></span> 
    </button>
        <button  title="Offline Rescan planned"
                 id="printerWebsocketScanning-${id}"
                 type="button"
                 class="tag btn btn-outline-warning btn-sm d-none"
                >
               <span id="webosocketScanIcon-${id}"><i class="fas fa-sync-alt fa-sm"></i></span><span id="websocketScanText-${id}"></span> 
    </button>
   `;
};

export function returnPrinterTableRow(printer) {
  return `
        <tr class="" id="printerCard-${printer._id}">
        <td class="align-middle">
            <span title="Drag and Change your Printers sorting"  id="printerSortIndex-${
              printer._id
            }"
                   class="btn btn-light btn-sm sortableList" style="vertical-align: middle"><i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
        <td class="align-middle">
            <span><i class="fas fa-print" style="color:${
              printer.settingsAppearance.color
            };"></i></span>
            <span id="printerName-${printer._id}"></span>
        </td>
        <td class="align-middle">
            <span id="printerURL-${printer._id}"></span>
        </td>
                <td class="align-middle">
            <small>
                <span data-title="${printer.hostState.desc}" id="hostBadge-${
    printer._id
  }" class="tag badge badge-${printer.hostState.colour.name} badge-pill">
                    ${printer.hostState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.printerState.desc}" id="printerBadge-${
    printer._id
  }" class="tag badge badge-${printer.printerState.colour.name} badge-pill">
                    ${printer.printerState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${
    printer._id
  }" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                    <i  class="fas fa-plug"></i>
                </span>
            </small>
        </td>
        <td class="align-middle" id="printerGroup-${printer._id}"></td>
                <td class="align-middle" id="printerActionBtns-${printer._id}">

        </td>

        <td class="align-middle" id="printerManageBtns-${printer._id}">
            <button  title="ReScan your printers API"
                 id="printerAPIReScan-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm mb-2"
                >
                <i class="fab fa-searchengin"></i> Scan API
                
            </button>
            <button  title="Printer is enabled, click to disable"
                 id="printerDisable-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-success btn-sm mb-2"
                >
                <i class="fas fa-running"></i> Enabled
            </button>
            <br>
            <button  title="Change your Printer Settings"
                 id="printerSettings-${printer._id}"
                 type="button"
                 class="tag btn btn-primary btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                >
                <i class="fas fa-cog"></i> Settings
            </button>
                    <button  title="View logs for your printer"
                 id="printerLog-${printer._id}"
                 type="button"
                 class="tag btn btn-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerLogsModal"
            >
                <i class="fas fa-file-alt"></i> Logs
            </button>
            <button title="View individual Printer Statistics"
                     id="printerStatistics-${printer._id}"
                     type="button"
                     class="tag btn btn-warning btn-sm text-dark"
                     data-toggle="modal"
                     data-target="#printerStatisticsModal"
                >
                <i class="fas fa-chart-pie text-dark"></i> Statistics
              </button>
            <button  title="Setup and track Maintenance Issues with Printers"
                     id="printerMaintenance-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                     data-toggle="modal"
                     data-target="#printerMaintenanceModal"
                     disabled
                >
                    <i class="fas fa-wrench"></i> Maintainance
            </button>
        </td>

        <td class="align-middle" id="printerAlertsBtns-${printer._id}">
            ${returnAlerts(printer._id)}
        </td>

    </tr>
    `;
}

export function returnDisabledPrinterTableRow(printer) {
  return `
   <tr class="printerDisabled" id="printerCard-${printer._id}">
        <td class="align-middle">
            <span title="Drag and Change your Printers sorting"  id="printerSortIndex-${
              printer._id
            }"
                   class="btn btn-light btn-sm sortableList" style="vertical-align: middle"><i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
        <td class="align-middle" >
                 <span><i class="fas fa-print" style="color:${
                   printer.settingsAppearance.color
                 };"></i></span>
            <span id="printerName-${printer._id}"></span>
            </td>
                    <td class="align-middle">
            <span id="printerURL-${printer._id}"></span>
        </td>
                <td class="align-middle">
            <small>
                <span data-title="${printer.hostState.desc}" id="hostBadge-${
    printer._id
  }" class="tag badge badge-dark badge-pill" disabled>
                    ${printer.hostState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.printerState.desc}" id="printerBadge-${
    printer._id
  }" class="tag badge badge-dark badge-pill">
                    ${printer.printerState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${
    printer._id
  }" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                    <i  class="fas fa-plug"></i>
                </span>
            </small>
        </td>
        <td class="align-middle" id="printerGroup-${printer._id}"></td>
        <td class="align-middle" id="printerActionBtns-${printer._id}">

        </td>
        <td class="align-middle" id="printerManageBtns-${printer._id}">
            <button  title="ReScan your printers API"
                 id="printerAPIReScan-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm mb-2"
                 disabled
                >
                 <i class="fab fa-searchengin"></i> Scan API
            </button>
            <button  title="Printer is enabled, click to disable"
                 id="printerDisable-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-light btn-sm mb-2"
                >
                <i class="fas fa-wheelchair"></i> Disabled
            </button>
            <br>
            <button  title="Change your Printer Settings"
                 id="printerSettings-${printer._id}"
                 type="button"
                 class="tag btn btn-primary btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                >
                <i class="fas fa-cog"></i> Settings
            </button>
               <button  title="View logs for your printer"
                 id="printerLog-${printer._id}"
                 type="button"
                 class="tag btn btn-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerLogsModal"
                 disabled
            >
                <i class="fas fa-file-alt"></i> Logs
            </button>
            <button title="View individual Printer Statistics"
                     id="printerStatistics-${printer._id}"
                     type="button"
                     class="tag btn btn-warning btn-sm text-dark"
                     data-toggle="modal"
                     data-target="#printerStatisticsModal"
                     disabled
                >
                <i class="fas fa-chart-pie text-dark"></i> Statistics
              </button>
            <button  title="Setup and track Maintenance Issues with Printers"
                     id="printerMaintenance-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                     data-toggle="modal"
                     data-target="#printerMaintenanceModal"
                     disabled
                >
                    <i class="fas fa-wrench"></i> Maintainence
            </button>
        </td>

        <td class="align-middle" id="printerAlertsBtns-${printer._id}">
               ${returnAlerts(printer._id)}
        </td>

    </tr>
    `;
}
