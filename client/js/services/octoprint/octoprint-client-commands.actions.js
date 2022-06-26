import OctoPrintClient from "./octoprint-client.service.js";
import UI from "../../utils/ui";
import OctoFarmClient from "../octofarm-client.service";
import bulkActionsStates from "../../pages/printer-manager/bulk-actions.constants";
import {printStartSequence} from "./octoprint-helpers.service";
import {printerIsIdle} from "../../utils/octofarm.utils";

async function updateBtnOnClick(printerID) {
  const printer = await OctoFarmClient.getPrinter(printerID);
  bootbox.confirm({
    message: "This will tell OctoPrint to update, are you sure?",
    buttons: {
      confirm: {
        label: "Yes",
        className: "btn-success",
      },
      cancel: {
        label: "No",
        className: "btn-danger",
      },
    },
    callback: async function (result) {
      if (result) {
        await updateOctoPrintClient(printer);
      }
    },
  });
}

export function setupUpdateOctoPrintClientBtn(printer) {
  const octoPrintClientUpdateBtn = document.getElementById(
    `octoprintUpdate-${printer._id}`
  );
  if (octoPrintClientUpdateBtn) {
    octoPrintClientUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintClient(printer) {
  const data = {
    targets: ["octoprint"],
    force: true,
  };
  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );

  const body = {
    action: "OctoPrint: Update Client",
    opts: data,
    status: updateRequest.status,
  };

  await OctoFarmClient.updateUserActionsLog(printer._id, body);

  if (updateRequest.status === 200) {
    UI.createAlert("success", "Update command fired!", 3000, "clicked");
    return {
      status: bulkActionsStates.SUCCESS,
      message:
        "Update command fired, you may need to restart OctoPrint once complete.",
    };
  } else {
    UI.createAlert(
      "success",
      "OctoPrint responded with a status of: " +
        post.status +
        "... there may be bugs on your instance!",
      3000,
      "clicked"
    );
    return {
      status: bulkActionsStates.ERROR,
      message:
        "OctoPrint responded with a status of: " +
        post.status +
        "... there may be bugs on your instance!",
    };
  }
}

export async function quickConnectPrinterToOctoPrint(printer) {
  const status = await printStartSequence(printer);
  if (printer.printerState.colour.category === "Disconnected") {
    if (!!status) {
      if (status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: "Connection attempt was successful!",
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message:
            "OctoPrint responded with a status of: " +
            status +
            "... please check your connection values in the printer settings modal.",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Couldn't contact OctoPrint, is it online?",
      };
    }
  } else {
    return {
      status: bulkActionsStates.SKIPPED,
      message:
        "Skipped connecting because printer wasn't in disconnected state...",
    };
  }
}

export async function disconnectPrinterFromOctoPrint(printer) {
  let data = {
    command: "disconnect",
  };
  if (printerIsIdle(printer)) {
    let post = await OctoPrintClient.post(printer, "connection", data);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: "Disconnect attempt was successful!",
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message:
            "OctoPrint responded with a status of: " +
            post.status +
            "... please check your connection values in the printer settings modal.",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Couldn't contact OctoPrint, is it online?",
      };
    }
  } else {
    return {
      status: bulkActionsStates.SKIPPED,
      message: "Skipped because printer wasn't in idle state...",
    };
  }
}

export async function sendPowerCommandToOctoPrint(printer, powerCommand) {
  let returnMessage = "Your OctoPrint instance will " + powerCommand;
  const hostTerm = ["reboot", "shutdown"];
  if(hostTerm.includes(powerCommand)){
    returnMessage = "Your OctoPrint host will " + powerCommand;
  }
  if (printer.printerState.colour.category !== "Active") {
    let post = await OctoPrintClient.systemNoConfirm(printer, powerCommand);
    await UI.delay(1000);
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: returnMessage,
        };
      } else {
        return {
          status: bulkActionsStates.ERROR,
          message:
            "OctoPrint responded with a status of: " +
            post.status +
            "... please check your power settings in the printer settings modal",
        };
      }
    } else {
      return {
        status: bulkActionsStates.ERROR,
        message: "Couldn't contact OctoPrint, is it online?",
      };
    }
  } else {
    return {
      status: bulkActionsStates.SKIPPED,
      message: "Skipped because printer wasn't in idle state...",
    };
  }
}
