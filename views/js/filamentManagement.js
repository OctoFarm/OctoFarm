import OctoFarmclient from "./lib/octofarm.js";
import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import tableSort from "./lib/functions/tablesort.js";
import Validate from "./lib/functions/validate.js";
import Calc from "./lib/functions/calc.js";

window.onload = function () {
    tableSort.makeAllSortable();
};
let jpInit = false;
let filamentStore = [
    {
        code: "pla",
        display: "PLA",
        density: "1.24"
    },
    {
        code: "abs",
        display: "ABS",
        density: "1.04"
    },
    {
        code: "petg",
        display: "PETG",
        density: "1.27"
    },
    {
        code: "nylon",
        display: "NYLON",
        density: "1.52"
    },
    {
        code: "tpu",
        display: "TPU",
        density: "1.21"
    },
    {
        code: "pc",
        display: "Polycarbonate (PC)",
        density: "1.3"
    },
    {
        code: "wood",
        display: "Wood Fill",
        density: "1.28"
    },
    {
        code: "carbon",
        display: "Carbon Fibre",
        density: "1.3"
    },
    {
        code: "pcabs",
        display: "PC/ABS",
        density: "1.19"
    },
    {
        code: "hips",
        display: "HIPS",
        density: "1.03"
    },
    {
        code: "pva",
        display: "PVA",
        density: "1.23"
    },
    {
        code: "asa",
        display: "ASA",
        density: "1.05"
    },
    {
        code: "pp",
        display: "Polypropylene (PP)",
        density: "0.9"
    },
    {
        code: "acetal",
        display: "Acetal (POM)",
        density: "1.4"
    },
    {
        code: "pmma",
        display: "PMMA",
        density: "1.18"
    },
    {
        code: "fpe",
        display: "Semi Flexible FPE",
        density: "2.16"
    }
];


// export async function returnFilament() {
//     let post = await OctoFarmclient.get("filament/get");
//     post = await post.json();
//     return post;
// }

// async function init() {
//   let post = await OctoFarmclient.get("filament/get");
//   post = await post.json();
//
//   let filamentKeys = Object.entries(filamentStore.filamentStore);
//
//   let filamentSelect = document.getElementById("filementTypeSelect");
//   filamentKeys.forEach((e, index) => {
//     filamentSelect.insertAdjacentHTML(
//       "beforeend",
//       `
//           <option value="${e[0]}">${e[1].display}</option>
//       `
//     );
//   });
// }

// export async function choose(value, i) {
//   let id = { id: value.options[value.selectedIndex].value, index: i };
//   let post = await OctoFarmclient.post("printers/selectFilament", id);
//   post = await post.json();
// }
let filamentManager = "";



