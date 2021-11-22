import UI from "./lib/functions/ui.js";
import { setupFilamentManagerReSyncBtn } from "./services/filament-manager-plugin.service";
import * as ApexCharts from "apexcharts";
import OctoFarmClient from "./services/octofarm-client.service";
import { dashboardOptions } from "./dashboard/dashboard.options";

const pageElements = {
  filamentProfileTotals: document.getElementById("filamentProfileTotals"),
  filamentSpoolTotals: document.getElementById("filamentSpoolsTotals"),
  filamentSpoolsActiveTotals: document.getElementById("filamentSpoolsActiveTotals"),
  filamentUsedProgress: document.getElementById("filamentUsedProgress"),
  filamentRemainingProgress: document.getElementById("filamentRemainingProgress"),
  filamentOverviewTable: document.getElementById("filamentOverviewTable"),
  filamentOverviewTableHeader: document.getElementById("filamentOverviewTableHeader"),
  filamentOverviewList: document.getElementById("filamentOverviewList")
};

let filamentManager = false;
const filamentStore = [
  {
    code: "pla",
    display: "PLA",
    density: "1.24"
  },
  {
    code: "abs",
    display: "ABS",
    density: "1.04"
  },
  {
    code: "petg",
    display: "PETG",
    density: "1.27"
  },
  {
    code: "nylon",
    display: "NYLON",
    density: "1.52"
  },
  {
    code: "tpu",
    display: "TPU",
    density: "1.21"
  },
  {
    code: "pc",
    display: "Polycarbonate (PC)",
    density: "1.3"
  },
  {
    code: "wood",
    display: "Wood Fill",
    density: "1.28"
  },
  {
    code: "carbon",
    display: "Carbon Fibre",
    density: "1.3"
  },
  {
    code: "pcabs",
    display: "PC/ABS",
    density: "1.19"
  },
  {
    code: "hips",
    display: "HIPS",
    density: "1.03"
  },
  {
    code: "pva",
    display: "PVA",
    density: "1.23"
  },
  {
    code: "asa",
    display: "ASA",
    density: "1.05"
  },
  {
    code: "pp",
    display: "Polypropylene (PP)",
    density: "0.9"
  },
  {
    code: "acetal",
    display: "Acetal (POM)",
    density: "1.4"
  },
  {
    code: "pmma",
    display: "PMMA",
    density: "1.18"
  },
  {
    code: "fpe",
    display: "Semi Flexible FPE",
    density: "2.16"
  }
];

