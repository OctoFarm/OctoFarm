import OctoFarmClient from "../../services/octofarm-client.service";
import ApexCharts from "apexcharts";
import { dashboardOptions } from "../charts/dashboard.options";
import {
  materialsFilterList,
  materialsListTableRow,
  profileManagerTableRow,
  spoolsManagerTableRow,
} from "./filament-manager.templates";
import { cloneSpool } from "./filament-manager-clone-spools.utils";
import {
  editSpool,
  deleteSpool,
  saveSpool,
  editProfile,
  deleteProfile,
  saveProfile,
  addSpool,
  addProfile,
  unAssignSpool,
} from "./filament-manager.actions";
import { isFilamentManagerPluginSyncEnabled } from "../../services/octoprint/filament-manager-plugin.service";

const materialsList = [
  {
    code: "pla",
    display: "Polylactic Acid",
    abbr: "PLA",
    density: "1.24",
  },
  {
    code: "abs",
    display: "Acrylonitrile Butadiene Styrene",
    abbr: "ABS",
    density: "1.04",
  },
  {
    code: "petg",
    display: "Polyethylene Terephthalate Glycol",
    abbr: "PETG",
    density: "1.27",
  },
  {
    code: "nylon",
    display: "Nylon",
    abbr: "NYLON",
    density: "1.52",
  },
  {
    code: "tpu",
    display: "Thermoplastic Polyurethane",
    abbr: "TPU",
    density: "1.21",
  },
  {
    code: "pc",
    display: "Polycarbonate",
    abbr: "PC",
    density: "1.3",
  },
  {
    code: "wood",
    display: "Wood Fill Polylactic Acid",
    abbr: "WF-PLA",
    density: "1.28",
  },
  {
    code: "carbon",
    display: "Carbon Fibre",
    abbr: "CF",
    density: "1.3",
  },
  {
    code: "pcabs",
    display: "Polycarbonate/Acrylonitrile Butadiene Styrene Blend",
    abbr: "PC/ABS",
    density: "1.19",
  },
  {
    code: "hips",
    display: "High Impact Polystyrene Sheet",
    abbr: "HIPS",
    density: "1.03",
  },
  {
    code: "pva",
    display: "Polyvinyl Alcohol",
    abbr: "PVA",
    density: "1.23",
  },
  {
    code: "asa",
    display: "Acrylonitrile Atyrene Acrylate",
    abbr: "ASA",
    density: "1.05",
  },
  {
    code: "pp",
    display: "Polypropylene",
    abbr: "PP",
    density: "0.9",
  },
  {
    code: "acetal",
    display: "Polyoxymethylene",
    abbr: "POM",
    density: "1.4",
  },
  {
    code: "pmma",
    display: "Poly(Methyl Methacrylate)",
    abbr: "PMMA",
    density: "1.18",
  },
  {
    code: "fpe",
    display: "Flexibel PolyEster",
    abbr: "FPE",
    density: "2.16",
  },
];

export const pageElements = {
  filamentProfileTotals: document.getElementById("filamentProfileTotals"),
  filamentSpoolTotals: document.getElementById("filamentSpoolsTotals"),
  filamentSpoolsActiveTotals: document.getElementById(
    "filamentSpoolsActiveTotals"
  ),
  filamentUsedProgress: document.getElementById("filamentUsedProgress"),
  filamentRemainingProgress: document.getElementById(
    "filamentRemainingProgress"
  ),
  filamentOverviewTable: document.getElementById("filamentOverviewTable"),
  filamentOverviewTableHeader: document.getElementById(
    "filamentOverviewTableHeader"
  ),
  filamentOverviewList: document.getElementById("filamentOverviewList"),
  spoolsManagerTable: document.getElementById("addSpoolsTable"),
  profileManagerTable: document.getElementById("addProfilesTable"),
  materialsListFilter: document.getElementById("materialsList"),
  materialsListTable: document.getElementById("materialsListTable"),
};

