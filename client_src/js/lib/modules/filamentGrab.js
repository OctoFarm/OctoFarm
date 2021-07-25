import OctoFarmClient from "../../services/octofarm-client.service";

export async function checkFilamentManager() {
  let settings = await OctoFarmClient.get("settings/server/get");
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
  await OctoFarmClient.post("filament/select", data);
}