async function reRenderPageInformation() {
  let { statistics, spools } = await OctoFarmClient.getFilamentStatistics();
  pageElements.filamentProfileTotals.innerHTML = statistics.profileCount;
  pageElements.filamentSpoolTotals.innerHTML = statistics.spoolCount;
  pageElements.filamentSpoolsActiveTotals.innerHTML = statistics.activeSpoolCount;
  const usedPercent = ((statistics.used / statistics.total) * 100).toFixed(0);
  pageElements.filamentUsedProgress.innerHTML = usedPercent + "%";
  pageElements.filamentUsedProgress.style.width = usedPercent;
  const remainingPercent = (
    ((statistics.total - statistics.used) / statistics.total) *
    100
  ).toFixed(0);
  pageElements.filamentRemainingProgress.innerHTML = remainingPercent + "%";
  pageElements.filamentRemainingProgress.style.width = remainingPercent;

  let headerBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    headerBreakdown += `<th scope="col">${used.name}</th>`;
  });

  let remainingBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    remainingBreakdown += `<th scope="col">${(used.total - used.used).toFixed(2) / 1000}kg</th>`;
  });
  let usedBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    usedBreakdown += `<th scope="col">${used.used.toFixed(2) / 1000}kg</th>`;
  });

  let weightBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    weightBreakdown += `<th scope="col">${used.total.toFixed(2) / 1000}kg</th>`;
  });

  let costBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    costBreakdown += `<th scope="col">${used.price.toFixed(2)}</th>`;
  });

  pageElements.filamentOverviewTableHeader.innerHTML = `
  <tr>
    <td scope="row">Material Overview: </td>
    ${headerBreakdown}    
  </tr>
  `;

  pageElements.filamentOverviewTable.innerHTML = `
  <tr>
      <td scope="row">Remaining <span class="badge badge-success ml-2">${
        (statistics.total.toFixed(0) - statistics.used.toFixed(0)) / 1000
      }kg</span></td>
      ${remainingBreakdown}
  </tr>
  <tr>
      <td scope="row">Used <span class="badge badge-warning ml-2">${
        statistics.used.toFixed(0) / 1000
      }kg</span> </td>
      ${usedBreakdown}
  </tr>
  <tr>
      <th scope="row">Weight<span class="badge badge-light text-dark ml-2">${
        statistics.total.toFixed(0) / 1000
      }kg</span></th>
      ${weightBreakdown}
  </tr>
  <tr>
      <th scope="row">Cost <span class="badge badge-info ml-2">${statistics.price.toFixed(
        2
      )}</span></th>
      ${costBreakdown}
  </tr>
  `;

  let spoolList = "";
  spools.forEach((spool) => {
    spoolList += `
                <tr>
                    <th style="display: none;"> </th>
                    <th><i class="fas fa-toilet-paper"></i></th>
                    <th scope="row">${spool.name}</th>
                    <td id="spoolsListMaterial-${spool._id}">
                    </td>
                    <td id="spoolsListManufacture-${spool._id}">
                    </td>
                    <td>${spool.weight / 1000}KG</td>
                    <td>${(spool.weight - spool.used).toFixed(0)}g</td>
                    <td>${spool.tempOffset}</td>
                    <td>${spool.bedOffset || 0}</td>
                    <td id="spoolsListPrinterAssignment-${spool._id}"></td>
                </tr>
    `;
  });

  pageElements.filamentOverviewList.innerHTML = spoolList;
}

// Profile functions
async function addProfile(manufacturer, material, density, diameter) {
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
    diameter: diameter.value
  };
  let post = await OctoFarmClient.post("filament/save/profile", opts);
  if (post) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new profile to the database..."
      },
      "profilesMessage"
    );
    manufacturer.value = "";
    material.value = "";
    density.value = 1.25;
    diameter.value = 1.75;
    let profileID = null;
    filamentManager = post.filamentManager;
    if (filamentManager) {
      profileID = post.dataProfile.profile.index;
    } else {
      profileID = post.dataProfile._id;
    }
    post = post.dataProfile;
    await reRenderPageInformation();
    await updateProfileDrop();
    document.getElementById("addProfilesTable").insertAdjacentHTML(
      "beforeend",
      `
                <tr data-jplist-item>
                  <th style="display: none;">${profileID}</th>
                  <th scope="row"><input class="form-control" type="text" placeholder="${post.profile.manufacturer}"></th>
                  <td><input class="form-control" type="text" placeholder="${post.profile.material}"></td>
                  <td><input class="form-control" type="text" placeholder="${post.profile.density}"></p></td>
                  <td><input class="form-control" type="text" placeholder="${post.profile.diameter}"></p></td>
                  <td><button id="edit-${profileID}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${profileID}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${profileID}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
    );
  } else {
    UI.createMessage(
      {
        type: "error",
        msg: "Could not add roll to database... is it alive?"
      },
      "profilesMessage"
    );
  }
}
async function editProfile(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
}
async function saveProfile(e) {
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
    profile
  };
  let post = await OctoFarmClient.post("filament/edit/profile", data);
  if (post) {
    await reRenderPageInformation();
    await updateProfileDrop();
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");
  }
  jplist.refresh();
}
async function deleteProfile(e) {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmClient.post("filament/delete/profile", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    });
    if (post?.profiles) {
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
      await reRenderPageInformation();
      updateProfileDrop(post);
    } else {
      UI.createAlert(
        "error",
        "There was a conflict when deleting this profile, is it attached to a spool?",
        4000,
        "Clicked"
      );
    }
  }
}

// Spool functions
async function addSpool(
  spoolsName,
  spoolsProfile,
  spoolsPrice,
  spoolsWeight,
  spoolsUsed,
  spoolsTempOffset,
  spoolsBedOffset
) {
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
    spoolsBedOffset: spoolsBedOffset.value
  };
  let post = await OctoFarmClient.post("filament/save/filament", opts);

  if (post) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new roll to the database..."
      },
      "addSpoolsMessage"
    );
    filamentManager = post.filamentManager;
    spoolsName.value = "";
    spoolsPrice.value = "";
    spoolsWeight.value = 1000;
    spoolsUsed.value = 0;
    spoolsTempOffset.value = 0.0;
    spoolsBedOffset.value = 0;
    post = post.spools;
    document.getElementById("addSpoolsTable").insertAdjacentHTML(
      "afterbegin",
      `
                <tr data-jplist-item>
                  <th style="display: none;">${post?._id}</th>
                  <th scope="row"><input class="form-control" type="text" placeholder="${post?.spools?.name}"></th>
                  <td>
                       <span class="d-none material" id="spoolsMaterialText-<%=spool._id%>"></span>
                       <select id="spoolsProfile-${post?._id}" class="form-control" disabled>

                       </select>
                   </td>
                  <td><input class="form-control" type="text" step="0.01" placeholder="${post?.spools?.price}" disabled></td>
                  <td><input class="form-control" type="text" placeholder="${post?.spools?.weight}" disabled></td>
                  <td><input class="form-control" type="text" placeholder="${post?.spools?.used}"></td>
                  <td><input class="form-control" type="text" placeholder="${post?.spools?.tempOffset}" disabled></td>
                  <td><input class="form-control" type="text" placeholder="${post?.spools?.bedOffset}" disabled></td>
                   <td>
                       <select id="spoolsPrinterAssignment-${post?._id}" class="form-control" disabled>

                       </select>
                   </td>
                  <td>
                  <button title="Clone Spool" id="clone-${post?._id}" type="button" class="btn btn-sm btn-success clone">
                      <i class="far fa-copy"></i>
                  </button>
                  <button id="edit-${post?._id}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${post?._id}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${post?._id}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
    );
    await reRenderPageInformation();
    await updatePrinterDrops();
    await updateProfileDrop();
    return true;
  } else {
    UI.createMessage(
      {
        type: "error",
        msg: "Could not add roll to database... is it alive?"
      },
      "addSpoolsMessage"
    );
    return false;
  }
}

