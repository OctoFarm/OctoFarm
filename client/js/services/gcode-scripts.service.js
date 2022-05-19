import OctoFarmClient from "./octofarm-client.service";
import UI from "../utils/ui";

const customGcodeScripts = document.getElementById("customGcodeBtn");
customGcodeScripts.addEventListener("click", async (e) => {
  const customScripts = await OctoFarmClient.get("settings/customGcode");
  //Draw Scripts
  const scriptTable = document.getElementById("gcodeScriptTable");
  scriptTable.innerHTML = "";
  customScripts.forEach((scripts) => {
    drawScriptTable(scripts);
  });
});
const createNewScriptBtn = document.getElementById("createNewScriptBtn");

async function newGcodeScript(newScript) {
  const keys = Object.keys(newScript);
  const errors = [];
  for (const key of keys) {
    if (
      newScript["name"] === "" ||
      newScript["gcode"] === "" ||
      newScript["printerIds"].length === 0
    ) {
      errors.push(key);
    }
  }

  if (errors.length !== 0) {
    if (errors.includes("printerIds")) {
      UI.createAlert(
        "error",
        "You need to select some printers!",
        3000,
        "Clicked"
      );
    }
    if (errors.includes("gcode") || errors.includes("name")) {
      UI.createAlert(
        "error",
        "You need to fill in at least a name and some gcode ",
        3000,
        "Clicked"
      );
    }
    return false;
  } else {
    const lines = newScript.gcode.match(/[^\r\n]+/g);
    newScript.gcode = lines.map(function (name) {
      if (!name.includes("=")) {
        return name.toLocaleUpperCase();
      } else {
        return name;
      }
    });
    if (newScript.id) {
      //TODO needs error checking on server side
      await OctoFarmClient.post("settings/customGcode/edit", newScript);
    } else {
      const post = await OctoFarmClient.post("settings/customGcode", newScript);
      await drawScriptTable(post);
    }
  }
  return true;
}

createNewScriptBtn.addEventListener("click", async (e) => {
  const newScript = {
    name: document.getElementById("gcodeScriptName").value,
    description: document.getElementById("gcodeScriptDescription").value,
    gcode: document.getElementById("gcodeScriptScript").value,
    buttonColour: document.getElementById("gcodeScriptBtnColour").value,
    printerIds: Array.from(
      document.getElementById("gcodeScriptPrinters").selectedOptions
    ).map((v) => v.value),
  };
  const scriptSuccess = await newGcodeScript(newScript);
  if (!!scriptSuccess) {
    document.getElementById("gcodeScriptName").value = "";
    document.getElementById("gcodeScriptDescription").value = "";
    document.getElementById("gcodeScriptScript").value = "";
    document.getElementById("gcodeScriptBtnColour").value = "";
    document.getElementById("gcodeScriptPrinters").value = "";
    UI.createAlert(
      "success",
      "Successfully created your new script!",
      3000,
      "Clicked"
    );
  }
});

