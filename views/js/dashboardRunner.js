import OctoPrintClient from "./lib/octoprint.js";
import OctoFarmClient from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";
import FileOperations from "./lib/functions/file.js";
import Validate from "./lib/functions/validate.js";
import {parse} from './vendor/flatted.js';
import tableSort from "./lib/functions/tablesort.js";


let printerInfo = "";
let editMode = false;
let deletedPrinters = [];

//Setup charts
let optionsMemory = {
    title: {
        text: "Memory",
        align: 'center',
        margin: 1,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: undefined,
            color: '#fff',
        },
    },
    chart: {
        type: 'donut',
        height: '160px',
        animations: {
            enabled: false,
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    plotOptions: {
        pie: {
            expandOnClick: true,
            dataLabels: {
                offset: 10,
                minAngleToShowLabel: 15
            },
        }
    },
    stroke: {
        show: false,
    },
    tooltip: {
        y: {
            formatter: function(val) {
                return Calc.bytes(val)
            },
        }
    },
    noData: {
        text: 'Loading...'
    },
    dataLabels: {
        enabled: false,
    },
    series: [],
    labels: ['Other', 'OctoFarm', 'Free'],
    colors: ['#f39c12', '#3498db', '#00bc8c'],
    legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '11px',
        fontFamily: 'Helvetica, Arial',
        fontWeight: 400,
        formatter: undefined,
        inverseOrder: false,
        width: undefined,
        height: undefined,
        tooltipHoverFormatter: undefined,
        offsetX: -25,
        offsetY: 0,
        labels: {
            colors: undefined,
            useSeriesColors: false
        },
        markers: {
            width: 9,
            height: 9,
            strokeWidth: 0,
            strokeColor: '#fff',
            fillColors: undefined,
            radius: 1,
            customHTML: undefined,
            onClick: undefined,
            offsetX: 0,
            offsetY: 0
        },
        itemMargin: {
            horizontal: 1,
            vertical: 0
        },
        onItemClick: {
            toggleDataSeries: false
        },
        onItemHover: {
            highlightDataSeries: false
        },
    }
};
let optionsCPU = {
    title: {
        text: "CPU",
        align: 'center',
        margin: 1,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: undefined,
            color: '#fff'
        },
    },
    chart: {
        type: 'donut',
        height: '160px',
        animations: {
            enabled: true,
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    plotOptions: {
        pie: {
            expandOnClick: false,
            dataLabels: {
                offset: 10,
                minAngleToShowLabel: 15
            },
        }
    },
    stroke: {
        show: false,
    },
    tooltip: {
        y: {
            formatter: function(val) {
                return Math.round(val * 10) / 10 + "%"
            },
        }
    },
    noData: {
        text: 'Loading...'
    },
    dataLabels: {
        enabled: false,
    },
    series: [],
    labels: ['System', 'OctoFarm', 'User', 'Free'],
    colors: ['#f39c12', '#3498db', '#375a7f', '#00bc8c'],
    legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '11px',
        fontFamily: 'Helvetica, Arial',
        fontWeight: 400,
        formatter: undefined,
        inverseOrder: false,
        width: undefined,
        height: undefined,
        tooltipHoverFormatter: undefined,
        offsetX: -25,
        offsetY: 0,
        labels: {
            colors: undefined,
            useSeriesColors: false
        },
        markers: {
            width: 9,
            height: 9,
            strokeWidth: 0,
            strokeColor: '#fff',
            fillColors: undefined,
            radius: 1,
            customHTML: undefined,
            onClick: undefined,
            offsetX: 0,
            offsetY: 0
        },
        itemMargin: {
            horizontal: 1,
            vertical: 0
        },
        onItemClick: {
            toggleDataSeries: false
        },
        onItemHover: {
            highlightDataSeries: false
        },
    }
};
let optionsFarmTemp = {
    chart: {
        type: 'line',
        id: 'realtime',
        height: '330px',
        width: '100%',
        animations: {
            enabled: false,
        },
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        },
        background: '#303030'
    },
    colors: ['#fcc329', '#ff1500', '#009cff', '#ff1800'],
    stroke: {
        curve: 'smooth'
    },
    toolbar: {
        show: false
    },
    theme: {
        mode: 'dark',
    },
    noData: {
        text: 'Loading...'
    },
    series: [],
    yaxis: [{
            title: {
                text: "Temp"
            },
            seriesName: "Actual Tool",
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
        {
            seriesName: "Actual Tool",
            show: false,
            labels: {
                formatter: function(value) {
                    return value + "°C";
                }
            },
        },
    ],
    xaxis: {
        type: 'datetime',
        labels: {
            formatter: function(value) {
                let date = new Date(value);
                let formatTime = date.toLocaleTimeString();
                return formatTime;
            }
        },
    },
};
var optionsHeatChart = {
    title: {
        text: "State Heat Map (Last 7 Days)",
        align: 'center',
        margin: 1,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: undefined,
            color: '#fff'
        },
    },
    chart: {
        type: 'heatmap',
        id: 'realtime',
        height: '333px',
        width: '100%',
        animations: {
            enabled: true,
            easing: 'linear',
            dynamicAnimation: {
                speed: 1000
            }
        },
        toolbar: {
            show: false
        },
        zoom: {
            enabled: false
        },
        background: '#303030'
    },
    theme: {
        mode: 'dark',
    },
    noData: {
        text: 'Loading...'
    },
    series: [],
    dataLabels: {
        enabled: true,
        formatter: function(val) {
            return Math.round(val * 10) / 10 + "%"
        },
        style: {
            fontSize: '14px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 'bold',
            colors: ['#000000']
        },

    },
    plotOptions: {
        heatmap: {
            shadeIntensity: 0.5,
            radius: 0,
            useFillColorAsStroke: true,
            colorScale: {
                ranges: [{
                        from: 0,
                        to: 25,
                        name: 'low',
                        color: '#004cff'
                    },
                    {
                        from: 26,
                        to: 50,
                        name: 'medium',
                        color: '#af00b5'
                    },
                    {
                        from: 51,
                        to: 75,
                        name: 'high',
                        color: '#ff7800'
                    },
                    {
                        from: 76,
                        to: 100,
                        name: 'extreme',
                        color: '#96ff00'
                    }
                ]
            }
        }
    },
    tooltip: {
        y: {
            formatter: function(val) {
                return Math.round(val * 10) / 10 + "%"
            },
        }
    }
};
let systemChartCPU = new ApexCharts(
    document.querySelector("#systemChartCPU"),
    optionsCPU
);
systemChartCPU.render();
let systemChartMemory = new ApexCharts(
    document.querySelector("#systemChartMemory"),
    optionsMemory
);
systemChartMemory.render();
let systemFarmTemp = new ApexCharts(
    document.querySelector("#farmTempMap"),
    optionsFarmTemp
);
systemFarmTemp.render();
var activityHeatChart = new ApexCharts(document.querySelector("#daysActivityHeatMap"), optionsHeatChart);
activityHeatChart.render();
async function asyncParse(str) {
    try {
        let info = parse(str)
        return info;
    } catch (e) {
        return false;
    }
}
let source = new EventSource("/sse/dashboardInfo/");
let statsCounter = 10;
let iHavePrinters = false;
source.onmessage = async function(e) {
    if (!editMode) {
        if (e.data != null) {
            let res = await asyncParse(e.data);
            if (res != false) {
                if (res.printerInfo.length > 0) {
                    if (
                        document.getElementById("printerManagerModal").classList.contains("show")
                    ) {
                        PrinterManager.init(res.printerInfo);
                    } else {
                        printerInfo = res.printerInfo;
                        currentOperations(res.currentOperations, res.currentOperationsCount, res.printerInfo);
                        dashUpdate.printers(res.printerInfo);
                        if (statsCounter === 10) {
                            dashUpdate.systemInformation(res.systemInfo);
                            dashUpdate.farmInformation(res.farmInfo, res.heatMap);
                            statsCounter = 0;
                        } else {
                            statsCounter = statsCounter + 1;
                        }


                    }
                } else {
                    if (iHavePrinters === false) {
                        bootbox.alert("No printers detected, please add them using the printer manager below.", function() {
                            iHavePrinters = true;
                        });
                    }

                }
            }
        }
    }

};
source.onerror = function() {
    UI.createAlert(
        "error",
        "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
    );
    setTimeout(function() {
        location.reload();
    }, 10000);
};
source.onclose = function() {};
let newPrintersIndex = 0;
//Dash control listeners
let saveEditBtn = document.getElementById("saveEditsBtn");
let editBtn = document.getElementById(("editPrinterBtn"));
let deleteBtns = document.querySelectorAll("[id^='deleteButton-']")
deleteBtns.forEach(b => {
    b.addEventListener('click', event => {
        PrintersManagement.deletePrinter(event.target);
    })
})
let searchOffline = document.getElementById("searchOfflineBtn");
searchOffline.addEventListener('click', async e => {
    searchOffline.innerHTML = '<i class="fas fa-redo fa-sm fa-spin"></i> Syncing...'

    let post = await OctoFarmClient.post("printers/reScanOcto", {
        id: null
    });
    searchOffline.innerHTML = '<i class="fas fa-redo fa-sm"></i> Re-Sync'
    UI.createAlert("success", `Started a background re-sync of all printers connected to OctoFarm`, 1000, "Clicked");
});
saveEditBtn.addEventListener("click", async event => {
    let saveEdits = document.getElementById("saveEditsBtn")
    saveEdits.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i> Saving...';
    if (deletedPrinters.length > 0) {
        let post = await OctoFarmClient.post("printers/remove", deletedPrinters);
        if (post.status === 200) {
            let printersRemoved = await post.json();
            printersRemoved = printersRemoved.printersRemoved;
            printersRemoved.forEach(printer => {
                UI.createAlert("success", `Printer: ${printer.printerURL} has successfully been removed from the farm...`, 1000, "Clicked");
            })
        } else {
            UI.createAlert("error", "Something went wrong updating the Server...", 3000, "Clicked")
            saveButton.innerHTML = '<i class=\"fas fa-save\"></i>';
        }
    }
    let editedPrinters = [];
    for (let i = 0; i < printerInfo.length; i++) {
        let printerCard = document.getElementById("printerCard-" + printerInfo[i]._id);
        if (printerCard) {
            let printerURL = document.getElementById("printerURL-" + printerInfo[i]._id);
            let printerCamURL = document.getElementById("printerCamURL-" + printerInfo[i]._id);
            let printerAPIKEY = document.getElementById("printerApiKey-" + printerInfo[i]._id);
            let printerGroup = document.getElementById("printerGroup-" + printerInfo[i]._id);
            let printerName = document.getElementById("printerName-" + printerInfo[i]._id);
            let printer = new PrintersManagement(
                printerURL.innerHTML,
                printerCamURL.innerHTML,
                printerAPIKEY.innerHTML,
                printerGroup.innerHTML,
                printerName.innerHTML
            ).build();
            printer._id = printerInfo[i]._id;
            let currentInfoIndex = _.findIndex(printerInfo, function(o) { return o._id === printerInfo[i]._id })
            if (printerURL.innerHTML !== printerInfo[currentInfoIndex].printerURL ||
                printerCamURL.innerHTML !== printerInfo[currentInfoIndex].camURL ||
                printerAPIKEY.innerHTML !== printerInfo[currentInfoIndex].apikey ||
                printerGroup.innerHTML !== printerInfo[currentInfoIndex].group ||
                printerName.innerHTML !== printerInfo[currentInfoIndex].settingsAppearance.name
            ) {
                editedPrinters.push(printer);
            }
        }
    }
    if (editedPrinters.length > 0) {
        let post = await OctoFarmClient.post("printers/update", editedPrinters)
        if (post.status === 200) {
            let printersAdded = await post.json();
            printersAdded = printersAdded.printersAdded;
            printersAdded.forEach(printer => {
                UI.createAlert("success", `Printer: ${printer.printerURL} information has been updated on the farm...`, 1000, "Clicked")
            })
        } else {
            UI.createAlert("error", "Something went wrong updating the Server...", 3000, "Clicked")
            saveEdits.innerHTML = '<i class="fas fa-save"></i> Save Edits';
        }
    }


    saveEdits.innerHTML = '<i class="fas fa-save"></i> Save Edits';
    editBtn.classList.remove("d-none");
    saveEditBtn.classList.add("d-none");
    let deleteBtns = document.querySelectorAll("[id^='deleteButton-']")
    deleteBtns.forEach(b => {
        b.classList.add("d-none");
    })
    if (editedPrinters.length === 0 && deletedPrinters.length === 0) {
        UI.createAlert("warning", "No changes we're made...", 3000, "Clicked")
    } else {
        UI.createAlert("success", "Printer updates have been saved, edit mode now deactivated. <br> Please await your printer list to reload...", 3000, "Clicked")
    }
    let editableFields = document.querySelectorAll('[contenteditable=true]')
    editableFields.forEach(f => {
        //document.getElementById(f.id).contentEditable = true;
        f.classList.remove("Active");
        f.contentEditable = false;
    })
    deletedPrinters = [];
    editedPrinters = [];
    editMode = false;

})
editBtn.addEventListener('click', event => {
    editMode = true;
    editBtn.classList.add("d-none");
    saveEditBtn.classList.remove("d-none");
    let deleteBtns = document.querySelectorAll("[id^='deleteButton-']")
    deleteBtns.forEach(b => {
        b.classList.remove("d-none");
    })

    let editableFields = document.querySelectorAll('[contenteditable=false]')

    editableFields.forEach(f => {
        f.classList.add("Active");
        f.contentEditable = true;
    })
    UI.createAlert("success", "Edit Mode turned on, press save once finished. <br> Your printer status will not update whilst in this mode...", 3000, "Clicked")
})