const clonedSpools = [];

async function cloneSpool(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const selects = row.querySelectorAll("select");
  const spool = [];
  editable.forEach((edit) => {
    spool.push(edit.placeholder);
  });

  let clonedIndex = clonedSpools.length;

  document.getElementById("addSpoolsTable").insertAdjacentHTML(
    "afterend",
    `
              <tr id="clonedRow-${clonedIndex}">
                <th style="display: none;">${clonedIndex}</th>
                <th scope="row"><input id="clonedName-${clonedIndex}" class="form-control" type="text" placeholder="${spool[0]}-${clonedIndex}" value="${spool[0]} (${clonedIndex})"></th>
                <td>
                     <span class="d-none material" id="spoolsMaterialText-${clonedIndex}"></span>
                     <select id="spoolsProfile-${clonedIndex}" class="form-control">

                     </select>
                 </td>
                <td><input id="clonedPrice-${clonedIndex}" class="form-control" type="text" step="0.01" placeholder="${spool[1]}" value="${spool[1]}"></td>
                <td><input id="clonedWeight-${clonedIndex}" class="form-control" type="text" placeholder="${spool[2]}" value="1000"></td>
                <td><input id="clonedUsed-${clonedIndex}" class="form-control" type="text" placeholder="${spool[3]}" value="0"></td>
                <td><input id="clonedToolOffset-${clonedIndex}" class="form-control" type="text" placeholder="${spool[4]}" value="${spool[4]}"></td>
                <td><input id="clonedBedOffset-${clonedIndex}" class="form-control" type="text" placeholder="${spool[5]}" value="${spool[5]}"></td>
                 <td>
                     <select id="spoolsPrinterAssignment-${clonedIndex}" class="form-control" disabled>

                     </select>
                 </td>
                 <td>
                <button id="clonedSave-${clonedIndex}" type="button" class="btn btn-sm btn-success">
                  <i class="fas fa-save saveIcon"></i>
                </button></td>
              </tr>
              `
  );

  document.getElementById("clonedSave-" + clonedIndex).addEventListener("click", function () {
    const clonedRow = document.getElementById(`clonedRow-${clonedIndex}`);
    const addedSpool = addSpool(
      document.getElementById(`clonedName-${clonedIndex}`),
      document.getElementById(`spoolsProfile-${clonedIndex}`),
      document.getElementById(`clonedPrice-${clonedIndex}`),
      document.getElementById(`clonedWeight-${clonedIndex}`),
      document.getElementById(`clonedUsed-${clonedIndex}`),
      document.getElementById(`clonedToolOffset-${clonedIndex}`),
      document.getElementById(`clonedBedOffset-${clonedIndex}`)
    );
    if (addedSpool) {
      // Remove Row
      clonedRow.remove();
      clonedSpools.pop();
    }
  });

  clonedSpools.push(clonedIndex);
  await updatePrinterDrops();
  await updateProfileDrop();
  document.getElementById(`spoolsProfile-${clonedIndex}`).value = selects[0].value;
}