async function drawScriptTable(scripts) {
  const scriptTable = document.getElementById("gcodeScriptTable");
  const printerList = await OctoFarmClient.listPrinters();
  const printerSelect = [
    '<option value="99aa99aaa9999a99999999aa"> Allow all printers </option>',
  ];
  printerList.forEach((printer) => {
    printerSelect.push(
      `<option value="${printer._id}"> ${printer.printerName} </option>`
    );
  });
  let lines = "";

  scripts.gcode.forEach((e) => {
    lines += `${e}\n`;
  });

  scriptTable.insertAdjacentHTML(
    "beforeend",
    `
             <tr id="scriptRow-${scripts._id}" >
                <td id="script_id_${scripts._id}" class="d-none">${scripts._id}</td>
                <td><input type="text" class="form-control" id="script_name_${scripts._id}" placeholder="${scripts.name}" disabled/></td>
                <td><input type="text" class="form-control" id="script_desc_${scripts._id}"  placeholder="${scripts.description}" disabled/></td>
                <td>            
                  <select class="custom-select" id="script_btn_colour_${scripts._id}" size="1" disabled>
                    <option value="success">Green</option>
                    <option value="warning">Yellow</option>
                    <option value="info">Blue</option>
                    <option value="danger">Red</option>
                    <option value="dark">Black</option>
                  </select>
                </td>
                <td>
                  <select multiple class="custom-select" id="script_printer_select_${scripts._id}" size="1" disabled>
                        ${printerSelect}
                  </select>
                </td>
                <td><textarea rows="1" type="text" class="form-control" id="script_lines_${scripts._id}"  placeholder="${lines}" disabled></textarea></td>
                <td>                                
                <button id="editScript-${scripts._id}" type="button" class="btn btn-sm btn-info edit bg-colour-1">
                    <i class="fas fa-edit editIcon"></i>
                </button>
                <button id="saveScript-${scripts._id}" type="button" class="btn btn-sm btn-success save bg-colour-2 d-none">
                    <i class="fas fa-save saveIcon"></i>
                </button>
                <button id="deleteScript-${scripts._id}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                </button>
                </td>
            </tr>
      `
  );
  const scriptButton = document.getElementById(
    `script_btn_colour_${scripts._id}`
  );
  const scriptPrinters = document.getElementById(
    `script_printer_select_${scripts._id}`
  );

  if (!scripts?.buttonColour) {
    scriptButton.value = "success";
  } else {
    scriptButton.value = scripts.buttonColour;
  }

  if (!scripts?.printerIds || scripts.printerIds.length === 0) {
    for (const scriptOptions of scriptPrinters.options) {
      scriptOptions.selected = true;
    }
  } else {
    for (const scriptOptions of scriptPrinters.options) {
      if (scripts.printerIds.includes(scriptOptions.value)) {
        scriptOptions.selected = true;
      }
    }
  }

  const scriptID = document.getElementById(`script_id_${scripts._id}`);
  const scriptName = document.getElementById(`script_name_${scripts._id}`);
  const scriptDesc = document.getElementById(`script_desc_${scripts._id}`);

  const scriptLines = document.getElementById(`script_lines_${scripts._id}`);
  const editButton = document.getElementById(`editScript-${scripts._id}`);
  const saveButton = document.getElementById(`saveScript-${scripts._id}`);

  document
    .getElementById("deleteScript-" + scripts._id)
    .addEventListener("click", async (e) => {
      const delt = await OctoFarmClient.get(
        "settings/customGcode/delete/" + scripts._id
      );
      if (!!delt) {
        UI.createAlert(
          "success",
          "Successfully deleted your script...",
          3000,
          "Clicked"
        );
        document.getElementById("scriptRow-" + scripts._id).remove();
      } else {
        UI.createAlert(
          "error",
          "Something went wrong, is the OctoFarm server online?",
          3000,
          "Clicked"
        );
      }
    });
  document
    .getElementById("editScript-" + scripts._id)
    .addEventListener("click", async (e) => {
      UI.enableElements([
        scriptName,
        scriptDesc,
        scriptButton,
        scriptPrinters,
        scriptLines,
      ]);

      UI.setElementValueFromPlaceholder([scriptName, scriptDesc, scriptLines]);

      scriptLines.rows = "10";
      scriptPrinters.size = "11";
      editButton.classList.toggle("d-none");
      saveButton.classList.toggle("d-none");
    });
  saveButton.addEventListener("click", async (e) => {
    const newScript = {
      id: scriptID.innerHTML,
      name: scriptName.value,
      description: scriptDesc.value,
      gcode: scriptLines.value,
      buttonColour: scriptButton.value,
      printerIds: Array.from(scriptPrinters.selectedOptions).map(
        (v) => v.value
      ),
    };

    const save = await newGcodeScript(newScript);
    if (save) {
      UI.setElementPlaceholderFromValue([scriptName, scriptDesc, scriptLines]);
      UI.disableElements([
        scriptName,
        scriptDesc,
        scriptButton,
        scriptPrinters,
        scriptLines,
      ]);
      UI.blankElementValue([scriptName, scriptDesc, scriptLines]);

      scriptLines.rows = "1";
      scriptPrinters.size = "1";
      editButton.classList.toggle("d-none");
      saveButton.classList.toggle("d-none");
    }
  });
}

export default {
  ignore: "ignore",
};
