import UI from "../../utils/ui.js";
import OctoFarmClient from "../octofarm-client.service";
import {ClientErrors} from "../../exceptions/octofarm-client.exceptions";
import {ApplicationError} from "../../exceptions/application-error.handler";
import { printActionStatusResponse } from "./octoprint.helpers-commands.actions"

export default class OctoPrintClient {
  static validatePrinter(printer) {
    if (!printer.apikey) {
      throw new Error("Api key not provided");
    }
    if (!printer.printerURL) {
      throw new Error("Printer URL not provided");
    }
  }

  static get(printer, item) {
    this.validatePrinter(printer);
    const url = `${printer.printerURL}/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    }).catch((e) => {
      console.error(e);
      return e;
    });
  }

  static postNOAPI(printer, item, data) {
    this.validatePrinter(printer);
    const url = `${printer.printerURL}/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    }).catch((e) => {
      console.error(e);
      return e;
    });
  }

  static post(printer, item, data) {
    this.validatePrinter(printer);
    const url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      },
      body: JSON.stringify(data)
    }).catch((e) => {
      console.error(e);
      return e;
    });
  }

  static folder(printer, item, data) {
    this.validatePrinter(printer);
    const url = `${printer.printerURL}/api/files/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "X-Api-Key": printer.apikey
      },
      body: data
    }).catch((e) => {
      console.error(e);
      return e;
    });
  }

  static async delete(printer, item) {
    this.validatePrinter(printer);
    const url = `${printer.printerURL}/api/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": printer.apikey
      }
    }).catch((e) => {
      console.error(e);
      return e;
    });
  }

  static async selectTool(printer, tool) {
    const opt = {
      command: "select",
      tool
    };

    const post = await OctoPrintClient.post(printer, "printer/tool", opt);

    const body = {
      action: "Printer: tool",
      opt
    }
    await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

    return post.status === 204;
  }

  static async system(printer, action) {
    const url = "system/commands/core/" + action;
    bootbox.confirm({
      message: `Are your sure you want to ${action} ${printer.printerName}?`,
      buttons: {
        cancel: {
          label: "<i class=\"fa fa-times\"></i> No"
        },
        confirm: {
          label: "<i class=\"fa fa-check\"></i> Yes"
        }
      },
      async callback(result) {
        if (result) {
          const post = await OctoPrintClient.post(printer, url).catch((e) => {
            UI.createAlert("danger", e, 4000, "Clicked");
          });


          const body = {
            action: `OctoPrint: ${action}`
          }
          await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

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

    const post = OctoPrintClient.post(printer, url);

    const body = {
      action: `OctoPrint: ${action}`
    }

    await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

    return post;
  }

  static async move(element, printer, action, axis, dir) {
    const flashReturn = function () {
      element.target.classList = "btn btn-light";
    };
    const url = "printer/printhead";
    let post = {};
    let amount = await document.querySelectorAll("#pcAxisSteps > .btn.active");
    amount = amount[0].innerHTML;
    let opt = {};
    if (action === "home") {
      opt = {
        command: action,
        axes: axis
      };
    } else if (action === "jog") {
      if (typeof dir !== "undefined") {
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

    const body = {
      action: `Printer: ${action}`,
      opt
    }
    await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

    if (post.status === 204) {
      element.target.classList = "btn btn-success";
      setTimeout(flashReturn, 500);
    } else {
      element.target.classList = "btn btn-danger";
      setTimeout(flashReturn, 500);
    }
  }

  static async checkFile(printer, fullPath) {
    const url = "api/files/local/" + fullPath;

    let response = await OctoPrintClient.get(printer, url);
    return response.status;
  }

  static async file(printer, fullPath, action) {
    const url = "files/local/" + fullPath;
    if (action === "load") {
      const opt = {
        command: "select",
        print: false
      };
      await OctoPrintClient.updateFeedAndFlow(printer);
      await OctoPrintClient.updateFilamentOffsets(printer);
      await OctoPrintClient.updateBedOffsets(printer);
      await OctoFarmClient.updateActiveControlUser(printer._id);

      const post = await OctoPrintClient.post(printer, encodeURIComponent(url), opt);

      const body = {
        action: `File: ${action}`,
        opt,
        fullPath: fullPath
      }
      await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

      return post;
    } else if (action === "print") {
      const opt = {
        command: "select",
        print: true
      };
      await OctoPrintClient.updateFeedAndFlow(printer);
      await OctoPrintClient.updateFilamentOffsets(printer);
      await OctoPrintClient.updateBedOffsets(printer);
      await OctoFarmClient.updateActiveControlUser(printer._id);

      const post = await OctoPrintClient.post(printer, encodeURIComponent(url), opt);

      const body = {
        action: `File: ${action}`,
        opt,
        fullPath: fullPath
      }

      await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

      return post;
    } else if (action === "delete") {

      const post = await OctoPrintClient.delete(printer, encodeURIComponent(url));

      const body = {
        action: `File: ${action}`,
        fullPath: fullPath
      }

      await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

      return post;
    }
  }

  static async updateFeedAndFlow(printer) {
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
  }

  static async updateBedOffsets(printer) {
    if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
      // Ignoring any multi-spools here, take first spool's bed offset.
      const bedOffset = parseInt(printer?.selectedFilament[0]?.spools?.bedOffset);
      if (bedOffset) {
        const offset = {
          command: "offset",
          offset: bedOffset
        };
        await OctoPrintClient.post(printer, "printer/bed", offset);
      }
    }
  }

  static async updateFilamentOffsets(printer) {
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
      await OctoPrintClient.post(printer, "printer/tool", offset);
    }
  }

  static async jobAction(printer, opts, element) {
    let checkSettings = await OctoFarmClient.get("settings/server/get");

    let filamentCheck = false;
    if (typeof checkSettings.filament !== "undefined") {
      filamentCheck = checkSettings.filament.filamentCheck;
    }

    let printerCheck = false;
    if (printer.selectedFilament !== null && Array.isArray(printer.selectedFilament)) {
      printerCheck = printer.selectedFilament.some(function (e) {
        return e !== null
      });
    }


    if (opts.command === "start") {
      await OctoPrintClient.updateFeedAndFlow(printer);
      await OctoPrintClient.updateFilamentOffsets(printer);
      await OctoPrintClient.updateBedOffsets(printer);
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
            await OctoFarmClient.updateActiveControlUser(printer._id);
            const { status } = await OctoPrintClient.post(printer, "job", opts);
            const body = {
              action: `Print: ${opts.command}`,
              opts
            }
            await OctoFarmClient.updateUserActionsLog(printer._id, body, status)
            printActionStatusResponse(status)
          }
        }
      });
    } else {
      const post = await OctoPrintClient.post(printer, "job", opts);

      const body = {
        action: `Print: ${opts.command}`,
        opts
      }
      await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

      await OctoFarmClient.updateActiveControlUser(printer._id);

      return post;
    }
    if (element) {
      element.target.disabled = false;
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

    const body = {
      action: `Print Action: ${opts.command}`,
      opts
    }
    await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status)

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

    const body = {
      action: `Printer: ${action}`,
      command
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

        await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status);

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
        const errorObject = ClientErrors.SILENT_ERROR;
        errorObject.message =  `Bulk Commands - ${e}`
        throw new ApplicationError(errorObject)
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

        await OctoFarmClient.updateUserActionsLog(printer._id, body, post.status);

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
        const errorObject = ClientErrors.SILENT_ERROR;
        errorObject.message =  `Bulk Commands - ${e}`
        throw new ApplicationError(errorObject)
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
    if (!!command || command === "") {
      try{
        let post = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          }
        });
        let status = false;
        if (post.status === 200 || post.status === 204) {
          status = post.json();
        }
        return status;
      }catch(e){
        const errorObject = ClientErrors.SILENT_ERROR;
        errorObject.message =  `Power Status - ${e}`
        throw new ApplicationError(errorObject)
      }
    } else {
      try{
        const post = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": printer.apikey
          },
          body: command
        });
        let status = false;
        if (post.status === 200 || post.status === 204) {
          status = post.json();
        }
        return status;
      }catch(e){
        const errorObject = ClientErrors.SILENT_ERROR;
        errorObject.message =  `Power Status - ${e}`
        throw new ApplicationError(errorObject)
      }
    }
  }
}
