import OctoFarmclient from "../octofarm.js";

let filamentManager = null;

export async function checkFilamentManager(){
    let settings = await OctoFarmclient.get("settings/server/get");
    settings = await settings.json();
    return settings.filamentManager;
}

export async function loadFilament(spoolId){
    let filament = await OctoFarmclient.get("filament/get/filament")
    filament = await filament.json();
    return filament;
}
export async function getProfile(spoolId){
    let profile = await OctoFarmclient.get("filament/get/profile")
    profile = await profile.json();
    return profile;
}
export async function getSelected(){
    let selected = await OctoFarmclient.get("filament/get/selected")
    selected = await selected.json();
    return selected;
}

export async function returnSelected(id, profiles) {

    let profileId = null;
    let filamentManager = await checkFilamentManager();
    if (filamentManager) {
        profileId = _.findIndex(profiles, function (o) {
            return o.profile.index == id.spools.profile;
        });
    } else {
        profileId = _.findIndex(profiles, function (o) {
            return o._id == id.spools.profile;
        });
    }
    return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(0)}g) - ${profiles[profileId].profile.material}`
}
export async function returnDropDown(history){
    let spools = await loadFilament();
    let profiles = await getProfile();
    let selected = await getSelected();
    let dropObject = [];
    let filamentManager = await checkFilamentManager();
    dropObject.push(`
                    <option value="0">No Spool Selected</option>
                `)
    spools.Spool.forEach(spool => {
        let profileId = null;
        profileId = _.findIndex(profiles.profiles, function (o) {
            return o._id == spool.profile;
        });
        console.log(profileId)
        if(spool.weight - spool.used > 0){
            let index = _.findIndex(selected.selected, function(o) {
                return o == spool._id;
            });
            if(index > -1 && !history){
                if(filamentManager){
                    dropObject.push(`
                    <option value="${spool._id}" disabled>${spool.name} (${(spool.weight - spool.used).toFixed(2)}g) - ${profiles.profiles[profileId].material}</option>
                `)
                }else{
                    dropObject.push(`
                    <option value="${spool._id}">${spool.name} - ${profiles.profiles[profileId].material}</option>
                `)
                }

            }else{
                if(filamentManager){
                    dropObject.push(`
                    <option value="${spool._id}">${spool.name} (${(spool.weight - spool.used).toFixed(2)}g) - ${profiles.profiles[profileId].material}</option>
                `)
                }else{
                    dropObject.push(`
                    <option value="${spool._id}">${spool.name} - ${profiles.profiles[profileId].material}</option>
                `)
                }

            }

        }

    })
    return dropObject
}

export async function selectFilament(printerId, spoolId, tool){
    let data = {
        tool: tool,
        printerId: printerId,
        spoolId: spoolId
    }
    let changedFilament = await OctoFarmclient.post("filament/select", data)
}

