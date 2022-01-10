import OctoPrintClient from "./octoprint-client.service";
import UI from "../utils/ui.js";
import OctoFarmClient from "./octofarm-client.service";

export default class CustomGenerator {
  static getButton(button) {
    let buttonColour = "success";
    if (button?.buttonColour) {
      buttonColour = button.buttonColour;
    }
    return `
    <button id="gcode-${button._id}" title="${button.description}" type="button" class="btn btn-${buttonColour}">${button.name}</button>
    `;
  }
  static async generateButtons(printer) {
    let customScripts = await OctoFarmClient.getCustomGcode(printer._id);
    //Draw Scripts
    let area = document.getElementById("customGcodeCommandsArea");
    if (area) {
      if (customScripts.length > 0 && area.classList.contains("d-none")) {
        area.classList.remove("d-none");
      }
      customScripts.forEach((scripts) => {
        let button = CustomGenerator.getButton(scripts);
        area.insertAdjacentHTML("beforeend", button);
        document.getElementById("gcode-" + scripts._id).addEventListener("click", (e) => {
          let post = CustomGenerator.fireCommand(scripts._id, scripts.gcode, printer);
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
      });
    }
  }
  static fireCommand(id, script, printer) {
    const opt = {
      commands: script
    };
    return OctoPrintClient.post(printer, "printer/command", opt);
  }
}
