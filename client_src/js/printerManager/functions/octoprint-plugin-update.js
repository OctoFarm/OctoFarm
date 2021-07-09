import OctoPrintClient from "../../lib/octoprint.js";
import UI from "../../lib/functions/ui";

export function setupUpdateOctoPrintPluginsBtn(printer) {
  document
    .getElementById(`octoprintPluginUpdate-${printer._id}`)
    .addEventListener("click", async () => {
      let pluginsToUpdate = [];
      let autoSelect = [];
      if (printer.octoPrintPluginUpdates.length > 0) {
        printer.octoPrintPluginUpdates.forEach((plugin) => {
          pluginsToUpdate.push({
            text: `${plugin.displayName} - Version: ${plugin.displayVersion}`,
            value: plugin.id
          });
          autoSelect.push(plugin.id);
        });
        bootbox.prompt({
          title: "Select the plugins you'd like to update below...",
          inputType: "select",
          multiple: true,
          value: autoSelect,
          inputOptions: pluginsToUpdate,
          callback: function (result, printer) {
            if (result.length > 0) {
              updateOctoPrintPlugins(result, printer);
            }
          }
        });
      } else {
        UI.createAlert(
          "info",
          "Please rescan your device as there's no plugins actually available..."
        );
      }
    });
}

export async function updateOctoPrintPlugins(result, printer) {
  const data = {
    targets: result,
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
      `${printer.printerName}: Successfully updated! your instance will restart now.`,
      3000,
      "Clicked"
    );
    let post = await OctoPrintClient.systemNoConfirm(printer, "restart");
    if (typeof post !== "undefined") {
      if (post.status === 204) {
        UI.createAlert(
          "success",
          `Successfully made restart attempt to ${printer.printerName}... You may need to Re-Sync!`,
          3000,
          "Clicked"
        );
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending restart to ${printer.printerName} are you sure it's online?`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
    }
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
  }
}
