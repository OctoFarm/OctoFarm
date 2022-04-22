import OctoFarmClient from "./octofarm-client.service";
import {isFilamentManagerPluginSyncEnabled} from "./octoprint/filament-manager-plugin.service";
import { selectFilament } from "../pages/filament-manager/filament-manager.actions"

const dropDownListTemplate = (spool, multiSelect) => {
    const { spoolID, spoolName, spoolRemain, spoolMaterial, spoolManufacturer, selected } = spool;
    let disabled;
    if(selected && !multiSelect){
        disabled = "disabled"
    }
    if(multiSelect){
        return `
        <option value="${spoolID}" ${disabled}>${spoolName} (${spoolManufacturer})</option>
    `
    }else{
        return `
        <option value="${spoolID}" ${disabled}>${spoolName} (${spoolRemain}g) - ${spoolMaterial} (${spoolManufacturer})</option>
    `
    }

}

export const findBigFilamentDropDowns = () => {
    return document.querySelectorAll("[id$=bigFilamentSelect]")
}

const findMiniFilamnetDropDowns = () => {
    return document.querySelectorAll("[id$=miniFilamentSelect]")
}

export const returnBigFilamentSelectorTemplate = (toolNumber, printerID = undefined) => {
    let toolID = toolNumber
    if(!!printerID){
        toolID = `${printerID}-${toolNumber}`
    }
    return `
      <div class="md-form input-group mb-3">
        <div title="Actual Tool temperature" class="input-group-prepend">
            <span class="input-group-text"><span>${toolNumber}: </span></span>
        </div>
        <select class="custom-select bg-secondary text-light" id="tool-${toolID}-bigFilamentSelect"><option value="" selected></option></select>
      </div>
    `
}

const returnMiniFilamentSelectorTemplate = () => {
    return `
    
    `
}

export const setupListenersForFilamentDropDowns = () => {

}

export async function returnDropDownList() {
    const { dropDownList } = await OctoFarmClient.get("filament/get/dropDownList");
    return dropDownList
}

async function redrawFilamentDropDownList (element, printer){
    element.innerHTML = "";
    const filamentDropDown = await returnDropDownList();
    const { allowMultiSelectIsEnabled } = await isFilamentManagerPluginSyncEnabled();
    element.insertAdjacentHTML("beforeend", filamentDropDown[0]);
    filamentDropDown.shift();
    filamentDropDown.forEach((spool) => {
        element.insertAdjacentHTML("beforeend", dropDownListTemplate(spool, allowMultiSelectIsEnabled));
    });
    const { _id: printerID } = printer;
    const selectedFilament = await OctoFarmClient.getSelectedFilament(printerID);
    if (Array.isArray(selectedFilament) && selectedFilament.length !== 0) {
        for (const spool of selectedFilament) {
            if (!!spool) {
                element.value = spool._id;
            }
        }
    }
}

export async function fillFilamentDropDownList(element, printer, toolIndex) {
    await redrawFilamentDropDownList(element, printer)
    element.addEventListener("change", async (event) => {
        await selectFilament([`${printer._id}-${toolIndex}`], event.target.value);
        await redrawFilamentDropDownList(element, printer)
    });
}