document.getElementById(("exportPrinterBtn")).addEventListener('click', event => {
    const table = document.getElementById("printerList");
    let printers = new Array();
    for (let r = 0, n = table.rows.length; r < n; r++) {
        let index = table.rows[r].id.split('-')
        let printer = {
            name: document.getElementById("printerName-" + index[1]).innerHTML,
            group: document.getElementById("printerGroup-" + index[1]).innerHTML,
            printerURL: document.getElementById("printerURL-" + index[1]).innerHTML,
            cameraURL: document.getElementById("printerCamURL-" + index[1]).innerHTML,
            apikey: document.getElementById("printerApiKey-" + index[1]).innerHTML
        }
        printers.push(printer);
    }
    let reFormat = {};
    reFormat.name = [];
    reFormat.group = [];
    reFormat.printerURL = [];
    reFormat.cameraURL = [];
    reFormat.apikey = [];
    printers.forEach((old, index) => {
        reFormat["name"].push(old.name);
        reFormat["group"].push(old.group);
        reFormat["printerURL"].push(old.printerURL);
        reFormat["cameraURL"].push(old.cameraURL);
        reFormat["apikey"].push(old.apikey);
    });
    FileOperations.download("printers.json", JSON.stringify(reFormat));
});
document.getElementById("importPrinterBtn").addEventListener('change', async function() {
    let Afile = this.files;
    if (Afile[0].name.includes(".json")) {
        let files = Afile[0];
        let reader = new FileReader();
        reader.onload = await PrintersManagement.importPrinters(files);
        reader.readAsText(files);
    } else {
        //File not json
        UI.createAlert("error", `File type not .json!`, 3000);
    }
});
document.getElementById("addPrinterBtn").addEventListener('click', event => {
    PrintersManagement.addPrinter();
});
let printerCard = document.querySelectorAll("[id^='printerButton-']");
printerCard.forEach(card => {
    let ca = card.id.split("-");
    card.addEventListener("click", e => {
        PrinterManager.updateIndex(ca[1]);
        PrinterManager.init(printerInfo);
    });
});

