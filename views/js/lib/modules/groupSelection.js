
let groupSelectionDropDown = document.getElementById("filterStates")



export default function initGroupSelect(printers){
//Active and fill dropdown...
    let currentGroups = [];
    printers.forEach(printer => {
       currentGroups.push(printer.group)
    })
    let uniqueGroups = _.uniq(currentGroups);
    if(uniqueGroups.length === 1){

    }else{
        uniqueGroups.forEach(group => {
            if(group != ""){
                groupSelectionDropDown.insertAdjacentHTML('beforeend', `
                      <option href="#" data-path=".${group.replace(/ /g, "_")}" value="${group.replace(/ /g, "_")}">Group: ${group}</option>
        `)
            }

        })
    }
}
