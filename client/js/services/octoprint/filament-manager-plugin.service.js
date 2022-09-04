import OctoFarmClient from "../octofarm-client.service";
import UI from "../../utils/ui";
import {reRenderPageInformation} from "../../pages/filament-manager/filament-manager-ui.utils";

let filamentManagerSettings = {};

const syncFilamentManagerButton = `
        <button id="setupFilamentManagerSyncBtn" type="button"
                class="btn btn-warning text-dark mb-1 btn-lg"><i
                    class="fas fa-sync"></i><br> Enable Filament Manager Plugin Sync
        </button>
    `
const disabledFilamentManagerButton = `
       <button id="disableFilamentManager" type="button" class="btn btn-danger mb-1 btn-lg"><i class="fas fa-skull-crossbones"></i><br>
                        Disable Filament Manager
      </button>
`

const filamentManagerSyncDiv = document.getElementById(
    "filamentManagerButton"
);

export async function isFilamentManagerPluginSyncEnabled() {
  if (_.isEmpty(filamentManagerSettings)) {
    const {
      filamentManager,
      filament: { allowMultiSelect },
    } = await OctoFarmClient.get("settings/server/get");
    filamentManagerSettings.filamentManagerPluginIsEnabled = filamentManager;
    filamentManagerSettings.allowMultiSelectIsEnabled = allowMultiSelect;
  }
  return {
    filamentManagerPluginIsEnabled:
      filamentManagerSettings.filamentManagerPluginIsEnabled,
    allowMultiSelectIsEnabled:
      filamentManagerSettings.allowMultiSelectIsEnabled,
  };
}

async function disabledFilamentManagerSync() {
  let filamentManagerDisabled = await OctoFarmClient.post(
    "filament/disableFilamentPlugin",
    {
      activate: true,
    }
  );
  if (filamentManagerDisabled) {
    UI.createAlert(
      "success",
      "Successfully disabled filament manager and removed all spools / profiles from OctoFarm.",
      3000
    );
  } else {
    UI.createAlert(
      "error",
      "Unable to disable filament manager please check the filament manager logs.",
      3000
    );
  }
}

export function setupFilamentManagerDisableBtn() {
  if (!!filamentManagerSyncDiv) {
    filamentManagerSyncDiv.innerHTML = disabledFilamentManagerButton;
    const disableFilManagerBtn = document.getElementById(
        "disableFilamentManager"
    );
    disableFilManagerBtn.addEventListener("click", () => {
      bootbox.confirm({
        message:
          "This will disable the filament manager plugin sync and remove all those spools from OctoFarm's database... are you sure?",
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
            await disabledFilamentManagerSync();
            disableFilManagerBtn.disabled = true;
          }
        },
      });
    });
  }
}

export function setupFilamentManagerSyncBtn() {
  if (!!filamentManagerSyncDiv) {
    filamentManagerSyncDiv.innerHTML = syncFilamentManagerButton;
    const filamentManagerSyncBtn = document.getElementById("setupFilamentManagerSyncBtn");
    filamentManagerSyncBtn.addEventListener("click", async () => {
      UI.addLoaderToElementsInnerHTML(filamentManagerSyncBtn);
      filamentManagerSyncBtn.disabled = true;
      const filamentManagerAlert = UI.createAlert(
        "info",
        "Enabling filament manager plugin sync... Please wait whilst checks have finished!"
      );
      const filamentManagerSyncEnabled = await OctoFarmClient.post(
        "filament/filamentManagerSync",
        {
          activate: true,
        }
      );

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
}

export async function setupFilamentManagerReSyncBtn() {
  const { filamentManagerPluginIsEnabled } =
    await isFilamentManagerPluginSyncEnabled();
  if (filamentManagerPluginIsEnabled) {
    const resyncBtn = document.getElementById("resyncFilamentManagerBtn");
    resyncBtn.addEventListener("click", async () => {
      UI.addLoaderToElementsInnerHTML(resyncBtn);
      const post = await OctoFarmClient.post("filament/filamentManagerReSync");
      console.log("HELLO")
      console.log(post)
      if (post.errors.length === 0) {
        UI.createAlert(
          "success",
          `Successfully synced filament manager! <br> Profiles - Updated: ${post.updatedProfiles} / New: ${post.newProfiles} <br> Spools - Updated: ${post.updatedSpools} / New: ${post.newSpools}`,
          4000,
          "Clicked"
        );
        await reRenderPageInformation();
      } else {
        let errorText =
          "There was an issue updating your spools and profiles! Error(s): <br>";
        errors.forEach((error) => {
          errorText += error + " <br>";
        });
        UI.createAlert("error", errorText, 3000, "Clicked");
      }
      UI.removeLoaderFromElementInnerHTML(resyncBtn);
    });
  }
}
