import UI from "./functions/ui.js";
import OctoFarmClient from "./octofarm.js";
import Validate from "./functions/validate.js";
import {returnDropDown} from "./modules/filamentGrab.js";

export default class OctoPrintClient {
  static post(printer, item, data) {
    let url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    });
  }
  static folder(printer, item, data) {
    let url = `${printer.printerURL}/api/files/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": printer.apikey
      },
      body: data
    });
  }
  static move(printer, item, data) {
    let url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    });
  }
  static delete(printer, item) {
    let url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
  }
  static async selectTool(printer, tool) {
    let opt = {
      command: "select",
      tool: tool
    };
    let post = await OctoPrintClient.post(printer, "printer/tool", opt);
    if (post.status === 204) {
      return true;
    } else {
      return false;
    }
  }
  static async system(printer, action) {
    let name = Validate.getName(printer)
    let url = "system/commands/core/" + action;
    bootbox.confirm({
      message: `Are your sure you want to ${action} ${name}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> No'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Yes'
        }
      },
      callback: async function(result) {
        if (result) {
          let post = await OctoPrintClient.post(printer, url);

          if (post.status === 204) {
            UI.createAlert(
              "success",
              `${name}: ${action} was successful`,
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `${name}: ${action} was unsuccessful. Please make sure printer is connected and commands are setup in Settings -> Server.`,
              3000,
              "clicked"
            );
          }
        }
      }
    });
  }
  static async move(element, printer, action, axis, dir) {
    let flashReturn = function() {
      element.target.classList = "btn btn-light";
    };
    let url = "printer/printhead";
    let post = null;
    let amount = await document.querySelectorAll("#pcAxisSteps > .btn.active");
    amount = amount[0].innerHTML;
    let opt = null;
    if (action === "home") {
      opt = {
        command: action,
        axes: axis
      };
    } else if (action === "jog") {
      if (dir != undefined) {
        amount = Number(dir + amount);
      } else {
        amount = Number(amount);
      }
      opt = {
        command: action,
        [axis]: amount
      };
    } else if (action === "feedrate") {
      opt = {
        command: action,
        factor: amount
      };
    }
    post = await OctoPrintClient.post(printer, url, opt);
    if (post.status === 204) {
      element.target.classList = "btn btn-success";
      setTimeout(flashReturn, 500);
    } else {
      element.target.classList = "btn btn-danger";
      setTimeout(flashReturn, 500);
    }
  }
  static async file(printer, fullPath, action, file) {
    let name = Validate.getName(printer)
    let url = "files/local/" + fullPath;
    let post = null;
    if (action === "load") {
      let opt = {
        command: "select",
        print: false
      };
      post = await OctoPrintClient.post(printer, url, opt);
    } else if (action === "print") {
      let opt = {
        command: "select",
        print: true
      };
      //Make sure feed/flow are set before starting print...
      let flow = {
        command: "flowrate",
        factor: parseInt(printer.flowRate)
      };
      await OctoPrintClient.post(printer, "printer/tool", flow);
      let feed = {
        command: "feedrate",
        factor: parseInt(printer.feedRate)
      };
      await OctoPrintClient.post(printer, "printer/printhead", feed);
      post = await OctoPrintClient.post(printer, url, opt);
    } else if (action === "delete") {
      post = await OctoPrintClient.delete(printer, url);
    }
    if (post.status === 204) {
      if (action === "delete") {
        let opt = {
          i: printer,
          fullPath: fullPath
        };
        let fileDel = await OctoFarmClient.post("printers/removefile", opt);
        UI.createAlert("success", `${name}: ${action} completed`, 3000, "clicked");
      } else {
        UI.createAlert("success", `${name}: ${action} actioned`, 3000, "clicked");
      }
    } else {
      UI.createAlert("error", `${name}: ${action} failed`, 3000, "clicked");
    }
  }
  static async jobAction(printer, opts, element) {
    let checkSettings = await OctoFarmClient.get("settings/server/get");
    checkSettings = await checkSettings.json();
    //Make sure feed/flow are set before starting print...
    let flow = {
      command: "flowrate",
      factor: parseInt(printer.flowRate)
    };
    await OctoPrintClient.post(printer, "printer/tool", flow);
    let feed = {
      command: "feedrate",
      factor: parseInt(printer.feedRate)
    };
    await OctoPrintClient.post(printer, "printer/printhead", feed);
    let body = {
      i: printer._id
    }
    printer = await OctoFarmClient.post("printers/printerInfo", body);
    printer = await printer.json();

    let filamentCheck = false;
    if(typeof checkSettings.filament !== 'undefined'){
      filamentCheck = checkSettings.filament.filamentCheck;
    }

    if(filamentCheck && printer.selectedFilament === null && opts.command === "start"){
      bootbox.confirm({
        message: "You have spools in the inventory, but none selected. Would you like to select a spool?",
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
          if(result){

          }else{
            if(printer.selectedFilament != null){
              let offset = {
                command: "offset",
                offsets: {
                  tool0: parseInt(printer.selectedFilament.spools.tempOffset)
                }
              }
              let post = await OctoPrintClient.post(printer, "printer/tool", offset);
            }
            await OctoPrintClient.post(printer, "printer/printhead", feed);
            let post = await OctoPrintClient.post(printer, "job", opts);
            element.target.disabled = false;
          }
        }
      });
    }else{
      if(printer.selectedFilament != null){
        let offset = {
          command: "offset",
          offsets: {
            tool0: parseInt(printer.selectedFilament.spools.tempOffset)
          }
        }
        let post = await OctoPrintClient.post(printer, "printer/tool", offset);
      }
      await OctoPrintClient.post(printer, "printer/printhead", feed);
      let post = await OctoPrintClient.post(printer, "job", opts);
      element.target.disabled = false;
    }

  }
  static async connect(command, printer) {
    let opts = null;
    if (command === "connect") {
      opts = {
        command: "connect",
        port: document.getElementById("pmSerialPort").value,
        baudrate: parseInt(document.getElementById("pmBaudrate").value),
        printerProfile: document.getElementById("pmProfile").value,
        save: true,
      };
    } else {
      opts = {
        command: "disconnect"
      };
    }
    let name = Validate.getName(printer)
    let post = await OctoPrintClient.post(printer, "connection", opts);
    if (post.status === 204) {
      UI.createAlert(
        "success",
        `Printer: ${name} has ${opts.command}ed successfully.`,
        3000,
        "click"
      );
      if (command === "connect") {
        document.getElementById("pmSerialPort").disabled = true;
        document.getElementById("pmBaudrate").disabled = true;
        document.getElementById("pmProfile").disabled = true;
      } else {
        document.getElementById("pmSerialPort").disabled = false;
        document.getElementById("pmBaudrate").disabled = false;
        document.getElementById("pmProfile").disabled = false;
      }
    } else {
      UI.createAlert(
        "error",
        `Printer: ${name} could not ${opts.command}.`,
        3000,
        "click"
      );
    }
  }
  static async power(printer, url, action, command) {
    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL)
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey)
    }
    if (typeof command === 'undefined' || command.length === 0) {
      let post = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (post.status !== 204)  {
        UI.createAlert("error", `${Validate.getName(printer)}: Could not complete ${action}`, 3000)
      } else {
        UI.createAlert("success", `${Validate.getName(printer)}: Successfully completed ${action}`, 3000)
      }
    } else {
      let post = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        },
        body: command
      });

      if (post.status !== 204) {
        UI.createAlert("error", `${Validate.getName(printer)}: Could not complete ${action}`, 3000)
      } else {
        UI.createAlert("success", `${Validate.getName(printer)}: Successfully completed ${action}`, 3000)
      }
    }
    return "done"
  }
  static async getPowerStatus(printer, url, command) {
    if(url.includes("[PrinterURL]")){
      url = url.replace("[PrinterURL]", printer.printerURL)
    }
    if(url.includes("[PrinterAPI]")){
      url = url.replace("[PrinterAPI]", printer.apikey)
    }
      if(typeof command === 'undefined' || command == ""){
        let post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if(post.status !== 200 || post.status !== 204){
          return "No Status"
        }else{
          post = await post.json();
          return post;
        }
      }else{
        let post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        let status = "No Status"
        if(post.status === 200 || post.status === 204){
          status = await post.json();
        }

        let powerStatusPrinter = document.getElementById("printerStatus-" + printer._id);
        if(powerStatusPrinter){
          if(status === "No Status"){
            powerStatusPrinter.style.color = "black";
          }else if(status[Object.keys(status)[0]]){
            powerStatusPrinter.style.color = "green";
          }else{
            powerStatusPrinter.style.color = "red";
          }
        }

      }
  }
}
