import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../utils/ui";

let settings;

export async function checkFilamentManager() {
  if (!settings) {
    settings = await OctoFarmClient.get("settings/server/get");
  }
  return settings.filamentManager;
}

export async function isFilamentManagerPluginSyncEnabled() {
  try {
    const systemSettings = await OctoFarmClient.get("settings/server/get");
    return systemSettings.filamentManager;
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      "There was an issue contacting the server, please check your logs",
      3000
    );
  }
}

export function setupFilamentManagerDisableBtn() {
  const disableFilManagerBtn = document.getElementById("disable-FilamentManager");
  disableFilManagerBtn.addEventListener("click", async (event) => {
    let filamentManagerDisabled = await OctoFarmClient.post("filament/disableFilamentPlugin", {
      activate: true
    });
    if (filamentManagerDisabled) {
      UI.createAlert(
        "success",
        "Successfully disabled filament manager and removed all spools / profiles.",
        3000
      );
    } else {
      UI.createAlert(
        "error",
        "Unable to disable filament manager please check the filament manager logs.",
        3000
      );
    }
  });
}

export function setupFilamentManagerSyncBtn() {
  const filamentManagerSyncBtn = document.getElementById("resyncFilamentManagerBtn");
  filamentManagerSyncBtn.addEventListener("click", async (event) => {
    UI.addLoaderToElementsInnerHTML(filamentManagerSyncBtn);
    filamentManagerSyncBtn.disabled = true;
    const filamentManagerAlert = UI.createAlert(
      "info",
      "Enabling filament manager plugin sync... Please wait whilst checks have finished!"
    );
    const filamentManagerSyncEnabled = await OctoFarmClient.post("filament/filamentManagerSync", {
      activate: true
    });

    if (filamentManagerSyncEnabled.errors.length > 0) {
      filamentManagerAlert.close();
      UI.removeLoaderFromElementInnerHTML(filamentManagerSyncBtn);
      filamentManagerSyncBtn.disabled = false;
      filamentManagerSyncEnabled.errors.forEach((error) => {
        UI.createAlert("error", error.msg, 0, "Clicked");
      });
    } else if (filamentManagerSyncEnabled.warnings.length > 0) {
      filamentManagerAlert.close();
      UI.removeLoaderFromElementInnerHTML(filamentManagerSyncBtn);
      filamentManagerSyncEnabled.warnings.forEach((error) => {
        UI.createAlert("warning", error.msg, 0, "Clicked");
        UI.createAlert(
          "success",
          `Filament Manager Plugin has been enabled regardless of the warnings! <br> Profiles: ${filamentManagerSyncEnabled.profileCount} <br> Spools: ${filamentManagerSyncEnabled.spoolCount}`,
          0,
          "Clicked"
        );
      });
    } else {
      filamentManagerAlert.close();
      UI.createAlert(
        "success",
        `Filament Manager Plugin has been enabled and synced!  <br> Profiles: ${filamentManagerSyncEnabled.profileCount} <br> Spools: ${filamentManagerSyncEnabled.spoolCount}`,
        0,
        "Clicked"
      );
      UI.removeLoaderFromElementInnerHTML(filamentManagerSyncBtn);
    }
  });
}

export function setupFilamentManagerReSyncBtn() {
  const filamentManagerEnabled = isFilamentManagerPluginSyncEnabled();
  if (filamentManagerEnabled) {
    const resyncBtn = document.getElementById("resyncFilamentManagerBtn");
    resyncBtn.addEventListener("click", async (e) => {
      UI.addLoaderToElementsInnerHTML(resyncBtn);
      const post = await OctoFarmClient.post("filament/filamentManagerReSync");
      UI.createAlert(
        "success",
        `Successfully synced filament manager! <br> Profiles - Updated: ${post.updatedProfiles} / New: ${post.newProfiles} <br> Spools - Updated: ${post.updatedSpools} / New: ${post.newSpools}`,
        4000,
        "Clicked"
      );
      UI.removeLoaderFromElementInnerHTML(resyncBtn);
    });
  }
}

export async function returnDropDown(history) {
  try {
    let dropDownLists = await OctoFarmClient.get("filament/get/dropDownList");
    if (history) {
      return dropDownLists.selected.historyDropDown;
    } else {
      return dropDownLists.selected.normalDropDown;
    }
  } catch (e) {
    console.error(e);
    UI.createAlert("error", "Issue contacting server, please check the logs...");
  }
}

export async function selectFilament(printers, spoolId) {
  const data = {
    printers,
    spoolId
  };
  try {
    await OctoFarmClient.post("filament/assign", data);
  } catch (e) {
    UI.createAlert("error", "Issue changing your spool, please check the logs...");
  }
}

export async function createFilamentSelector(element, printer, toolIndex) {
  element.innerHTML = "";
  const filamentDropDown = await returnDropDown();
  filamentDropDown.forEach((filament) => {
    element.insertAdjacentHTML("beforeend", filament);
  });
  if (Array.isArray(printer.selectedFilament) && printer.selectedFilament.length !== 0) {
    for (let i = 0; i < printer.selectedFilament.length; i++) {
      if (!!printer.selectedFilament[i]) {
        element.value = printer.selectedFilament[i]._id;
      }
    }
  }
  element.addEventListener("change", (event) => {
    selectFilament([{ printer: printer._id, tool: toolIndex }], event.target.value);
  });
}
