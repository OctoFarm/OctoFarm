export function returnPrinterTableRow(printer) {
  return `
        <tr class="printerEnabled" id="printerCard-${printer._id}">
        <td class="align-middle">
            <span title="Drag and Change your Printers sorting"  id="printerSortIndex-${printer._id}"
                   class="btn btn-light btn-sm sortableList" style="vertical-align: middle"><i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
        <td class="align-middle" id="printerName-${printer._id}"></td>
                <td class="align-middle">
            <small>
                <span data-title="${printer.hostState.desc}" id="hostBadge-${printer._id}" class="tag badge badge-${printer.hostState.colour.name} badge-pill">
                    ${printer.hostState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-${printer.printerState.colour.name} badge-pill">
                    ${printer.printerState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${printer._id}" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                    <i  class="fas fa-plug"></i>
                </span>
            </small>
        </td>
        <td class="align-middle" id="printerGroup-${printer._id}"></td>
        <td class="align-middle" id="printerManageBtns-${printer._id}">
            <button  title="ReScan your printers API"
                 id="printerAPIReScan-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm"
                >
                <span id="apiReScanIcon-${printer._id}"><i class="fas fa-redo fa-sm"></i></span><span id="apiReScanText-${printer._id}"></span>
                
            </button>
            <button  title="Change your Printer Settings"
                 id="printerSettings-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                >
                <i class="fas fa-cog"></i>
            </button>
            <button  title="Printer is enabled, click to disable"
                 id="printerDisable-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-success btn-sm"
                >
                <i class="fas fa-running"></i>
            </button>
            <button  title="Setup and track Maintenance Issues with Printers"
                     id="printerMaintenance-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                     data-toggle="modal"
                     data-target="#printerMaintenanceModal"
                     disabled
                >
                    <i class="fas fa-wrench"></i>
            </button>
        </td>
        <td class="align-middle" id="printerInformationBtns-${printer._id}">
        <button  title="View logs for your printer"
                 id="printerLog-${printer._id}"
                 type="button"
                 class="tag btn btn-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerLogsModal"
            >
                <i class="fas fa-file-alt"></i>
            </button>
            <button title="View individual Printer Statistics"
                     id="printerStatistics-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-3"
                     data-toggle="modal"
                     data-target="#printerStatisticsModal"
                >
                <i class="fas fa-chart-pie text-dark"></i>
              </button>
        </td>
        <td class="align-middle" id="printerActionBtns-${printer._id}">

        </td>
        <td class="align-middle" id="printerAlertsBtns-${printer._id}">
            <button title="No OctoPrint updates available!" id="octoprintUpdate-${printer._id}" class='tag btn btn-outline-info btn-sm' disabled><i class="fab fa-raspberry-pi"></i></button>
            <button title="No OctoPrint plugin updates available" id="octoprintPluginUpdate-${printer._id}" class='tag btn btn-outline-success btn-sm' disabled><i class="fas fa-plug"></i></button>
            <button title="No issue from scanning OctoPrints API"
                 id="scanningIssues-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                 disabled
                >
                <i class="fas fa-exclamation-triangle"></i>
            </button>
            <button title="No current printer health issues!"
                 id="healthIssues-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-warning btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                 disabled
                >
                <i class="fas fa-heartbeat"></i>
            </button>
            <button title="A restart is required on your OctoPrint instance!"
                type="button"
                 class="tag btn btn-outline-danger btn-sm"
             id="restartRequired-${printer._id}"
             disabled
            >
                <i class="fas fa-power-off"></i>
            </button>
            <button title="Multiple user issue detected! Please open settings and choose one..."
                type="button"
                 class="tag btn btn-outline-primary btn-sm"
                 id="multiUserIssue-${printer._id}"
                 disabled
            >
                <i class="fas fa-users"></i>
            </button>
            <button title="CORS is not enable on OctoPrint!"
                type="button"
                 class="tag btn btn-outline-info btn-sm"
                 id="corsIssue-${printer._id}"
                 disabled
            >
                <i class="fas fa-crosshairs"></i>
            </button>
        </td>

    </tr>
    `;
}

