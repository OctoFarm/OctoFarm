import UI from "../lib/functions/ui.js";
import OctoFarmClient from "./octofarm-client.service";
import Axios from "./axios.service";
import { validatePrinterObject } from "../utils/validators/octoprint.validator";

export default class OctoPrintClient extends Axios {
  static base = "/api";
  static settings = `${this.base}/settings`;
  static timelapse = `${this.base}/timelapse`;
  static filesBase = `${this.base}/files`;
  static filesLocal = `${this.filesBase}/local/`;
  static filesSdCard = `${this.filesBase}/sdcard/`;
  static printerBase = `${this.base}/printer`;
  static tool = `${this.printerBase}/tool`;
  static printHead = `${this.printerBase}/printhead`;
  static command = `${this.printerBase}/command`;

  static getDefaultHeaders(apikey) {
    return {
      "Content-Type": "application/json",
      "X-Api-Key": apikey
    };
  }
  static formDataHeaders(apikey) {
    return {
      "Content-Type": "multipart/form-data",
      "X-Api-Key": apikey
    };
  }

  static updateSettings(printer, data) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.post(printer.printerURL + this.settings, data, options);
  }

  static updateTimelapse(printer, data) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.post(printer.printerURL + this.timelapse, data, options);
  }

  static selectFile(printer, filePath) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const command = {
      command: "select",
      print: false
    };
    return this.post(printer.printerURL + this.filesLocal + filePath, command, options);
  }

  static async printFile(printer, filePath) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const command = {
      command: "select",
      print: true
    };
    // OctoFarm keeps track of the previously set flow/feed rates and re-applies them to a print.
    await this.updateFlowRate(printer);
    await this.updateFeedRate(printer);
    return this.post(printer.printerURL + this.filesLocal + filePath, command, options);
  }

  static deleteFile(printer, filePath) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.deleteStatus(printer.printerURL + this.filesLocal + filePath, options);
  }

  static moveFileOrFolder(printer, fullPath, location) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const command = {
      command: "move",
      destination: location
    };
    return this.post(printer.printerURL + this.filesLocal + fullPath, command, options);
  }

  static checkFile(printer, filePath) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.getStatus(printer.printerURL + this.filesLocal + filePath, options);
  }

  static createFolder(printer, formData) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.post(printer.printerURL + this.filesLocal, formData, options);
  }

  static deleteFolder(printer, filePath) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.post(printer.printerURL + this.filesLocal + filePath, options);
  }

  static updateFlowRate(printer, override) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const flow = {
      command: "flowrate",
      factor: parseInt(printer.flowRate)
    };
    return this.post(printer.printerURL + this.tool, flow, options);
  }

  static updateFeedRate(printer, override) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const feed = {
      command: "feedrate",
      factor: parseInt(printer.feedRate)
    };
    return this.post(printer.printerURL + this.printHead, feed, options);
  }

  static startGcode(printer, gcode) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    const command = {
      commands: gcode
    };
    return this.post(printer.printerURL + this.command, command, options);
  }

  static postNOAPI(printer, item, data) {
    validatePrinterObject(printer);
    const url = `${printer.printerURL}/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    }).catch((e) => {
      console.log(e);
    });
  }

  static folder(printer, item, data) {
    validatePrinterObject(printer);
    const url = `${printer.printerURL}/api/files/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": printer.apikey
      },
      body: data
    }).catch((e) => {
      console.log(e);
    });
  }

  static async selectTool(printer, tool) {
    const opt = {
      command: "select",
      tool
    };
    const post = await OctoPrintClient.post(printer, "printer/tool", opt);

    if (post.status === 204) {
      return true;
    } else {
      return false;
    }
  }

  static async system(printer, action) {
    const url = "system/commands/core/" + action;
    bootbox.confirm({
      message: `Are your sure you want to ${action} ${printer.printerName}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> No'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Yes'
        }
      },
      async callback(result) {
        if (result) {
          const post = await OctoPrintClient.post(printer, url).catch((e) => {
            UI.createAlert("danger", e, 4000, "Clicked");
          });

          if (post.status === 204) {
            UI.createAlert(
              "success",
              `${printer.printerName}: ${action} was successful`,
              3000,
              "clicked"
            );
          } else {
            UI.createAlert(
              "error",
              `${printer.printerName}: ${action} was unsuccessful. Please make sure printer is connected and commands are setup in Settings -> Server.`,
              3000,
              "clicked"
            );
          }
        }
      }
    });
  }

  static async systemNoConfirm(printer, action) {
    const url = "system/commands/core/" + action;
    return await OctoPrintClient.post(printer, url);
  }

  static async move(element, printer, action, axis, dir) {
    const flashReturn = function () {
      element.target.classList = "btn btn-light";
    };
    const url = "printer/printhead";
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

  static async jobAction(printer, opts, element) {
    let checkSettings = await OctoFarmClient.get("settings/server/get");
    // Make sure feed/flow are set before starting print...
    const flow = {
      command: "flowrate",
      factor: parseInt(printer.flowRate)
    };
    await OctoPrintClient.post(printer, "printer/tool", flow);
    const feed = {
      command: "feedrate",
      factor: parseInt(printer.feedRate)
    };

    await OctoPrintClient.post(printer, "printer/printhead", feed);
    const body = {
      i: printer._id
    };

    let filamentCheck = false;
    if (typeof checkSettings.filament !== "undefined") {
      filamentCheck = checkSettings.filament.filamentCheck;
    }
    let printerCheck = false;
    if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
      printerCheck = printer.selectedFilament.every(function (e) {
        return e !== null;
      });
    }
    if (filamentCheck && !printerCheck && opts.command === "start") {
      bootbox.confirm({
        message:
          "You have spools in the inventory, but none selected. Would you like to select a spool?",
        buttons: {
          confirm: {
            label: "Yes",
            className: "btn-success"
          },
          cancel: {
            label: "No",
            className: "btn-danger"
          }
        },
        async callback(result) {
          if (!result) {
            if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
              const offset = {
                command: "offset",
                offsets: {}
              };
              printer.selectedFilament.forEach((spool, index) => {
                if (spool != null) {
                  offset.offsets["tool" + index] = parseInt(spool.spools.tempOffset);
                }
              });

              const post = await OctoPrintClient.post(printer, "printer/tool", offset);
              console.log(offset);
            }
            await OctoPrintClient.post(printer, "printer/printhead", feed);
            const post = await OctoPrintClient.post(printer, "job", opts);
            if (element) {
              element.target.disabled = false;
            }
          }
        }
      });
    } else {
      await OctoPrintClient.post(printer, "printer/printhead", feed);
      const post = await OctoPrintClient.post(printer, "job", opts);
      if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
        const offset = {
          command: "offset",
          offsets: {}
        };
        printer.selectedFilament.forEach((spool, index) => {
          if (spool != null) {
            offset.offsets["tool" + index] = parseInt(spool.spools.tempOffset);
          }
        });

        const post = await OctoPrintClient.post(printer, "printer/tool", offset);
      }
      if (element) {
        element.target.disabled = false;
      }
    }
  }

  static async connect(command, printer) {
    let opts;
    if (command === "connect") {
      opts = {
        command: "connect",
        port: document.getElementById("pmSerialPort").value,
        baudrate: parseInt(document.getElementById("pmBaudrate").value),
        printerProfile: document.getElementById("pmProfile").value,
        save: true
      };
    } else {
      opts = {
        command: "disconnect"
      };
    }

    const post = await OctoPrintClient.post(printer, "connection", opts);
    if (typeof post !== "undefined" && post.status === 204) {
      UI.createAlert(
        "success",
        `${printer.printerName}: ${opts.command}ion attempt was successful`,
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
      document.getElementById("pmSerialPort").disabled = false;
      document.getElementById("pmBaudrate").disabled = false;
      document.getElementById("pmProfile").disabled = false;
      UI.createAlert("error", `${printer.printerName}: could not ${opts.command}.`, 3000, "click");
    }
  }

  static async power(printer, url, action, command) {
    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL);
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey);
    }
    if (typeof command === "undefined" || command.length === 0) {
      try {
        const post = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          }
        });
        if (post.status !== 200 || post.status !== 204) {
          UI.createAlert("error", `${printer.printerName}: Could not complete ${action}`, 3000);
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: Successfully completed ${action}`,
            3000
          );
        }
      } catch (e) {
        UI.createAlert(
          "error",
          `${printer.printerName}: Could not complete ${action} - Error: ${e}`,
          3000
        );
      }
    } else {
      try {
        const post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        if (post.status !== 200 || post.status !== 204) {
          UI.createAlert("error", `${printer.printerName}: Could not complete ${action}`, 3000);
        } else {
          UI.createAlert(
            "success",
            `${printer.printerName}: Successfully completed ${action}`,
            3000
          );
        }
      } catch (e) {
        UI.createAlert(
          "error",
          `${printer.printerName}: Could not complete ${action} - Error: ${e}`,
          3000
        );
      }
    }
    return "done";
  }

  static async getPowerStatus(printer, url, command) {
    if (url.includes("[PrinterURL]")) {
      url = url.replace("[PrinterURL]", printer.printerURL);
    }
    if (url.includes("[PrinterAPI]")) {
      url = url.replace("[PrinterAPI]", printer.apikey);
    }
    if (typeof command === "undefined" || command === "" || command === null) {
      let post = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": printer.apikey
        }
      });
      if (post.status !== 200 || post.status !== 204) {
        return "No Status";
      } else {
        post = await post.json();
        return post;
      }
    } else {
      try {
        const post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        let status = "No Status";
        if (post.status === 200 || post.status === 204) {
          status = await post.json();
        }

        const powerStatusPrinter = document.getElementById("printerStatus-" + printer._id);
        if (powerStatusPrinter) {
          if (status === "No Status") {
            powerStatusPrinter.style.color = "black";
          } else if (status[Object.keys(status)[0]]) {
            powerStatusPrinter.style.color = "green";
          } else {
            powerStatusPrinter.style.color = "red";
          }
        }
      } catch (e) {
        console.log("Printer Power Check failed... classing offline:", e);
      }
    }
  }
}
