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

export const returnBigFilamentSelectorTemplate = (toolNumber) => {
    return `
      <div class="md-form input-group mb-3">
        <div title="Actual Tool temperature" class="input-group-prepend">
            <span class="input-group-text"><span>${toolNumber}: </span></span>
        </div>
        <select class="custom-select bg-secondary text-light" id="tool-${toolNumber}-bigFilamentSelect"><option value="" selected></option></select>
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

export async function fillFilamentDropDownList(element, printer, toolIndex) {
    element.innerHTML = "";
    const filamentDropDown = await returnDropDownList();
    const { allowMultiSelectIsEnabled } = await isFilamentManagerPluginSyncEnabled();
    element.insertAdjacentHTML("beforeend", filamentDropDown[0]);
    filamentDropDown.shift();
    filamentDropDown.forEach((spool) => {
        element.insertAdjacentHTML("beforeend", dropDownListTemplate(spool, allowMultiSelectIsEnabled));
    });
    if (Array.isArray(printer.selectedFilament) && printer.selectedFilament.length !== 0) {
        for (const selectedFilament of printer.selectedFilament) {
            if (!!selectedFilament) {
                element.value = selectedFilament._id;
            }
        }
    }
    element.addEventListener("change", (event) => {
        selectFilament([`${printer._id}-${toolIndex}`], event.target.value);
    });
}
