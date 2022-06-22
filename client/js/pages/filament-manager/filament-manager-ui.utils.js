import UI from "../../utils/ui";
import OctoFarmClient from "../../services/octofarm-client.service";
import {
  loadOverviewTable,
  loadPageStatistics,
  renderMaterialsList,
  renderProfilesManagerTable,
  renderSpoolsManagerTable,
} from "./filament-manager.utils";

export const printErrors = (errors) => {
  let errorMessage = "OctoFarm is having issues! Error(s): <br>";
  errors.forEach((error) => {
    errorMessage += error + "<br>";
  });
  UI.createAlert("error", errorMessage, 6000, "Clicked");
};
export const updateProfileDrop = async () => {
  // Update filament selection profile drop
  const spoolsProfile = document.getElementById("spoolsProfile");
  const { profiles } = await OctoFarmClient.getFilamentProfiles();
  const { spools } = await OctoFarmClient.getFilamentSpools();
  if (!!profiles) {
    spoolsProfile.innerHTML = "";
    profiles.forEach((profile) => {
      spoolsProfile.insertAdjacentHTML(
        "beforeend",
        `
             <option value="${profile?._id}">${profile?.manufacturer} (${profile?.material})</option>
            `
      );
    });
  }
  // Generate profile assignment
  const printerDrops = document.querySelectorAll("[id^='spoolsProfile-']");
  const printerListMaterials = document.querySelectorAll(
    "[id^='spoolsListMaterial-']"
  );
  const spoolsListManufacture = document.querySelectorAll(
    "[id^='spoolsListManufacture-']"
  );
  const spoolsMaterialText = document.querySelectorAll(
    "[id^='spoolsMaterialText-']"
  );
  printerDrops.forEach((drop, index) => {
    drop.innerHTML = "";
    profiles.forEach((prof) => {
      drop.insertAdjacentHTML(
        "beforeend",
        `<option value="${prof?._id}">${prof?.manufacturer} (${prof?.material})</option>`
      );
    });
    const spoolID = drop?.id.split("-");
    const spool = _.findIndex(spools, function (o) {
      return o?._id === spoolID[1];
    });
    if (typeof spools[spool] !== "undefined") {
      drop.value = spools[spool].profile;
      const profileID = _.findIndex(profiles, function (o) {
        return o._id === spools[spool].profile;
      });
      drop.className = `form-control ${profiles[profileID]?.material.toLowerCase().replace(/ /g, "_").replace(/[^\w\s]/gi, "_")}`;
      spoolsMaterialText[index].innerHTML = `${profiles[profileID]?.material.toLowerCase().replace(/ /g, "_").replace(/[^\w\s]/gi, "_")}`;
    }
  });
  //Fix for not updating main spool list with correct information, not skipping fo shizzle
  spoolsListManufacture.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(spools, function (o) {
      return o._id === spoolID[1];
    });
    if (typeof spools[spool] !== "undefined") {
      const profileID = _.findIndex(profiles, function (o) {
        return o._id === spools[spool]?.profile;
      });
      text.innerHTML = `${profiles[profileID]?.manufacturer}`;
    }
  });
  printerListMaterials.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(spools, function (o) {
      return o._id === spoolID[1];
    });
    if (typeof spools[spool] !== "undefined") {
      const profileID = _.findIndex(profiles, function (o) {
        return o._id === spools[spool]?.profile;
      });
      text.innerHTML = `${profiles[profileID]?.material}`;
    }
  });

};
export const updatePrinterDrops = async () => {
  const { spools } = await OctoFarmClient.getFilamentSpools();
  const { printerList } = await OctoFarmClient.get("filament/get/printerList");
  let printerDropList = "";
  printerList.forEach((printer) => {
    printerDropList += printer;
  });

  const printerDrops = document.querySelectorAll(
    "[id^='spoolsPrinterAssignment-']"
  );
  const printerAssignments = document.querySelectorAll(
    "[id^='spoolsListPrinterAssignment-']"
  );
  printerDrops.forEach((drop) => {
    const split = drop.id.split("-");
    const spoolID = split[1];
    const spool = _.findIndex(spools, function (o) {
      return o?._id === spoolID;
    });
    drop.innerHTML = printerDropList;

    const selectedValues = [];

    if (typeof spools[spool] !== "undefined") {
      spools[spool]?.printerAssignment.forEach((printer) => {
        selectedValues.push(`${printer?.id}-${printer?.tool}`);
      });
    }
    for (const option of drop.options) {
      if (selectedValues.includes(option.value)) {
        option.selected = true;
      }
    }
    if (selectedValues.length === 0) {
      drop.value = 0;
    }
    drop.disabled = true;
  });
  printerAssignments.forEach((text) => {
    text.innerHTML = "";
    const split = text.id.split("-");
    const spoolID = split[1];
    const spoolIndex = _.findIndex(spools, function (o) {
      return o?._id === spoolID;
    });
    if (typeof spools[spoolIndex] !== "undefined") {
      if (spools[spoolIndex]?.printerAssignment.length > 0) {
        spools[spoolIndex]?.printerAssignment.forEach((printer) => {
          text.innerHTML +=
            "<small>" +
            printer.name +
            ": Tool" +
            printer.tool +
            "<br>" +
            "</small>";
        });
      } else {
        text.innerHTML = "Not Assigned";
      }
    }
  });
};

export const getSelectValues = (select) => {
  const result = [];
  const options = select && select.options;
  let opt;

  for (let i = 0, iLen = options.length; i < iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
};

export const reRenderPageInformation = async () => {
  await loadPageStatistics();
  await loadOverviewTable();
  await renderSpoolsManagerTable();
  await renderProfilesManagerTable();
  await updateProfileDrop();
  await updatePrinterDrops();
  renderMaterialsList();
  jplist.resetContent();
  jplist.resetControl();
};
