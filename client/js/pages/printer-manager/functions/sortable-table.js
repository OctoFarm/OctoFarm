import OctoFarmClient from "../../../services/octofarm-client.service";
import Sortable from "../../../vendor/sortable";

export function setupSortablePrintersTable() {
  // Setup drag and drop re-ordering listeners
  const el = document.getElementById("printerList");
  Sortable.create(el, {
    handle: ".sortableList",
    animation: 150,
    onUpdate: async (e) => {
      const elements = e.target.querySelectorAll("[id^='printerCard-']");
      const listID = [];
      elements.forEach((element) => {
        const ca = element.id.split("-");
        listID.push(ca[1]);
      });
      await OctoFarmClient.post("printers/updateSortIndex", { idList: listID });
    },
  });
}
