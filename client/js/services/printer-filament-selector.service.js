import OctoFarmClient from "./octofarm-client.service";
import { isFilamentManagerPluginSyncEnabled } from "./octoprint/filament-manager-plugin.service";
import { selectFilament } from "../pages/filament-manager/filament-manager.actions";

const dropDownListTemplate = (spool, multiSelect) => {
  const {
    spoolID,
    spoolName,
    spoolRemain,
    spoolMaterial,
    spoolManufacturer,
    selected,
  } = spool;
  let disabled = "";
  if (selected && !multiSelect) {
    disabled = "disabled";
  }
  if (multiSelect) {
    return `
        <option value="${spoolID}" ${disabled}>${spoolName} - ${spoolMaterial} (${spoolManufacturer})</option>
    `;
  } else {
    return `
        <option value="${spoolID}" ${disabled}>${spoolName} (${spoolRemain}g) - ${spoolMaterial} (${spoolManufacturer})</option>
    `;
  }
};

export const findBigFilamentDropDowns = () => {
  return document.querySelectorAll("[id$=bigFilamentSelect]");
};

export const findMiniFilamentDropDownsSelect = (printerID, toolIndex) => {
  return document.getElementById(
    `tool-${printerID}-${toolIndex}-miniFilamentSelect`
  );
};

export const returnBigFilamentSelectorTemplate = (
  toolNumber,
  printerID = undefined
) => {
  let toolID = toolNumber;
  if (!!printerID) {
    toolID = `${printerID}-${toolNumber}`;
  }
  return `
      <div class="md-form input-group mb-3">
        <div title="Actual Tool temperature" class="input-group-prepend">
            <span class="input-group-text"><span>${toolNumber}: </span></span>
        </div>
        <select class="custom-select bg-secondary text-light" id="tool-${toolID}-bigFilamentSelect"></select>
      </div>
    `;
};

export const returnMiniFilamentSelectorTemplate = (printerID, toolNumber) => {
  return `
        <div class="input-group input-group-sm btn-block m-0">
            <div class="input-group-prepend">
                <label class="input-group-text" for="tool-${printerID}-${toolNumber}-miniFilamentSelect"><b>Tool ${toolNumber} </b></label>
            </div>
            <select class="custom-select bg-secondary text-light" id="tool-${printerID}-${toolNumber}-miniFilamentSelect"></select>
            <div class="input-group-append">
                <label id="${printerID}-temperature-${toolNumber}" class="input-group-text" for="tool-${printerID}-${toolNumber}-miniFilamentSelect">
                    <i class="far fa-circle "></i> 0°C <i class="fas fa-bullseye"></i> 0°C</label>
            </div>
        </div>
    `;
};

export async function returnDropDownList() {
  const { dropDownList } = await OctoFarmClient.get(
    "filament/get/dropDownList"
  );
  return dropDownList;
}

export async function fillMiniFilamentDropDownList(
  element,
  printer,
  toolIndex,
  dropDownList
) {
  await redrawMiniFilamentDropDownList(element, printer, toolIndex, dropDownList);
  element.addEventListener("change", async (event) => {
    await selectFilament([`${printer._id}-${toolIndex}`], event.target.value);
    await redrawMiniFilamentDropDownList(element, printer, toolIndex, dropDownList);
  });
}

async function redrawMiniFilamentDropDownList(element, printer, toolIndex, filamentDropDown) {
  element.innerHTML = "";
  const { allowMultiSelectIsEnabled } =
    await isFilamentManagerPluginSyncEnabled();
  element.insertAdjacentHTML(
    "beforeend",
    '<option value="0">No Spool</option>'
  );
  filamentDropDown.forEach((spool) => {
    element.insertAdjacentHTML(
      "beforeend",
      dropDownListTemplate(spool, allowMultiSelectIsEnabled)
    );
  });
  const { _id: printerID } = printer;
  const selectedFilament = await OctoFarmClient.getSelectedFilament(printerID);
  if (Array.isArray(selectedFilament) && selectedFilament.length !== 0) {
    if (!!selectedFilament[toolIndex]) {
      element.value = selectedFilament[toolIndex]._id;
    }
  }
}

async function redrawFilamentDropDownList(element, printer, toolIndex) {
  element.innerHTML = "";
  const filamentDropDown = await returnDropDownList();
  const { allowMultiSelectIsEnabled } =
    await isFilamentManagerPluginSyncEnabled();
  element.insertAdjacentHTML(
      "beforeend",
      '<option value="0">No Spool</option>'
  );
  filamentDropDown.forEach((spool) => {
    element.insertAdjacentHTML(
      "beforeend",
      dropDownListTemplate(spool, allowMultiSelectIsEnabled)
    );
  });
  const { _id: printerID } = printer;
  const selectedFilament = await OctoFarmClient.getSelectedFilament(printerID);
  if (Array.isArray(selectedFilament) && selectedFilament.length !== 0) {
    if (!!selectedFilament[toolIndex]) {
      element.value = selectedFilament[toolIndex]._id;
    }
  }
}

export async function drawHistoryDropDown(element, selectedID) {
  element.innerHTML = "";
  const filamentDropDown = await returnDropDownList();
  element.insertAdjacentHTML(
      "beforeend",
      '<option value="0">No Spool</option>'
  );
  filamentDropDown.forEach((spool) => {
    element.insertAdjacentHTML("beforeend", dropDownListTemplate(spool, true));
  });
  if (!!selectedID) {
    element.value = selectedID;
  } else {
    element.value = "0";
  }
}

export async function fillFilamentDropDownList(element, printer, toolIndex) {
  await redrawFilamentDropDownList(element, printer, toolIndex);
  element.addEventListener("change", async (event) => {
    await selectFilament([`${printer._id}-${toolIndex}`], event.target.value);
    await redrawFilamentDropDownList(element, printer, toolIndex);
  });
}
