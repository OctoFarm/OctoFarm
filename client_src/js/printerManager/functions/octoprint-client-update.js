import OctoPrintClient from "../../lib/octoprint.js";
import UI from "../../lib/functions/ui";

export function setupUpdateOctoPrintClientBtn(printer) {
  document
    .getElementById(`octoprintUpdate-${printer._id}`)
    .addEventListener("click", async () => {
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
        callback: function (result, printer) {
          if (result) {
            updateOctoPrintClient(printer);
          }
        }
      });
    });
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
