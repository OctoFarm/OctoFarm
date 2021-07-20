import OctoFarmClient from "../octofarm_client";

export async function checkFilamentManager() {
  let settings = await OctoFarmClient.get("settings/server/get");
  settings = await settings.json();
  return settings.filamentManager;
}

export async function returnDropDown(history) {
  let dropDownLists = await OctoFarmClient.get("filament/get/dropDownList");
  if (history) {
    return dropDownLists.selected.historyDropDown;
  } else {
    return dropDownLists.selected.normalDropDown;
  }
}

export async function selectFilament(printerId, spoolId, tool) {
  const data = {
    tool,
    printerId,
    spoolId
  };
  const changedFilament = await OctoFarmClient.post("filament/select", data);
}
