import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import {returnHistory, returnHistoryUsage, returnDropDown} from "./filamentGrab.js";
import tableSort from "../functions/tablesort.js";
window.onload = function () {tableSort.makeAllSortable();};

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
  document.getElementById("historyUpdateCostBtn").remove();
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
        let radius = parseFloat(1.75) / 2
        let volume = (length * Math.PI * radius * radius)
        let usage = volume * parseFloat(1.24)
        return length.toFixed(2) + "m / " + usage.toFixed(2) + "g";
      }
  }
  static returnFilamentCost(filament, usageElement){
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
  static returnPrintCost(costSettings, time){
    if(typeof costSettings === "undefined"){
      //Attempt to update cost settings in history...
      return "No cost settings to calculate from"
    }else{
      // calculating electricity cost
      let powerConsumption = parseFloat(costSettings.powerConsumption);
      let costOfElectricity = parseFloat(costSettings.electricityCosts);
      let costPerHour = powerConsumption * costOfElectricity;
      let estimatedPrintTime = time / 3600;  // h
      let electricityCost = costPerHour * estimatedPrintTime;
      // calculating printer cost
      let purchasePrice = parseFloat(costSettings.purchasePrice);
      let lifespan = parseFloat(costSettings.estimateLifespan);
      let depreciationPerHour = lifespan > 0 ? purchasePrice / lifespan : 0;
      let maintenancePerHour = parseFloat(costSettings.maintenanceCosts);
      let printerCost = (depreciationPerHour + maintenancePerHour) * estimatedPrintTime;
      // assembling string
      let estimatedCost = electricityCost + printerCost;
      return estimatedCost.toFixed(2);
    }



  }

  static async get() {
    let newHistory = await OctoFarmClient.get("history/get");
    historyList = await newHistory.json();
    for (let i = historyList.history.length; i--;) {
      let filamentString = null;
      let filamentUsage = null;
      if (historyList.history[i].printHistory.success) {
        let filamentString = null;
        let filamentUsage = null;
        if (historyList.history[i].printHistory.filamentSelection !== null) {
          filamentString = await returnHistory(historyList.history[i].printHistory.filamentSelection)
          filamentUsage = returnHistoryUsage(historyList.history[i].printHistory)
        } else {
          filamentString = "None selected..."
          filamentUsage = History.returnFilamentUsage(historyList.history[i].printHistory)
        }
        document.getElementById("spool-" + historyList.history[i]._id).innerHTML = filamentString;
        document.getElementById("usage-" + historyList.history[i]._id).innerHTML = filamentUsage;
        let grams = document.getElementById("usage-" + historyList.history[i]._id)
        grams = grams.innerHTML
        grams = grams.split(" / ").pop();

        document.getElementById("printerCost-" + historyList.history[i]._id).innerHTML = History.returnPrintCost(historyList.history[i].printHistory.costSettings, historyList.history[i].printHistory.printTime);
        document.getElementById("cost-" + historyList.history[i]._id).innerHTML = History.returnFilamentCost(historyList.history[i].printHistory.filamentSelection, grams);
      } else {
        if (historyList.history[i].printHistory.filamentSelection !== null) {
          filamentString = await returnHistory(historyList.history[i].printHistory.filamentSelection)
        } else {
          filamentString = "None selected..."
        }
        document.getElementById("spool-" + historyList.history[i]._id).innerHTML = filamentString;
        document.getElementById("cost-" + historyList.history[i]._id).innerHTML = "";
        document.getElementById("usage-" + historyList.history[i]._id).innerHTML = "";
        document.getElementById("printerCost-" + historyList.history[i]._id).innerHTML = History.returnPrintCost(historyList.history[i].printHistory.costSettings, historyList.history[i].printHistory.printTime);
      }

    }
    jplist.init({
      storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
      storageName: 'history-sorting' //the same storage name can be used to share storage between multiple pages
    });
    document.getElementById("loading").style.display = "none";
    document.getElementById("wrapper").classList.remove("d-none");
    document.getElementById("historyToolbar").classList.remove("d-none");
  }

  static async edit(e) {
    if (e.target.classList.value.includes("historyEdit")) {
      document.getElementById("historySave").insertAdjacentHTML(
        "afterbegin",
        `
      <button id="historyUpdateCostBtn" type="button" class="btn btn-warning" data-dismiss="modal">
        Update Cost
      </button>
      <button id="historySaveBtn" type="button" class="btn btn-success" data-dismiss="modal">
        Save Changes
      </button>
    `
      );
      document.getElementById("historySaveBtn").addEventListener("click", f => {
        History.save(e.target.id);
      });
      document.getElementById("historyUpdateCostBtn").addEventListener("click", f => {
        History.updateCost(e.target.id);
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
      let printerCost = document.getElementById("printerCost");

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
      cost.value = " - ";
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
          cost.value = History.returnFilamentCost(current.filamentSelection, filamentWeight);
          printerCost.value = History.returnPrintCost(current.costSettings, current.printTime);


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
      let filamentList = await returnDropDown();
      filamentList.forEach(list => {
        filament.insertAdjacentHTML("beforeend", list)
      })
      if(current.filamentSelection != null){
        if(SelectHasValue(filament, current.filamentSelection._id)){
          filament.value = current.filamentSelection._id;
        }else{
          filament.insertAdjacentHTML("afterbegin", `
            <option value="${current.filamentSelection._id}">${await returnHistory(current.filamentSelection)}</option>
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
  static async updateCost(id) {
    let update = {
      id: id
    }
    let post = await OctoFarmClient.post("history/updateCostMatch", update);
    if (post.status === 200) {
      UI.createAlert("success", "Successfully updated your printers cost");
    }else{
      UI.createAlert("success", "Printer no longer exists in database, default cost applied.");
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
  static updateTotals(filtered) {
    let times = []
    let cost = [];
    let printerCost = [];
    let usageG = [];
    let usageL = [];
      filtered.forEach(row => {
        times.push(parseInt(row.getElementsByClassName("time")[0].innerText))
        if(!isNaN(parseFloat(row.getElementsByClassName("cost")[0].innerText))){
          cost.push(parseFloat(row.getElementsByClassName("cost")[0].innerText))
        }
        if(!isNaN(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))){
          printerCost.push(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))
        }
        if(row.getElementsByClassName("usage")[0].innerText !== ""){
          let split = row.getElementsByClassName("usage")[0].innerText.split("/")
          usageL.push(parseFloat(split[0]))
          usageG.push(parseFloat(split[1]))
        }

      })
    document.getElementById("totalCost").innerHTML = cost.reduce((a, b) => a + b, 0).toFixed(2)
    document.getElementById("totalFilament").innerHTML = usageL.reduce((a, b) => a + b, 0).toFixed(2) + "m / " + usageG.reduce((a, b) => a + b, 0).toFixed(2)+ "g"
    let totalTimes = times.reduce((a, b) => a + b, 0)
    document.getElementById("totalPrintTime").innerHTML = Calc.generateTime(totalTimes)
    document.getElementById("printerTotalCost").innerHTML = printerCost.reduce((a, b) => a + b, 0).toFixed(2);
    document.getElementById("combinedTotalCost").innerHTML = (parseFloat(printerCost.reduce((a, b) => a + b, 0).toFixed(2)) + parseFloat(cost.reduce((a, b) => a + b, 0).toFixed(2))).toFixed(2);
  }
}
const element = document.getElementById('listenerHistory');
element.addEventListener('jplist.state', (e) => {
  //the elements list after filtering + pagination
  History.updateTotals(e.jplistState.filtered);
}, false);
History.get();