async function editSpool(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  document.getElementById(`spoolsProfile-${id}`).disabled = false;
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
}
async function deleteSpool(e) {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmClient.post("filament/delete/filament", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    });
    if (post?.spool) {
      await reRenderPageInformation();
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
      UI.createAlert(
        "error",
        "There was a conflict when deleting this spool, is it attached to a printer?",
        4000,
        "Clicked"
      );
    }
  }
}
async function saveSpool(e) {
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
    spool
  };
  let post = await OctoFarmClient.post("filament/edit/filament", data);
  if (post) {
    document.getElementById(`spoolsProfile-${id}`).disabled = true;
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");
  }
  jplist.refresh();
}

async function updateProfileDrop() {
  // Update filament selection profile drop
  const spoolsProfile = document.getElementById("spoolsProfile");
  let profiles = await OctoFarmClient.get("filament/get/profile");
  let fill = await OctoFarmClient.get("filament/get/filament");
  let profile = await OctoFarmClient.get("filament/get/profile");
  if (!!profiles) {
    spoolsProfile.innerHTML = "";
    profiles.profiles.forEach((profile) => {
      let profileID = null;
      profileID = profile?._id;
      spoolsProfile.insertAdjacentHTML(
        "beforeend",
        `
             <option value="${profileID}">${profile?.manufacturer} (${profile?.material})</option>
            `
      );
    });
  }
  // Generate profile assignment
  const printerDrops = document.querySelectorAll("[id^='spoolsProfile-']");
  const printerListMaterials = document.querySelectorAll("[id^='spoolsListMaterial-']");
  const spoolsListManufacture = document.querySelectorAll("[id^='spoolsListManufacture-']");
  const spoolsMaterialText = document.querySelectorAll("[id^='spoolsMaterialText-']");
  printerDrops.forEach((drop, index) => {
    drop.innerHTML = "";
    profiles?.profiles.forEach((prof) => {
      drop.insertAdjacentHTML(
        "beforeend",
        `<option value="${prof?._id}">${prof?.manufacturer} (${prof?.material})</option>`
      );
    });
    const spoolID = drop?.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o?._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      drop.value = fill?.Spool[spool].profile;
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool].profile;
      });
      drop.className = `form-control ${profiles?.profiles[profileID]?.material.replace(/ /g, "_")}`;
      spoolsMaterialText[index].innerHTML = `${profiles?.profiles[profileID]?.material}`;
    }
  });
  //Fix for not updating main spool list with correct information, not skipping fo shizzle
  spoolsListManufacture.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool]?.profile;
      });
      text.innerHTML = `${profiles?.profiles[profileID]?.manufacturer}`;
    }
  });
  printerListMaterials.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool]?.profile;
      });
      text.innerHTML = `${profiles?.profiles[profileID]?.material}`;
    }
  });
}
async function updatePrinterDrops() {
  let filament = await OctoFarmClient.get("filament/get/filament");

  const printerDrops = document.querySelectorAll("[id^='spoolsPrinterAssignment-']");
  const printerAssignments = document.querySelectorAll("[id^='spoolsListPrinterAssignment-']");
  printerDrops.forEach((drop, index) => {
    const split = drop.id.split("-");
    const spoolID = split[1];
    const spool = _.findIndex(filament?.Spool, function (o) {
      return o?._id == spoolID;
    });
    if (typeof filament.Spool[spool] !== "undefined") {
      if (filament?.Spool[spool]?.printerAssignment.length > 0) {
        drop.innerHTML = `<option>${filament?.Spool[spool]?.printerAssignment[0]?.name}: Tool ${filament?.Spool[spool]?.printerAssignment[0]?.tool}</option>`;
      } else {
        drop.innerHTML = "<option>Not Assigned</option>";
      }
    }
    // Not needed until bring back selecting spool function server side
    // drop.addEventListener("change", (e) => {
    //   const meta = e.target.value.split("-");
    //   const printerId = meta[0];
    //   const tool = meta[1];
    //   const spoolId = e.target.id.split("-");
    //   selectFilament(printerId, spoolId[1], tool);
    // });
  });
  printerAssignments.forEach((text, index) => {
    const split = text.id.split("-");
    const spoolID = split[1];
    const spool = _.findIndex(filament?.Spool, function (o) {
      return o?._id == spoolID;
    });
    if (typeof filament?.Spool[spool] !== "undefined") {
      if (filament?.Spool[spool]?.printerAssignment.length > 0) {
        text.innerHTML =
          filament?.Spool[spool]?.printerAssignment[0]?.name +
          ": Tool" +
          filament?.Spool[spool]?.printerAssignment[0]?.tool;
      } else {
        text.innerHTML = "Not Assigned";
      }
    }
    // Not needed until bring back selecting spool function server side
    // drop.addEventListener("change", (e) => {
    //   const meta = e.target.value.split("-");
    //   const printerId = meta[0];
    //   const tool = meta[1];
    //   const spoolId = e.target.id.split("-");
    //   selectFilament(printerId, spoolId[1], tool);
    // });
  });
}
async function init() {
  let historyStatistics = await OctoFarmClient.getHistoryStatistics();
  let usageByDay = historyStatistics.history.totalByDay;
  let usageOverTime = historyStatistics.history.usageOverTime;

  let yAxisSeries = [];
  usageOverTime.forEach((usage, index) => {
    let obj = null;
    if (index === 0) {
      obj = {
        title: {
          text: "Weight"
        },
        seriesName: usageOverTime[0].name,
        labels: {
          formatter: function (val) {
            if (!!val) {
              return val.toFixed(0) + "g";
            }
          }
        }
      };
    } else {
      obj = {
        show: false,
        seriesName: usageOverTime[0].name,
        labels: {
          formatter: function (val) {
            if (!!val) {
              return val.toFixed(0) + "g";
            }
          }
        }
      };
    }

    yAxisSeries.push(obj);
  });

  dashboardOptions.filamentUsageOverTimeChartOptions.yaxis = yAxisSeries;

  if (typeof usageOverTime[0] !== "undefined") {
    let systemFarmTemp = new ApexCharts(
      document.querySelector("#usageOverTime"),
      dashboardOptions.filamentUsageByDayChartOptions
    );
    await systemFarmTemp.render();
    let usageOverFilamentTime = new ApexCharts(
      document.querySelector("#usageOverFilamentTime"),
      dashboardOptions.filamentUsageOverTimeChartOptions
    );
    await usageOverFilamentTime.render();

    usageOverFilamentTime.updateSeries(usageOverTime);
    systemFarmTemp.updateSeries(usageByDay);
  }

  // Grab data
  const spoolTable = document.getElementById("addSpoolsTable");
  // Initialise materials dropdown
  const dataList = document.getElementById("profilesMaterial");
  dataList.addEventListener("change", function (e) {
    const { value } = this;
    const selection = _.findIndex(filamentStore, function (o) {
      return o.code == value.toLowerCase();
    });
    if (selection != -1) {
      this.value = filamentStore[selection].display;
      document.getElementById("profilesDensity").value = filamentStore[selection].density;
    }
  });
  filamentStore.forEach((filament) => {
    document.getElementById("huge_list").insertAdjacentHTML(
      "beforeend",
      `
            <option value="${filament.code.toUpperCase()}">${filament.display}</option>
        `
    );
  });
  spoolTable.addEventListener("click", (e) => {
    // Remove from UI
    if (e.target.classList.contains("edit")) {
      editSpool(e.target);
    } else if (e.target.classList.contains("delete")) {
      deleteSpool(e.target);
    } else if (e.target.classList.contains("save")) {
      saveSpool(e.target);
    } else if (e.target.classList.contains("clone")) {
      cloneSpool(e.target);
    }
  });
  await updateProfileDrop();
  await updatePrinterDrops();
  // Initialise Profile Listeners
  const profilesBtn = document.getElementById("addProfilesBtn");
  profilesBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("profilesMessage").innerHTML = "";
    const profilesManufactuer = document.getElementById("profilesManufactuer");
    const profilesMaterial = document.getElementById("profilesMaterial");
    const profilesDensity = document.getElementById("profilesDensity");
    const profilesDiameter = document.getElementById("profilesDiameter");
    await addProfile(profilesManufactuer, profilesMaterial, profilesDensity, profilesDiameter);
  });
  document.getElementById("addProfilesTable").addEventListener("click", (e) => {
    // Remove from UI
    if (e.target.classList.contains("edit")) {
      editProfile(e.target);
    } else if (e.target.classList.contains("delete")) {
      deleteProfile(e.target);
    } else if (e.target.classList.contains("save")) {
      saveProfile(e.target);
    }
  });

  //    //Init Spools
  document.getElementById("addSpoolBtn").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("addSpoolsMessage").innerHTML = "";
    const spoolsName = document.getElementById("spoolsName");
    const spoolsProfile = document.getElementById("spoolsProfile");
    const spoolsPrice = document.getElementById("spoolsPrice");
    const spoolsWeight = document.getElementById("spoolsWeight");
    const spoolsUsed = document.getElementById("spoolsRemaining");
    const spoolsTempOffset = document.getElementById("spoolsTempOffset");
    const spoolsBedOffset = document.getElementById("spoolsBedOffset");
    await addSpool(
      spoolsName,
      spoolsProfile,
      spoolsPrice,
      spoolsWeight,
      spoolsUsed,
      spoolsTempOffset,
      spoolsBedOffset
    );
  });
  await setupFilamentManagerReSyncBtn();

  jplist.init({
    storage: "localStorage", // 'localStorage', 'sessionStorage' or 'cookies'
    storageName: "spools-sorting" // the same storage name can be used to share storage between multiple pages
  });
}

