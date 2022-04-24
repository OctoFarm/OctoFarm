import OctoPrintClient from "../octoprint-client.service.js";
import OctoFarmClient from "../octofarm-client.service.js";
import UI from "../../utils/ui";
import bulkActionsStates from "../../pages/printer-manager/bulk-actions.constants";

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

async function updateBtnOnClick(printerID) {
    let data = {
      i: printerID
    };

    const printer = await OctoFarmClient.post(printerBase + printerInfoURL, data);

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
        callback: async function (result) {
          if (result && result.length > 0) {
            await updateOctoPrintPlugins(result, printer);
          }
        }
      });
    } else {
      UI.createAlert(
        "info",
        "Please rescan your device as there's no plugins actually available..."
      );
    }
}

export function setupUpdateOctoPrintPluginsBtn(printer) {
  const octoPrintClientPluginUpdateBtn = document.getElementById(
    `octoprintPluginUpdate-${printer._id}`
  );
  if (octoPrintClientPluginUpdateBtn) {
    octoPrintClientPluginUpdateBtn.addEventListener("click", async () => {
      await updateBtnOnClick(printer._id);
    });
  }
}

export async function updateOctoPrintPlugins(pluginList, printer) {
  const data = {
    targets: pluginList,
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
        return {
          status: bulkActionsStates.SUCCESS,
          message: "Update command fired and instance restart start command sent!"
        };
      } else {
        UI.createAlert(
          "error",
          `There was an issue sending restart to ${printer.printerName} are you sure it's online?`,
          3000,
          "Clicked"
        );
        return {
          status: bulkActionsStates.WARNING,
          message: "Update command fired, but unable to restart instance, please do this manually!"
        };
      }
    } else {
      UI.createAlert(
        "error",
        `No response from ${printer.printerName}, is it online???`,
        3000,
        "Clicked"
      );
      return {
        status: bulkActionsStates.ERROR,
        message: "Could not contact OctoPrint, is it online?"
      };
    }
  } else {
    UI.createAlert(
      "error",
      `${printer.printerName}: Failed to update, manual intervention required!`,
      3000,
      "Clicked"
    );
    return {
      status: bulkActionsStates.ERROR,
      message: "Failed to update, manual intervention required!"
    };
  }
}

export async function octoPrintPluginInstallAction(printer, pluginList, action) {
  let cleanAction = JSON.stringify(action.charAt(0).toUpperCase() + action.slice(1));
  if (action === "install") {
    cleanAction = cleanAction + "ing";
  }

  if (printer.printerState.colour.category !== "Active") {
    for (const plugin of pluginList) {
      let alert = UI.createAlert(
        "warning",
        `${printer.printerName}: ${cleanAction} - ${plugin}<br>Do not navigate away from this screen!`
      );
      let postData = {};
      if (action === "install") {
        postData = {
          command: action.toLowerCase(),
          dependency_links: false,
          url: plugin
        };
      } else {
        postData = {
          command: action.toLowerCase(),
          plugin: plugin
        };
      }

      const post = await OctoPrintClient.post(printer, "plugin/pluginmanager", postData);
      alert.close();
      if (post.status === 409) {
        return {
          status: bulkActionsStates.ERROR,
          message: "OctoPrint reported a conflict when dealing with the request! are you printing?"
        };
      } else if (post.status === 400) {
        return {
          status: bulkActionsStates.ERROR,
          message: `OctoPrint did not action the request, please open an issue! Error in data: ${postData}`
        };
      } else if (post.status === 200) {
        let response = await post.json();

        if (response.needs_restart || response.needs_refresh) {
          return {
            status: bulkActionsStates.WARNING,
            message: "Your plugins we're installed successfully! Restart is required!"
          };
        } else if (response.in_progress) {
          return {
            status: bulkActionsStates.SUCCESS,
            message: "Your install was actioned, please check the connection log for status!"
          };
        } else {
          return {
            status: bulkActionsStates.SUCCESS,
            message: "Your plugins we're installed successfully! No restart required."
          };
        }
      }
    }
  } else {
    return {
      status: bulkActionsStates.SKIPPED,
      message: "Skipped because your printer is currently active..."
    };
  }
}
