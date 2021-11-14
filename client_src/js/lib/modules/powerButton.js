import OctoPrintClient from "../octoprint";
import OctoFarmClient from "../../services/octofarm-client.service";

let listenersApplied = false;

export default class PowerButton {
  static revealBulkPower() {
    let bulkPowerBtn = document.getElementById("bulkPowerBtn");
    if (bulkPowerBtn) {
      if (bulkPowerBtn.classList.contains("d-none")) {
        bulkPowerBtn.classList.remove("d-none");
      }
    }
  }

  static async powerButtons(printer) {
    const divider = document.getElementById("printerPowerDropDownMarker-" + printer._id);
    if (printer.powerSettings.powerOffURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerOffPrinter = document.getElementById("printerPowerOff-" + printer._id);
      if (powerOffPrinter.classList.contains("d-none")) {
        powerOffPrinter.classList.remove("d-none");
        powerOffPrinter.addEventListener("click", async (event) => {
          bootbox.confirm({
            message: "Are you sure you would like to power down your printer?",
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
            callback: async function (result) {
              if (result) {
                await OctoPrintClient.power(
                  printer,
                  printer.powerSettings.powerOffURL,
                  "Power Off",
                  printer.powerSettings.powerOffCommand
                );
                if (printer.powerSettings.powerStatusURL !== "") {
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                  await OctoPrintClient.getPowerStatus(
                    printer,
                    printer.powerSettings.powerStatusURL,
                    printer.powerSettings.powerStatusCommand
                  );
                }
              }
            }
          });
        });
      }
    }
    if (printer.powerSettings.powerOnURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerOnnPrinter = document.getElementById("printerPowerOn-" + printer._id);
      if (powerOnnPrinter.classList.contains("d-none")) {
        powerOnnPrinter.classList.remove("d-none");
        powerOnnPrinter.addEventListener("click", async (event) => {
          await OctoPrintClient.power(
            printer,
            printer.powerSettings.powerOnURL,
            "Power On",
            printer.powerSettings.powerOnCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
          await OctoPrintClient.getPowerStatus(
            printer,
            printer.powerSettings.powerStatusURL,
            printer.powerSettings.powerStatusCommand
          );
        });
      }
    }
    if (printer.powerSettings.powerStatusURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const status = await OctoPrintClient.getPowerStatus(
        printer,
        printer.powerSettings.powerStatusURL,
        printer.powerSettings.powerStatusCommand
      );
    }
    if (printer.powerSettings.powerToggleURL !== "") {
      if (divider.classList.contains("d-none")) {
        divider.classList.remove("d-none");
      }
      const powerTogglePrinter = document.getElementById("printerPowerToggle-" + printer._id);
      if (powerTogglePrinter) {
        if (powerTogglePrinter.disabled === true) {
          powerTogglePrinter.disabled = false;
          powerTogglePrinter.addEventListener("click", async (event) => {
            if (
              document.getElementById("printerStatus-" + printer._id).style.color === "green" ||
              document.getElementById("printerStatus-" + printer._id).style.color === "black"
            ) {
              bootbox.confirm({
                message: "Are you sure you would like to power down your printer?",
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
                callback: async function (result) {
                  if (result) {
                    const status = await OctoPrintClient.power(
                      printer,
                      printer.powerSettings.powerToggleURL,
                      "Power Toggle",
                      printer.powerSettings.powerToggleCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                    await OctoPrintClient.getPowerStatus(
                      printer,
                      printer.powerSettings.powerStatusURL,
                      printer.powerSettings.powerStatusCommand
                    );
                  }
                }
              });
            } else {
              const status = await OctoPrintClient.power(
                printer,
                printer.powerSettings.powerToggleURL,
                "Power Toggle",
                printer.powerSettings.powerToggleCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
              await OctoPrintClient.getPowerStatus(
                printer,
                printer.powerSettings.powerStatusURL,
                printer.powerSettings.powerStatusCommand
              );
            }
          });
        }
      }
    }
  }

  static async applyBtn(printer) {
    if (typeof printer.otherSettings.system !== "undefined" && !listenersApplied) {
      if (
        (printer.otherSettings.system.commands.serverRestartCommand !== "" &&
          printer.otherSettings.system.commands.serverRestartCommand !== null) ||
        (printer.otherSettings.system.commands.systemRestartCommand !== "" &&
          printer.otherSettings.system.commands.systemRestartCommand !== null) ||
        (printer.otherSettings.system.commands.systemShutdownCommand !== "" &&
          printer.otherSettings.system.commands.systemShutdownCommand !== null)
      ) {
        if (
          printer.otherSettings.system.commands.serverRestartCommand !== "" &&
          printer.otherSettings.system.commands.serverRestartCommand !== null
        ) {
          const restartOctoPrint = document.getElementById(
            "printerRestartOctoPrint-" + printer._id
          );
          const divider = document.getElementById("printerDropDownMaker-" + printer._id);
          if (divider.classList.contains("d-none")) {
            divider.classList.remove("d-none");
          }
          restartOctoPrint.classList.remove("d-none");
          restartOctoPrint.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "restart");
          });
        }
        if (
          printer.otherSettings.system.commands.systemRestartCommand !== "" &&
          printer.otherSettings.system.commands.systemRestartCommand !== null
        ) {
          const restartHost = document.getElementById("printerRestartHost-" + printer._id);
          restartHost.classList.remove("d-none");
          restartHost.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "reboot");
          });
        }

        if (
          printer.otherSettings.system.commands.systemShutdownCommand !== "" &&
          printer.otherSettings.system.commands.systemShutdownCommand !== null
        ) {
          const shutdownHost = document.getElementById("printerShutdownHost-" + printer._id);
          shutdownHost.classList.remove("d-none");
          shutdownHost.addEventListener("click", (event) => {
            OctoPrintClient.system(printer, "shutdown");
          });
        }
        listenersApplied = true;
      }
    }
    if (printer.powerSettings !== null && !_.isEmpty(printer.powerSettings)) {
      if (printer.powerSettings.powerOnURL !== "") {
        PowerButton.powerButtons(printer);
      }
      if (typeof printer.powerSettings.wol !== "undefined") {
        if (printer.powerSettings.wol.enabled) {
          if (
            printer.powerSettings.wol.ip === "" ||
            printer.powerSettings.wol.port === "" ||
            printer.powerSettings.wol.interval === "" ||
            printer.powerSettings.wol.count === ""
          ) {
            console.log("ISSUE WITH WAKE ON LAN SETTINGS");
          } else {
            const wakeButton = document.getElementById("printerWakeHost-" + printer._id);
            if (wakeButton.classList.contains("d-none")) {
              wakeButton.classList.remove("d-none");
              wakeButton.addEventListener("click", (e) => {
                OctoFarmClient.post("printers/wakeHost", printer.powerSettings.wol);
              });
            }
          }
        }
      }
    }
  }
}