export const loadPageStatistics = async () => {
  const { statistics } = await OctoFarmClient.getFilamentStatistics();
  pageElements.filamentProfileTotals.innerHTML = statistics.profileCount;
  pageElements.filamentSpoolTotals.innerHTML = statistics.spoolCount;
  pageElements.filamentSpoolsActiveTotals.innerHTML =
    statistics.activeSpoolCount;
  const usedPercent = ((statistics.used / statistics.total) * 100).toFixed(0);
  pageElements.filamentUsedProgress.innerHTML = !isNaN(usedPercent) ? usedPercent + "%" : 0 + "%";
  pageElements.filamentUsedProgress.style.width = !isNaN(usedPercent) ? usedPercent + "%" : 0 + "%";
  const remainingPercent = (
    ((statistics.total - statistics.used) / statistics.total) *
    100
  ).toFixed(0);
  pageElements.filamentRemainingProgress.innerHTML = !isNaN(remainingPercent) ? remainingPercent + "%" : 0 + "%";
  pageElements.filamentRemainingProgress.style.width = !isNaN(remainingPercent) ? remainingPercent + "%" : 0 + "%";
  let headerBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    headerBreakdown += `<th scope="col">${used.name}</th>`;
  });

  let remainingBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    remainingBreakdown += `<th scope="col">${
        ((used.total - used.used)/ 1000).toFixed(2)
    }kg</th>`;
  });
  let usedBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    usedBreakdown += `<th scope="col">${(used.used / 1000).toFixed(2)}kg</th>`;
  });

  let weightBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    weightBreakdown += `<th scope="col">${(used.total / 1000).toFixed(0)}kg</th>`;
  });

  let costBreakdown = "";
  statistics.materialBreakDown.forEach((used) => {
    costBreakdown += `<th scope="col">${used.price.toFixed(2)}</th>`;
  });

  pageElements.filamentOverviewTableHeader.innerHTML = `
  <tr>
    <td >Material Overview: </td>
    ${headerBreakdown}    
  </tr>
  `;
  pageElements.filamentOverviewTable.innerHTML = `
  <tr>

      <td >Remaining <span class="badge badge-success ml-2">${
      ((statistics.total - statistics.used) / 1000 ).toFixed(2)
      }kg</span></td>
      ${remainingBreakdown}
  </tr>
  <tr>
      <td >Used <span class="badge badge-warning ml-2">${
      (statistics.used / 1000).toFixed(2)
      }kg</span> </td>
      ${usedBreakdown}
  </tr>
  <tr>
      <th >Weight<span class="badge badge-light text-dark ml-2">${
      (statistics.total / 1000).toFixed(0)
      }kg</span></th>
      ${weightBreakdown}
  </tr>
  <tr>
      <th >Cost <span class="badge badge-info ml-2">${statistics.price.toFixed(
        2
      )}</span></th>
      ${costBreakdown}
  </tr>
  `;
  renderMaterialsFilterList(statistics.materialList);
};