class Printer {
    constructor(printerURL, camURL, apikey, group, name) {
        this.settingsApperance = {
            color: "default",
            colorTransparent: false,
            defaultLanguage: "_default",
            name: name,
            showFahrenheitAlso: false
        };
        this.printerURL = printerURL;
        this.camURL = camURL;
        this.apikey = apikey;
        this.group = group;
    }
}
class PrintersManagement {
    constructor(printerURL, camURL, apikey, group, name) {
        this.printer = new Printer(printerURL, camURL, apikey, group, name);
    }
    build() {
        return this.printer;
    }
    static addPrinter(newPrinter) {
        //Insert Blank Row at top of printer list
        if (typeof newPrinter !== 'undefined') {
            document.getElementById("printerList").insertAdjacentHTML("beforebegin", `
         <tr id="newPrinterCard-${newPrintersIndex}">
              <th></th>
              <th></th>
              <th><div class="Idle" id="newPrinterName-${newPrintersIndex}" contenteditable="plaintext-only">${newPrinter.name}</div></th>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              <th><div class="Idle" id="newPrinterGroup-${newPrintersIndex}" contenteditable="plaintext-only">${newPrinter.group}</div></th>
              <th><div class="Idle" id="newPrinterURL-${newPrintersIndex}" contenteditable="plaintext-only">${newPrinter.printerURL}</th>
              <th><div class="Idle" id="newPrinterCamURL-${newPrintersIndex}" contenteditable="plaintext-only">${newPrinter.cameraURL}</div></th>
              <th><div class="Idle" id="newPrinterAPIKEY-${newPrintersIndex}" contenteditable="plaintext-only" >${newPrinter.apikey}</div></th>
              <th></th>
              <th></th>
              <th><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                      <i class="fas fa-save"></i>
                  </button></th>
              <th><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                      <i class="fas fa-trash"></i>
                  </button></th>
      
          </tr>
  `)
        } else {
            document.getElementById("printerList").insertAdjacentHTML("beforebegin", `
        <tr id="newPrinterCard-${newPrintersIndex}">
        <th></th>
        <th><div class="Idle" id="newPrinterName-${newPrintersIndex}" contenteditable="plaintext-only">{Leave to Grab from OctoPrint}</div></th>
        <th></th>
        <th></th>
        <th></th>
        <th></th>
        <th><div class="Idle" id="newPrinterGroup-${newPrintersIndex}" contenteditable="plaintext-only"></div></th>
        <th><div class="Idle" id="newPrinterURL-${newPrintersIndex}" contenteditable="plaintext-only"></th>
        <th><div class="Idle" id="newPrinterCamURL-${newPrintersIndex}" contenteditable="plaintext-only">{Set blank to grab from OctoPrint}</div></th>
        <th><div class="Idle" id="newPrinterAPIKEY-${newPrintersIndex}" contenteditable="plaintext-only" ></div></th>
        <th></th>
        <th></th>
        <th><button id="saveButton-${newPrintersIndex}" type="button" class="btn btn-success btn-sm">
                <i class="fas fa-save"></i>
            </button></th>
        <th><button id="delButton-${newPrintersIndex}" type="button" class="btn btn-danger btn-sm">
                <i class="fas fa-trash"></i>
            </button></th>

    </tr>
  `)
        }
        document.getElementById("saveButton-" + newPrintersIndex).addEventListener('click', event => {
            PrintersManagement.savePrinter(event.target);
        });
        document.getElementById("delButton-" + newPrintersIndex).addEventListener('click', event => {
            PrintersManagement.deletePrinter(event.target);
            newPrintersIndex--
        });
        let printerName = document.getElementById("newPrinterName-" + newPrintersIndex)
        printerName.addEventListener('focus', event => {
            printerName.innerHTML = "";
        });
        let printerCamURL = document.getElementById("newPrinterCamURL-" + newPrintersIndex)
        printerCamURL.addEventListener('focus', event => {
            printerCamURL.innerHTML = "";
        });
        newPrintersIndex++;
        return;
    }
    static async importPrinters() {
        return function(e) {
            const theBytes = e.target.result; //.split('base64,')[1];
            //Initial JSON validation
            if (Validate.JSON(theBytes)) {
                //If we can parse the file.
                //Grab uploaded file contents into an object
                const importPrinters = JSON.parse(theBytes);
                //Check if old import/new import
                let currentImportList = [];
                if ("ip" in importPrinters) {
                    //Convert import old to new
                    if (importPrinters.ip.length === importPrinters.port.length &&
                        importPrinters.ip.length === importPrinters.port.length &&
                        importPrinters.ip.length === importPrinters.apikey.length) {
                        let z = {};
                        z.printerURL = [];
                        z.cameraURL = [];
                        z.name = [];
                        z.group = [];
                        z.apikey = [];
                        for (let index = 0; index < importPrinters.ip.length; index++) {
                            z.printerURL.push("http://" + importPrinters.ip[index] + ":" + importPrinters.port[index]);
                            z.cameraURL.push(importPrinters.camURL[index]);
                            z.name.push("{Leave to Grab from OctoPrint}");
                            z.group.push("");
                            z.apikey.push(importPrinters.apikey[index]);
                        };
                        currentImportList = z;
                    } else {
                        UI.createAlert(
                            "error",
                            "The file you have tried to upload is missing a value.",
                            3000
                        );
                    }
                } else {
                    if (importPrinters.printerURL.length === importPrinters.name.length &&
                        importPrinters.printerURL.length === importPrinters.group.length &&
                        importPrinters.printerURL.length === importPrinters.apikey.length &&
                        importPrinters.printerURL.length === importPrinters.cameraURL.length) {
                        currentImportList = importPrinters;
                    } else {
                        UI.createAlert(
                            "error",
                            "The file you have tried to upload is missing a value.",
                            3000
                        );
                    }

                }
                for (let index = 0; index < currentImportList.printerURL.length; index++) {
                    let printer = {
                        printerURL: currentImportList.printerURL[index],
                        cameraURL: currentImportList.cameraURL[index],
                        name: currentImportList.name[index],
                        group: currentImportList.group[index],
                        apikey: currentImportList.apikey[index]
                    }
                    PrintersManagement.addPrinter(printer);
                };
                UI.createAlert("success", "Successfully imported your printer list, Please check it over and save when ready.", 3000);
            } else {
                UI.createAlert(
                    "error",
                    "The file you have tried to upload contains json syntax errors.",
                    3000
                );
            }
        }
    }

