import OctoFarmClient from "../octofarm.js";

const printersTable = `
<div class="row">
    <div class="col-md-3">
                       <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <label class="input-group-text" for="printerStateList">State: </label>
                            </div>
                            <select class="custom-select" id="printerStateList"
                                    data-jplist-control="select-filter"
                                    data-group="printer-list"
                                    data-name="state"
                            >
                                <option selected
                                         href="#"
                                        data-value="all"
                                        data-path="default"
                                >Filter</option>
                                    <option 
                                            href="#"
                                            value="active"
                                            data-path=".Active">Active</option>
                                    <option 
                                            href="#"
                                            value="idle"
                                            data-path=".Idle">Idle</option>
                                    <option 
                                            href="#"
                                            value="complete"
                                            data-path=".Complete">Complete</option>
                                    <option 
                                             href="#"
                                            value="diconnected"
                                            data-path=".Diconnected">Diconnected</option>
                            </select>
                        </div>
    </div>
    <div class="col-md-3">
                         <div class="input-group mb-3">
                            <div class="input-group-prepend">
                                <label class="input-group-text" for="printerGroupList">Group: </label>
                            </div>
                            <select class="custom-select" id="printerGroupList"
                                    data-jplist-control="select-filter"
                                    data-group="printer-list"
                                    data-name="group"
                            >
                            </select>
                        </div>
    </div>
    <div class="col-md-3">

    </div>
    <div class="col-md-3">
        <button id="selectAll" type="button" class="btn btn-secondary"><i class="fas fa-check-square"></i> Select All</button>
        <button id="selectNone" type="button" class="btn btn-secondary"><i class="fas fa-square"></i> Deselect All</button>
    </div>
</div>
<table class="table table-dark">
  <thead>
    <tr>
      <th scope="col">Select</th>
      <th scope="col">Index</th>
      <th scope="col">Name</th>
      <th scope="col">State</th>
      <th scope="col">Group</th>
      <th scope="col">Spool</th>
    </tr>
  </thead>
  <tbody id="printerSelectBody" data-jplist-group="printer-list">

  </tbody>
</table>

`;

export default class PrinterSelect{
    static async create(element){
        element.innerHTML = "";
        const printersInfo = await OctoFarmClient.post("printers/printerInfo");
        const printers = await printersInfo.json();
        const groupList = [];
        const printerList = [];
        printers.forEach(printer => {
            if(typeof printer.printerState !== 'undefined' && printer.printerState.colour.category !== 'Offline'){
                let spoolName = null;
                if(printer.selectedFilament.length !== 0){
                    spoolName = "";
                    printer.selectedFilament.forEach((spool, index) => {
                        spoolName += `Tool ${index}: ${spool.spools.name} - ${spool.spools.material} <br>`;
                    });
                }else{
                    spoolName = "No Spool Selected";
                }
                const forList = {
                    id: printer._id,
                    index: printer.sortIndex,
                    name: printer.printerName,
                    state: printer.printerState.colour.category,
                    group: printer.group,
                    spool: spoolName
                };
                printerList.push(forList);
            }
            if(printer.group !== ""){
                const group = {
                    display: printer.group,
                    tag: printer.group.replace(/\s/g, '_')
                };
                groupList.push(group);
            }
        });


        const groupListUnique = _.uniq(groupList, 'display');
        if(printerList.length !== 0){
            //Create printers table
            element.innerHTML = printersTable;
            const tableBody = document.getElementById("printerSelectBody");
            printerList.forEach(printer => {
                tableBody.insertAdjacentHTML('beforeend', `
                       <tr id="${printer.id}" class="${printer.state}" data-jplist-item>
                          <td>
                                <div class="custom-control custom-checkbox">
                                  <input type="checkbox" class="custom-control-input" id="checkBox-${printer.id}" value="${printer.id}">
                                  <label class="custom-control-label" for="checkBox-${printer.id}"></label>
                                </div>
                          </td>
                          <th scope="row">${printer.index}</th>
                          <td>${printer.name}</td>
                          <td class="${printer.state}">${printer.state}</td>
                          <td class="${printer.group.replace(/\s/g, '_')}">${printer.group}</td>
                          <td>${printer.spool}</td>
                        </tr>
                `);
            });
            const printerGroupList = document.getElementById("printerGroupList");
            printerGroupList.innerHTML = "";
            printerGroupList.insertAdjacentHTML('beforeend', `
                                  <option selected
                                        value="all"
                                        data-path="default"
                                >Filter</option>
            `);
            groupListUnique.forEach((group, index) => {
                printerGroupList.insertAdjacentHTML('beforeend', `
                                                        <option
                                                        value="${group.tag.toLowerCase()}"
                                                        data-path=".${group.tag}">${group.display}</option>
                `);
            });
        }else{
            const tableBody = document.getElementById("printerSelectBody");
            tableBody.insertAdjacentHTML('beforeend', `<tr><td>No Online Printers</td></tr>`);
        }
        //get a jPList control element
        PrinterSelect.addListeners();
    }
    static addListeners(){
        document.getElementById("selectAll").addEventListener('click', e => {
            const checkBoxes = document.querySelectorAll('input[type="checkbox"]:not(:checked)');
            checkBoxes.forEach(box => {
                box.checked = true;
            });
        });
        document.getElementById("selectNone").addEventListener('click', e => {
            const checkBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
            checkBoxes.forEach(box => {
                box.checked = false;
            });
        });
        jplist.init();
    }
    static getSelected(){
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const printers = [];
        checkedBoxes.forEach(box => {
            if(box.id.includes("checkBox")){
                printers.push(box);
            }}
        );
        return printers;
    }
    static selectFilter(){

    }

}