import OctoPrintClient from "../octoprint";
import UI from "../functions/ui.js";
import OctoFarmClient from "../octofarm_client";

function getButton(button) {
  return `
    <button id="gcode-${button._id}" title="${button.description}" type="button" class="btn btn-primary">${button.name}</button>
    `;
}

export default class CustomGenerator {
  static async generateButtons(printers) {
    let customScripts = await OctoFarmClient.getCustomGcode();

    //Draw Scripts
    let area = document.getElementById("customGcodeCommandsArea");
    if (area) {
      customScripts.forEach((scripts) => {
        let button = getButton(scripts);
        area.insertAdjacentHTML("beforeend", button);
        document.getElementById("gcode-" + scripts._id).addEventListener("click", (e) => {
          this.fireCommand(scripts._id, scripts.gcode, printers);
        });
      });
    }
  }
  static async fireCommand(id, script, printers) {
    await printers.forEach(async (printer) => {
      const opt = {
        commands: script
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
    });
  }
}
