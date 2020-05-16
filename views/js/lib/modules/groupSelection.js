import OctoFarmclient from "../octofarm.js";
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
let dynamicContent = getParameterByName('?Group');


let viewPanels = document.querySelectorAll("[id^='viewPanel-']")

let groupSelectionBtn = document.getElementById("groupSelectionBtn")

let groupSelectionDropDown = document.getElementById("groupSelection")

let currentGroup = document.getElementById("currentGroup")

export default function initGroupSelect(printers){
    //Active and fill dropdown...
    let currentGroups = [];
    printers.forEach(printer => {
       currentGroups.push(printer.group)
    })
    let uniqueGroups = _.uniq(currentGroups);
    groupSelectionDropDown.insertAdjacentHTML('beforeend', `
                        <a class="dropdown-item groupSelect" href="#?Group=All Printers">All Printers</a>
        `)
    console.log(uniqueGroups)
    if(uniqueGroups[0] == ""){

    }else{
        groupSelectionBtn.classList.remove("d-none")
        uniqueGroups.forEach(group => {
            if(group != ""){
                groupSelectionDropDown.insertAdjacentHTML('beforeend', `
                        <a class="dropdown-item groupSelect" href="#?Group=${group}">${group}</a>
        `)
            }

        })
    }
    //Add listeners to dropdown...
   addListeners()
}

let addListeners = function(){
   let allGroups = document.querySelectorAll(".groupSelect")
       allGroups.forEach(group => {
           group.addEventListener('click', e => {
                   filterGroup(group.innerHTML);
               })
           })

}

let filterGroup = async function(selectedGroup){
    currentGroup.innerHTML = "Selected: "+selectedGroup;
    //Make sure all groups are visible
    let groupList = await OctoFarmclient.get("printers/groups");
    groupList = await groupList.json();

    groupList.forEach(group => {
        if(selectedGroup != "All Printers"){
            if(selectedGroup == group.group){
                document.getElementById("viewPanel-"+group._id).classList.remove("d-none")
            }else{
                document.getElementById("viewPanel-"+group._id).classList.add("d-none")
            }
        }else{
            document.getElementById("viewPanel-"+group._id).classList.remove("d-none")
        }
    })

}

function groupCheck(){
    if(dynamicContent !== 'undefined' && dynamicContent !== null){
        addListeners();
        filterGroup(dynamicContent);
    }
}

window.onload = groupCheck();
