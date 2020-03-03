import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";

async function load() {
  document
    .getElementById("addFilamentBtn")
    .addEventListener("click", async e => {
      document.getElementById("filamentMessage").innerHTML = "";
      let filamentName = document.getElementById("filamentName");
      let filamentType = document.getElementById("filamentType");
      let filamentColour = document.getElementById("filamentColour");
      let filamentManufacturer = document.getElementById(
        "filamentManufacturer"
      );

      if (
        filamentName.value === "" ||
        filamentType === "" ||
        filamentColour === ""
      ) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      let opts = {
        name: filamentName.value,
        type: filamentType.value,
        colour: filamentColour.value,
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
          "afterend",
          `
          <tr>
            <th scope="row">${filamentName.value}</th>
            <td>${filamentType.value}</td>
            <td>${filamentColour.value}</td>
            <td>${filamentManufacturer.value}</td>
            <td><button type="button" class="btn btn-danger delete">
              <i class="fas fa-trash deleteIcon"></i>
            </button></td>
          </tr>
          `
        );
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
load();