    static deletePrinter(event) {
        if (editMode) {
            bootbox.confirm({
                message: "Are you sure you want to delete your printer? This will mark your printer for deletion and action on save..",
                buttons: {
                    confirm: {
                        label: 'Yes',
                        className: 'btn-success'
                    },
                    cancel: {
                        label: 'No',
                        className: 'btn-danger'
                    }
                },
                callback: async function(result) {
                    if (result) {
                        let ca = event.id.split("-");
                        deletedPrinters.push(ca[1]);
                        document.getElementById("printerCard-" + ca[1]).remove();
                    }
                }
            });
        } else {
            event.parentElement.parentElement.parentElement.remove();
        }

    }
    static async savePrinter(event) {
        //Gather the printer data...
        let newId = event.id.split("-");
        newId = newId[1];

        //Grab new printer cells...
        let printerURL = document.getElementById("newPrinterURL-" + newId);
        let printerCamURL = document.getElementById("newPrinterCamURL-" + newId);
        let printerAPIKEY = document.getElementById("newPrinterAPIKEY-" + newId);
        let printerGroup = document.getElementById("newPrinterGroup-" + newId);
        let printerName = document.getElementById("newPrinterName-" + newId);

        let errors = [];
        let printCheck = -1;
        if (printerURL.innerHTML !== "") {
            printCheck = _.findIndex(printerInfo, function(o) { return o.printerURL.includes(printerURL.innerHTML) })
        }
        //Check information is filled correctly...
        if (printerURL.innerHTML === "" || printCheck > -1 || printerAPIKEY.innerHTML === "" || printerName.innerHTML === "" || printerCamURL.innerHTML === "") {
            if (printerURL.innerHTML === "") {
                errors.push({ type: "warning", msg: "Please input your printers URL" });
            }
            if (printerAPIKEY.innerHTML === "") {
                errors.push({ type: "warning", msg: "Please input your printers API Key" });
            }
            if (printerName.innerHTML === "") {
                errors.push({ type: "warning", msg: "Please input your printers name" });
            }
            if (printCheck > -1) {
                errors.push({ type: "error", msg: "Printer URL: " + printerURL.innerHTML + " already exists on farm" });
            }
        }
        if (errors.length > 0) {
            errors.forEach(error => {
                UI.createAlert(error.type, error.msg, 3000, "clicked")
            })
        } else {
            let printers = [];
            let saveButton = document.getElementById("saveButton-" + newId);
            saveButton.innerHTML = '<i class=\"fas fa-spinner fa-spin\"></i>';
            saveButton.disabled = true;
            let printer = new PrintersManagement(
                    printerURL.innerHTML,
                    printerCamURL.innerHTML,
                    printerAPIKEY.innerHTML,
                    printerGroup.innerHTML,
                    printerName.innerHTML
                )
                .build();
            printers.push(printer)
            let post = await OctoFarmClient.post("printers/add", printers)
            if (post.status === 200) {
                let printersAdded = await post.json();
                printersAdded = printersAdded.printersAdded;
                printersAdded.forEach(printer => {
                    UI.createAlert("success", `Printer: ${printer.printerURL} has successfully been added to the farm...`, 500, "Clicked")
                })
                event.parentElement.parentElement.parentElement.remove()

            } else {
                UI.createAlert("error", "Something went wrong updating the Server...", 3000, "Clicked")
                saveButton.innerHTML = '<i class=\"fas fa-save\"></i>';
                saveButton.disabled = false;
            }
        }
    }

}