function updateTotals(filtered) {
  const price = [];
  const weight = [];
  const used = [];

  filtered.forEach((row) => {
    price.push(parseInt(row.getElementsByClassName("price")[0].innerHTML));
    weight.push(parseInt(row.getElementsByClassName("weight")[0].innerHTML));
    used.push(parseInt(row.getElementsByClassName("used")[0].innerHTML));
  });
  const usedReduced = used.reduce((a, b) => a + b, 0).toFixed(0);
  const weightReduced = weight.reduce((a, b) => a + b, 0).toFixed(0);
  document.getElementById("totalPrice").innerHTML = price.reduce((a, b) => a + b, 0).toFixed(0);
  document.getElementById("totalWeight").innerHTML = weightReduced;
  document.getElementById("totalUsed").innerHTML = usedReduced;
  document.getElementById("totalRemaining").innerHTML = (weightReduced - usedReduced).toFixed(0);
  document.getElementById("totalRemainingPercent").innerHTML = (
    100 -
    (usedReduced / weightReduced) * 100
  ).toFixed(0);
}

const element = document.getElementById("listenerSpools");
element.addEventListener(
  "jplist.state",
  (e) => {
    // the elements list after filtering + pagination
    updateTotals(e.jplistState.filtered);
    updateProfileDrop();
    updatePrinterDrops();
  },
  false
);
init();
// load();