export const loadOverviewTable = async () => {
  const { spools } = await OctoFarmClient.getFilamentSpools();
  let spoolList = "";
  spools.forEach((spool) => {
    spoolList += `
                <tr>
                    <th style="display: none;"> </th>
                    <th><i class="fas fa-toilet-paper"></i></th>
                    <th >${spool.name}</th>
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
};

export const renderFilamentUsageCharts = async () => {
  const {
    history: { totalByDay, usageOverTime },
  } = await OctoFarmClient.getHistoryStatistics();
  if (!!usageOverTime && usageOverTime.length > 0 && usageOverTime[0].data.length > 1) {
    const filamentUsageOverTimeChart = new ApexCharts(
      document.querySelector("#usageOverFilamentTime"),
      dashboardOptions.filamentUsageOverTimeChartOptions
    );
    await filamentUsageOverTimeChart.render();

    await filamentUsageOverTimeChart.updateSeries(usageOverTime);
  }
  if (!!totalByDay && totalByDay.length > 0 && totalByDay[0].data.length > 1) {
    const totalByDayChart = new ApexCharts(
      document.querySelector("#usageOverTime"),
      dashboardOptions.filamentUsageByDayChartOptions
    );
    await totalByDayChart.render();
    await totalByDayChart.updateSeries(totalByDay);
  }
};

export const renderSpoolsManagerTable = async () => {
  const { spools } = await OctoFarmClient.getFilamentSpools();

  const { allowMultiSelectIsEnabled } =
    await isFilamentManagerPluginSyncEnabled();
  spools.forEach((spool) => {
    const listItem = document.getElementById("spoolList-" + spool._id);
    if (!listItem) {
      pageElements.spoolsManagerTable.insertAdjacentHTML(
        "beforeend",
        `
            ${spoolsManagerTableRow(spool, allowMultiSelectIsEnabled)}
        `
      );
    }
  });
};

export const renderProfilesManagerTable = async () => {
  const { profiles } = await OctoFarmClient.getFilamentProfiles();
  profiles.forEach((profile) => {
    const listItem = document.getElementById("profileList-" + profile._id);
    if (!listItem) {
      pageElements.profileManagerTable.insertAdjacentHTML(
        "beforeend",
        `
            ${profileManagerTableRow(profile)}
            `
      );
    }
  });
};

export const addProfileTableListeners = () => {
  document
    .getElementById("addProfilesTable")
    .addEventListener("click", async (e) => {
      // Remove from UI
      if (e.target.classList.contains("edit")) {
        await editProfile(e.target);
      } else if (e.target.classList.contains("delete")) {
        await deleteProfile(e.target);
      } else if (e.target.classList.contains("save")) {
        await saveProfile(e.target);
      }
    });
};

export const addSpoolTableListeners = () => {
  pageElements.spoolsManagerTable.addEventListener("click", async (e) => {
    // Remove from UI
    if (e.target.classList.contains("edit")) {
      await editSpool(e.target);
    } else if (e.target.classList.contains("delete")) {
      await deleteSpool(e.target);
    } else if (e.target.classList.contains("save")) {
      await saveSpool(e.target);
    } else if (e.target.classList.contains("clone")) {
      await cloneSpool(e.target);
    } else if (e.target.classList.contains("unassign")) {
      await unAssignSpool(e.target);
    }
  });
};

export const renderMaterialsFilterList = (materials) => {
  pageElements.materialsListFilter.innerHTML = `
      <option selected
            href="#"
            data-value="0"
            data-path="default"
        >Filter</option>
    `;
  materials.forEach((material) => {
    pageElements.materialsListFilter.insertAdjacentHTML(
      "beforeend",
      materialsFilterList(material)
    );
  });
};

export const renderMaterialsList = () => {
  pageElements.materialsListTable.innerHTML = "";
  materialsList.forEach((material) => {
    pageElements.materialsListTable.insertAdjacentHTML(
      "beforeend",
      `
        ${materialsListTableRow(material)}
    `
    );
  });
};

const selectMaterialsListener = (value) => {
  const selection = _.findIndex(materialsList, function (o) {
    return o.code === value.toLowerCase();
  });
  if (selection !== -1) {
    value = materialsList[selection].abbr;
    document.getElementById("profilesDensity").value =
      materialsList[selection].density;
  }
};

export const setupMaterialsPreSelect = () => {
  const dataList = document.getElementById("profilesMaterial");
  dataList.addEventListener("change", function () {
    const { value } = this;
    selectMaterialsListener(value);
  });
  const hugeMaterialList = document.getElementById("huge_list");
  materialsList.forEach((material) => {
    hugeMaterialList.insertAdjacentHTML(
      "beforeend",
      `
              <option value="${material.code.toUpperCase()}">${
        material.display
      } (${material.abbr})</option>
          `
    );
  });
};

export const setupAddSpoolsListener = () => {
  document
    .getElementById("addSpoolBtn")
    .addEventListener("click", async (e) => {
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
};

export const setupAddProfilesListener = () => {
  document
    .getElementById("addProfilesBtn")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("profilesMessage").innerHTML = "";
      const profilesManufactuer = document.getElementById(
        "profilesManufactuer"
      );
      const profilesMaterial = document.getElementById("profilesMaterial");
      const profilesDensity = document.getElementById("profilesDensity");
      const profilesDiameter = document.getElementById("profilesDiameter");
      await addProfile(
        profilesManufactuer,
        profilesMaterial,
        profilesDensity,
        profilesDiameter
      );
    });
};