//Initial listeners
document.getElementById("connectAllBtn").addEventListener("click", () => {
    dashActions.connectAll();
});
document.getElementById("disconnectAllBtn").addEventListener("click", () => {
    dashActions.disconnectAll();
});

let printerReSync = document.querySelectorAll("[id^='printerSyncButton-']");
printerReSync.forEach(card => {
    let ca = card.id.split("-");
    card.addEventListener("click", async e => {
        e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
        e.target.disabled = true;
        let data = {
            id: ca[1]
        };
        let post = await OctoFarmClient.post("printers/reScanOcto", data);
        post = await post.json();
        if (post.msg.status !== "error") {
            UI.createAlert("success", post.msg.msg, 3000, "clicked");
        } else {
            UI.createAlert("error", post.msg.msg, 3000, "clicked");
        }

        e.target.innerHTML = "<i class='fas fa-sync'></i>";
        e.target.disabled = false;
    });
});
class dashActions {
    static async connectionAction(action) {
        $("#connectionModal").modal("hide");
        let selected = document.querySelectorAll("[id^='printerSel-']");
        document.getElementById("connectionAction").remove();
        if (action === "connect") {
            for (let i = 0; i < selected.length; i++) {
                if (selected[i].checked === true) {
                    let index = selected[i].id.replace("printerSel-", "");
                    let printerName = "";
                    if (typeof printerInfo[index].settingsAppearance != "undefined") {
                        printerName = printerInfo[index].settingsAppearance.name;
                    }
                    let preferBaud = printerInfo[index].options.baudratePreference;
                    let preferPort = printerInfo[index].options.portPreference;
                    let preferProfile =
                        printerInfo[index].options.printerProfilePreference;
                    if (preferBaud === null) {
                        preferBaud = "115200";
                    }
                    if (preferPort === null) {
                        preferPort = printerInfo[index].options.ports[0];
                    }
                    if (preferProfile === null) {
                        preferProfile = printerInfo[index].options.printerProfiles[0];
                    }
                    let opts = {
                        command: "connect",
                        port: preferPort,
                        baudrate: parseInt(preferPort),
                        printerProfile: preferProfile,
                        save: true
                    }
                    let post = null;
                    try {
                        post = await OctoPrintClient.post(printerInfo[index], "connection", opts);
                        if (post.status === 204) {
                            UI.createAlert(
                                "success",
                                `Connected: ${printerInfo[index].index}. ${printerName}`,
                                1000,
                                "clicked"
                            );
                        } else {
                            UI.createAlert(
                                "error",
                                `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
                                1000,
                                "clicked"
                            );
                        }
                    } catch (e) {
                        console.log(e)
                        UI.createAlert(
                            "error",
                            `Couldn't Connect ${printerInfo[index].index}with Port: ${preferPort}, Baud: ${preferBaud}, Profile: ${preferProfile}`,
                            1000,
                            "clicked"
                        );
                    }
                }
            }
        } else if (action === "disconnect") {
            for (let i = 0; i < selected.length; i++) {
                if (selected[i].checked === true) {
                    let index = selected[i].id.replace("printerSel-", "");
                    let printerName = "";
                    if (typeof printerInfo[index].settingsAppearance != "undefined") {
                        printerName = printerInfo[index].settingsAppearance.name;
                    }
                    let opts = {
                        command: "disconnect"
                    };
                    let post = await OctoPrintClient.post(
                        printerInfo[index],
                        "connection",
                        opts
                    );
                    if (post.status === 204) {
                        UI.createAlert(
                            "success",
                            `Disconnected: ${printerInfo[index].index}. ${printerName}`,
                            1000,
                            "clicked"
                        );
                    } else {
                        UI.createAlert(
                            "error",
                            `Couldn't Disconnect: ${printerInfo[index].index}. ${printerName}`,
                            1000,
                            "clicked"
                        );
                    }
                }
            }
        }
    }
    static async connectAll() {
        //Create bootbox confirmation message
        document.getElementById("connectionActionBtn").insertAdjacentHTML(
            "beforeBegin",
            `
    <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
      Connect All
    </button>
    `
        );
        let message = document.getElementById("printerConnection");

        message.innerHTML =
            "You must have at least 1 printer in the Disconnected state to use this function...";

        let printersList = "";
        printerInfo.forEach(printer => {
            if (printer.state === "Disconnected") {
                let printerName = "";
                if (typeof printer.settingsAppearance != "undefined") {
                    printerName = printer.settingsAppearance.name;
                }
                let print = `
          <div style="display:inline-block;">
          <form class="was-validated">
          <div class="custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
            <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
            <div class="valid-feedback">Attempt to connect</div>
            <div class="invalid-feedback">DO NOT connect</div>
          </div>
        </form></div>
          `;
                printersList += print;
                message.innerHTML = printersList;
            }
        });
        let checkBoxes = document.querySelectorAll("[id^='printerSel-']");
        checkBoxes.forEach(box => {
            box.checked = true;
        });
        document.getElementById("connectionAction").addEventListener("click", () => {
            dashActions.connectionAction("connect");
        });
    }
    static async disconnectAll() {
        //Create bootbox confirmation message
        document.getElementById("connectionActionBtn").insertAdjacentHTML(
            "beforeBegin",
            `
        <button id="connectionAction" type="button" class="btn btn-success" data-dismiss="modal">
          Disconnect All
        </button>
        `
        );
        let message = document.getElementById("printerConnection");
        message.innerHTML =
            "You must have at least 1 printer in the Idle category to use this function...";
        let printersList = "";
        printerInfo.forEach(printer => {
            if (
                printer.stateColour.category === "Idle" ||
                printer.stateColour.category === "Complete"
            ) {
                let printerName = "";
                if (typeof printer.settingsAppearance != "undefined") {
                    printerName = printer.settingsAppearance.name;
                }
                let print = `
              <div style="display:inline-block;">
              <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                <input type="checkbox" class="custom-control-input" id="printerSel-${printer.index}" required>
                <label class="custom-control-label" for="printerSel-${printer.index}">${printer.index}. ${printerName}</label>
                <div class="valid-feedback">Attempt to connect</div>
                <div class="invalid-feedback">DO NOT connect</div>
              </div>
            </form></div>
              `;
                printersList += print;
                message.innerHTML = printersList;
            }
        });

        let checkBoxes = document.querySelectorAll("[id^='printerSel-']");
        checkBoxes.forEach(box => {
            box.checked = true;
        });
        document.getElementById("connectionAction").addEventListener("click", () => {
            dashActions.connectionAction("disconnect");
        });
    }
}

class dashUpdate {
    static systemInformation(systemInfo) {
        if (Object.keys(systemInfo).length === 0 && systemInfo.constructor === Object) {

        } else {
            document.getElementById("systemUpdate").innerHTML = Calc.generateTime(
                systemInfo.sysUptime.uptime
            );
            //labels: ['System', 'OctoFarm', 'User', 'Free'],
            let cpuLoad = systemInfo.cpuLoad.currentload_system;
            let octoLoad = systemInfo.sysProcess.pcpu;
            let userLoad = systemInfo.cpuLoad.currentload_user;
            let remain = cpuLoad + octoLoad + userLoad;
            systemChartCPU.updateSeries([cpuLoad, octoLoad, userLoad, 100 - remain])

            let otherRAM = systemInfo.memoryInfo.total - systemInfo.memoryInfo.free
            let octoRAM = systemInfo.memoryInfo.total / 100 * systemInfo.sysProcess.pmem
            let freeRAM = systemInfo.memoryInfo.free

            systemChartMemory.updateSeries([otherRAM, octoRAM, freeRAM])

        }

    }

