import OctoFarmClient from "../octofarm-client.service";
import UI from "../../utils/ui";

let filamentManagerSettings;
let filamentManagerPluginIsEnabled;
let allowMultiSelectIsEnabled;

export async function isFilamentManagerPluginSyncEnabled() {
    if(typeof filamentManagerSettings === "undefined"){
      const { filamentManager, filament: { allowMultiSelect } } = await OctoFarmClient.get("settings/server/get");
      filamentManagerPluginIsEnabled = filamentManager;
      allowMultiSelectIsEnabled = allowMultiSelect;
    }
    return { filamentManagerPluginIsEnabled, allowMultiSelectIsEnabled };
}

async function disabledFilamentManagerSync(){
  let filamentManagerDisabled = await OctoFarmClient.post("filament/disableFilamentPlugin", {
    activate: true
  });
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
  const disableFilManagerBtn = document.getElementById("disableFilamentManager");
  if(!!disableFilManagerBtn){
    disableFilManagerBtn.addEventListener("click",  () => {
      bootbox.confirm({
        message: "This will disable the filament manager plugin sync and remove all those spools from OctoFarm's database... are you sure?",
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
        callback: async function (result) {
          if(result){
            await disabledFilamentManagerSync()
            disableFilManagerBtn.disabled = true;
          }
        }
      });
    });
  }

}

export function setupFilamentManagerSyncBtn() {
  const filamentManagerSyncBtn = document.getElementById("setupFilamentManagerBtn");
  if(!!filamentManagerSyncBtn){
    filamentManagerSyncBtn.addEventListener("click", async () => {
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

}

export function setupFilamentManagerReSyncBtn() {
  const { filamentManagerPluginIsEnabled } = isFilamentManagerPluginSyncEnabled();
  if (filamentManagerPluginIsEnabled) {
    const resyncBtn = document.getElementById("resyncFilamentManagerBtn");
    resyncBtn.addEventListener("click", async () => {
      UI.addLoaderToElementsInnerHTML(resyncBtn);
      const post = await OctoFarmClient.post("filament/filamentManagerReSync");
      if(post.errors.length === 0){
        UI.createAlert(
            "success",
            `Successfully synced filament manager! <br> Profiles - Updated: ${post.updatedProfiles} / New: ${post.newProfiles} <br> Spools - Updated: ${post.updatedSpools} / New: ${post.newSpools}`,
            4000,
            "Clicked"
        );
      }else{
        let errorText = "There was an issue updating your spools and profiles! Error(s): <br>";
        errors.forEach(error => {
          errorText += error +" <br>"
        })
        UI.createAlert("error", errorText, 3000, "Clicked")
      }
      UI.removeLoaderFromElementInnerHTML(resyncBtn);
    });
  }
}

export async function returnDropDown(history) {
    let dropDownLists = await OctoFarmClient.get("filament/get/dropDownList");
    if (history) {
      return dropDownLists.selected.historyDropDown;
    } else {
      return dropDownLists.selected.normalDropDown;
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
    for (const selectedFilament of printer.selectedFilament) {
      if (!!selectedFilament) {
        element.value = selectedFilament._id;
      }
    }
  }
  element.addEventListener("change", (event) => {
    selectFilament([{ printer: printer._id, tool: toolIndex }], event.target.value);
  });
}
