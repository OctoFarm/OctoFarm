import OctoPrintClient from "./octoprint-client.service.js";
import OctoFarmClient from "../octofarm-client.service.js";
import UI from "../../utils/ui";
import bulkActionsStates from "../../pages/printer-manager/bulk-actions.constants";

const printerBase = "printers";
const printerInfoURL = "/printerInfo";

async function updateBtnOnClick(printerID) {
  let data = {
    i: printerID,
  };

  const printer = await OctoFarmClient.post(printerBase + printerInfoURL, data);

  let pluginsToUpdate = [];
  let autoSelect = [];
  const displayNameList = [];
  if (printer.octoPrintPluginUpdates.length > 0) {
    printer.octoPrintPluginUpdates.forEach((plugin) => {
      const n = plugin.releaseNotesURL.lastIndexOf("/");
      const version = plugin.releaseNotesURL.substring(n + 1);
      pluginsToUpdate.push({
        text: `${plugin.displayName} - Updating to ${version}`,
        value: plugin.id,
      });
      displayNameList.push(plugin.displayName);
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
          const pluginUpdate = await updateOctoPrintPlugins(
            result,
            printer,
            displayNameList
          );
          if (pluginUpdate.status === bulkActionsStates.SUCCESS) {
            UI.createAlert(
              "success",
              "Updates successfully fired! Please check results in Connection Log.",
              3000,
              "Clicked"
            );
            UI.createAlert(
              "warning",
              "OctoPrint will restart itself when complete...",
              3000,
              "Clicked"
            );

            await OctoFarmClient.post(
              "printers/rescanOctoPrintUpdates/" + printer._id
            );
          } else {
            UI.createAlert(
              "danger",
              "Updates failed to fire, manual intervention required!",
              3000,
              "Clicked"
            );
          }
        }
      },
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

export async function updateOctoPrintPlugins(
  pluginList,
  printer,
  displayNameList
) {
  const data = {
    targets: pluginList,
  };

  let pluginListMessage = "";

  let updateRequest = await OctoPrintClient.postNOAPI(
    printer,
    "plugin/softwareupdate/update",
    data
  );

  const body = {
    action: "OctoPrint: Update Plugins",
    opts: data,
    status: updateRequest.status,
  };

  await OctoFarmClient.updateUserActionsLog(printer._id, body);

  if (updateRequest.status === 200) {
    displayNameList.forEach((plugin) => {
      pluginListMessage += `<i class="fa-solid fa-plug text-success"></i> ${plugin} <br>`;
    });

    return {
      status: bulkActionsStates.SUCCESS,
      message: `Plugin updates successfully actioned! <br> ${pluginListMessage}`,
    };
  } else {
    displayNameList.forEach((plugin) => {
      pluginListMessage += `<i class="fa-solid fa-plug text-danger"></i> ${plugin} <br>`;
    });

    return {
      status: bulkActionsStates.ERROR,
      message: `Failed to update plugins, manual intervention required! <br> ${pluginListMessage}`,
    };
  }
}

export async function octoPrintPluginInstallAction(printer, plugin, action) {
  if (printer.printerState.colour.category !== "Active") {
    let postData = {};
    if (action === "install") {
      postData = {
        command: action.toLowerCase(),
        dependency_links: false,
        url: plugin,
      };
    } else {
      postData = {
        command: action.toLowerCase(),
        plugin: plugin,
      };
    }

    const post = await OctoPrintClient.post(
      printer,
      "plugin/pluginmanager",
      postData
    );

    const body = {
      action: `OctoPrint: ${postData.command}`,
      opts: postData,
      status: post.status,
    };
    await OctoFarmClient.updateUserActionsLog(printer._id, body);

    if (post.status === 409) {
      return {
        status: bulkActionsStates.ERROR,
        message:
          "OctoPrint reported a conflict when dealing with the request! are you printing?",
      };
    } else if (post.status === 404) {
      return {
        status: bulkActionsStates.ERROR,
        message: `OctoPrint did not ${action} the ${plugin}, could not find plugin...`,
      };
    } else if (post.status === 400) {
      return {
        status: bulkActionsStates.ERROR,
        message: `OctoPrint did not action the request, please open an issue! Error in data: ${postData}`,
      };
    } else if (post.status === 200) {
      let response = await post.json();

      if (response.needs_restart || response.needs_refresh) {
        return {
          status: bulkActionsStates.WARNING,
          message: `Your ${action} of ${plugin} was successful! Restart is required!`,
        };
      } else if (response.in_progress) {
        return {
          status: bulkActionsStates.SUCCESS,
          message: `Your ${action} of ${plugin} was actioned, please check the connection log for status!`,
        };
      } else {
        return {
          status: bulkActionsStates.SUCCESS,
          message: `Your ${action} of ${plugin} was successful! No restart required.`,
        };
      }
    }
  } else {
    return {
      status: bulkActionsStates.SKIPPED,
      message: "Skipped because your printer is currently active...",
    };
  }
}
