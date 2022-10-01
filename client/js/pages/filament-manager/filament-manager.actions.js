import OctoFarmClient from "../../services/octofarm-client.service";
import UI from "../../utils/ui";
import {
  reRenderPageInformation,
  printErrors,
  getSelectValues,
} from "./filament-manager-ui.utils";

export async function selectFilament(spools, id) {
  let printerIds = [];
  for (const spool of spools) {
    const meta = spool.split("-");

    printerIds.push({
      printer: meta[0],
      tool: meta[1],
    });
  }
  await OctoFarmClient.post("/filament/assign", {
    printers: printerIds,
    spoolId: id,
  });
}

export const editProfile = async (e) => {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
};
export const saveProfile = async (e) => {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  const profile = [];
  editable.forEach((edit) => {
    edit.disabled = true;
    edit.placeholder = edit.value;
    profile.push(edit.value);
    edit.value = "";
  });
  const data = {
    id,
    profile,
  };
  let post = await OctoFarmClient.post("filament/edit/profile", data);
  if (post && post.errors.length === 0) {
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");

    await reRenderPageInformation();
  } else {
    printErrors(post.errors);
  }
};
export const deleteProfile = async (e) => {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmClient.post("filament/delete/profile", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim(),
    });
    if (post && post.errors.length === 0) {
      if (e.classList.contains("deleteIcon")) {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.parentElement.remove();
        });
      } else {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.remove();
        });
      }
      UI.createAlert(
        "success",
        "Successfully deleted your profile!",
        3000,
        "Clicked"
      );
    } else {
      printErrors(post.errors);
    }
  }
};

// Spool functions
export const addSpool = async (
  spoolsName,
  spoolsProfile,
  spoolsPrice,
  spoolsWeight,
  spoolsUsed,
  spoolsTempOffset,
  spoolsBedOffset
) => {
  const errors = [];

  if (spoolsName.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool name" });
  }
  if (spoolsProfile.value === "") {
    errors.push({ type: "warning", msg: "Please select a profile" });
  }
  if (spoolsPrice.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool price" });
  }
  if (spoolsWeight.value === 0 || spoolsWeight.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool weight" });
  }
  if (spoolsUsed.value === "") {
    errors.push({ type: "warning", msg: "Please input spool used weight" });
  }

  if (errors.length > 0) {
    errors.forEach((error) => {
      UI.createMessage(error, "addSpoolsMessage");
    });
    return;
  }
  const opts = {
    spoolsName: spoolsName.value,
    spoolsProfile: spoolsProfile.value,
    spoolsPrice: spoolsPrice.value,
    spoolsWeight: spoolsWeight.value,
    spoolsUsed: spoolsUsed.value,
    spoolsTempOffset: spoolsTempOffset.value,
    spoolsBedOffset: spoolsBedOffset.value,
  };
  let post = await OctoFarmClient.post("filament/save/filament", opts);

  if (post || post?.errors?.length === 0) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new roll to the database...",
      },
      "addSpoolsMessage"
    );

    spoolsName.value = "";
    spoolsPrice.value = "";
    spoolsWeight.value = 1000;
    spoolsUsed.value = 0;
    spoolsTempOffset.value = 0.0;
    spoolsBedOffset.value = 0;
    await reRenderPageInformation();
    return true;
  } else {
    printErrors(post.errors);
    return false;
  }
};
// Profile functions
export const addProfile = async (manufacturer, material, density, diameter) => {
  const errors = [];

  if (manufacturer.value === "") {
    errors.push({ type: "warning", msg: "Please input manufacturer" });
  }
  if (material.value === "") {
    errors.push({ type: "warning", msg: "Please select or type a material" });
  }
  if (density.value === 0) {
    errors.push({ type: "warning", msg: "Please input a density" });
  }
  if (diameter.value === 0) {
    errors.push({ type: "warning", msg: "Please input a density" });
  }
  if (errors.length > 0) {
    errors.forEach((error) => {
      UI.createMessage(error, "profilesMessage");
    });
    return;
  }
  const opts = {
    manufacturer: manufacturer.value,
    material: material.value,
    density: density.value,
    diameter: diameter.value,
  };
  let post = await OctoFarmClient.post("filament/save/profile", opts);
  if (post && post?.errors.length === 0) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new profile to the database...",
      },
      "profilesMessage"
    );
    manufacturer.value = "";
    material.value = "";
    density.value = 1.25;
    diameter.value = 1.75;
    await reRenderPageInformation();
  } else {
    printErrors(post?.errors);
  }
};

export const editSpool = async (e) => {
  UI.captureScrollPosition(document.getElementById("addSpoolModalBody"));
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  document.getElementById(`spoolsPrinterAssignment-${id}`).disabled = false;
  document.getElementById(`spoolsProfile-${id}`).disabled = false;
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
};
export const deleteSpool = async (e) => {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmClient.post("filament/delete/filament", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim(),
    });
    if (post && post.errors.length === 0) {
      if (e.classList.contains("deleteIcon")) {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.parentElement.remove();
        });
      } else {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.remove();
        });
      }
    } else {
      printErrors(post.errors);
    }
  }
};
export const saveSpool = async (e) => {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  const spool = [];
  editable.forEach((edit) => {
    edit.disabled = true;
    edit.placeholder = edit.value;
    spool.push(edit.value);
    edit.value = "";
  });

  spool.push(document.getElementById(`spoolsProfile-${id}`).value);
  const data = {
    id,
    spool,
  };
  let post = await OctoFarmClient.post("filament/edit/filament", data);
  if (post && post.errors.length === 0) {
    document.getElementById(`spoolsPrinterAssignment-${id}`).disabled = true;
    document.getElementById(`spoolsProfile-${id}`).disabled = true;
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");

    await selectFilament(
      getSelectValues(document.getElementById(`spoolsPrinterAssignment-${id}`)),
      id
    );
    await reRenderPageInformation();
  } else {
    printErrors(post.errors);
  }
  // UI.reApplyScrollPosition(document.getElementById("addSpoolModalBody"))
};

export const unAssignSpool = async (e) => {
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  await selectFilament(["0"], id);
  await reRenderPageInformation();
};
