import OctoPrintClient from "../../services/octoprint-client.service";
import UI from "../functions/ui.js";
import OctoFarmClient from "../../services/octofarm-client.service";

function getButton(button) {
  return `
    <button id="gcode-${button._id}" title="${button.description}" type="button" class="btn btn-primary">${button.name}</button>
    `;
}

export default class CustomGenerator {
  static async generateButtons(printers) {
    let customScripts = await OctoFarmClient.getCustomGCode();

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
    const command = {
      commands: script
    };
    for (let i = 0; i < printers.length; i++) {
      const printer = printers[i];
      await OctoPrintClient.startGcode(printer, command);
    }
  }
}
