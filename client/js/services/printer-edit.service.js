import UI from "../utils/ui";
import OctoFarmClient from "./octofarm-client.service";

export default class PrinterEditService {
    static pageElements;
    static currentPrinter;
    static loadPrinterEditInformation(printersInformation, printerID){
        PrinterEditService.setCurrentPrinter(printersInformation, printerID)
        if(!!PrinterEditService.currentPrinter){
            PrinterEditService.grabPageElements();
            PrinterEditService.enablePrinterEditSaveButton(printerID);
            PrinterEditService.loadPageInformation();
        }else{
            throw new Error("Failed to load printers information!")
        }

    }

    static setCurrentPrinter(printersInformation, printerID) {
        const printersIndex = _.findIndex(printersInformation, function (o) {
            return o._id === printerID;
        });
        PrinterEditService.currentPrinter = printersInformation[printersIndex];
    }

    static loadPageInformation () {
        const currentPrinter = PrinterEditService.currentPrinter;
        document.getElementById("generateNameButtonWrapper").innerHTML = `
          <button class="btn btn-info btn-block" id="generatePrinterName"><i class="fas fa-sync"></i></button>
        `;
        const userDropDown = document.getElementById("psOctoPrintUser");
        userDropDown.innerHTML = "";
        userDropDown.disabled = false;

        if (!!currentPrinter?.userList && currentPrinter.userList.length !== 0) {
          userDropDown.innerHTML = "";
          currentPrinter.userList.forEach((user) => {
            userDropDown.insertAdjacentHTML("beforeend", `<option value="${user}">${user}</option>`);
          });
          userDropDown.value = currentPrinter.currentUser;
        } else {
          userDropDown.disabled = true;
          userDropDown.insertAdjacentHTML("beforeend", "<option value='0'>No users available</option>");
          userDropDown.value = 0;
        }

        const printerNameElement = document.getElementById("psPrinterName");
        printerNameElement.placeholder = currentPrinter.printerName;
        document.getElementById("psPrinterURL").placeholder = currentPrinter.printerURL;



        const generatePrinterName = document.getElementById("generatePrinterName");
        generatePrinterName.addEventListener("click", async (e) => {
          e.preventDefault();
          e.target.innerHTML = "<i class=\"fas fa-sync fa-spin\"></i>"
          e.target.disabled = true;
          const newPrinterName = await OctoFarmClient.getPrinterName();
          if(!!newPrinterName){
            printerNameElement.value = newPrinterName;
            UI.createAlert("success",
                `Successfully generated new printer name! ${ newPrinterName }<br> Don't forget to save!`,
                "clicked",
                3000)
          }else{
            UI.createAlert("warning",
                `Failed to generate printer name! Please check the logs... ${newPrinterName}`,
                3000,
                "clicked")
          }

          e.target.innerHTML = "<i class=\"fas fa-sync\"></i>"
          e.target.disabled = false;
        })

        // Convert websocket url into a url object
        const webSocketURL = new URL(currentPrinter.webSocketURL);
        // Grab out the protocol and select it on the select box.
        document.getElementById("psWebSocketProtocol").value = webSocketURL.protocol + "//";
        document.getElementById("psCamURL").placeholder = currentPrinter.camURL;
        document.getElementById("psAPIKEY").placeholder = currentPrinter.apikey;
    }
    static grabPageElements() {
        if (!PrinterEditService.pageElements) {
            PrinterEditService.pageElements = {
                title: document.getElementById("printerSettingsTitle"),
                psPrinterEditSaveButton: document.getElementById("psPrinterEditSaveButton")
            };
        }
    }
    static enablePrinterEditSaveButton(){
        PrinterEditService.pageElements.psPrinterEditSaveButton.innerHTML = `
            <button id="savePrinterEditsButton" type="button" class="btn btn-success float-right" id="savePrinterSettingsBtn">Save Settings</button>
        `
        document.getElementById("savePrinterEditsButton").addEventListener("click", async (event) => {
            UI.addLoaderToElementsInnerHTML(event.target);
            const printerSettingsValues = PrinterEditService.getPageValues();
            const updatedSettings = await OctoFarmClient.post(
                "printers/updateSettings",
                { printer: printerSettingsValues }
            );
            UI.createAlert("info", "Successfully saved " + PrinterEditService.currentPrinter.printerName + " settings!", 5000, "clicked");
            UI.removeLoaderFromElementInnerHTML(event.target);
        });
    }
    static getPageValues(){
        return {
            printerName: UI.getValueOrPlaceHolder(document.getElementById("psPrinterName")),
                printerURL: UI.getValueOrPlaceHolder(document.getElementById("psPrinterURL")),
                webSocketProtocol: UI.getValueOrPlaceHolder(document.getElementById("psWebSocketProtocol")),
                index: PrinterEditService.currentPrinter._id,
                cameraURL: UI.getValueOrPlaceHolder(document.getElementById("psCamURL")),
                apikey: UI.getValueOrPlaceHolder(document.getElementById("psAPIKEY")),
                currentUser: UI.getValueOrPlaceHolder(document.getElementById("psOctoPrintUser"))
        }
    }
}