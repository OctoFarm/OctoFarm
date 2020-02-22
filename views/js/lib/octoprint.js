import UI from "./functions/ui.js";
import OctoFarmClient from "./octofarm.js";
export default class OctoPrintClient {
  static post(printer, item, data) {
    let url = `http://${printer.ip}:${printer.port}/api/${item}`;
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
    let url = `http://${printer.ip}:${printer.port}/api/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    });
  }
  static async system(printer, action) {
    let url = "system/commands/core/" + action;
    bootbox.confirm({
      message:
        "This is a confirm with custom button text and color! Do you like it?",
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      callback: async function(result) {
        if (result) {
          let post = await OctoPrintClient.post(printer, url);
          if (post.status === 204) {
            UI.createAlert(
              "success",
              `${printer.index}: ${action} was successful`,
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `${printer.index}: ${action} was unsuccessful. Please make sure printer is connected and commands are setup in Settings -> Server.`,
              3000,
              "clicked"
            );
          }
        }
      }
    });

    console.log(printer.ip, printer.port, action);
  }
  static move(printer) {}
  static async file(printer, fullPath, action, file) {
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
      post = await OctoPrintClient.post(printer, url, opt);
    } else if (action === "delete") {
      post = await OctoPrintClient.delete(printer, url);
    }
    if (post.status === 204) {
      if (action === "delete") {
        document.getElementById("file-" + fullPath).remove();
        let opt = {
          i: printer.index,
          fullPath: fullPath
        };
        let fileDel = await OctoFarmClient.post("printers/removefile", opt);
        UI.createAlert("success", `${action} completed`, 3000, "clicked");
      } else {
        UI.createAlert("success", `${action} actioned`, 3000, "clicked");
      }
    } else {
      UI.createAlert("error", `${action} failed`, 3000, "clicked");
    }
  }
  static async connect(command, printer) {
    let opts = null;
    if (command === "connect") {
      opts = {
        command: "connect",
        port: document.getElementById("pmSerialPort").value,
        baudrate: parseInt(document.getElementById("pmBaudrate").value),
        printerProfile: document.getElementById("pmProfile").value
      };
    } else {
      opts = {
        command: "disconnect"
      };
    }
    let post = await OctoPrintClient.post(printer, "connection", opts);
    if (post.status === 204) {
      UI.createAlert(
        "success",
        `Printer: ${printer.index} has ${opts.command}ed successfully.`,
        3000,
        "click"
      );
    } else {
      UI.createAlert(
        "error",
        `Printer: ${printer.index} could not ${opts.command}.`,
        3000,
        "click"
      );
    }
  }
}
