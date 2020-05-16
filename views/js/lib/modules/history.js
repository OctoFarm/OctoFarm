import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import tableSort from "../functions/tablesort.js";
import {returnHistory, returnHistoryUsage, returnDropDown} from "./filamentGrab.js";



//Setup history listeners
document.getElementById("historyTable").addEventListener("click", e => {
  //Remove from UI
  e.preventDefault();
  History.delete(e);
});
document.getElementById("historyTable").addEventListener("click", e => {
  //Remove from UI
  e.preventDefault();
  History.edit(e);
});
let historyList = [];
$("#historyModal").on("hidden.bs.modal", function(e) {
  document.getElementById("historySaveBtn").remove();
});



export default class History {
  static returnFilamentUsage(id){
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
        let usage = (3.14 * (1.75 / 2)) * (2 * 1.24 * (length) )
        return length.toFixed(2) + "m / " + usage.toFixed(2) + "g";
      }
  }
  static returnPrintCost(filament, usageElement){
    let grams = usageElement.replace("g","")
    grams = parseFloat(grams)
    if(isNaN(grams)){
      return `No length to calculate from`
    }else{
      if(filament === null || filament == "None chosen..."){
        return `No filament to calculate from`
      }else{
        let cost = (filament.spools.price / filament.spools.weight) * grams
        return  cost.toFixed(2)
      }

    }
  }

  static async get() {
    let newHistory = await OctoFarmClient.get("history/get");
    historyList = await newHistory.json();

    historyList.history.forEach(history => {
      let filamentString = null;
      let filamentUsage = null;
      if(history.printHistory.filamentSelection !== null){
        filamentString = returnHistory(history.printHistory.filamentSelection)
        filamentUsage = returnHistoryUsage(history.printHistory)
      }else{
        filamentString = "None selected..."
        filamentUsage = History.returnFilamentUsage(history.printHistory)
      }
      document.getElementById("spool-"+history._id).innerHTML = filamentString;
      document.getElementById("usage-"+history._id).innerHTML = filamentUsage;
      let grams = document.getElementById("usage-"+history._id)
      grams = grams.innerHTML
      grams = grams.split(" / ").pop()
      document.getElementById("cost-"+history._id).innerHTML = History.returnPrintCost(history.printHistory.filamentSelection, grams);
    })
  }

  static async edit(e) {
    if (e.target.classList.value.includes("historyEdit")) {
      document.getElementById("historySave").insertAdjacentHTML(
        "afterbegin",
        `
      <button id="historySaveBtn" type="button" class="btn btn-success" data-dismiss="modal">
        Save Changes
      </button>
    `
      );
      document.getElementById("historySaveBtn").addEventListener("click", f => {
        History.save(e.target.id);
      });
      //Grab elements
      let printerName = document.getElementById("printerName");
      let fileName = document.getElementById("fileName");
      let status = document.getElementById("printStatus");
      let filament = document.getElementById("filament");

      let startDate = document.getElementById("startDate");
      let printTime = document.getElementById("printTime");
      let endDate = document.getElementById("endDate");

      let volume = document.getElementById("volume");
      let length = document.getElementById("length");
      let weight = document.getElementById("weight");

      let notes = document.getElementById("notes");

      let uploadDate = document.getElementById("dateUploaded");
      let path = document.getElementById("path");
      let size = document.getElementById("size");

      let cost = document.getElementById("cost")

      let estimatedPrintTime = document.getElementById("estimatedPrintTime");
      let averagePrintTime = document.getElementById("averagePrintTime");
      let lastPrintTime = document.getElementById("lastPrintTime");

      printerName.innerHTML = " - ";
      fileName.innerHTML = " - ";
      status.innerHTML = " - ";
      filament.innerHTML = " - ";

      startDate.innerHTML = " - ";
      printTime.innerHTML = " - ";
      endDate.innerHTML = " - ";

      volume.value = " - ";
      length.value = " - ";
      weight.value = " - ";

      notes.value = "";

      uploadDate.value = " - ";
      path.value = " - ";
      size.value = " - ";

      estimatedPrintTime.value = " - ";
      averagePrintTime.value = " - ";
      lastPrintTime.value = " - ";
      let index = _.findIndex(historyList.history, function(o) {
        return o._id == e.target.id;
      });
      let current = historyList.history[index].printHistory;
      printerName.innerHTML = current.printerName;
      fileName.innerHTML = current.fileName;
      if (current.success) {
        status.innerHTML =
          '<i class="fas fa-thumbs-up text-success fa-3x"></i>';
        if(typeof current.job != 'undefined' && current.job.filament != null) {
          volume.value = Math.round((current.job.filament.tool0.volume / 100) * 100) / 100;
          length.value = Math.round((current.job.filament.tool0.length / 1000) * 100) / 100;

          let filamentWeight = null;
          if (current.filamentSelection !== null) {
            filamentWeight = returnHistoryUsage(current)
          } else {
            filamentWeight = History.returnFilamentUsage(current)
          }
          filamentWeight = filamentWeight.split(" / ").pop()
          weight.value = filamentWeight
          cost.value = History.returnPrintCost(current.filamentSelection, filamentWeight);
          if (current.job.filament.tool0.length === 0) {
            volume.value = "No statistic generated by OctoPrint";
            length.value = "No statistic generated by OctoPrint";
            weight.value = "No statistic generated by OctoPrint";
            cost.value = "No statistic generated by OctoPrint";
          }
        }
        if (typeof current.job != "undefined") {
          let upDate = new Date(current.job.file.date * 1000);
          upDate =
            upDate.toLocaleDateString() + " " + upDate.toLocaleTimeString();
          uploadDate.value = upDate;
          path.value = current.job.file.path;
          size.value = Calc.bytes(current.job.file.size);

          estimatedPrintTime.value = Calc.generateTime(
            current.job.averagePrintTime
          );
          averagePrintTime.value = Calc.generateTime(
            current.job.estimatedPrintTime
          );
          lastPrintTime.value = Calc.generateTime(current.job.lastPrintTime);
        }
      } else {
        if (current.reason === "cancelled") {
          status.innerHTML =
            '<i class="fas fa-thumbs-down text-warning fa-3x"></i>';
        } else {
          status.innerHTML =
            '<i class="fas fa-exclamation text-danger fa-3x"></i>';
        }
      }
      function SelectHasValue(select, value) {
        let obj = document.getElementById(select);

        if (obj !== null) {
          return (obj.innerHTML.indexOf('value="' + value + '"') > -1);
        } else {
          return false;
        }
      }
      let filamentList = await returnDropDown(true);
      filamentList.forEach(list => {
        filament.insertAdjacentHTML("beforeend", list)
      })
      if(current.filamentSelection != null){
        if(SelectHasValue(filament, current.filamentSelection._id)){
          filament.value = current.filamentSelection._id;
        }else{
          filament.insertAdjacentHTML("afterbegin", `
            <option value="${current.filamentSelection._id}">${returnHistory(current.filamentSelection)}</option>
          `)
          filament.value = current.filamentSelection._id;
        }

      }else{
        filament.value = 0;
      }

      startDate.innerHTML = current.startDate;
      printTime.innerHTML = Calc.generateTime(current.printTime);
      endDate.innerHTML = current.endDate;
    }
  }

  static async save(id) {
    let update = {
      id: id,
      note: document.getElementById("notes").value,
      filamentId: document.getElementById("filament").value
    };

    let post = await OctoFarmClient.post("history/update", update);

    if (post.status === 200) {
      UI.createAlert("success", "Successfully updated your history entry...");
      document.getElementById("note-" + id).innerHTML = update.note;
      document.getElementById("spool-" + id).innerHTML = update.filamentId;
    }
  }
  static async delete(e) {
    if (e.target.classList.value.includes("historyDelete")) {
      let histID = {
        id: e.target.id
      };
      let post = await OctoFarmClient.post("history/delete", histID);
      if (post.status === 200) {
        e.target.parentElement.parentElement.parentElement.remove();
        UI.createAlert(
          "success",
          "Your history entry has been deleted...",
          3000,
          "clicked"
        );
      } else {
        UI.createAlert(
          "error",
          "Hmmmm seems we couldn't contact the server to delete... is it online?",
          3000,
          "clicked"
        );
      }
    }
  }
  static reload() {}
}
History.get();
window.onload = function () {tableSort.makeAllSortable();};