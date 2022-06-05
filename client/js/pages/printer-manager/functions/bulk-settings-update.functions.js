import UI from "../../../utils/ui";

const formTemplate = (keyName, obj) => {
  let buttonsHTML = "";
  let checkBoxHTML = "";
  for (const [key, value] of Object.entries(obj)) {
    switch (key) {
      case "plugins":
        break;
      default:
        if (typeof value === "boolean") {
          checkBoxHTML += UI.convertValueToTemplate(key, value);
        } else {
          buttonsHTML += UI.convertValueToTemplate(key, value);
        }
    }
  }

  return `
        <form>
            <div class="row">  
              ${buttonsHTML}
            </div>
            <div class="row">
            ${checkBoxHTML}
            </div>
        </form>
    `;
};

export function populateBulkSettingsForms(settings) {
  for (const key of Object.keys(settings)) {
    const appearanceElement = document.getElementById(`bulk-${key}-el`);
    switch (key) {
      case "scripts":
        appearanceElement.innerHTML = formTemplate(
          `${key}`,
          settings[key].gcode
        );
        break;
      case "terminalFilters":
        break;
      default:
        appearanceElement.innerHTML = formTemplate(`${key}`, settings[key]);
    }
    UI.removeLoaderFromElementInnerHTML(
      document.getElementById(`bulk-${key}-settings-btn`)
    );
  }
}
