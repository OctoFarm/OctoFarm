import OctoFarmClient from "./octofarm-client.service";

const customGcodeScripts = document.getElementById("customGcodeBtn");
customGcodeScripts.addEventListener("click", async (e) => {
  let customScripts = await OctoFarmClient.get("settings/customGcode");
  //Draw Scripts
  let scriptTable = document.getElementById("gcodeScriptTable");
  scriptTable.innerHTML = "";
  customScripts.forEach((scripts) => {
    drawScriptTable(scripts);
  });
});
const createNewScriptBtn = document.getElementById("createNewScriptBtn");

async function newGcodeScript(newScript) {
  const keys = Object.keys(newScript);
  let errors = [];
  for (const key of keys) {
    if (newScript["name"] === "") {
      errors.push(key);
    }
    if (newScript["gcode"] === "") {
      errors.push(key);
    }
  }
  if (errors.length !== 0) {
    UI.createAlert("error", "You have blank fields sony jim!, sort them out...", 3000, "Clicked");
    return false;
  } else {
    let lines = newScript.gcode.match(/[^\r\n]+/g);
    newScript.gcode = lines.map(function (name) {
      if (!name.includes("=")) {
        return name.toLocaleUpperCase();
      } else {
        return name;
      }
    });
    if (newScript.id) {
      let post = await OctoFarmClient.post("settings/customGcode/edit", newScript);
      if (post.status === 200) {
        post = await post.json();
      } else {
        UI.createAlert("error", "Something went wrong updating, is the server online?");
      }
    } else {
      let post = await OctoFarmClient.post("settings/customGcode", newScript);
      if (post.status === 200) {
        post = await post.json();
        drawScriptTable(post);
      } else {
        UI.createAlert("error", "Something went wrong updating, is the server online?");
      }
    }
  }
  return true;
}

createNewScriptBtn.addEventListener("click", async (e) => {
  let newScript = {
    name: document.getElementById("gcodeScriptName").value,
    description: document.getElementById("gcodeScriptDescription").value,
    gcode: document.getElementById("gcodeScriptScript").value
  };
  await newGcodeScript(newScript);
  document.getElementById("gcodeScriptName").value = "";
  document.getElementById("gcodeScriptDescription").value = "";
  document.getElementById("gcodeScriptScript").value = "";
});

function drawScriptTable(scripts) {
  let scriptTable = document.getElementById("gcodeScriptTable");
  let scriptLines = "";

  scripts.gcode.forEach((e) => {
    scriptLines += `${e}\n`;
  });

  scriptTable.insertAdjacentHTML(
    "beforeend",
    `
             <tr id="scriptRow-${scripts._id}" >
                <td id="script_id_${scripts._id}" class="d-none">${scripts._id}</td>
                <td><input type="text" class="form-control" id="script_name_${scripts._id}" placeholder="${scripts.name}" disabled></input></td>
                <td><input type="text" class="form-control" id="script_desc_${scripts._id}"  placeholder="${scripts.description}" disabled></input></td>
                <td>
                  <select class="custom-select" id="gcodeScriptBtnColour" size="5">
                    <option selected value="success">Green</option>
                    <option value="warning">Yellow</option>
                    <option value="info">Blue</option>
                    <option value="danger">Red</option>
                    <option value="dark">Black</option>
                  </select>
                </td>
                <td>
                <select multiple class="custom-select" id="gcodeScriptPrinters" size="5">

                    </select>
                </td>
                <td><textarea rows="4" type="text" class="form-control" id="script_lines_${scripts._id}"  placeholder="${scriptLines}" disabled></textarea></td>
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
  document.getElementById("deleteScript-" + scripts._id).addEventListener("click", async (e) => {
    let delt = await OctoFarmClient.get("settings/customGcode/delete/" + scripts._id);
    if (delt.status === 200) {
      UI.createAlert("success", "Successfully deleted your script...", 3000, "Clicked");
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
  document.getElementById("editScript-" + scripts._id).addEventListener("click", async (e) => {
    document.getElementById(`script_name_${scripts._id}`).disabled = false;
    document.getElementById(`script_desc_${scripts._id}`).disabled = false;
    document.getElementById(`script_lines_${scripts._id}`).disabled = false;
    document.getElementById(`script_name_${scripts._id}`).value = document.getElementById(
      `script_name_${scripts._id}`
    ).placeholder;
    document.getElementById(`script_desc_${scripts._id}`).value = document.getElementById(
      `script_desc_${scripts._id}`
    ).placeholder;
    document.getElementById(`script_lines_${scripts._id}`).value = document.getElementById(
      `script_lines_${scripts._id}`
    ).placeholder;
    document.getElementById(`editScript-${scripts._id}`).classList.toggle("d-none");
    document.getElementById(`saveScript-${scripts._id}`).classList.toggle("d-none");
  });
  document.getElementById("saveScript-" + scripts._id).addEventListener("click", async (e) => {
    let newScript = {
      id: document.getElementById(`script_id_${scripts._id}`).innerHTML,
      name: document.getElementById(`script_name_${scripts._id}`).value,
      description: document.getElementById(`script_desc_${scripts._id}`).value,
      gcode: document.getElementById(`script_lines_${scripts._id}`).value
    };
    console.log(newScript);
    let save = await newGcodeScript(newScript);
    if (save) {
      document.getElementById(`script_name_${scripts._id}`).placeholder = document.getElementById(
        `script_name_${scripts._id}`
      ).value;
      document.getElementById(`script_desc_${scripts._id}`).placeholder = document.getElementById(
        `script_desc_${scripts._id}`
      ).value;
      document.getElementById(`script_lines_${scripts._id}`).placeholder = document.getElementById(
        `script_lines_${scripts._id}`
      ).value;
      document.getElementById(`script_name_${scripts._id}`).value = "";
      document.getElementById(`script_desc_${scripts._id}`).value = "";
      document.getElementById(`script_lines_${scripts._id}`).value = "";
      document.getElementById(`script_name_${scripts._id}`).disabled = true;
      document.getElementById(`script_desc_${scripts._id}`).disabled = true;
      document.getElementById(`script_lines_${scripts._id}`).disabled = true;
      document.getElementById(`editScript-${scripts._id}`).classList.toggle("d-none");
      document.getElementById(`saveScript-${scripts._id}`).classList.toggle("d-none");
    }
  });
}

export default {
  ignore: "ignore"
};