export function returnDisabledPrinterTableRow(printer) {
  return `
   <tr class="printerDisabled" id="printerCard-${printer._id}">
        <td class="align-middle">
            <span title="Drag and Change your Printers sorting"  id="printerSortIndex-${printer._id}"
                   class="btn btn-light btn-sm sortableList" style="vertical-align: middle"><i class="fas fa-spinner fa-spin"></i>
            </span>
        </td>
        <td class="align-middle" id="printerName-${printer._id}"></td>
                <td class="align-middle">
            <small>
                <span data-title="${printer.hostState.desc}" id="hostBadge-${printer._id}" class="tag badge badge-dark badge-pill" disabled>
                    ${printer.hostState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.printerState.desc}" id="printerBadge-${printer._id}" class="tag badge badge-dark badge-pill">
                    ${printer.printerState.state}
                </span>
            </small>
        </td>
        <td class="align-middle">
            <small>
                <span data-title="${printer.webSocketState.desc}" id="webSocketIcon-${printer._id}" class="tag badge badge-${printer.webSocketState.colour} badge-pill">
                    <i  class="fas fa-plug"></i>
                </span>
            </small>
        </td>
        <td class="align-middle" id="printerGroup-${printer._id}"></td>

        <td class="align-middle" id="printerManageBtns-${printer._id}">
            <button  title="ReScan your printers API"
                 id="printerAPIReScan-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm"
                 disabled
                >
                <span id="apiReScanIcon-${printer._id}"><i class="fas fa-redo fa-sm"></i></span><span id="apiReScanText-${printer._id}"></span>
            </button>
            <button  title="Change your Printer Settings"
                 id="printerSettings-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                 disabled
                >
                <i class="fas fa-cog"></i>
            </button>
            <button  title="Printer is current disabled, click to re-enable"
                 id="printerDisable-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-light btn-sm"
                >
                <i class="fas fa-wheelchair"></i>
            </button>
            <button  title="Setup and track Maintenance Issues with Printers"
                     id="printerMaintenance-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-4 d-none"
                     data-toggle="modal"
                     data-target="#printerMaintenanceModal"
                     disabled
                >
                    <i class="fas fa-wrench"></i>
            </button>
        </td>
        <td class="align-middle" id="printerInformationBtns-${printer._id}">
        <button  title="View logs for your printer"
                 id="printerLog-${printer._id}"
                 type="button"
                 class="tag btn btn-info btn-sm"
                 data-toggle="modal"
                 data-target="#printerLogsModal"
                 disabled
            >
                <i class="fas fa-file-alt"></i>
            </button>
            <button title="View individual Printer Statistics"
                     id="printerStatistics-${printer._id}"
                     type="button"
                     class="tag btn btn-secondary btn-sm bg-colour-3"
                     data-toggle="modal"
                     data-target="#printerStatisticsModal"
                     disabled
                >
                <i class="fas fa-chart-pie text-dark"></i>
              </button>
        </td>
        <td class="align-middle" id="printerActionBtns-${printer._id}">

        </td>
        <td class="align-middle" id="printerAlertsBtns-${printer._id}">
            <button title="No OctoPrint updates available!" id="octoprintUpdate-${printer._id}" class='tag btn btn-outline-info btn-sm d-none'><i class="fab fa-raspberry-pi"></i></button>
            <button title="No OctoPrint plugin updates available" id="octoprintPluginUpdate-${printer._id}" class='tag btn btn-outline-success btn-sm d-none'><i class="fas fa-plug"></i></button>
            <button title="No issue from scanning OctoPrints API"
                 id="scanningIssues-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-danger btn-sm d-none"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                 disabled
                >
                <i class="fas fa-exclamation-triangle"></i>
            </button>
            <button title="No current printer health issues!"
                 id="healthIssues-${printer._id}"
                 type="button"
                 class="tag btn btn-outline-warning btn-sm d-none"
                 data-toggle="modal"
                 data-target="#printerSettingsModal"
                 disabled
                >
                <i class="fas fa-heartbeat"></i>
            </button>
            <button title="A restart is required on your OctoPrint instance!"
                type="button"
                 class="tag btn btn-outline-danger btn-sm d-none"
             id="restartRequired-${printer._id}"
             disabled
            >
                <i class="fas fa-power-off"></i>
            </button>
            <button title="Multiple user issue detected! Please open settings and choose one..."
                type="button"
                 class="tag btn btn-outline-primary btn-sm d-none"
                 id="multiUserIssue-${printer._id}"
                 disabled
            >
                <i class="fas fa-users"></i>
            </button>
            <button title="CORS is not enable on OctoPrint!"
                type="button"
                 class="tag btn btn-outline-info btn-sm d-none"
                 id="corsIssue-${printer._id}"
                 disabled
            >
                <i class="fas fa-crosshairs"></i>
            </button>
        </td>

    </tr>
    `;
}
