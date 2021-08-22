import OctoFarmClient from "../services/octofarm-client.service";
import UI from "../lib/functions/ui";

export async function isFilamentManagerPluginSyncEnabled() {
  let serverSettings = await OctoFarmClient.getServerSettings();
  return serverSettings.filamentManager;
}

export function setupFilamentManagerSyncBtn() {
  const filamentManagerSyncBtn = document.getElementById("resyncFilamentManagerBtn");
  filamentManagerSyncBtn.addEventListener("click", async (event) => {
    UI.addLoaderToElementsInnerHTML(filamentManagerSyncBtn);
    filamentManagerSyncBtn.disabled = true;
    const filamentManagerSyncEnabled = await OctoFarmClient.syncFilamentManager({
      activate: true
    });
    if (filamentManagerSyncEnabled) {
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
    UI.removeLoaderFromElementInnerHTML(filamentManagerSyncBtn);
    filamentManagerSyncBtn.disabled = false;
  });
}

export async function setupFilamentManagerReSyncBtn() {
  const filamentManagerEnabled = await checkFilamentManager();
  if (filamentManagerEnabled) {
    const resyncBtn = document.getElementById("resyncFilamentManagerBtn");
    resyncBtn.addEventListener("click", async (e) => {
      UI.addLoaderToElementsInnerHTML(resyncBtn);
      const post = await OctoFarmClient.reSyncFilamentManager();
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

// re-enable at some point
// export async function returnSelected(id, profiles) {
//   console.log("Return Selected");
//   let profileId = null;
//   const filamentManager = await checkFilamentManager();
//   if (filamentManager) {
//     profileId = _.findIndex(profiles, function (o) {
//       return o.profile.index == id.spools.profile;
//     });
//   } else {
//     profileId = _.findIndex(profiles, function (o) {
//       return o._id == id.spools.profile;
//     });
//   }
//   return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(
//     0
//   )}g) - ${profiles[profileId].profile.material}`;
// }

export async function returnDropDown(history) {
  try {
    let dropDownLists = await OctoFarmClient.getFilamentDropDownList();
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

export async function selectFilament(printerId, spoolId, tool) {
  const data = {
    tool,
    printerId,
    spoolId
  };
  try {
    await OctoFarmClient.selectFilament(data);
  } catch (e) {
    UI.createAlert("error", "Issue changing your spool, please check the logs...");
  }
}
