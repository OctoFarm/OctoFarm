import OctoFarmClient from "../octofarm_client";

export async function checkFilamentManager() {
  let settings = await OctoFarmClient.get("settings/server/get");
  settings = await settings.json();
  return settings.filamentManager;
}

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
  let dropDownLists = await OctoFarmClient.get("filament/get/dropDownList");
  dropDownLists = await dropDownLists.json();
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
