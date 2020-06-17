import OctoFarmClient from "../octofarm.js";
import Calc from "../functions/calc.js";
import UI from "../functions/ui.js";
import {returnDropDown} from "./filamentGrab.js";
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
  static async get() {
    let numOr0 = n => isNaN(n) ? 0 : parseFloat(n)
    let newHistory = await OctoFarmClient.get("history/get");
    historyList = await newHistory.json();
    for (let i = historyList.history.length; i--;) {
      document.getElementById("printerCost-"+ historyList.history[i]._id).innerHTML = historyList.history[i].printerCost;
      document.getElementById("printerCost-"+ historyList.history[i]._id).innerHTML
      let spoolText = "";
      let usageText = "";
      let costText = "";
      let lengthArray = [];
      let gramsArray = [];
      if(historyList.history[i].spools !== null){
        historyList.history[i].spools.forEach(spool => {
          let sp = Object.keys(spool)[0]
          lengthArray.push(numOr0(spool[sp].length))
          gramsArray.push(numOr0(spool[sp].weight))
          if(spool[sp].spoolName === null){
            spoolText += "<b>" + spool[sp].toolName + "</b>: (No Spool)<br>";
          }else{
            spoolText += "<b>" + spool[sp].toolName + "</b>: " + spool[sp].spoolName + "<br>";
            usageText += "<b>" + spool[sp].toolName + "</b>: " + (parseFloat(spool[sp].length)/1000).toFixed(2) + "m / " + spool[sp].weight.toFixed(2) + "g" + "<br>";
            costText += "<b>" + spool[sp].toolName + "</b>: " + spool[sp].cost+ "<br>";
          }

        })
      }else{
        spoolText += "<b>Tool 0</b>: (No Spool)<br>";
      }

      document.getElementById("spool-" + historyList.history[i]._id).innerHTML = spoolText;
      document.getElementById("usage-" + historyList.history[i]._id).innerHTML = usageText;
      document.getElementById("totalUsageMeter-"+ historyList.history[i]._id).innerHTML = (lengthArray.reduce((a, b) => a + b, 0)/1000).toFixed(2);
      document.getElementById("totalUsageGrams-"+ historyList.history[i]._id).innerHTML = (gramsArray.reduce((a, b) => a + b, 0)).toFixed(2);
      document.getElementById("cost-"+ historyList.history[i]._id).innerHTML = costText;
      document.getElementById("totalCost-"+ historyList.history[i]._id).innerHTML = historyList.history[i].totalCost.toFixed(2);

      //


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
    function SelectHasValue(select, value) {
      let obj = document.getElementById(select);
      if (obj !== null) {
        return (obj.innerHTML.indexOf('value="' + value + '"') > -1);
      } else {
        return false;
      }
    }
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
      let printerCost = document.getElementById("printerCost");
      let actualPrintTime = document.getElementById("printerTime");
      let printTimeAccuracy = document.getElementById("printTimeAccuracy");

      let startDate = document.getElementById("startDate");
      let printTime = document.getElementById("printTime");
      let endDate = document.getElementById("endDate");

      let notes = document.getElementById("notes");

      let uploadDate = document.getElementById("dateUploaded");
      let path = document.getElementById("path");
      let size = document.getElementById("size");

      let estimatedPrintTime = document.getElementById("estimatedPrintTime");
      let averagePrintTime = document.getElementById("averagePrintTime");
      let lastPrintTime = document.getElementById("lastPrintTime");
      let viewTable = document.getElementById("viewTable");
      let jobCosting = document.getElementById("jobCosting");

      viewTable.innerHTML = "";
      printerName.innerHTML = " - ";
      fileName.innerHTML = " - ";
      status.innerHTML = " - ";
      printerCost.placeholder = " - ";
      actualPrintTime.placeholder = " - ";
      printTimeAccuracy.placeholder = " - ";
      startDate.innerHTML = " - ";
      printTime.innerHTML = " - ";
      endDate.innerHTML = " - ";
      notes.placeholder = "";
      uploadDate.placeholder = " - ";
      path.value = " - ";
      size.value = " - ";
      estimatedPrintTime.placeholder = " - ";
      averagePrintTime.placeholder = " - ";
      lastPrintTime.placeholder = " - ";
      jobCosting.placeholder = " - ";
      let thumbnail = document.getElementById("history-thumbnail");
      thumbnail.innerHTML = "";
      let index = _.findIndex(historyList.history, function(o) {
        return o._id == e.target.id;
      });
      let current = historyList.history[index];
      printerName.innerHTML = current.printer;
      fileName.innerHTML = current.file.name;
      if(typeof current.thumbnail !== 'undefined' && current.thumbnail != null){
        thumbnail.innerHTML = `<center><img src="data:image/png;base64, ${current.thumbnail}" class="historyImage mb-2"></center>`
      }
      startDate.innerHTML = "<b>Started</b><hr>" + current.startDate.replace(" - ", "<br>");
      printTime.innerHTML = "<b>Duration</b><hr>" + Calc.generateTime(current.printTime);
      endDate.innerHTML = "<b>Finished</b><hr>" + current.endDate.replace(" - ", "<br>");
      printerCost.value = current.printerCost;
      notes.value = current.notes;
      actualPrintTime.value = Calc.generateTime(current.printTime);
      status.innerHTML = current.state;
      if(typeof current.job !== 'undefined' && current.job !== null){
        estimatedPrintTime.value = Calc.generateTime(current.job.estimatedPrintTime);
        printTimeAccuracy.value = current.job.printTimeAccuracy;
      }
      jobCosting.value = current.totalCost;
      let upDate = new Date(current.file.uploadDate * 1000);
      upDate =
          upDate.toLocaleDateString() + " " + upDate.toLocaleTimeString();
      uploadDate.value = upDate;
      path.value = current.file.path;
      size.value = Calc.bytes(current.file.size);
      averagePrintTime.value = Calc.generateTime(current.file.averagePrintTime)
      lastPrintTime.value = Calc.generateTime(current.file.lastPrintTime)
      let toolsArray = [];
      current.spools.forEach(spool => {
        let sp = Object.keys(spool)[0]
        toolsArray.push(sp)
        viewTable.insertAdjacentHTML("beforeend",`
          <tr>
            <td>
              <b>${spool[sp].toolName}</b>
              </td>
              <td>
              <div class="input-group mb-3">
                  <select id="filament-${sp}" class="custom-select">
                  </select>
                  </div>
              </td>
              <td>
              ${(spool[sp].volume).toFixed(2)}m3
              </td>
              <td>
              ${(spool[sp].length/1000).toFixed(2)}m
              </td>
              <td>
                 ${(spool[sp].weight).toFixed(2)}g
              </td>
              <td>
                 ${spool[sp].cost}
              </td>
              </tr>
          </tr>
        `)
      })
      for(let i = 0; i<toolsArray.length; i++){
        let currentToolDropDown = document.getElementById("filament-"+toolsArray[i]);
        let filamentList = await returnDropDown();
        filamentList.forEach(list => {
          currentToolDropDown.insertAdjacentHTML("beforeend", list);
        })
        if(current.spools[i][toolsArray[i]].spoolId !== null){
          if(SelectHasValue(currentToolDropDown.id, current.spools[i][toolsArray[i]].spoolId)){
            currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
          }else{
            currentToolDropDown.insertAdjacentHTML("afterbegin", `
              <option value="${current.spools[i][toolsArray[i]].spoolId}">${current.spools[i][toolsArray[i]].spoolName}</option>
          `)
            currentToolDropDown.value = current.spools[i][toolsArray[i]].spoolId;
          }
        }else{
          currentToolDropDown.value = 0;
        }
      }

      viewTable.insertAdjacentHTML("beforeend", `
        <tr style="background-color:#303030;">
        <td>
        Totals
        </td>
        <td>

        </td>
        <td>
        ${current.totalVolume.toFixed(2)}m3
        </td>
        <td>
        ${(current.totalLength/1000).toFixed(2)}m
        </td>
        <td>
        ${current.totalWeight.toFixed(2)}g
        </td>
        <td>
        ${current.spoolCost.toFixed(2)}
        </td>
        </tr>
      `)

    }
  }
  static async updateCost(id) {
    let update = {
      id: id
    }
    let post = await OctoFarmClient.post("history/updateCostMatch", update);
    post = await post.json();
    if (post.status === 200) {
      UI.createAlert("success", "Successfully added your printers cost to history.", 3000, "clicked");
      document.getElementById("printerCost-"+id).innerHTML = Calc.returnPrintCost(post.costSettings, post.printTime);
    }else{
      UI.createAlert("warning", "Printer no longer exists in database, default cost applied.", 3000, "clicked");
      document.getElementById("printerCost-"+id).innerHTML = Calc.returnPrintCost(post.costSettings, post.printTime);
    }
  }
  static async save(id) {
    let filamentDrops = document.querySelectorAll("[id^='filament-tool']");
    let filamentID = [];
    filamentDrops.forEach(drop => {
      filamentID.push(drop.value);
    })

    let update = {
      id: id,
      note: document.getElementById("notes").value,
      filamentId: filamentID
    };

    let post = await OctoFarmClient.post("history/update", update);

    if (post.status === 200) {
      UI.createAlert("success", "Successfully updated your history entry...", 3000, "clicked");
      document.getElementById("note-" + id).innerHTML = update.note;
      document.getElementById("spool-" + id).innerHTML = update.filamentId;
    }
  }
  static async delete(e) {
    if (e.target.classList.value.includes("historyDelete")) {
      bootbox.confirm({
          message: "Are you sure you'd like to delete this entry? this is not reversible.",
          buttons: {
              confirm: {
                  label: 'Yes',
                  className: 'btn-success'
              },
              cancel: {
                  label: 'No',
                  className: 'btn-danger'
              }
          },
          callback: async function (result) {

              let histID = {
                id: e.target.id
              };
              let post = await OctoFarmClient.post("history/delete", histID);
              if (post.status === 200) {
                jplist.resetContent(function(){
                  //remove element with id = el1
                  e.target.parentElement.parentElement.parentElement.remove();
                });
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

      });
    }
  }
  static updateTotals(filtered) {
    let times = []
    let cost = [];
    let printerCost = [];
    let statesCancelled = [];
    let statesFailed = [];
    let statesSuccess = [];
    let totalUsageGrams = [];
    let totalUsageMeter = [];
      filtered.forEach(row => {
        times.push(parseInt(row.getElementsByClassName("time")[0].innerText))
        if(!isNaN(parseFloat(row.getElementsByClassName("filamentCost")[0].innerText))){
          cost.push(parseFloat(row.getElementsByClassName("filamentCost")[0].innerText))
        }
        if(!isNaN(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))){
          printerCost.push(parseFloat(row.getElementsByClassName("printerCost")[0].innerText))
        }
        if(!isNaN(parseFloat(row.getElementsByClassName("totalUsageGrams")[0].innerText))){
          totalUsageGrams.push(parseFloat(row.getElementsByClassName("totalUsageGrams")[0].innerText))
        }
        if(!isNaN(parseFloat(row.getElementsByClassName("totalUsageMeter")[0].innerText))){
          totalUsageMeter.push(parseFloat(row.getElementsByClassName("totalUsageMeter")[0].innerText))
        }
        let stateText = row.getElementsByClassName("stateText")[0].innerText.trim();
        if(stateText === "Cancelled"){
          statesCancelled.push(stateText)
        }
        if(stateText === "Failure"){
          statesFailed.push(stateText)
        }
        if(stateText === "Success"){
          statesSuccess.push(stateText)
        }


      })
    let total = statesCancelled.length + statesFailed.length + statesSuccess.length;
    let cancelledPercent = (statesCancelled.length / total) * 100;
    let failurePercent = (statesFailed.length / total) * 100;
    let successPercent = (statesSuccess.length / total) * 100;
    let failure = document.getElementById("totalFailurePercent")
    failure.style.width = failurePercent.toFixed(2)+"%";
    failure.innerHTML = failurePercent.toFixed(2)+"%";
    let success = document.getElementById("totalSuccessPercent")
    success.style.width = successPercent.toFixed(2)+"%";
    success.innerHTML = successPercent.toFixed(2)+"%";
    let cancelled = document.getElementById("totalCancelledPercent")
    cancelled.style.width = cancelledPercent.toFixed(2)+"%";
    cancelled.innerHTML = cancelledPercent.toFixed(2)+"%";
    document.getElementById("totalCost").innerHTML = cost.reduce((a, b) => a + b, 0).toFixed(2)
    document.getElementById("totalFilament").innerHTML = totalUsageMeter.reduce((a, b) => a + b, 0).toFixed(2) + "m / " + totalUsageGrams.reduce((a, b) => a + b, 0).toFixed(2)+ "g"
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
