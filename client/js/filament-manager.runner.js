import { setupFilamentManagerReSyncBtn } from "./services/octoprint/filament-manager-plugin.service";
import {
  loadPageStatistics,
  renderFilamentUsageCharts,
  renderMaterialsList,
  renderProfilesManagerTable,
  renderSpoolsManagerTable,
  setupMaterialsPreSelect,
  setupAddSpoolsListener,
  setupAddProfilesListener,
  addProfileTableListeners,
  addSpoolTableListeners,
} from "./pages/filament-manager/filament-manager.utils";
import {
  updateProfileDrop,
  updatePrinterDrops,
} from "./pages/filament-manager/filament-manager-ui.utils";

async function init() {
  await renderFilamentUsageCharts();

  await loadPageStatistics();

  await renderProfilesManagerTable();

  addProfileTableListeners();

  await renderSpoolsManagerTable();

  addSpoolTableListeners();

  await updateProfileDrop();
  await updatePrinterDrops();

  await setupFilamentManagerReSyncBtn();

  renderMaterialsList();

  setupMaterialsPreSelect();

  setupAddSpoolsListener();

  setupAddProfilesListener();

  jplist.init({
    storage: "localStorage", // 'localStorage', 'sessionStorage' or 'cookies'
    storageName: "spools-sorting", // the same storage name can be used to share storage between multiple pages
  });
}

function updateTotals(filtered) {
  const price = [];
  const weight = [];
  const used = [];

  filtered.forEach((row) => {
    const spoolUsed = parseInt(row.getElementsByClassName("grams")[0].innerHTML);
    const spoolWeight = parseInt(row.getElementsByClassName("weight")[0].innerHTML)
    if(spoolUsed <= spoolWeight){
      price.push(parseInt(row.getElementsByClassName("price")[0].innerHTML));
      weight.push(parseInt(row.getElementsByClassName("weight")[0].innerHTML));
      used.push(parseInt(row.getElementsByClassName("grams")[0].innerHTML));
    }

  });
  const usedReduced = used.reduce((a, b) => a + b, 0).toFixed(0);
  const weightReduced = weight.reduce((a, b) => a + b, 0).toFixed(0);
  document.getElementById("totalPrice").innerHTML = price
    .reduce((a, b) => a + b, 0)
    .toFixed(0);
  document.getElementById("totalWeight").innerHTML = weightReduced;
  document.getElementById("totalUsed").innerHTML = usedReduced;
  document.getElementById("totalRemaining").innerHTML = (
    weightReduced - usedReduced
  ).toFixed(0);
  document.getElementById("totalRemainingPercent").innerHTML = (
    100 -
    (usedReduced / weightReduced) * 100
  ).toFixed(0);
}

const element = document.getElementById("listenerSpools");
element.addEventListener(
  "jplist.state",
  async (e) => {
    // the elements list after filtering + pagination
    updateTotals(e.jplistState.filtered);
    await updateProfileDrop();
    await updatePrinterDrops();
  },
  false
);
init().then();