async function init() {
   //Init Spools
    let fill = await OctoFarmclient.get("filament/get/filament");
    fill = await fill.json();
    let spoolTable = document.getElementById("addSpoolsTable");
    let profile = await OctoFarmclient.get("filament/get/profile");
    profile = await profile.json();
    let printers = await OctoFarmclient.post("printers/printerInfo");
    printers = await printers.json();
    filamentManager = profile.filamentManager;

    fill.Spool.forEach(spools => {
        profile.profiles.forEach(prof => {
            let profileID = null;
            if(filamentManager){
                profileID = prof.profile.index
            }else{
                profileID = prof._id
            }
            document.getElementById("spoolsProfile-"+spools._id).insertAdjacentHTML('beforeend',`
                     <option value="${profileID}">${prof.profile.manufacturer} (${prof.profile.material})</option>
                    `)

        })
        document.getElementById("spoolsProfile-"+spools._id).value = spools.spools.profile;
        if(filamentManager){
            let prof = _.findIndex(profile.profiles, function(o) { return o.profile.index == spools.spools.profile; });
            document.getElementById("spoolsProfile-"+spools._id).className = "form-control " + profile.profiles[prof].profile.material.replace(/ /g, "_");
        }else{
            let prof = _.findIndex(profile.profiles, function(o) { return o._id == spools.spools.profile; });

            document.getElementById("spoolsProfile-"+spools._id).className = "form-control " + profile.profiles[prof].profile.material.replace(/ /g, "_");
        }

        let printerListCurrent = document.getElementById("spoolsPrinterAssignment-"+spools._id);

        printerListCurrent.insertAdjacentHTML("beforeend", `
                        <option value="0">No Selection</option>
                   `)
            printers.forEach(printer => {
                    if(printer.stateColour.category !== "Active"){
                        printerListCurrent.insertAdjacentHTML("beforeend", `
                        <option value="${printer._id}">${Validate.getName(printer)}</option>
                   `)
                    }else{
                        printerListCurrent.insertAdjacentHTML("beforeend", `
                        <option value="${printer._id}" disabled>${Validate.getName(printer)}</option>
                   `)
                    }
                if(printer.selectedFilament !== null && printer.selectedFilament._id === spools._id){
                    printerListCurrent.value = printer._id
                    if(printer.stateColour.category === "Active"){
                        printerListCurrent.disabled = true;
                        document.getElementById("delete-"+spools._id).disabled = true;
                        document.getElementById("edit-"+spools._id).disabled = true;
                    }
                }
            })

        printerListCurrent.addEventListener("change", e => {
            let data = {
                printerId: e.target.value,
                spoolId: e.target.parentElement.parentElement.firstElementChild.innerHTML.trim()
            }
            OctoFarmclient.post("filament/select", data)
        })
    })
    //Grab printer list...

    document.getElementById("addSpoolsTable").addEventListener("click", e => {
        //Remove from UI
        if(e.target.classList.contains("edit")){
            editSpool(e.target)
        }else if(e.target.classList.contains("delete")){
            deleteSpool(e.target)
        }else if(e.target.classList.contains("save")){
            saveSpool(e.target)
        }
    });
  //Init Profiles
  let post = await OctoFarmclient.get("filament/get/profile");
  post = await post.json();
  let profileTable = document.getElementById("addProfilesTable");
    //profileTable.innerHTML = "";
  post.profiles.forEach(profiles => {
      let profileID = null;
      if(filamentManager){
          profileID = profiles.profile.index
      }else{
          profileID = profiles._id
      }
    // profileTable.insertAdjacentHTML("beforeend", `
    //     <tr data-jplist-item>
    //       <td class="d-none" scope="row">
    //         ${profileID}
    //       </td>
    //       <td scope="row">
    //          <p contenteditable="false">${profiles.profile.manufacturer}</p>
    //       </td>
    //        <td>
    //         <p contenteditable="false">${profiles.profile.material}</p>
    //       </td>
    //       <td>
    //         <p contenteditable="false">${profiles.profile.density}</p>
    //       </td>
    //       <td>
    //         <p contenteditable="false">${profiles.profile.diameter}</p>
    //       </td>
    //           <td>
    //               <button id="edit-${profileID}" type="button" class="btn btn-sm btn-info edit">
    //                 <i class="fas fa-edit editIcon"></i>
    //               </button>
    //               <button id="save-${profileID}" type="button" class="btn d-none btn-sm btn-success save">
    //                 <i class="fas fa-save saveIcon"></i>
    //               </button>
    //               <button id="delete-${profileID}" type="button" class="btn btn-sm btn-danger delete">
    //                 <i class="fas fa-trash deleteIcon"></i>
    //               </button>
    //           </td>
    //     </tr>
    // `)

      printers.forEach(printer => {
          if(printer.selectedFilament !== null && printer.selectedFilament.spools.profile === profileID){
              if(printer.stateColour.category === "Active"){
                  document.getElementById("delete-"+profileID).disabled = true;
                  document.getElementById("edit-"+profileID).disabled = true;
              }
          }
      })
  })
    document.getElementById("addProfilesTable").addEventListener("click", e => {
        //Remove from UI
        if(e.target.classList.contains("edit")){
            editProfile(e.target)
        }else if(e.target.classList.contains("delete")){
            deleteProfile(e.target)
        }else if(e.target.classList.contains("save")){
            saveProfile(e.target)
        }
    });
    jplist.init({
        storage: 'localStorage', //'localStorage', 'sessionStorage' or 'cookies'
        storageName: 'spools-sorting' //the same storage name can be used to share storage between multiple pages
    });
  //Update Profiles Spools Dropdown.
  updateProfiles(post)

}
async function updateProfiles(post){
    let spoolsProfile = document.getElementById("spoolsProfile");
    if(typeof post.profiles !== 'undefined'){
        spoolsProfile.innerHTML = "";
        post.profiles.forEach(profile => {
            let profileID = null
            if(filamentManager){
                profileID = profile.profile.index
            }else{
                profileID = profile._id
            }
            spoolsProfile.insertAdjacentHTML('beforeend',`
             <option value="${profileID}">${profile.profile.manufacturer} (${profile.profile.material})</option>
            `)
        })
    }else{
        let profileID = null
        if(filamentManager){
            profileID = post.profile.index
        }else{
            profileID = post._id
        }
        spoolsProfile.insertAdjacentHTML('beforeend',`
         <option value="${profileID}">${post.profile.manufacturer} (${post.profile.material})</option>
        `)
    }
}
async function load() {
    let dataList = document.getElementById("profilesMaterial")
        dataList.addEventListener('change', function(e){
            let value = this.value
            let selection = _.findIndex(filamentStore, function(o) { return o.code == value.toLowerCase(); });
            if(selection != -1){
                this.value = filamentStore[selection].display
                document.getElementById("profilesDensity").value = filamentStore[selection].density;
            }

    });
    filamentStore.forEach(filament => {
        document.getElementById("huge_list").insertAdjacentHTML('beforeend',`
            <option value="${filament.code.toUpperCase()}">${filament.display}</option>
        `)
    })
   // Grab Profile

    document
        .getElementById("addSpoolBtn")
        .addEventListener("click", async e => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById("addSpoolsMessage").innerHTML = "";

            let spoolsName = document.getElementById("spoolsName");
            let spoolsProfile = document.getElementById("spoolsProfile");
            let spoolsPrice = document.getElementById("spoolsPrice");
            let spoolsWeight = document.getElementById("spoolsWeight");
            let spoolsUsed = document.getElementById("spoolsRemaining");
            let spoolsTempOffset = document.getElementById("spoolsTempOffset");
            let errors = [];

            if (spoolsName.value === "") {
                errors.push({type: "warning", msg: "Please input a spool name"})
            }
            if (spoolsProfile.value === "") {
                errors.push({type: "warning", msg: "Please select a profile"})
            }
            if (spoolsPrice.value === "") {
                errors.push({type: "warning", msg: "Please input a spool price"})
            }
            if (spoolsWeight.value === 0 || spoolsWeight.value === "") {
                errors.push({type: "warning", msg: "Please input a spool weight"})
            }
            if (spoolsUsed.value === "") {
                errors.push({type: "warning", msg: "Please input spool used weight"})
            }

            if (errors.length > 0) {
                errors.forEach(error => {
                    UI.createMessage(error, "addSpoolsMessage")
                })
                return;
            }
            let opts = {
                spoolsName: spoolsName.value,
                spoolsProfile: spoolsProfile.value,
                spoolsPrice: spoolsPrice.value,
                spoolsWeight: spoolsWeight.value,
                spoolsUsed: spoolsUsed.value,
                spoolsTempOffset: spoolsTempOffset.value
            };
            let printers = await OctoFarmclient.post("printers/printerInfo");
            printers = await printers.json();
            let post = await OctoFarmclient.post("filament/save/filament", opts);

            if (post.status === 200) {
                UI.createMessage(
                    {
                        type: "success",
                        msg: "Successfully added new roll to the database..."
                    },
                    "addSpoolsMessage"
                );
                post = await post.json();

                spoolsName.value = "";
                spoolsPrice.value = "";
                spoolsWeight.value = 1000;
                spoolsUsed.value = 0;
                spoolsTempOffset.value = 0.00;
                post = post.spools;
                let displayNone = "d-none";
                if(filamentManager){
                    displayNone = "";
                }
                document.getElementById("addSpoolsTable").insertAdjacentHTML(
                    "beforeend",
                    `
                <tr data-jplist-item>
                  <th style="display: none;">${post._id}</th>
                  <th scope="row"><p contenteditable="false">${post.spools.name}</p></th>
                  <td>
                       <select id="spoolsProfile-${post._id}" class="form-control" disabled>
    
                       </select>
                   </td>
                  <td><p class="price" contenteditable="false">${post.spools.price}</p></td>
                  <td><p class="weight" contenteditable="false">${post.spools.weight}</p></td>
                  <td><p class="used ${displayNone}" contenteditable="false">${post.spools.used}</p></td>
                  <td class="grams ${displayNone}">${(post.spools.weight - post.spools.used).toFixed(0)}</td>
                  <td class="percent ${displayNone}">${(100 - post.spools.used / post.spools.weight * 100).toFixed(0)}</td>
                  <td><p contenteditable="false">${post.spools.tempOffset}</p></td>
                   <td>
                       <select id="spoolsPrinterAssignment-${post._id}" class="form-control">
        
                       </select>
                   </td>
                  <td><button id="edit-${post._id}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${post._id}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${post._id}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
                );
                document.getElementById("spoolsProfile-"+post._id).value = post.spools.profile;
                // if(filamentManager){
                //     let prof = _.findIndex(fill.Spool, function(o) { return o.profile.index == post.spools.profile; });
                //     document.getElementById("spoolsProfile-"+post.spools._id).className = "form-control " + profile.profiles[prof].profile.material.replace(/ /g, "_");
                // }else{
                //     let prof = _.findIndex(profile.profiles, function(o) { return o._id == post.spools.profile; });
                //
                //     document.getElementById("spoolsProfile-"+post.spools._id).className = "form-control " + profile.profiles[prof].profile.material.replace(/ /g, "_");
                // }
                let printerListCurrent = document.getElementById("spoolsPrinterAssignment-"+post._id);
                printerListCurrent.insertAdjacentHTML("beforeend", `
                    <option value = "0" > No Selection </option>
                   `)
                printers.forEach(printer => {
                    if(printer.stateColour.category !== "Active"){
                        printerListCurrent.insertAdjacentHTML("beforeend", `
                        <option value="${printer._id}">${Validate.getName(printer)}</option>
                   `)
                    }else{

                        printerListCurrent.insertAdjacentHTML("beforeend", `
                        <option value="${printer._id}" disabled>${Validate.getName(printer)}</option>
                   `)
                    }
                })
                printerListCurrent.addEventListener("change", e => {
                    let data = {
                        printerId: e.target.value,
                        spoolId: e.target.parentElement.parentElement.firstElementChild.innerHTML.trim()
                    }
                    OctoFarmclient.post("filament/select", data)
                })
                let profile = await OctoFarmclient.get("filament/get/profile");
                profile = await profile.json();

                profile.profiles.forEach(profile => {
                    let profileID = null
                    if(filamentManager){
                        profileID = profile.profile.index
                    }else{
                        profileID = profile._id
                    }
                document.getElementById("spoolsProfile-"+post._id).insertAdjacentHTML('beforeend',`
                     <option value="${profileID}">${profile.profile.manufacturer} (${profile.profile.material})</option>
                    `)
                })
                document.getElementById("spoolsProfile-"+post._id).value = post.spools.profile;
            } else {
                UI.createMessage(
                    {
                        type: "error",
                        msg: "Could not add roll to database... is it alive?"
                    },
                    "addSpoolsMessage"
                );
            }
        });

    // document.getElementById("addSpoolsTable").addEventListener("click", e => {
    //     //Remove from UI
    //     if(e.target.classList.contains("edit")){
    //         editSpool(e.target)
    //     }else if(e.target.classList.contains("delete")){
    //         deleteSpool(e.target)
    //     }else if(e.target.classList.contains("save")){
    //         saveSpool(e.target)
    //     }
    // });
    // Grab Profile
    document
        .getElementById("addProfilesBtn")
        .addEventListener("click", async e => {
            e.preventDefault();
            e.stopPropagation();
            document.getElementById("profilesMessage").innerHTML = "";
            ;

            let profilesManufactuer = document.getElementById("profilesManufactuer");
            let profilesMaterial = document.getElementById("profilesMaterial");
            let profilesDensity = document.getElementById("profilesDensity");
            let profilesDiameter = document.getElementById("profilesDiameter");
            let errors = [];

            if (profilesManufactuer.value === "") {
                errors.push({type: "warning", msg: "Please input manufacturer"})
            }
            if (profilesMaterial.value === "") {
                errors.push({type: "warning", msg: "Please select or type a material"})
            }
            if (profilesDensity.value === 0) {
                errors.push({type: "warning", msg: "Please input a density"})
            }
            if (profilesDiameter.value === 0) {
                errors.push({type: "warning", msg: "Please input a density"})
            }
            if (errors.length > 0) {
                errors.forEach(error => {
                    UI.createMessage(error, "profilesMessage")
                })
                return;
            }
            let opts = {
                manufacturer: profilesManufactuer.value,
                material: profilesMaterial.value,
                density: profilesDensity.value,
                diameter: profilesDiameter.value
            };
            let post = await OctoFarmclient.post("filament/save/profile", opts);
            if (post.status === 200) {
                UI.createMessage(
                    {
                        type: "success",
                        msg: "Successfully added new roll to the database..."
                    },
                    "profilesMessage"
                );
                post = await post.json();

                profilesManufactuer.value = "";
                profilesMaterial.value = "";
                profilesDensity.value = 1.25;
                profilesDiameter.value = 1.75;
                let profileID = null
                if(filamentManager){
                    profileID = post.profile.profile.index
                }else{
                    profileID = post.profile._id
                }
                post = post.profile;
                updateProfiles(post)
                document.getElementById("addProfilesTable").insertAdjacentHTML(
                    "beforeend",
                    `
                <tr data-jplist-item>
                  <th style="display: none;">${profileID }</th>
                  <th scope="row"><p contenteditable="false">${post.profile.manufacturer}</p></th>
                  <td><p contenteditable="false">${post.profile.material}</p></td>
                  <td><p contenteditable="false">${post.profile.density}</p></td>
                  <td><p contenteditable="false">${post.profile.diameter}</p></td>
                  <td><button id="edit-${profileID}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${profileID}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${profileID}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
                );
            } else {
                UI.createMessage(
                    {
                        type: "error",
                        msg: "Could not add roll to database... is it alive?"
                    },
                    "profilesMessage"
                );
            }
        });
    // document.getElementById("addProfilesTable").addEventListener("click", e => {
    //     //Remove from UI
    //     if(e.target.classList.contains("edit")){
    //         editProfile(e.target)
    //     }else if(e.target.classList.contains("delete")){
    //         deleteProfile(e.target)
    //     }else if(e.target.classList.contains("save")){
    //         saveProfile(e.target)
    //     }
    // });

}
async function editProfile(e) {
    let row = e.parentElement.parentElement;
    let editable = row.querySelectorAll("[contenteditable]")
    let id = e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    editable.forEach(edit => {
        edit.contentEditable = true;
        edit.classList.add("contentEditable");
    })
    document.getElementById("save-"+id).classList.remove("d-none");
    document.getElementById("edit-"+id).classList.add("d-none");

}
async function editSpool(e) {
    let row = e.parentElement.parentElement;
    let editable = row.querySelectorAll("[contenteditable]")
    let id = e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    editable.forEach(edit => {
        edit.contentEditable = true;
        edit.classList.add("contentEditable");
    })
    // let profile = await OctoFarmclient.get("filament/get/profile");
    // profile = await profile.json();
    // document.getElementById("spoolsProfile-"+id).innerHTML = "";
    // profile.profiles.forEach(prof => {
    //     let profileID = null;
    //     if(filamentManager){
    //         profileID = prof.profile.index
    //     }else{
    //         profileID = prof._id
    //     }
    //     document.getElementById("spoolsProfile-"+id).insertAdjacentHTML('beforeend',`
    //                  <option value="${profileID}">${prof.profile.manufacturer} (${prof.profile.material})</option>
    //                 `)
    // })
    document.getElementById("spoolsProfile-"+id).disabled = false;
    document.getElementById("save-"+id).classList.remove("d-none");
    document.getElementById("edit-"+id).classList.add("d-none");
}
async function saveProfile(e, filamentManager) {
    let row = e.parentElement.parentElement;
    let editable = row.querySelectorAll("[contenteditable]")
    let id = e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    let profile = []
    editable.forEach(edit => {
        edit.contentEditable = false;
        edit.classList.remove("Active");
        profile.push(edit.innerHTML.trim());
    })
    let data = {
        id: id,
        profile: profile
    }
    let post = await OctoFarmclient.post("filament/edit/profile", data);
    if (post.status === 200) {
        post = await post.json();
        updateProfiles(post)
        document.getElementById("save-" + id).classList.add("d-none");
        document.getElementById("edit-" + id).classList.remove("d-none");
    }
    jplist.refresh();
}
async function saveSpool(e, filamentManager) {
    let row = e.parentElement.parentElement;
    let editable = row.querySelectorAll("[contenteditable]")
    let id = e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    let spool = []
    editable.forEach(edit => {
        edit.contentEditable = false;
        edit.classList.remove("Active");
        spool.push(edit.innerHTML.trim());
    })
    spool.push(document.getElementById("spoolsProfile-"+id).value);
    let data = {
        id: id,
        spool: spool
    }
     let post = await OctoFarmclient.post("filament/edit/filament", data);
     if (post.status === 200) {
         post = await post.json();
         init();
    document.getElementById("spoolsProfile-"+id).disabled = true;
    document.getElementById("save-" + id).classList.add("d-none");
    document.getElementById("edit-" + id).classList.remove("d-none");

     }
    jplist.refresh();
}
async function deleteProfile(e, filamentManager) {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {

    let post = await OctoFarmclient.post("filament/delete/profile", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    });
    if (post.status === 200) {
      if (e.classList.contains("deleteIcon")) {
          jplist.resetContent(function(){
              //remove element with id = el1
              e.parentElement.parentElement.parentElement.remove();
          })

      } else {
          jplist.resetContent(function(){
              //remove element with id = el1
              e.parentElement.parentElement.remove();
          })

      }
      post = await post.json();
      updateProfiles(post)

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
async function deleteSpool(e, filamentManager) {
    document.getElementById("profilesMessage").innerHTML = "";
    if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
        let post = await OctoFarmclient.post("filament/delete/filament", {
            id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
        });
        if (post.status === 200) {
            if (e.classList.contains("deleteIcon")) {
                jplist.resetContent(function(){
                    //remove element with id = el1
                    e.parentElement.parentElement.parentElement.remove();
                });

            } else {
                jplist.resetContent(function(){
                    //remove element with id = el1
                    e.parentElement.parentElement.remove();
                });

            }
            post = await post.json();
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
function updateTotals(filtered) {
    let price = [];
    let weight = [];
    let used = [];
    filtered.forEach(row => {
        price.push(parseInt(row.getElementsByClassName("price")[0].innerText))
        weight.push(parseInt(row.getElementsByClassName("weight")[0].innerText))
        used.push(parseInt(row.getElementsByClassName("used")[0].innerText))
    })
    let usedReduced = used.reduce((a, b) => a + b, 0).toFixed(0);
    let weightReduced = weight.reduce((a, b) => a + b, 0).toFixed(0);
    document.getElementById("totalPrice").innerHTML = price.reduce((a, b) => a + b, 0).toFixed(0)
    document.getElementById("totalWeight").innerHTML = weightReduced;
    document.getElementById("totalUsed").innerHTML = usedReduced;
    document.getElementById("totalRemaining").innerHTML = (weightReduced - usedReduced).toFixed(0);
    document.getElementById("totalRemainingPercent").innerHTML = (100 - (usedReduced / weightReduced) * 100).toFixed(0);
}
const element = document.getElementById('listenerSpools');
element.addEventListener('jplist.state', (e) => {
    //the elements list after filtering + pagination
    updateTotals(e.jplistState.filtered);
}, false);
init();
load();