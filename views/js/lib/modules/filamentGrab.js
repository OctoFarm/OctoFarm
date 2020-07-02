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
export async function returnHistory(id) {
    let filamentManager = await checkFilamentManager();
    if(id.spools !== undefined){
        if(filamentManager){
            return `${id.spools.name} (${(id.spools.weight - id.spools.used).toFixed(0)}g) - ${id.spools.profile.material}`
        }else{
            return `${id.spools.name} - ${id.spools.profile.material}`
        }
    }else{
        return `Old database, please update on the view modal.`
    }

}
export function returnHistoryUsage(id){
    if(typeof id.filamentSelection.spools !== 'undefined'){
        if(id.job.filament === null) {
            id.job.filament = {
                tool0: {
                    length: 0
                }
            }
        }
        let length = id.job.filament.tool0.length / 1000
        if(length === 0){
            return ''
        }else{
            let radius = parseFloat(id.filamentSelection.spools.profile.diameter) / 2
            let volume = (length * Math.PI * radius * radius)
            let usage = volume * parseFloat(id.filamentSelection.spools.profile.density)
            return length.toFixed(2) + "m / " + usage.toFixed(2) + "g";
        }

    }else{
        return ``
    }

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
        if(profiles.filamentManager){
            profileId = _.findIndex(profiles.profiles, function (o) {
                return o.profile.index == spool.spools.profile;
            });
        }else{
            profileId = _.findIndex(profiles.profiles, function (o) {
                return o._id == spool.spools.profile;
            });
        }
        if(spool.spools.weight - spool.spools.used > 0){
            let index = _.findIndex(selected.selected, function(o) {
                return o == spool._id;
            });
            if(index > -1 && !history){
                if(filamentManager){
                    dropObject.push(`
                    <option value="${spool._id}" disabled>${spool.spools.name} (${(spool.spools.weight - spool.spools.used).toFixed(2)}g) - ${profiles.profiles[profileId].profile.material}</option>
                `)
                }else{
                    dropObject.push(`
                    <option value="${spool._id}">${spool.spools.name} - ${profiles.profiles[profileId].profile.material}</option>
                `)
                }

            }else{
                if(filamentManager){
                    dropObject.push(`
                    <option value="${spool._id}">${spool.spools.name} (${(spool.spools.weight - spool.spools.used).toFixed(2)}g) - ${profiles.profiles[profileId].profile.material}</option>
                `)
                }else{
                    dropObject.push(`
                    <option value="${spool._id}">${spool.spools.name} - ${profiles.profiles[profileId].profile.material}</option>
                `)
                }

            }

        }

    })
    return dropObject
}

export async function selectFilament(printerId, spoolId){
    let data = {
        printerId: printerId,
        spoolId: spoolId
    }
    let changedFilament = await OctoFarmclient.post("filament/select", data)
}

