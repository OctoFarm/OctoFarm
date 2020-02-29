import Validate from "./lib/functions/validate.js";
import UI from "./lib/functions/ui.js";
import Client from "./lib/octofarm.js";
import FileOperations from "./lib/functions/file.js";
import Calculate from "./lib/functions/calc.js";
//Main functions on load!
window.onload = () => {
  //Listener for new printer button
  document.getElementById("addPrinterLine").addEventListener("click", e => {
    //Validate Printer Form, then Add
    PrintersManagement.validate(e);
  });
  //Listener for delete buttons on printer table
  document.getElementById("addPrintersTable").addEventListener("click", e => {
    //Remove from UI
    PrintersManagement.delete(e.target);
  });
  //Listener for save button
  document.getElementById("printerSaveBtn").addEventListener("click", e => {
    PrintersManagement.save("addPrintersTable");
  });
  //Listener for Importing Printers
  document
    .getElementById("importFileBtn")
    .addEventListener("change", function() {
      //Import printer list
      PrintersManagement.importPrinters(this.files);
    });
  //Listener for Exporting Printers
  document.getElementById("exportPrintersBtn").addEventListener("click", e => {
    //Export printer list
    PrintersManagement.exportPrinters();
  });
  //Listener for Deleting Printers
  document
    .getElementById("deletePrintersBtn")
    .addEventListener("click", function() {
      //Import printer list
      PrintersManagement.resetPrinters();
    });
  //Listener for editing printers
  /*   document.getElementById("editPrinters").addEventListener("click", e => {
    //Validate Printer Form, then Add
    Printers.edit(e);
  }); */
  //Listener for printer refresh button
  let searchOfflineBtn = document.getElementById("searchOfflineBtn");
  if (searchOfflineBtn !== null) {
    searchOfflineBtn.addEventListener("click", e => {
      searchOfflineBtn.innerHTML = '<i class="fas fa-redo fa-spin"></i>';
      Client.post("printers/runner/checkOffline", {})
        .then(res => {
          return res.json();
        })
        .then(res => {
          console.log(res);
          searchOfflineBtn.innerHTML = '<i class="fas fa-redo"></i>';
          UI.createAlert(
            "success",
            `Checked for printer(s): ${res.printers} <br> ${res.msg}`,
            3000,
            "yes"
          );
        })
        .catch(error => {});
    });
  }
};
class Printer {
  constructor(ip, port, camURL, apikey) {
    this.ip = ip;
    this.port = port;
    this.camURL = camURL;
    this.apikey = apikey;
  }
}
class PrintersManagement {
  constructor(ip, port, camURL, apikey) {
    this.printer = new Printer(ip, port, camURL, apikey);
  }
  build() {
    return this.printer;
  }
  setPrinter(index) {
    this.printer.index = index;
    return this;
  }
  static validate(e) {
    e.preventDefault();

    const ip = document.getElementById("printerIP");
    const port = document.getElementById("printerPort");
    const camURL = document.getElementById("printerCamURL");
    const apikey = document.getElementById("printerApiKey");
    document.getElementById("message").innerHTML = "";

    let errors = [];

    if (!Validate.IP(ip.value) || port.value === "" || apikey.value === "") {
      if (!Validate.IP(ip.value)) {
        ip.className = "form-control is-invalid";
        errors.push({ type: "warning", msg: "IP Address is not valid" });
      } else {
        ip.className = "form-control is-valid";
      }
      if (port.value === "") {
        port.className = "form-control is-invalid";
        errors.push({ type: "danger", msg: "Please enter a port" });
      } else {
        port.className = "form-control is-valid";
      }
      if (apikey.value === "") {
        apikey.className = "form-control is-invalid";
        errors.push({ type: "danger", msg: "Please enter a ApiKey" });
      } else {
        apikey.className = "form-control is-valid";
      }
      errors.forEach(error => {
        UI.createMessage(error);
      });
    } else {
      let currentApiKeys = document.querySelectorAll("[data-apikey]");
      let grabbedKeys = [];
      currentApiKeys.forEach(element => {
        grabbedKeys.push(element.innerHTML);
      });
      if (grabbedKeys.includes(apikey.value)) {
        apikey.className = "form-control is-invalid";
        errors.push({
          type: "warning",
          msg: "ApiKey already exists in database."
        });
        errors.forEach(error => {
          UI.createMessage(error);
        });
      } else {
        apikey.className = "form-control is-valid";
        let printer = new Printer(
          ip.value,
          port.value,
          camURL.value,
          apikey.value
        );
        this.add(printer);
        document.getElementById("message").innerHTML = "";
        let oldPrinterCount = document.getElementById("printerAmmount");
        const newPrinterCount = parseInt(oldPrinterCount.innerHTML) + 1;
        oldPrinterCount.innerHTML = newPrinterCount;
        this.clearFields();
        //Not actually errors, couldn't be arsed re-creating functions
        errors.push({
          type: "success",
          msg:
            "Printer successfully added, she's a beaut! Don't forget to save after finishing adding your farm."
        });
        errors.forEach(error => {
          UI.createMessage(error);
        });
      }
    }
  }
  static clearFields() {
    document.getElementById("printerIP").value = "";
    document.getElementById("printerPort").value = "";
    document.getElementById("printerCamURL").value = "";
    document.getElementById("printerApiKey").value = "";
    document.getElementById("printerIP").className = "form-control";
    document.getElementById("printerPort").className = "form-control";
    document.getElementById("printerCamURL").className = "form-control";
    document.getElementById("printerApiKey").className = "form-control";
  }
  static add(printer) {
    const list = document.getElementById("addPrintersTable");
    const row = document.createElement("tr");
    row.innerHTML = `
                <td>${printer.ip}</td>
                <td>${printer.port}</td>
                <td>${printer.camURL}</td>
                <td data-apikey="${printer.apikey}">${printer.apikey}</td>
                <td class="delete"><button type="button" class="btn btn-danger delete"><i class="fas fa-trash delete"></i></button></td>`;
    list.appendChild(row);
  }
  static edit(e) {
    e.preventDefault();

    const list = document.getElementById("addPrintersTable");
    list.innerHTML = "";
    for (let i = 0; i < printers.length; i++) {
      const row = document.createElement("tr");
      row.innerHTML = `
            <td><input type="text" class="form-control bg-dark text-white" placeholder="${printers[i].ip}"></td>
            <td><input type="text" class="form-control bg-dark text-white" placeholder="${printers[i].port}"></td>
            <td><input type="text" class="form-control bg-dark text-white" placeholder="${printers[i].camURL}"></td>
            <td><input type="text" class="form-control bg-dark text-white" placeholder="${printers[i].apikey}"></td>`;
      list.appendChild(row);
    }
  }
  static delete(el) {
    let errors = [];
    document.getElementById("message").innerHTML = "";
    if (
      el.classList.contains("delete") ||
      el.classList.contains("deleteIcon")
    ) {
      errors.push({
        type: "success",
        msg:
          "Printer has been successfully removed from farm. Don't forget to save after finishing your changes."
      });
      errors.forEach(error => {
        UI.createMessage(error);
      });
      if (el.classList.contains("deleteIcon")) {
        el.parentElement.parentElement.parentElement.remove();
      } else {
        el.parentElement.parentElement.remove();
      }

      let oldPrinterCount = document.getElementById("printerAmmount");
      const newPrinterCount = parseInt(oldPrinterCount.innerHTML) - 1;
      oldPrinterCount.innerHTML = newPrinterCount;
    }
  }
  static async save(printerTable) {
    document.getElementById("overlay").style.display = "block";
    UI.createAlert(
      "success",
      "Printers updated, please wait whilst the server restarts...<br> This may take some time...<br> The page will automatically refresh when complete.... ",
      10000,
      "clicked"
    );
    const table = document.getElementById(printerTable);
    let printers = new Array();
    for (var r = 0, n = table.rows.length; r < n; r++) {
      let printer = new PrintersManagement(
        table.rows[r].cells[0].innerHTML,
        table.rows[r].cells[1].innerHTML,
        table.rows[r].cells[2].innerHTML,
        table.rows[r].cells[3].innerHTML
      )
        .setPrinter(r)
        .build();
      printers.push(printer);
    }
    _.orderBy(printers, ["index"], ["desc"]);

    Client.post("printers/save", printers)
      .then(res => {
        if (res.status === 200) {
          Client.post("printers/runner/init", {});
          window.location.replace("/dashboard");
        } else {
          window.location.replace("/dashboard");
        }
      })
      .catch(err => {
        UI.createAlert(
          "error",
          "Sorry I can't seem to access the API to save your printers.",
          3000,
          "yes"
        );
        console.log(err);
      });
  }
  //Import Printers Function
  static importPrinters(Afile) {
    if (Afile[0].name.includes(".json")) {
      let files = Afile[0];
      let reader = new FileReader();
      reader.onload = this.stageImport(files);
      reader.readAsText(files);
    } else {
      //File not json
      UI.createAlert("error", `File type not .json!`, 3000);
    }
  }
  static stageImport() {
    return function(e) {
      const theBytes = e.target.result; //.split('base64,')[1];
      //Initial JSON validation
      if (Validate.JSON(theBytes)) {
        //If we can parse the file.
        //Grab uploaded file contents into an object
        const newPrinters = JSON.parse(theBytes);
        //Validate the file.
        if (
          newPrinters.ip.length === newPrinters.port.length &&
          newPrinters.ip.length === newPrinters.port.length &&
          newPrinters.ip.length === newPrinters.apikey.length
        ) {
          //Create bootbox confirmation message
          let message = `<center><i class="fas fa-exclamation-circle"></i> Please check over the list below and press ok to confirm the import.</center><br><hr><br>`;
          message += `<table class="table table-sm table-dark"><thead><tr><th scope="col">IP</th><th scope="col">Port</th><th scope="col">Camera URL</th><th scope="col">API KEY</th></tr></thead><tbody id="newPrintersTable">`;
          for (let i = 0; i < newPrinters.ip.length; i++) {
            message += `
                            <tr><td>${newPrinters.ip[i]}</td>
                            <td>${newPrinters.port[i]}</td>
                            <td>${newPrinters.camURL[i]}</td>
                            <td>${newPrinters.apikey[i]}</td></tr>`;
          }
          message += `</tbody></table >`;
          //Last change confirmation
          bootbox
            .confirm(message, function(result) {
              if (result) {
                PrintersManagement.save("newPrintersTable");
              }
            })
            .find("div.modal-dialog")
            .addClass("largeWidth");
        } else {
          UI.createAlert(
            "error",
            "The file you have tried to upload is missing a value.",
            3000
          );
        }
      } else {
        UI.createAlert(
          "error",
          "The file you have tried to upload contains json syntax errors.",
          3000
        );
      }
    };
  }
  static activatePrinterManagement() {
    //document.getElementById("editPrinters").classList.remove("d-none");
    document.getElementById("exportPrintersBtn").disabled = false;
    document.getElementById("deletePrintersBtn").disabled = false;
    document.getElementById("menuMonitoring").classList.remove("notyet");
    document.getElementById("fileManagerBtn").classList.remove("notyet");
    document.getElementById("historyBtn").classList.remove("notyet");
    document.getElementById("filamentBtn").classList.remove("notyet");
  }
  static deactivatePrinterManagement() {
    //document.getElementById("editPrinters").classList.add("d-none");
    document.getElementById("menuMonitoring").classList.add("notyet");
    document.getElementById("fileManagerBtn").classList.add("notyet");
    document.getElementById("historyBtn").classList.add("notyet");
    document.getElementById("filamentBtn").classList.add("notyet");
    document.getElementById("exportPrintersBtn").disabled = true;
    document.getElementById("deletePrintersBtn").disabled = true;
  }
  static exportPrinters() {
    const table = document.getElementById("addPrintersTable");
    let printers = new Array();
    for (var r = 0, n = table.rows.length; r < n; r++) {
      let printer = new PrintersManagement(
        table.rows[r].cells[0].innerHTML,
        table.rows[r].cells[1].innerHTML,
        table.rows[r].cells[2].innerHTML,
        table.rows[r].cells[3].innerHTML
      );
      printers.push(printer);
    }
    let reFormat = {};
    reFormat.ip = [];
    reFormat.port = [];
    reFormat.camURL = [];
    reFormat.apikey = [];
    printers.forEach((old, index) => {
      reFormat["ip"].push(old.ip);
      reFormat["port"].push(old.port);
      reFormat["camURL"].push(old.camURL);
      reFormat["apikey"].push(old.apikey);
    });
    FileOperations.download("printers.json", JSON.stringify(reFormat));
  }
  static resetPrinters() {
    Client.post("printers/delete")
      .then(res => {
        if (res.status === 200) {
          document.getElementById("addPrintersTable").innerHTML = "";
          document.getElementById("printerAmmount").innerHTML = 0;
          PrintersManagement.deactivatePrinterManagement();
          window.location.replace("/dashboard");
        } else {
          window.location.replace("/dashboard");
        }
      })
      .catch(err => {
        UI.createAlert(
          "error",
          "Sorry I can't seem to access the API to save your printers.",
          3000,
          "yes"
        );
        console.log(err);
      });
  }
}
