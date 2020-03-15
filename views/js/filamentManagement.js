import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import OctoFarmclient from "./lib/octofarm.js";

let filamentStore = null;

export function returnFilament() {
  return filamentStore;
}

async function init() {
  let post = await Client.get("filament/get");
  post = await post.json();
  filamentStore = post;

  let filamentKeys = Object.entries(filamentStore.filamentStore);

  let filamentSelect = document.getElementById("filementTypeSelect");
  filamentKeys.forEach((e, index) => {
    filamentSelect.insertAdjacentHTML(
      "beforeend",
      `  
          <option value="${e[0]}">${e[1].display}</option>
      `
    );
  });
}

export async function choose(value, i) {
  let id = { id: value.options[value.selectedIndex].value, index: i };
  let post = await OctoFarmclient.post("printers/selectFilament", id);
  post = await post.json();
}

async function load() {
  document
    .getElementById("addFilamentBtn")
    .addEventListener("click", async e => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("filamentMessage").innerHTML = "";
      let filamentName = document.getElementById("filamentName");
      let filamentType = document.getElementById("filementTypeSelect");
      let filamentColour = document.getElementById("filamentColour");
      let filamentManufacturer = document.getElementById(
        "filamentManufacturer"
      );
      let filamentCost = document.getElementById("filamentCost");
      if (
        filamentName.value === "" ||
        filamentType.value === "0" ||
        filamentColour.value === "" ||
        filamentCost.value === ""
      ) {
          UI.createMessage(
          {
            type: "danger",
            msg: "Error: Could not add roll to database, Fill in all fields..."
          },
          "filamentMessage"
        );
        return;
      }

      let opts = {
        name: filamentName.value,
        type: [
          filamentType.value,
          filamentType.options[filamentType.selectedIndex].text
        ],
        colour: filamentColour.value,
        cost: filamentCost.value,
        manufacturer: filamentManufacturer.value
        
      };
      let post = await Client.post("filament/saveNew", opts);
      if (post.status === 200) {
        UI.createMessage(
          {
            type: "success",
            msg: "Successfully added new roll to the database..."
          },
          "filamentMessage"
        );
        document.getElementById("addFilamentTable").insertAdjacentHTML(
          "beforeend",
          `
          <tr>
            <th style="display: none;">${filamentStore.id}</th>
            <th scope="row">${filamentName.value}</th>
            <td id="filemantSelect">${
              filamentType.options[filamentType.selectedIndex].text
            }</td>
            <td>${filamentColour.value}</td>
            <td>${filamentManufacturer.value}</td>
            <td>${filamentCost.value}</td>
            <td><button type="button" class="btn btn-danger delete">
              <i class="fas fa-trash deleteIcon"></i>
            </button></td>
          </tr>
          `
        );
        let post = await Client.get("filament/get");
        post = await post.json();
        filamentStore = post;
      } else {
        UI.createMessage(
          {
            type: "danger",
            msg: "Error: Could not add roll to database, check connection..."
          },
          "filamentMessage"
        );
      }
    });
  document.getElementById("addFilamentTable").addEventListener("click", e => {
    //Remove from UI
    deleteFilament(e.target);
  });
}
async function deleteFilament(e) {
  document.getElementById("filamentMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await Client.post("filament/delete", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML
    });
    if (post.status === 200) {
      if (e.classList.contains("deleteIcon")) {
        e.parentElement.parentElement.parentElement.remove();
      } else {
        e.parentElement.parentElement.remove();
      }
    } else {
      UI.createMessage(
        {
          type: "danger",
          msg: "Error: Could not delete roll from database, check connection..."
        },
        "filamentMessage"
      );
    }
  }
}
if (!document.getElementById("systemDropDown").classList.contains("notyet")) {
  load();
  init();
}
