import UI from "../lib/functions/ui.js";
import AxiosService from "./axios.service";
import {
  validatePrinterObject,
  validatePowerPluginURL
} from "../utils/validators/printer.validator";
import { bootboxConfirmTemplate } from "../templates/bootbox.templates";

export default class OctoPrintClient extends AxiosService {
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
  static systemBase = `${this.base}/system/commands/core/`;
  static commandRestartOctoPrint = `${this.systemBase}/restart`;
  static commandRebootSystem = `${this.systemBase}/reboot`;
  static commandShutdownSystem = `${this.systemBase}/shutdown`;
  static pluginBase = "/plugin";
  static logList = `${this.pluginBase}/logging/logs`;

  static getDefaultHeaders(apikey) {
    return {
      "Content-Type": "application/json",
      "X-Api-Key": apikey
    };
  }
  static getFormDataHeader(apikey) {
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
      headers: this.getFormDataHeader(printer.apikey)
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

  static restartService(printer) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    bootboxConfirmTemplate.ARE_YOU_SURE(
      OctoPrintClient.post(printer.printerURL + this.commandRestartOctoPrint + "/restart", options)
    );
  }

  static rebootSystem(printer) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    bootboxConfirmTemplate.ARE_YOU_SURE(
      OctoPrintClient.post(printer.printerURL + this.commandRebootSystem + "/reboot", options)
    );
  }
  static shutdownSystem(printer) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    bootboxConfirmTemplate.ARE_YOU_SURE(
      OctoPrintClient.post(printer.printerURL + this.commandShutdownSystem + "/shutdown", options)
    );
  }

  static powerPluginCommand(printer, url, command) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    url = validatePowerPluginURL(url);
    if (!!command || command.length === 0) {
      return this.get(url, options);
    } else {
      return this.post(url, command, options);
    }
  }

  static getLogs(printer) {
    validatePrinterObject(printer);
    const options = {
      headers: this.getDefaultHeaders(printer.apikey)
    };
    return this.get(printer.printerURL + this.logList, options);
  }

  static async setupOctoPrintForTimelapses(printers) {
    let successfulPrinters = "";
    let failedPrinters = "";

    let webCamSettings = {
      webcam: {
        ffmpegVideoCodec: "libx264",
        webcamEnabled: true
      }
    };
    let timeLapseSettings = {
      type: "zchange"
    };
    for (let i = 0; i < printers.length; i++) {
      if (printers[i].printerState.colour.category !== "Offline") {
        await this.updateSettings(printers[i], webCamSettings);
        await this.updateTimelapse(printers[i], timeLapseSettings);
        successfulPrinters += `<i class="fas fa-check-circle text-success"></i> ${printers[i].printerName}: Settings Updated! <br>`;
      } else {
        failedPrinters += `<i class="fas fa-check-circle text-danger"></i> ${printers[i].printerName}: Offline! <br>`;
      }
    }
    return {
      successfulPrinters,
      failedPrinters
    };
  }

  static async printerPreHeatChamber(printer, chamberTemp) {
    let chamberData = {
      command: "target",
      target: 0
    };
    if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
      chamberData.target = parseInt(chamberTemp.value);
    }
    //Set chamber temp
    if (chamberTemp.value !== "" && !isNaN(chamberTemp.value)) {
      let post = await OctoPrintClient.post(printer, "printer/chamber", chamberData);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully set chamber target attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue setting chamber target attempt to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    }
  }

  static printerPreHeatBed(printer, bedTemp) {
    let bedData = {
      command: "target",
      target: 0
    };
    if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
      bedData.target = parseInt(bedTemp.value);
    }
    //Set bed temp
    if (bedTemp.value !== "" && !isNaN(bedTemp.value)) {
      return OctoPrintClient.post(printer, "printer/bed", bedData);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully set bed target attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue setting bed target attempt to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    }
  }

  static printerPreHeatTool(printer, toolTemp, toolNumber) {
    let toolData = {
      command: "target",
      targets: {}
    };
    if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
      toolData.targets["tool" + toolNumber.value] = parseInt(toolTemp.value);
    }
    if (toolTemp.value !== "" && !isNaN(toolTemp.value)) {
      return OctoPrintClient.post(printer, "printer/tool", toolData);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully set tool${toolNumber.value} target attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue setting tool${toolNumber.value} target attempt to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    }
  }

  static printerStartPrint(printer, e) {
    e.target.disabled = true;
    const opts = {
      command: "start"
    };
    return OctoPrintClient.jobAction(printer, opts, e);
  }

  static printerPausePrint(printer, e) {
    e.target.disabled = true;
    const opts = {
      command: "pause",
      action: "pause"
    };
    return OctoPrintClient.jobAction(printer, opts, e);
  }

  static printerRestartPrint(printer, e) {
    e.target.disabled = true;
    const opts = {
      command: "restart"
    };
    return OctoPrintClient.jobAction(printer, opts, e);
  }

  static printerResumePrint(printer, e) {
    e.target.disabled = true;
    const opts = {
      command: "pause",
      action: "resume"
    };
    return OctoPrintClient.jobAction(printer, opts, e);
  }

  static printerStopPrint(printer, e) {
    e.target.disabled = true;
    const opts = {
      command: "cancel"
    };
    return OctoPrintClient.jobAction(printer, opts, e);
  }

  static printerMoveAxis(e, printer, axis, dir) {
    return OctoPrintClient.move(e, printer, "jog", axis, dir);
  }

  static printerHomeAxis(e, printer, axis) {
    return OctoPrintClient.move(e, printer, "home", axis);
  }

  static async octoPrintPluginInstallAction(printer, pluginList, action) {
    let cleanAction = action.charAt(0).toUpperCase() + action.slice(1);
    if (action === "install") {
      cleanAction = cleanAction + "ing";
    }
    if (printer.printerState.colour.category !== "Active") {
      for (let r = 0; r < pluginList.length; r++) {
        let alert = UI.createAlert(
          "warning",
          `${printer.printerName}: ${cleanAction} - ${pluginList[r]}<br>Do not navigate away from this screen!`
        );
        let postData = {};
        if (action === "install") {
          postData = {
            command: action,
            dependency_links: false,
            url: pluginList[r]
          };
        } else {
          postData = {
            command: action,
            plugin: pluginList[r]
          };
        }

        const post = await OctoPrintClient.post(printer, "plugin/pluginmanager", postData);
        alert.close();
        if (post.status === 409) {
          UI.createAlert(
            "error",
            "Plugin not installed... Printer could be active...",
            4000,
            "Clicked"
          );
        } else if (post.status === 400) {
          UI.createAlert("error", "Malformed request... please log an issue...", 4000, "Clicked");
        } else if (post.status === 200) {
          let response = await post.json();
          if (response.needs_restart || response.needs_refresh) {
            UI.createAlert(
              "success",
              `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... OctoPrint restart is required!`,
              4000,
              "Clicked"
            );
          } else {
            UI.createAlert(
              "success",
              `${printer.printerName}: ${pluginList[r]} - Has successfully been installed... No further action requested...`,
              4000,
              "Clicked"
            );
          }
        }
      }
    } else {
      UI.createAlert(
        "danger",
        `${printer.printerName}: Is active skipping the plugin installation command...`
      );
    }
  }
  static async updateOctoPrintPlugins(pluginList, printer) {
    const data = {
      targets: pluginList,
      force: true
    };
    let updateRequest = await OctoPrintClient.postNOAPI(
      printer,
      "plugin/softwareupdate/update",
      data
    );
    if (updateRequest.status === 200) {
      UI.createAlert(
        "success",
        `${printer.printerName}: Successfully updated! your instance will restart now.`,
        3000,
        "Clicked"
      );
      let post = await OctoPrintClient.systemNoConfirm(printer, "restart");
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully made restart attempt to ${printer.printerName}... You may need to Re-Sync!`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue sending restart to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "error",
        `${printer.printerName}: Failed to update, manual intervention required!`,
        3000,
        "Clicked"
      );
    }
  }

  static async updateOctoPrintClient(printer) {
    const data = {
      targets: ["octoprint"],
      force: true
    };
    let updateRequest = await OctoPrintClient.postNOAPI(
      printer,
      "plugin/softwareupdate/update",
      data
    );
    if (updateRequest.status === 200) {
      UI.createAlert(
        "success",
        `${printer.printerName}: Update command fired, you may need to restart OctoPrint once complete.`,
        3000,
        "Clicked"
      );
    } else {
      UI.createAlert(
        "error",
        `${printer.printerName}: Failed to update, manual intervention required!`,
        3000,
        "Clicked"
      );
    }
  }

  static async quickConnectPrinterToOctoPrint(printer) {
    let data = {};
    if (typeof printer.connectionOptions !== "undefined") {
      data = {
        command: "connect",
        port: printer.connectionOptions.portPreference,
        baudrate: printer.connectionOptions.baudratePreference,
        printerProfile: printer.connectionOptions.printerProfilePreference,
        save: true
      };
    } else {
      UI.createAlert(
        "warning",
        `${printer.printerName} has no preferences saved, defaulting to AUTO...`,
        8000,
        "Clicked"
      );
      data.command = "connect";
      data.port = "AUTO";
      data.baudrate = 0;
      data.printerProfile = "_default";
      data.save = false;
    }
    if (printer.printerState.colour.category === "Disconnected") {
      const post = await OctoPrintClient.post(printer, "connection", data);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully made connection attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue connecting to ${printer.printerName} it's either not online, or the connection options supplied are not available...`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "warning",
        `Printer ${printer.printerName} is not in "Disconnected" state... skipping`,
        3000,
        "Clicked"
      );
    }
  }

  static async disconnectPrinterFromOctoPrint(printer) {
    let data = {
      command: "disconnect"
    };
    if (printer.printerState.colour.category === "Idle") {
      let post = await OctoPrintClient.post(printer, "connection", data);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully made disconnect attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue disconnecting to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "warning",
        `Printer ${printer.printerName} is not in "Idle" state... skipping`,
        3000,
        "Clicked"
      );
    }
  }

  static async sendPowerCommandToOctoPrint(printer, powerCommand) {
    if (printer.printerState.colour.category !== "Active") {
      let post = await OctoPrintClient.systemNoConfirm(printer, powerCommand);
      await UI.delay(1000);
      if (typeof post !== "undefined") {
        if (post.status === 204) {
          UI.createAlert(
            "success",
            `Successfully made ${result} attempt to ${printer.printerName}...`,
            3000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `There was an issue sending ${result} to ${printer.printerName} are you sure it's online?`,
            3000,
            "Clicked"
          );
        }
      } else {
        UI.createAlert(
          "error",
          `No response from ${printer.printerName}, is it online???`,
          3000,
          "Clicked"
        );
      }
    } else {
      UI.createAlert(
        "warning",
        `Printer ${printer.printerName} is not in "Idle" state... skipping`,
        3000,
        "Clicked"
      );
    }
  }

  static async printerSendGcode(printer) {
    let lines = result.match(/[^\r\n]+/g);
    lines = lines.map(function (name) {
      if (!name.includes("=")) {
        return name.toLocaleUpperCase();
      } else {
        return name;
      }
    });
    const opt = {
      commands: lines
    };
    const post = await OctoPrintClient.post(printer, "printer/command", opt);
    if (post.status === 204) {
      UI.createAlert(
        "success",
        "Your gcode commands have successfully been sent!",
        3000,
        "Clicked"
      );
    } else {
      UI.createAlert(
        "danger",
        "Your gcode failed to send! Please check the printer is able to receive these commands.",
        3000,
        "Clicked"
      );
    }
  }

  // static postNOAPI(printer, item, data) {
  //   validatePrinterObject(printer);
  //   const url = `${printer.printerURL}/${item}`;
  //   return fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "X-Api-Key": printer.apikey
  //     },
  //     body: JSON.stringify(data)
  //   }).catch((e) => {
  //     console.log(e);
  //   });
  // }
  //
  // static folder(printer, item, data) {
  //   validatePrinterObject(printer);
  //   const url = `${printer.printerURL}/api/files/${item}`;
  //   return fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "X-Api-Key": printer.apikey
  //     },
  //     body: data
  //   }).catch((e) => {
  //     console.log(e);
  //   });
  // }
  //
  // static async selectTool(printer, tool) {
  //   const opt = {
  //     command: "select",
  //     tool
  //   };
  //   const post = await OctoPrintClient.post(printer, "printer/tool", opt);
  //
  //   if (post.status === 204) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  //
  // static async systemNoConfirm(printer, action) {
  //   const url = "system/commands/core/" + action;
  //   return await OctoPrintClient.post(printer, url);
  // }
  //
  // static async move(element, printer, action, axis, dir) {
  //   const flashReturn = function () {
  //     element.target.classList = "btn btn-light";
  //   };
  //   const url = "printer/printhead";
  //   let post = null;
  //   let amount = await document.querySelectorAll("#pcAxisSteps > .btn.active");
  //   amount = amount[0].innerHTML;
  //   let opt = null;
  //   if (action === "home") {
  //     opt = {
  //       command: action,
  //       axes: axis
  //     };
  //   } else if (action === "jog") {
  //     if (dir != undefined) {
  //       amount = Number(dir + amount);
  //     } else {
  //       amount = Number(amount);
  //     }
  //     opt = {
  //       command: action,
  //       [axis]: amount
  //     };
  //   } else if (action === "feedrate") {
  //     opt = {
  //       command: action,
  //       factor: amount
  //     };
  //   }
  //   post = await OctoPrintClient.post(printer, url, opt);
  //   if (post.status === 204) {
  //     element.target.classList = "btn btn-success";
  //     setTimeout(flashReturn, 500);
  //   } else {
  //     element.target.classList = "btn btn-danger";
  //     setTimeout(flashReturn, 500);
  //   }
  // }
  //
  // static async jobAction(printer, opts, element) {
  //   let checkSettings = await OctoFarmClient.get("settings/server/get");
  //   // Make sure feed/flow are set before starting print...
  //   const flow = {
  //     command: "flowrate",
  //     factor: parseInt(printer.flowRate)
  //   };
  //   await OctoPrintClient.post(printer, "printer/tool", flow);
  //   const feed = {
  //     command: "feedrate",
  //     factor: parseInt(printer.feedRate)
  //   };
  //
  //   await OctoPrintClient.post(printer, "printer/printhead", feed);
  //   const body = {
  //     i: printer._id
  //   };
  //
  //   let filamentCheck = false;
  //   if (typeof checkSettings.filament !== "undefined") {
  //     filamentCheck = checkSettings.filament.filamentCheck;
  //   }
  //   let printerCheck = false;
  //   if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
  //     printerCheck = printer.selectedFilament.every(function (e) {
  //       return e !== null;
  //     });
  //   }
  //   if (filamentCheck && !printerCheck && opts.command === "start") {
  //     bootbox.confirm({
  //       message:
  //         "You have spools in the inventory, but none selected. Would you like to select a spool?",
  //       buttons: {
  //         confirm: {
  //           label: "Yes",
  //           className: "btn-success"
  //         },
  //         cancel: {
  //           label: "No",
  //           className: "btn-danger"
  //         }
  //       },
  //       async callback(result) {
  //         if (!result) {
  //           if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
  //             const offset = {
  //               command: "offset",
  //               offsets: {}
  //             };
  //             printer.selectedFilament.forEach((spool, index) => {
  //               if (spool != null) {
  //                 offset.offsets["tool" + index] = parseInt(spool.spools.tempOffset);
  //               }
  //             });
  //
  //             const post = await OctoPrintClient.post(printer, "printer/tool", offset);
  //             console.log(offset);
  //           }
  //           await OctoPrintClient.post(printer, "printer/printhead", feed);
  //           const post = await OctoPrintClient.post(printer, "job", opts);
  //           if (element) {
  //             element.target.disabled = false;
  //           }
  //         }
  //       }
  //     });
  //   } else {
  //     await OctoPrintClient.post(printer, "printer/printhead", feed);
  //     const post = await OctoPrintClient.post(printer, "job", opts);
  //     if (printer.selectedFilament != null && Array.isArray(printer.selectedFilament)) {
  //       const offset = {
  //         command: "offset",
  //         offsets: {}
  //       };
  //       printer.selectedFilament.forEach((spool, index) => {
  //         if (spool != null) {
  //           offset.offsets["tool" + index] = parseInt(spool.spools.tempOffset);
  //         }
  //       });
  //
  //       const post = await OctoPrintClient.post(printer, "printer/tool", offset);
  //     }
  //     if (element) {
  //       element.target.disabled = false;
  //     }
  //   }
  // }
  //
  // static async connect(command, printer) {
  //   let opts;
  //   if (command === "connect") {
  //     opts = {
  //       command: "connect",
  //       port: document.getElementById("pmSerialPort").value,
  //       baudrate: parseInt(document.getElementById("pmBaudrate").value),
  //       printerProfile: document.getElementById("pmProfile").value,
  //       save: true
  //     };
  //   } else {
  //     opts = {
  //       command: "disconnect"
  //     };
  //   }
  //
  //   const post = await OctoPrintClient.post(printer, "connection", opts);
  //   if (typeof post !== "undefined" && post.status === 204) {
  //     UI.createAlert(
  //       "success",
  //       `${printer.printerName}: ${opts.command}ion attempt was successful`,
  //       3000,
  //       "click"
  //     );
  //     if (command === "connect") {
  //       document.getElementById("pmSerialPort").disabled = true;
  //       document.getElementById("pmBaudrate").disabled = true;
  //       document.getElementById("pmProfile").disabled = true;
  //     } else {
  //       document.getElementById("pmSerialPort").disabled = false;
  //       document.getElementById("pmBaudrate").disabled = false;
  //       document.getElementById("pmProfile").disabled = false;
  //     }
  //   } else {
  //     document.getElementById("pmSerialPort").disabled = false;
  //     document.getElementById("pmBaudrate").disabled = false;
  //     document.getElementById("pmProfile").disabled = false;
  //     UI.createAlert("error", `${printer.printerName}: could not ${opts.command}.`, 3000, "click");
  //   }
  // }
}