    static printers(printers) {
        printers.forEach((printer) => {
            let printerName = "";
            if (typeof printer.stateColour != "undefined") {
                if (typeof printer.settingsAppearance != "undefined") {
                    printerName = printer.settingsAppearance.name;
                }
                let printerCard = document.getElementById("printerCard-" + printer._id);
                if (printerCard) {
                    let printName = document.getElementById("printerName-" + printer._id);
                    let printButton = document.getElementById("printerButton-" + printer._id);
                    let settingButton = document.getElementById("printerSettings-" + printer._id);
                    let webButton = document.getElementById("printerWeb-" + printer._id);
                    let hostBadge = document.getElementById("hostBadge-" + printer._id);
                    let printerBadge = document.getElementById("printerBadge-" + printer._id);
                    let socketBadge = document.getElementById("webSocketIcon-" + printer._id);
                    let printerGroup = document.getElementById("printerGroup-" + printer._id);
                    let printerURL = document.getElementById("printerURL-" + printer._id);
                    let printerCameraURL = document.getElementById("printerCamURL-" + printer._id);
                    let printerAPIKey = document.getElementById("printerApiKey-" + printer._id);
                    let printerOctoPrintVersion = document.getElementById("printerOctoPrintVersion-" + printer._id);
                    let printerSortIndex = document.getElementById("printerSortIndex-"+printer._id)
                    printerSortIndex.innerHTML = printer.sortIndex;
                    printerGroup.innerHTML = printer.group;
                    printerURL.innerHTML = printer.printerURL;
                    printerAPIKey.innerHTML = printer.apikey;
                    if (printer.camURL === "none") {
                        printerCameraURL.innerHTML = "";
                    } else {
                        printerCameraURL.innerHTML = printer.camURL;R
                    }

                    printerOctoPrintVersion.innerHTML = printer.octoPrintVersion;

                    printName.innerHTML = `${printerName}`;
                    printerBadge.innerHTML =
                        printer.state;
                    printerBadge.className = `tag badge badge-${printer.stateColour.name} badge-pill`;
                    printerBadge.setAttribute('title',printer.stateDescription)
                    hostBadge.innerHTML =
                        printer.hostState;
                    hostBadge.setAttribute('title',printer.hostDescription)
                    hostBadge.className = `tag badge badge-${printer.hostStateColour.name} badge-pill`;
                    socketBadge.className = `tag badge badge-${printer.webSocket} badge-pill`;
                    socketBadge.setAttribute('title',printer.webSocketDescription)
                    webButton.href = printer.printerURL;
                    if (printer.stateColour.category === "Offline") {
                        printButton.disabled = true;
                        settingButton.disabled = true;
                    } else {
                        printButton.disabled = false;
                        settingButton.disabled = false;
                    }
                } else {
                    //Insert new printer addition...
                    document.getElementById("printerList").insertAdjacentHTML("beforeend", `
        <tr id="printerCard-${printer._id}">
        <th>
            <center>
            <form class="was-validated form-check-inline form-check">
                <div class="custom-control custom-checkbox mb-2 pr-2">
                    <input type="checkbox" class="custom-control-input" id="dashboardSelect-${printer._id}" required>
                    <label class="custom-control-label" for="dashboardSelect-${printer._id}" contenteditable="false"></label>
                </div>
            </form>
            </center>
        </th>
        <th><div id="printerName-${printer._id}" contenteditable="false">${printerName}</div></th>
        <th>
            <button  
            data-title="Control Your Printer"
            id="printerButton-${printer._id}"
                     type="button"
                     class="tag btn btn-primary btn-sm"
                     data-toggle="modal"
                     data-target="#printerManagerModal" disabled
            ><i class="fas fa-print"></i>
            </button>
            <button  data-title="Change your Printer Settings"
            id="printerSettings-${printer._id}"
                                 type="button"
                                 class="tag btn btn-secondary btn-sm"
                                 data-toggle="modal"
                                 data-target="#printerSettingsModal" disabled
            ><i class="fas fa-cog"></i>
            </button>
            <a data-title="Open your Printers Web Interface"
               id="printerWeb-${printer._id}"
               type="button"
               class="tag btn btn-info btn-sm"
               target="_blank"
               href="${ printer.printerURL }" role="button"><i class="fas fa-globe-europe"></i></a>
            <button  
                     data-title="Re-Sync your printer"
                     id="printerSyncButton-${printer._id}"
                     type="button"
                     class="tag btn btn-success btn-sm"
            >
                <i class="fas fa-sync"></i>
            </button>
            <button  data-title="Turn your printer on/off"
                     id="printerPower-${printer._id}"
                     type="button"
                     class="tag btn btn-danger btn-sm"
                     data-toggle="modal"
                     data-target="#powerModal"
            ><i class="fas fa-power-off"></i>
            </button>
            <span data-title="Drag and Change your Printers sorting"  id="printerSortButton-${printer._id}"
                   class="tag btn btn-light btn-sm sortableList"
            >
    <i class="fas fa-grip-vertical"></i>
    </span></th>
        <th><small><span data-title="${printer.hostDescription}" id="hostBadge-${printer._id}" class="tag badge badge-${ printer.hostStateColour.name } badge-pill">
                ${ printer.hostState }</small></span></th>
        <th><small><span data-title="${printer.stateDescription}" id="printerBadge-${printer._id}" class="tag badge badge-${ printer.stateColour.name } badge-pill">
                ${ printer.state }</small></span></th>
        <th><small><span data-title="${printer.webSocketDescription}" id="webSocketIcon-${printer._id}" class="tag badge badge-${ printer.webSocket } badge-pill">
                <i  class="fas fa-plug"></i></span></th>
        <th><div id="printerGroup-${printer._id}" contenteditable="false"></div></th>
        <th><div id="printerURL-${printer._id}" contenteditable="false"></div></th>
        <th><div id="printerCamURL-${printer._id}" contenteditable="false"></div></th>
        <th><div id="printerApiKey-${printer._id}" contenteditable="false"></div></th>
        <th id="printerOctoPrintVersion-${printer._id}"></th>
        <th><button id="deleteButton-${printer._id}" type="button" class="btn btn-danger btn-sm d-none">
                <i class="fas fa-trash"></i>
            </button></th>
    </tr>
          `)
                    document.getElementById("deleteButton-" + printer._id).addEventListener('click', event => {
                        PrintersManagement.deletePrinter(event.target);
                    })
                    document.getElementById("printerSyncButton-" + printer._id).addEventListener("click", async e => {
                        e.target.innerHTML = "<i class='fas fa-sync fa-spin'></i>";
                        e.target.disabled = true;
                        let data = {
                            id: printer._id
                        };
                        let post = await OctoFarmClient.post("printers/reScanOcto", data);
                        post = await post.json();
                        if (post.msg.status !== "error") {
                            UI.createAlert("success", post.msg.msg, 3000, "clicked");
                        } else {
                            UI.createAlert("error", post.msg.msg, 3000, "clicked");
                        }

                        e.target.innerHTML = "<i class='fas fa-sync'></i>";
                        e.target.disabled = false;
                    });
                }
            }
        });
    }
    static farmInformation(farmInfo, heatMap) {

        document.getElementById("globalTemp").innerHTML = `
            <i class="fas fa-temperature-high"></i> Total Temperature: ${Math.round(farmInfo.totalActualTemperature)} °C
    `;
        document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.avgEstimateTime
        );
        document.getElementById("avgRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.avgRemainingTime
        );
        document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.avgElapsedTime
        );
        document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
            farmInfo.totalEstimateTime
        );
        document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
            farmInfo.totalRemainingTime
        );
        document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
            farmInfo.totalElapsedTime
        );
        systemFarmTemp.updateSeries(farmInfo.temp);
        activityHeatChart.updateSeries(heatMap);
    }

    //   static farmInformation(farmInfo) {
    //     document.getElementById("avgEstimatedTime").innerHTML = Calc.generateTime(
    //         farmInfo.avgEstimateTime
    //     );
    //     document.getElementById("avgRemaingingTime").innerHTML = Calc.generateTime(
    //         farmInfo.avgRemainingTime
    //     );
    //     document.getElementById("avgElapsedTime").innerHTML = Calc.generateTime(
    //         farmInfo.avgElapsedTime
    //     );
    //     document.getElementById("cumEstimatedTime").innerHTML = Calc.generateTime(
    //         farmInfo.totalEstimateTime
    //     );
    //     document.getElementById("cumRemainingTime").innerHTML = Calc.generateTime(
    //         farmInfo.totalRemainingTime
    //     );
    //     document.getElementById("cumElapsedTime").innerHTML = Calc.generateTime(
    //         farmInfo.totalElapsedTime
    //     );
    //     document.getElementById(
    //         "cumTool0Heat"
    //     ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
    //         farmInfo.activeToolA * 100
    //     ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
    //         farmInfo.activeToolT * 100
    //     ) / 100}°C`;
    //     document.getElementById(
    //         "cumBedHeat"
    //     ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
    //         farmInfo.activeBedA * 100
    //     ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
    //         farmInfo.activeBedT * 100
    //     ) / 100}°C`;
    //     document.getElementById(
    //         "cumPrintHeat"
    //     ).innerHTML = `<i class="far fa-circle"></i> ${Math.round(
    //         (farmInfo.activeToolA + farmInfo.activeBedA) * 100
    //     ) / 100}°C <i class="fas fa-bullseye"></i> ${Math.round(
    //         (farmInfo.activeToolT + farmInfo.activeBedT) * 100
    //     ) / 100}°C`;
    //   }
    // }
    //   static farmStatistics(octofarmStatistics) {
    //     document.getElementById("activeHours").innerHTML =
    //       "<i class='fas fa-square text-success'></i> <b>Active: </b>" +
    //       Calc.generateTime(octofarmStatistics.activeHours);
    //     document.getElementById("idleHours").innerHTML =
    //       "<i class='fas fa-square text-danger'></i> <b>Idle: </b>" +
    //       Calc.generateTime(octofarmStatistics.idleHours);
    //     let activeProgress = document.getElementById("activeProgress");
    //     activeProgress.innerHTML = octofarmStatistics.activePercent + "%";
    //     activeProgress.style.width = octofarmStatistics.activePercent + "%";
    //
    //     let idleProgress = document.getElementById("idleProgress");
    //     idleProgress.innerHTML = 100 - octofarmStatistics.activePercent + "%";
    //     idleProgress.style.width = 100 - octofarmStatistics.activePercent + "%";
    //   }
}
let el = document.getElementById("printerList");
let sortable = Sortable.create(el, {
    handle: ".sortableList",
    animation: 150,
    onUpdate: function( /**Event*/ e) {
        let elements = e.target.querySelectorAll("[id^='printerCard-']");
        let listID = [];
        elements.forEach(e => {
            let ca = e.id.split("-");
            listID.push(ca[1]);
        });
        OctoFarmClient.post("printers/updateSortIndex", listID);
    }
});

window.onload = function () {tableSort.makeAllSortable();};