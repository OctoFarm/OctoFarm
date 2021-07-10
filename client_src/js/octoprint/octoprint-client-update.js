import OctoPrintClient from "../lib/octoprint.js";
import UI from "../lib/functions/ui";
import OctoFarmClient from "../lib/octofarm_client";

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

async function updateBtnOnClick(printerID) {
  try {
    let data = {
      i: printerID
    };

    const printer = await OctoFarmClient.post(
      printerBase + printerInfoURL,
      data
    );

    bootbox.confirm({
      message: "This will tell OctoPrint to update, are you sure?",
      buttons: {
        confirm: {
          label: "Yes",
          className: "btn-success"
        },
        cancel: {
          label: "No",
          className: "btn-danger"
        }
      },
      callback: async function (result, printer) {
        if (result) {
          await updateOctoPrintClient(printer);
        }
      }
    });
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Unable to grab latest printer information: ${e}`,
      0,
      "clicked"
    );
  }
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
    force: true
  };
  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );
  if (updateRequest.status === 200) {
    UI.createAlert(
      "success",
      `${printer.printerName}: Update command fired, you may need to restart OctoPrint once complete.`,
      3000,
      "Clicked"
    );
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}
