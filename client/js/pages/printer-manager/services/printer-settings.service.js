import OctoFarmClient from "../../../services/octofarm-client.service.js";
import UI from "../../../utils/ui.js";
import Calc from "../../../utils/calc.js";
import Script from "../../../services/octofarm-scripts.service.js";
import { ApplicationError } from "../../../exceptions/application-error.handler";
import { ClientErrors } from "../../../exceptions/octofarm-client.exceptions";
import "../../../utils/cleanup-modals.util";

let currentPrinterIndex;
let printerOnline;
let currentPrinter;
let pageElements;
let currentPrintersInformation;
const NO_PREFERENCE = "<option value=\"0\">No Preference</option>";

export async function updatePrinterSettingsModal(
  printersInformation,
  printerID
) {
  // Make sure we have page elements
  PrinterSettingsService.grabPageElements();
  // Check if printer ID is provided
  if (!printerID) {
    // No printer ID we are updating the state...
    // The SSE Event doesn't stop on an error, so we need to make sure the update event skips an error occurring...

    if (!ApplicationError.hasErrorNotificationBeenTriggered) {
      // Make sure online state is latest...
      printerOnline =
        printersInformation[currentPrinterIndex]?.printerState?.colour
          ?.category !== "Offline";
      PrinterSettingsService.updateStateElements(
        printersInformation[currentPrinterIndex]
      );
    }
  } else {
    PrinterSettingsService.updateCurrentPrinterIndex(
      printersInformation,
      printerID
    );
    // Resync Printer Settings to latest values and continue to setup page.
    currentPrinter = await OctoFarmClient.refreshPrinterSettings(printerID);
    //Convert online state to a boolean
    printerOnline =
      currentPrinter?.printerState?.colour?.category !== "Offline";
    PrinterSettingsService.updateStateElements(currentPrinter);
    // Clear the page of old values.
    UI.clearSelect("ps");

    // Setup Connection Tab
    PrinterSettingsService.setupConnectionTab();
    PrinterSettingsService.enablePanel(pageElements.menu.printerConnectionBtn);

    // Setup Cost Tab
    PrinterSettingsService.setupCostTab();
    PrinterSettingsService.enablePanel(pageElements.menu.printerCostBtn);
    // Setup Power Tab
    PrinterSettingsService.setupPowerTab();
    PrinterSettingsService.enablePanel(pageElements.menu.printerPowerBtn);
    // Setup Alerts Tab
    await PrinterSettingsService.setupAlertsTab();
    PrinterSettingsService.enablePanel(pageElements.menu.printerAlertsBtn);
    if (printerOnline) {
      // Setup Profile Tab
      PrinterSettingsService.setupProfileTab();
      PrinterSettingsService.enablePanel(pageElements.menu.printerProfileBtn);
      // Setup Gcode Script Tab
      PrinterSettingsService.setupGcodeTab();
      PrinterSettingsService.enablePanel(pageElements.menu.printerGcodeBtn);
      // Setup Camera Settings Tab
      PrinterSettingsService.setupCameraTab();
      PrinterSettingsService.enablePanel(
        pageElements.menu.printerCameraSettingsBtn
      );
      // Setup Triggers Tab
      PrinterSettingsService.setupTriggersTab();
      PrinterSettingsService.enablePanel(
        pageElements.menu.printerTriggerSettingsBtn
      );
    }
    // Setup Refresh Settings Button
    await PrinterSettingsService.setupRefreshButton();
    // Setup Save Settings button
    await PrinterSettingsService.setupSaveButton();

    UI.addSelectListeners("ps");

    // Remove any loadng elements left over
    Object.values(pageElements.menu).map((e) => {
      UI.removeLoaderFromElementInnerHTML(e);
    });
  }
}

class PrinterSettingsService {
  static updateCurrentPrinterIndex(printersInformation, printerID) {
    currentPrintersInformation = printersInformation;
    // Printer ID we need to initialise the page.
    const printersIndex = _.findIndex(printersInformation, function (o) {
      return o._id === printerID;
    });
    if (printersIndex !== -1) {
      currentPrinterIndex = printersIndex;
    } else {
      throw new ApplicationError(ClientErrors.FAILED_STATE_UPDATE);
    }
  }

  static setupConnectionTab() {
    document.getElementById("psDefaultPortDrop").innerHTML = `
      <div class="input-group mb-1"> <div class="input-group-prepend"> 
      <label class="input-group-text bg-secondary text-light" for="psDefaultSerialPort"">Preferred Port:</label> 
      </div> <select class="custom-select bg-secondary text-light" id="psDefaultSerialPort"></select></div>
      `;
    document.getElementById("psDefaultBaudDrop").innerHTML = `
      <div class="input-group mb-1"> <div class="input-group-prepend">
       <label class="input-group-text bg-secondary text-light" for="psDefaultBaudrate">Preferred Baudrate:</label> 
       </div> <select class="custom-select bg-secondary text-light" id="psDefaultBaudrate"></select></div>
      `;
    document.getElementById("psDefaultProfileDrop").innerHTML = `
      <div class="input-group mb-1"> <div class="input-group-prepend">
       <label class="input-group-text bg-secondary text-light" for="psDefaultProfile">Preferred Profile:</label> 
       </div> <select class="custom-select bg-secondary text-light" id="psDefaultProfile"></select></div>
      `;

    const baudrateDropdown = document.getElementById("psDefaultBaudrate");

    const serialPortDropDown = document.getElementById("psDefaultSerialPort");
    // Reset here for subsequent modal openings
    this.setPortAvailability(serialPortDropDown, true);

    const profileDropDown = document.getElementById("psDefaultProfile");

    const quickConnectEnabled = document.getElementById("psQuickConnect");
    const quickPowerEnabled = document.getElementById("psQuickPower");
    const connectTimeout = document.getElementById("psQuickConnectTimeout");
    const powerTimeout = document.getElementById("psQuickPowerTimeout");

    quickConnectEnabled.checked = currentPrinter.quickConnectSettings.connectPrinter;
    quickPowerEnabled.checked = currentPrinter.quickConnectSettings.powerPrinter;
    connectTimeout.value = currentPrinter.quickConnectSettings.connectAfterPowerTimeout / 1000;
    powerTimeout.value = currentPrinter.quickConnectSettings.powerAfterDisconnectTimeout / 1000;
    connectTimeout.placeholder = currentPrinter.quickConnectSettings.connectAfterPowerTimeout / 1000;
    powerTimeout.placeholder = currentPrinter.quickConnectSettings.powerAfterDisconnectTimeout / 1000;

    if (printerOnline) {
      pageElements.mainPage.offlineMessage.innerHTML = "";
      currentPrinter.connectionOptions.baudrates.forEach((baud) => {
        if (baud !== 0) {
          baudrateDropdown.insertAdjacentHTML(
            "beforeend",
            `<option value="${baud}">${baud}</option>`
          );
        } else {
          baudrateDropdown.insertAdjacentHTML(
            "beforeend",
            `<option value="${baud}">AUTO</option>`
          );
        }
      });
      if (!!currentPrinter.connectionOptions.baudratePreference) {
        baudrateDropdown.insertAdjacentHTML("afterbegin", NO_PREFERENCE);
      }
      const portAvailable = this.checkPortIsAvailable(
        currentPrinter?.connectionOptions?.ports,
        currentPrinter?.connectionOptions?.portPreference
      );

      currentPrinter?.connectionOptions?.ports.forEach((port) => {
        serialPortDropDown.insertAdjacentHTML(
          "beforeend",
          `<option value="${port}">${port}</option>`
        );
      });
      // If port not available then we need to add the port preference to the list.
      if (!portAvailable) {
        this.setPortAvailability(serialPortDropDown, portAvailable);
        serialPortDropDown.insertAdjacentHTML(
          "beforeend",
          `<option value="${currentPrinter?.connectionOptions?.portPreference}">${currentPrinter.connectionOptions.portPreference}</option>`
        );
      }
      if (currentPrinter?.connectionOptions?.portPreference === null) {
        serialPortDropDown.insertAdjacentHTML("afterbegin", NO_PREFERENCE);
      }
      currentPrinter?.connectionOptions?.printerProfiles.forEach((profile) => {
        profileDropDown.insertAdjacentHTML(
          "beforeend",
          `<option value="${profile.id}">${profile.name}</option>`
        );
      });
      if (currentPrinter.connectionOptions.printerProfilePreference === null) {
        profileDropDown.insertAdjacentHTML("afterbegin", NO_PREFERENCE);
      }
      if (!!currentPrinter.connectionOptions.baudratePreference) {
        baudrateDropdown.value =
          currentPrinter.connectionOptions.baudratePreference;
      } else {
        baudrateDropdown.value = 0;
      }
      if (!!currentPrinter?.connectionOptions?.portPreference) {
        serialPortDropDown.value =
          currentPrinter.connectionOptions.portPreference;
      } else {
        serialPortDropDown.value = 0;
      }
      if (!!currentPrinter.connectionOptions.printerProfilePreference) {
        profileDropDown.value =
          currentPrinter.connectionOptions.printerProfilePreference;
      } else {
        profileDropDown.value = 0;
      }
    } else {
      pageElements.mainPage.offlineMessage.innerHTML =
        "<div class=\"alert alert-danger\" role=\"alert\">" +
        "NOTE! Your printer is currently offline, any settings requiring an OctoPrint connection have been disabled... " +
        "Please turn on your OctoPrint instance to re-enabled these.</div>";
      baudrateDropdown.disabled = true;
      serialPortDropDown.disabled = true;
      profileDropDown.disabled = true;
    }
  }

  static setupCostTab() {
    console.log(currentPrinter.costSettings)
    document.getElementById("psPrinterCost").innerHTML = `
          <div class="col-6">
                 <h5>Operating Costs</h5>
                 <div class="form-group">
                  <label for="psPowerConsumption">Power Consumption</label>
                        <div class="input-group mb-2">
                              <input type="number" class="form-control" id="psPowerConsumption" placeholder="${currentPrinter.costSettings.powerConsumption}" step="0.01">
                              <div class="input-group-append">
                                   <div class="input-group-text">kW</div>
                              </div>
                        </div>
                  <small id="psPowerConsumptionNote" class="form-text text-muted">
                      The kW (kilowatt) usage of your printer.
                  </small>
                </div>
                <div class="form-group">
                  <label for="psElectricityCosts">Electricity Costs</label>
                       <div class="input-group mb-2">
                          <input type="number" class="form-control" id="psElectricityCosts" placeholder="${currentPrinter.costSettings.electricityCosts}" step="0.01">
                              <div class="input-group-append">
                                   <div class="input-group-text"></div>
                              </div>
                        </div>
                  <small id="psElectricityCostsNote" class="form-text text-muted">
                      What is your kWh (kilowatt hour) rate for your home electricity.
                  </small>
                </div>
          </div>
          <div class="col-6">
                  <h5>Printer Costs</h5>
                  <div class="form-group">
                    <label for="psPurchasePrice">Purchase Price</label>
                       <div class="input-group mb-2">
                          <input type="number" class="form-control" id="psPurchasePrice" placeholder="${currentPrinter.costSettings.purchasePrice}" step="0.01">
                              <div class="input-group-append">
                                   <div class="input-group-text"></div>
                              </div>
                        </div>

                    <small id="psPurchasePriceNote" class="form-text text-muted">
                        What did you buy your printer for?
                    </small>
                  </div>
                 
                  <div class="form-group">
                    <label for="psEstimatedLifespan">Estimated Life Span</label>
                         <div class="input-group mb-2">
                           <input type="number" class="form-control" id="psEstimatedLifespan" placeholder="${currentPrinter.costSettings.estimateLifespan}" step="0.01">
                              <div class="input-group-append">
                                   <div class="input-group-text">hours</div>
                              </div>
                        </div>
                    <small id="psPurchasePriceNote" class="form-text text-muted">
                        How many hours total do you expect your printer to last?
                    </small>
                  </div>
                  <div class="form-group">
                    <label for="psMaintenanceCosts">Maintenance Costs</label>
                         <div class="input-group mb-2">
                           <input type="number" class="form-control" id="psMaintenanceCosts" placeholder="${currentPrinter.costSettings.maintenanceCosts}" step="0.01">
                              <div class="input-group-append">
                                   <div class="input-group-text"><i class="fas fa-wrench"></i> / hour</div>
                              </div>
                        </div>
                    <small id="psMaintenanceCostsNote" class="form-text text-muted">
                        What are your printer maintenance costs? Worked out on an hourly basis.
                    </small>
                  </div>
          </div>
      `;
  }

  static setupProfileTab() {
    document.getElementById("psPrinterProfiles").innerHTML = `
          <div class="col-12 col-lg-4">
          <h5 class="mb-1"><u>Printer</u></h5>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">Profile Name: </span>
            </div>
            <input id="psProfileName" type="text" class="form-control" 
            placeholder="${currentPrinter.currentProfile.name}" aria-label="Username" aria-describedby="basic-addon1">
          </div>
          </p>
              <div class="input-group mb-3">
                <div class="input-group-prepend">
                  <span class="input-group-text">Printer Model: </span>
                </div>
                <input id="psPrinterModel" type="text" class="form-control" 
                placeholder="${currentPrinter.currentProfile.model}" aria-label="Username" 
                aria-describedby="basic-addon1">
              </div>
          </p>
          <h5 class="mb-1"><u>Axis</u></h5>
          <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                  <input type="checkbox" class="custom-control-input" id="psEInverted" required>
                  <label class="custom-control-label" for="psEInverted">E Inverted</label>
              </div>
          </form>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">E:</span>
            </div>
            <input id="psPrinterEAxis" type="number" class="form-control" 
            placeholder="${currentPrinter.currentProfile.axes.e.speed}" aria-label="Username" 
            aria-describedby="basic-addon1" step="1" min="0">
            <div class="input-group-append">
              <span class="input-group-text">mm/min</span>
            </div>
          </div>
          <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                  <input type="checkbox" class="custom-control-input" id="psXInverted" required>
                  <label class="custom-control-label" for="psXInverted">X Inverted</label>
              </div>
          </form>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">X:</span>
            </div>
            <input id="psPrinterXAxis" type="number" class="form-control" 
            placeholder="${currentPrinter.currentProfile.axes.x.speed}" aria-label="Username" aria-describedby="basic-addon1" step="1" min="0">
            <div class="input-group-append">
              <span class="input-group-text">mm/min</span>
            </div>
          </div>
          <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                  <input type="checkbox" class="custom-control-input" id="psYInverted" required>
                  <label class="custom-control-label" for="psYInverted">Y Inverted</label>
              </div>
          </form>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">Y:</span>
            </div>
            <input id="psPrinterYAxis" type="number" class="form-control" 
            placeholder="${currentPrinter.currentProfile.axes.y.speed}" aria-label="Username" aria-describedby="basic-addon1" step="1" min="0">
            <div class="input-group-append">
              <span class="input-group-text">mm/min</span>
            </div>
          </div>
          <form class="was-validated">
              <div class="custom-control custom-checkbox mb-3">
                  <input type="checkbox" class="custom-control-input" id="psZInverted" required>
                  <label class="custom-control-label" for="psZInverted">Z Inverted</label>
              </div>
          </form>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">Z:</span>
            </div>
            <input id="psPrinterZAxis" type="number" class="form-control" 
            placeholder="${currentPrinter.currentProfile.axes.z.speed}" aria-label="Username" aria-describedby="basic-addon1" step="1" min="0">
            <div class="input-group-append">
              <span class="input-group-text">mm/min</span>
            </div>
          </div>
          </div>
          <div class="col-12 col-lg-4">
          <h5 class="mb-1"><u>Extrusion</u></h5>
          <p class="mb-0"><span><form class="was-validated">
                                      <div class="custom-control custom-checkbox mb-3">
                                          <input type="checkbox" class="custom-control-input" id="psSharedNozzle" required>
                                          <label class="custom-control-label" for="psSharedNozzle">Shared Nozzle</label>
                                      </div>
                                  </form></span></p>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">Extruder Count:</span>
            </div>
            <input id="psExtruderCount" type="number" class="form-control" 
            placeholder="${currentPrinter?.currentProfile?.extruder?.count}" aria-label="Username" 
            aria-describedby="basic-addon1" step="1" min="1">
          </div>
           <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">Nozzle Size:</span>
            </div>
            <input id="psNozzleDiameter" type="number" class="form-control" 
            placeholder="${currentPrinter?.currentProfile?.extruder?.nozzleDiameter}" 
            aria-label="Username" aria-describedby="basic-addon1" step="0.1" min="0.1">
          </div>
          </div>
          <div class="col-12 col-lg-4">
                      <h5 class="mb-1"><u>Bed / Chamber</u></h5>
         <p class="mb-1"><form class="was-validated">
                                              <div class="custom-control custom-checkbox mb-3">
                                                  <input type="checkbox" class="custom-control-input" id="psHeatedBed" required>
                                                  <label class="custom-control-label" for="psHeatedBed">Heated Bed</label>
                                              </div>
                                          </form></span></p>
      <p class="mb-1"><form class="was-validated">
                                              <div class="custom-control custom-checkbox mb-3">
                                                  <input type="checkbox" class="custom-control-input" id="psHeatedChamber" required>
                                                  <label class="custom-control-label" for="psHeatedChamber">Heated Chamber</label>
                                              </div>
                                          </form></span></p>
          <h5 class="mb-1"><u>Dimensions</u></h5>
            <div class="input-group mb-3">
            <div class="input-group-prepend">
              <label class="input-group-text" for="extruderFormFactor">Form Factor:</label>
            </div>
            <select class="custom-select" id="extruderFormFactor">
              <option value="rectangular">Rectangular</option>
              <option value="circular">Circular</option>
            </select>
          </div>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">D:</span>
            </div>
            <input id="psVolumeDepth" type="number" class="form-control" placeholder="${currentPrinter.currentProfile.volume.depth}" 
            aria-label="Username" aria-describedby="basic-addon1" step="1" min="1">
            <div class="input-group-append">
              <span class="input-group-text">mm</span>
            </div>
          </div>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">H:</span>
            </div>
            <input id="psVolumeHeight" type="number" class="form-control" placeholder="${currentPrinter.currentProfile.volume.height}" 
            aria-label="Username" aria-describedby="basic-addon1" step="1" min="1">
            <div class="input-group-append">
              <span class="input-group-text">mm</span>
            </div>
          </div>
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text">W:</span>
            </div>
            <input id="psVolumeWidth" type="number" class="form-control" 
            placeholder="${currentPrinter.currentProfile.volume.width}" 
            aria-label="Username" aria-describedby="basic-addon1" step="1" min="1">
            <div class="input-group-append">
              <span class="input-group-text">mm</span>
            </div>
          </div>
          </div>
      `;
    document.getElementById("extruderFormFactor").value =
      currentPrinter.currentProfile.volume.formFactor;
    document.getElementById("psEInverted").checked =
      currentPrinter.currentProfile.axes.e.inverted;
    document.getElementById("psXInverted").checked =
      currentPrinter.currentProfile.axes.x.inverted;
    document.getElementById("psYInverted").checked =
      currentPrinter.currentProfile.axes.y.inverted;
    document.getElementById("psZInverted").checked =
      currentPrinter.currentProfile.axes.z.inverted;
    document.getElementById("psSharedNozzle").checked =
      currentPrinter.currentProfile.extruder.sharedNozzle;
    document.getElementById("psHeatedBed").checked =
      currentPrinter.currentProfile.heatedBed;
    document.getElementById("psHeatedChamber").checked =
      currentPrinter.currentProfile.heatedChamber;
  }

  static setupPowerTab() {
    let serverRestart = "N/A";
    let systemRestart = "N/A";
    let systemShutdown = "N/A";
    if (printerOnline && !!currentPrinter.otherSettings) {
      if (
        currentPrinter.otherSettings.system.commands.serverRestartCommand !== ""
      ) {
        serverRestart =
          currentPrinter.otherSettings.system.commands.serverRestartCommand;
      }
      if (
        currentPrinter.otherSettings.system.commands.systemRestartCommand !== ""
      ) {
        systemRestart =
          currentPrinter.otherSettings.system.commands.systemRestartCommand;
      }
      if (
        currentPrinter.otherSettings.system.commands.systemShutdownCommand !==
        ""
      ) {
        systemShutdown =
          currentPrinter.otherSettings.system.commands.systemShutdownCommand;
      }
    }

    let wolEnable = false;
    let wolIP = "255.255.255.255";
    let wolPort = "9";
    let wolInterval = "100";
    let wolCount = "3";
    let wolMAC = "";
    const currentWolSubsettings = currentPrinter?.powerSettings?.wol;
    if (!!currentWolSubsettings) {
      wolEnable = currentWolSubsettings.enabled;
      wolIP = currentWolSubsettings.ip;
      wolPort = currentWolSubsettings.port;
      wolInterval = currentWolSubsettings.interval;
      wolCount = currentWolSubsettings.packets;
      wolMAC = currentWolSubsettings.MAC;
    }

    // disable OctoPrint specific elements when offline
    let disabledElement = "disabled";
    if (printerOnline) {
      disabledElement = "";
    }

    document.getElementById("psPowerCommands").innerHTML = `
      <h5><u>OctoPrint Specific Power Commands</u></h5>
      <form>
        <div class="form-group">
          <label for="psServerRestart">OctoPrint Server Restart</label>
          <input type="text" class="form-control" id="psServerRestart" placeholder="${serverRestart}" ${disabledElement}>
          <small id="passwordHelpBlock" class="form-text text-muted">
              Usually your OctoPrint hosts server restart command. i.e: <code>sudo service octoprint restart</code>
          </small>
        </div>
        <div class="form-group">
          <label for="psSystemRestart">OctoPrint System Restart</label>
          <input type="text" class="form-control" id="psSystemRestart" placeholder="${systemRestart}" ${disabledElement}>
          <small id="passwordHelpBlock" class="form-text text-muted">
             Usually your OctoPrint hosts system restart command. i.e: <code>sudo shutdown -r now</code>
          </small>
        </div>
        <div class="form-group">
          <label for="psSystemShutdown">OctoPrint System Shutdown</label>
          <input type="text" class="form-control" id="psSystemShutdown" placeholder="${systemShutdown}" ${disabledElement}>
          <small id="passwordHelpBlock" class="form-text text-muted">
            Usually your OctoPrint hosts system shutdown command. i.e: <code>sudo shutdown -h now</code>
          </small>
        </div>
        <h5 class="d-none"><u>Wake On Lan</u></h5>
        <small class="d-none">Enable and setup the ability for OctoFarm to fire a wake on lan packet to your client. Client MUST support wake on lan for this to work.</small>
      <form class="was-validated">
        <div class="d-none  custom-control custom-checkbox mb-3">
            <input type="checkbox" class="custom-control-input" id="psWolEnable" required>
            <label class="custom-control-label" for="wolEnable">Enable wake on lan</label>
            <div class="invalid-feedback">Wake on Lan support disabled</div>
            <div class="valid-feedback">Wake on Lan support enabled</div>
        </div>
      </form>
       <div class="form-row d-none">
          <div class="col-2">
            <input id="psWolMAC"  type="text" class="form-control" placeholder="${wolMAC}" value="">
             <small class="form-text text-muted">
                  MAC Address to target wake packet sending
             </small>
          </div>
          <div class="col-2">
            <input id="psWolIP"  type="text" class="form-control" placeholder="${wolIP}" value="">
             <small class="form-text text-muted">
                  Broadcast Address to send wake packet too. <code>(255.255.255.255)</code>
             </small>
          </div>
          <div class="col-2">
            <input id="psWolPort"  type="text" class="form-control" placeholder="${wolPort}" value="">
             <small class="form-text text-muted">
              Port to send wake packet too.  <code>(Default: 9)</code>
             </small>
          </div>
          <div class="col-2">
            <input id="psWolInterval"  type="text" class="form-control" placeholder="${wolInterval}" value="">
             <small class="form-text text-muted">
                  Interval between packets. <code>(Default: 100)</code>
             </small>
          </div>
          <div class="col-2">
            <input id="psWolCount"  type="text" class="form-control" placeholder="${wolCount}" value="">
             <small class="form-text text-muted">
              Amount of packets to send.  <code>(Default: 3)</code>
             </small>
          </div>
        </div>
        <hr>
        <h5><u>Custom Power Commands</u></h5>
        <p class="mb-0">Custom power commands is designed to work with all available plugins, and also custom API endpoints.</p>
        <p class="mb-0">If your endpoint requires url params, and not an object then please leave the command boxes empty.</p>
        <p class="mb-0">Alternatively they will accept a command in the form of a json object. You can find sample setups at 
        <a type=”noopener” href="https://docs.octofarm.net/getting-started/octoprint-supported-plugins.html#octoprint-s-power-control-plugins">
        OctoFarm Documentation</a></p>
        <p class="mb-0">Printer URL: <code>[PrinterURL]</code></p>
        <p class="mb-0">Printer API-KEY: <code>[PrinterAPI]</code></p>
        
        <h6>Power On</h6>
         <div class="form-row">
            <div class="col-4">
              <input id="psPowerOnCommand"  type="text" class="form-control" placeholder="Command">
               <small class="form-text text-muted">
                This is usually an json object supplied in the following format <code>{"command":"turnPSUOn"}</code>
               </small>
            </div>
            <div class="col-8">
              <input id="psPowerOnURL"  type="text" class="form-control" placeholder="URL">
               <small class="form-text text-muted">
                The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
               </small>
            </div>
          </div>
         <h6>Power Off</h6>
          <div class="form-row">
            <div class="col-4">
              <input id="psPowerOffCommand" type="text" class="form-control" placeholder="Command">
               <small class="form-text text-muted">
                 This is usually an json object supplied in the following format <code>{"command":"turnPSUOff"}</code>
               </small>
            </div>
            <div class="col-8">
              <input  id="psPowerOffURL" type="text" class="form-control" placeholder="URL">
               <small class="form-text text-muted">
                 The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
               </small>
            </div>
          </div>
          <h6>Power Status</h6>
          <p class="mb-0">This must return a boolean value to work properly. When you enter this in your printer will show it's power state on the power button icon.</p>
          <div class="form-row">
            <div class="col-4">
              <input id="psPowerStateCommand" type="text" class="form-control" placeholder="Command">
               <small class="form-text text-muted">
                 This is usually an json object supplied in the following format <code>{"command":"getPSUState"}</code>
               </small>
            </div>
            <div class="col-8">
              <input id="psPowerStateURL" type="text" class="form-control" placeholder="URL">
               <small class="form-text text-muted">
                  The URL endpoint you would like to make the request too. <code>[PrinterURL]/api/plugin/psucontrol</code>
               </small>
            </div>
          </div>
      </form>
      `;
    document.getElementById("psWolEnable").checked = wolEnable;
    if (serverRestart !== "N/A") {
      document.getElementById("psServerRestart").placeholder = serverRestart;
    }
    if (systemRestart !== "N/A") {
      document.getElementById("psSystemRestart").placeholder = systemRestart;
    }
    if (systemShutdown !== "N/A") {
      document.getElementById("psSystemShutdown").placeholder = systemShutdown;
    }
    if (
      currentPrinter.powerSettings &&
      !_.isEmpty(currentPrinter.powerSettings)
    ) {
      document.getElementById("psPowerOnCommand").placeholder =
        currentPrinter.powerSettings.powerOnCommand;
      document.getElementById("psPowerOnURL").placeholder =
        currentPrinter.powerSettings.powerOnURL;
      document.getElementById("psPowerOffCommand").placeholder =
        currentPrinter.powerSettings.powerOffCommand;
      document.getElementById("psPowerOffURL").placeholder =
        currentPrinter.powerSettings.powerOffURL;
      document.getElementById("psPowerStateCommand").placeholder =
        currentPrinter.powerSettings.powerStatusCommand;
      document.getElementById("psPowerStateURL").placeholder =
        currentPrinter.powerSettings.powerStatusURL;
    }
  }

  static async setupAlertsTab() {
    const scripts = await OctoFarmClient.get("scripts/get");
    const printerScripts = [];
    scripts.alerts.forEach((script) => {
      if (
        script.printer === currentPrinter._id ||
        script.printer.length === 0
      ) {
        printerScripts.push({
          _id: script._id,
          active: script.active,
          message: script.message,
          scriptLocation: script.scriptLocation,
          trigger: script.trigger,
        });
      }
    });

    const alertsTable = document.getElementById("printerAltersTableBody");
    alertsTable.innerHTML = "";
    printerScripts.forEach(async (s) => {
      alertsTable.insertAdjacentHTML(
        "beforeend",
        `
            <tr>
              <td>
              <form class="was-validated">
                    <div class="custom-control custom-checkbox mb-3">
                          <input type="checkbox" class="custom-control-input" id="activePrinter-${s._id}" required="">
                          <label class="custom-control-label" for="activePrinter-${s._id}"></label>
                      </div>
                  </form>
              </td>
              <td>
              <select class="custom-select" id="triggerPrinter-${s._id}" disabled>
               </select>
                     </td>
              <td>${s.scriptLocation} </td>
              <td>${s.message}</td>
            </tr>

        `
      );
      document.getElementById(`activePrinter-${s._id}`).checked = s.active;
      const triggerSelect = document.getElementById(`triggerPrinter-${s._id}`);
      triggerSelect.innerHTML = await Script.alertsDrop();
      triggerSelect.value = s.trigger;
    });
  }

  static setupGcodeTab() {
    let afterPrintCancelled = "";
    if (
      typeof currentPrinter.gcodeScripts.afterPrintCancelled !== "undefined"
    ) {
      afterPrintCancelled = currentPrinter.gcodeScripts.afterPrintCancelled;
    }
    let afterPrintDone = "";
    if (typeof currentPrinter.gcodeScripts.afterPrintDone !== "undefined") {
      afterPrintDone = currentPrinter.gcodeScripts.afterPrintDone;
    }
    let afterPrintPaused = "";
    if (typeof currentPrinter.gcodeScripts.afterPrintPaused !== "undefined") {
      afterPrintPaused = currentPrinter.gcodeScripts.afterPrintPaused;
    }
    let afterPrinterConnected = "";
    if (
      typeof currentPrinter.gcodeScripts.afterPrinterConnected !== "undefined"
    ) {
      afterPrinterConnected = currentPrinter.gcodeScripts.afterPrinterConnected;
    }
    let beforePrintResumed = "";
    if (typeof currentPrinter.gcodeScripts.beforePrintResumed !== "undefined") {
      beforePrintResumed = currentPrinter.gcodeScripts.beforePrintResumed;
    }
    let afterToolChange = "";
    if (typeof currentPrinter.gcodeScripts.afterToolChange !== "undefined") {
      afterToolChange = currentPrinter.gcodeScripts.afterToolChange;
    }
    let beforePrintStarted = "";
    if (typeof currentPrinter.gcodeScripts.beforePrintStarted !== "undefined") {
      beforePrintStarted = currentPrinter.gcodeScripts.beforePrintStarted;
    }
    let beforePrinterDisconnected = "";
    if (
      typeof currentPrinter.gcodeScripts.beforePrinterDisconnected !==
      "undefined"
    ) {
      beforePrinterDisconnected =
        currentPrinter.gcodeScripts.beforePrinterDisconnected;
    }
    let beforeToolChange = "";
    if (typeof currentPrinter.gcodeScripts.beforeToolChange !== "undefined") {
      beforeToolChange = currentPrinter.gcodeScripts.beforeToolChange;
    }
    document.getElementById("psGcodeManagerGcode").innerHTML = `
            <div class="form-group">
            <label for="psSettingsAfterPrinterCancelled">After Printing Cancelled</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsAfterPrinterCancelled" rows="2" placeholder="${afterPrintCancelled}"></textarea>
            <small>Anything you put here will be executed after any lines in your files.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsAfterPrinterDone">After Printing Done</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsAfterPrinterDone" rows="2" placeholder="${afterPrintDone}"></textarea>
             <small>Anything you put here will be executed after any lines in your files.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsAfterPrinterPaused">After Printing Paused</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsAfterPrinterPaused" rows="2" placeholder="${afterPrintPaused}"></textarea>
             <small>Anything you put here will be executed after any lines in your files.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsAfterPrinterConnected">After Printer Connected</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsAfterPrinterConnected" rows="2" placeholder="${afterPrinterConnected}"></textarea>
             <small> Anything you put here will only be executed after the printer has established a connection.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsAfterToolChange">After Tool Change</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsAfterToolChange" rows="2" placeholder="${afterToolChange}"></textarea>
             <small>Anything you put here will be executed after any tool change commands <code>Tn</code>.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsBeforePrinterResumed">Before Printing Resumed</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsBeforePrinterResumed" rows="2" placeholder="${beforePrintResumed}"></textarea>
             <small>Anything you put here will be executed before any lines in your files.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsBeforePrinterStarted">Before Printing Started</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsBeforePrinterStarted" rows="2" placeholder="${beforePrintStarted}"></textarea>
             <small>Anything you put here will be executed before any lines in your files.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsBeforePrinterDisconnected">Before Printer Disconnected</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsBeforePrinterDisconnected" rows="2" placeholder="${beforePrinterDisconnected}"></textarea>
             <small> Anything you put here will only be executed when closing the connection 
             actively. If the connection to the printer is suddenly lost nothing will be sent.</small>
            </div>
            <div class="form-group">
            <label for="psSettingsBeforeToolChange">Before Tool Change</label>
            <textarea class="form-control bg-dark text-white" id="psSettingsBeforeToolChange" rows="2" placeholder="${beforeToolChange}"></textarea>
             <small>Anything you put here will be executed before any tool change commands <code>Tn</code>.</small>
            </div>
      `;
  }

  static setupCameraTab() {
    document.getElementById("cameraRotation").innerHTML = `
      <form class="was-validated">
      <div class="custom-control custom-checkbox mb-3">
          <input type="checkbox" class="custom-control-input" id="camEnabled" required>
          <label class="custom-control-label" for="camEnabled">Enable Web Camera</label>
      </div>
      </form>
      <form class="was-validated">
      <div class="custom-control custom-checkbox mb-3">
          <input type="checkbox" class="custom-control-input" id="camRot90" required>
          <label class="custom-control-label" for="camRot90">Rotate your camera by 90°</label>
      </div>
      </form>
      <form class="was-validated">
      <div class="custom-control custom-checkbox mb-3">
          <input type="checkbox" class="custom-control-input" id="camFlipH" required>
          <label class="custom-control-label" for="camFlipH">Flip your camera horizontally</label>
      </div>
      </form>
      <form class="was-validated">
      <div class="custom-control custom-checkbox mb-3">
          <input type="checkbox" class="custom-control-input" id="camFlipV" required>
          <label class="custom-control-label" for="camFlipV">Flip your camera vertically</label>
      </div>
      </form>
      <form class="was-validated">
      <div class="custom-control custom-checkbox mb-3">
          <input type="checkbox" class="custom-control-input" id="camTimelapse" required>
          <label class="custom-control-label" for="camTimelapse">Enable Time lapse</label>
      </div>
      </form>
    `;

    document.getElementById("camEnabled").checked =
      currentPrinter.otherSettings.webCamSettings.webcamEnabled;
    document.getElementById("camTimelapse").checked =
      currentPrinter.otherSettings.webCamSettings.timelapseEnabled;
    document.getElementById("camRot90").checked =
      currentPrinter.otherSettings.webCamSettings.rotate90;
    document.getElementById("camFlipH").checked =
      currentPrinter.otherSettings.webCamSettings.flipH;
    document.getElementById("camFlipV").checked =
      currentPrinter.otherSettings.webCamSettings.flipV;
  }
  static setupTriggersTab() {
    document.getElementById("tempTriggers").innerHTML = `
         <div class="form-group">
            <label for="headtingVariation">Heating Variation</label>
            <input type="number" class="form-control" id="psHeatingVariation" placeholder="${currentPrinter.otherSettings.temperatureTriggers.heatingVariation}" step="0.01">
            <small class="form-text text-muted">
                What temperature variation will trigger orange warning on the temperature display when a printer is Active. <code>Default is 1°C</code>
            </small>
          </div>
          <div class="form-group">
            <label for="coolDown">Cool Down Trigger</label>
            <input type="number" class="form-control" id="psCoolDown" placeholder="${currentPrinter.otherSettings.temperatureTriggers.coolDown}" step="0.01">
            <small class="form-text text-muted">
                What temperature limit will trigger the blue status on the temperature display when a printer is Complete and cooling down. <code>Default is 30°C</code>
            </small>
          </div>
      `;
  }

  static async setupSaveButton() {
    pageElements.menu.printerMenuFooter.insertAdjacentHTML(
      "beforeend",
      "<button id=\"savePrinterSettingsBtn\" type=\"button\" class=\"btn btn-success btn-block\">Save Settings</button>"
    );

    document
      .getElementById("savePrinterSettingsBtn")
      .addEventListener("click", async (event) => {
        UI.addLoaderToElementsInnerHTML(event.target);
        const printerSettingsValues = this.getPageValues(currentPrinter);
        const updatedSettings = await OctoFarmClient.post(
          "printers/updateSettings",
          printerSettingsValues
        );
        const serverResponseMessage =
          this.createServerResponseMessageForSaveAction(
            currentPrinter.printerName,
            updatedSettings
          );
        UI.createAlert("info", serverResponseMessage, 5000, "clicked");
        await updatePrinterSettingsModal(
          currentPrintersInformation,
          currentPrinter._id
        );
        UI.removeLoaderFromElementInnerHTML(event.target);
      });
  }

  static async setupRefreshButton() {
    pageElements.menu.printerMenuFooter.innerHTML = "";
    pageElements.menu.printerMenuFooter.insertAdjacentHTML(
      "beforeend",
      "<button id=\"settingsPageRefreshButton\" type=\"button\" class=\"btn btn-warning btn-block mt-2\">Refresh Settings</button>"
    );

    document
      .getElementById("settingsPageRefreshButton")
      .addEventListener("click", async (event) => {
        UI.addLoaderToElementsInnerHTML(event.target);
        await updatePrinterSettingsModal(
          currentPrintersInformation,
          currentPrinter._id
        );
        UI.createAlert(
          "success",
          "Successfully reloaded your OctoPrint Settings",
          3000,
          "clicked"
        );
        UI.removeLoaderFromElementInnerHTML(event.target);
      });
  }

  static createServerResponseMessageForSaveAction(
    currentPrinterName,
    response
  ) {
    let serverResponseMessage = `${currentPrinterName}: Settings Saved <br>`;

    if (response.status.octofarm === 200) {
      serverResponseMessage +=
        "<i class=\"fas fa-check-circle text-success\"></i> OctoFarm<br>";
    } else {
      serverResponseMessage +=
        "<i class=\"fas fa-exclamation-circle text-danger\"></i> OctoFarm<br>";
    }
    if (response.status.profile === 200) {
      serverResponseMessage +=
        "<i class=\"fas fa-check-circle text-success\"></i> OctoPrint Profile<br>";
    } else {
      serverResponseMessage +=
        "<i class=\"fas fa-exclamation-circle text-danger\"></i> OctoPrint Profile<br>";
    }
    if (response.status.settings === 200) {
      serverResponseMessage +=
        "<i class=\"fas fa-check-circle text-success\"></i> OctoPrint Settings <br>";
    } else {
      serverResponseMessage +=
        "<i class=\"fas fa-exclamation-circle text-danger\"></i> OctoPrint Profile <br>";
    }

    return serverResponseMessage;
  }

  static getPageValues() {
    const newPrinterSettingsValues = {
      printer: {
        index: currentPrinter._id,
      },
      connection: {
        preferredPort: UI.getValueOrPlaceHolder(
          document.getElementById("psDefaultSerialPort")
        ),
        preferredBaud: UI.getValueOrPlaceHolder(
          document.getElementById("psDefaultBaudrate")
        ),
        preferredProfile: UI.getValueOrPlaceHolder(
          document.getElementById("psDefaultProfile")
        ),
      },
      systemCommands: {
        serverRestart: UI.getValueOrPlaceHolder(
          document.getElementById("psServerRestart")
        ),
        systemRestart: UI.getValueOrPlaceHolder(
          document.getElementById("psSystemRestart")
        ),
        systemShutdown: UI.getValueOrPlaceHolder(
          document.getElementById("psSystemShutdown")
        ),
      },
      quickConnectSettings: {
        connectPrinter: document.getElementById("psQuickConnect").checked,
        powerPrinter: document.getElementById("psQuickPower").checked,
        preHeat: false,
        connectAfterPowerTimeout: UI.getValueOrPlaceHolder(document.getElementById("psQuickConnectTimeout")) * 1000,
        powerAfterDisconnectTimeout: UI.getValueOrPlaceHolder(document.getElementById("psQuickPowerTimeout")) * 1000
      },
      powerCommands: {
        powerOnCommand: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerOnCommand")
        ),
        powerOnURL: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerOnURL")
        ),
        powerOffCommand: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerOffCommand")
        ),
        powerOffURL: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerOffURL")
        ),
        powerStatusCommand: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerStateCommand")
        ),
        powerStatusURL: UI.getValueOrPlaceHolder(
          document.getElementById("psPowerStateURL")
        ),
        wol: {
          enabled: document.getElementById("psWolEnable").checked,
          ip: UI.getValueOrPlaceHolder(document.getElementById("psWolIP")),
          port: UI.getValueOrPlaceHolder(document.getElementById("psWolPort")),
          interval: UI.getValueOrPlaceHolder(
            document.getElementById("psWolInterval")
          ),
          packets: UI.getValueOrPlaceHolder(
            document.getElementById("psWolCount")
          ),
          MAC: UI.getValueOrPlaceHolder(document.getElementById("psWolMAC")),
        },
      },
      costSettings: {
        powerConsumption: parseFloat(
          UI.getValueOrPlaceHolder(
            document.getElementById("psPowerConsumption")
          )
        ),
        electricityCosts: parseFloat(
          UI.getValueOrPlaceHolder(
            document.getElementById("psElectricityCosts")
          )
        ),
        purchasePrice: parseFloat(
          UI.getValueOrPlaceHolder(document.getElementById("psPurchasePrice"))
        ),
        estimateLifespan: parseFloat(
          UI.getValueOrPlaceHolder(
            document.getElementById("psEstimatedLifespan")
          )
        ),
        maintenanceCosts: parseFloat(
          UI.getValueOrPlaceHolder(
            document.getElementById("psMaintenanceCosts")
          )
        ),
      },
    };
    if (printerOnline) {
      let printerName = UI.getValueOrPlaceHolder(
        document.getElementById("psProfileName")
      );
      let printerModel = UI.getValueOrPlaceHolder(
        document.getElementById("psPrinterModel")
      );
      if (printerName === "") {
        printerName = null;
      }
      if (printerModel === "") {
        printerModel = null;
      }
      newPrinterSettingsValues.profileID = currentPrinter.currentProfile.id;
      newPrinterSettingsValues.profile = {
        name: printerName,
        model: printerModel,
        volume: {
          formFactor: UI.getValueOrPlaceHolder(
            document.getElementById("extruderFormFactor")
          ),
          width: parseInt(
            UI.getValueOrPlaceHolder(document.getElementById("psVolumeWidth"))
          ),
          depth: parseInt(
            UI.getValueOrPlaceHolder(document.getElementById("psVolumeDepth"))
          ),
          height: parseInt(
            UI.getValueOrPlaceHolder(document.getElementById("psVolumeHeight"))
          ),
        },
        heatedBed: document.getElementById("psHeatedBed").checked,
        heatedChamber: document.getElementById("psHeatedChamber").checked,
        axes: {
          x: {
            speed: parseInt(
              UI.getValueOrPlaceHolder(
                document.getElementById("psPrinterXAxis")
              )
            ),
            inverted: document.getElementById("psXInverted").checked,
          },
          y: {
            speed: parseInt(
              UI.getValueOrPlaceHolder(
                document.getElementById("psPrinterYAxis")
              )
            ),
            inverted: document.getElementById("psYInverted").checked,
          },
          z: {
            speed: parseInt(
              UI.getValueOrPlaceHolder(
                document.getElementById("psPrinterZAxis")
              )
            ),
            inverted: document.getElementById("psZInverted").checked,
          },
          e: {
            speed: parseInt(
              UI.getValueOrPlaceHolder(
                document.getElementById("psPrinterEAxis")
              )
            ),
            inverted: document.getElementById("psEInverted").checked,
          },
        },
        extruder: {
          count: parseInt(
            UI.getValueOrPlaceHolder(document.getElementById("psExtruderCount"))
          ),
          nozzleDiameter: parseFloat(
            UI.getValueOrPlaceHolder(
              document.getElementById("psNozzleDiameter")
            )
          ),
          sharedNozzle: document.getElementById("psSharedNozzle").checked,
        },
      };
      newPrinterSettingsValues.gcode = {
        afterPrintCancelled: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsAfterPrinterCancelled")
        ),
        afterPrintDone: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsAfterPrinterDone")
        ),
        afterPrintPaused: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsAfterPrinterPaused")
        ),
        afterPrinterConnected: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsAfterPrinterConnected")
        ),
        afterToolChange: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsAfterToolChange")
        ),
        beforePrintResumed: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsBeforePrinterResumed")
        ),
        beforePrintStarted: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsBeforePrinterStarted")
        ),
        beforePrinterDisconnected: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsBeforePrinterDisconnected")
        ),
        beforeToolChange: UI.getValueOrPlaceHolder(
          document.getElementById("psSettingsBeforeToolChange")
        ),
      };
      newPrinterSettingsValues.other = {
        enableCamera: document.getElementById("camEnabled").checked,
        rotateCamera: document.getElementById("camRot90").checked,
        flipHCamera: document.getElementById("camFlipH").checked,
        flipVCamera: document.getElementById("camFlipV").checked,
        enableTimeLapse: document.getElementById("camTimelapse").checked,
        heatingVariation: UI.getValueOrPlaceHolder(
          document.getElementById("psHeatingVariation")
        ),
        coolDown: UI.getValueOrPlaceHolder(
          document.getElementById("psCoolDown")
        ),
      };
    }
    return newPrinterSettingsValues;
  }

  // Will move this to it's own file and do a require when enabled in the printer modal. May move the whole connection dropdown there thinking about it.
  static setPortAvailability(serialPortDropDownElement, available) {
    if (available) {
      pageElements.connectPage.portNotAvailableMessage.innerHTML = "";
      serialPortDropDownElement.classList =
        "custom-select bg-secondary text-light";
    } else {
      pageElements.connectPage.portNotAvailableMessage.innerHTML =
        "<div class=\"alert alert-danger\" role=\"alert\">Your port preference is not available... Is your printer turned on? " +
        "Please click the refresh button once the issue is rectified</div>";
      serialPortDropDownElement.classList = "custom-select bg-danger";
    }
  }

  static enablePanel(element) {
    if (element.classList.contains("notyet")) {
      element.classList.remove("notyet");
    }
    UI.removeLoaderFromElementInnerHTML(element);
  }

  static disablePanel(element) {
    if (element.classList.contains("notyet")) {
      element.classList.remove("notyet");
    }
  }

  static checkPortIsAvailable(portList, portPreference) {
    // If port preference is null, then we have no preference from OctoPrint so no need to check if available
    if (portPreference === null) {
      return true;
    }
    return !!portList.includes(portPreference);
  }

  static grabPageElements() {
    if (!pageElements) {
      pageElements = {
        mainPage: {
          offlineMessage: document.getElementById("offlineMessage"),
          title: document.getElementById("printerSettingsTitle"),
          status: document.getElementById("psStatus"),
          host: document.getElementById("psHost"),
          socket: document.getElementById("psWebSocket"),
        },
        connectPage: {
          printerPort: document.getElementById("printerPortDrop"),
          printerBaud: document.getElementById("printerBaudDrop"),
          printerProfile: document.getElementById("printerProfileDrop"),
          printerConnect: document.getElementById("printerConnect"),
          portDropDown: document.getElementById("psSerialPort"),
          baudDropDown: document.getElementById("psBaudrate"),
          apiCheck: document.getElementById("apiCheck"),
          filesCheck: document.getElementById("filesCheck"),
          stateCheck: document.getElementById("stateCheck"),
          profileCheck: document.getElementById("profileCheck"),
          settingsCheck: document.getElementById("settingsCheck"),
          systemCheck: document.getElementById("systemCheck"),
          systemInfoCheck: document.getElementById("systemInfoCheck"),
          pluginsCheck: document.getElementById("pluginsCheck"),
          updatesCheck: document.getElementById("updatesCheck"),
          portNotAvailableMessage: document.getElementById(
            "portNotAvailableMessage"
          ),
        },
        menu: {
          printerConnectionBtn: document.getElementById(
            "printer-connection-btn"
          ),
          printerCostBtn: document.getElementById("printer-cost-btn"),
          printerProfileBtn: document.getElementById("printer-profile-btn"),
          printerPowerBtn: document.getElementById("printer-power-btn"),
          printerAlertsBtn: document.getElementById("printer-alerts-btn"),
          printerGcodeBtn: document.getElementById("printer-gcode-btn"),
          printerSettingsBtn: document.getElementById("printer-settings-btn"),
          printerCameraSettingsBtn: document.getElementById(
            "printer-settings-btn"
          ),
          printerTriggerSettingsBtn: document.getElementById(
            "printer-trigger-btn"
          ),
          printerMenuFooter: document.getElementById("printerSettingsFooter"),
        },
      };
    }
  }

  static updateStateElements() {
    if (isNaN(currentPrinterIndex)) {
      // Disable the entire page as this is a major failure!
      Object.values(pageElements.menu).map((e) => {
        this.disablePanel(e);
      });
      throw new ApplicationError(ClientErrors.FAILED_STATE_UPDATE);
    }
    if (!currentPrinter) {
      return;
    }
    pageElements.mainPage.title.innerHTML = `Printer Settings: ${currentPrinter?.printerName}`;
    pageElements.mainPage.status.innerHTML = `<b>Printer Status</b><br>${currentPrinter?.printerState?.state}`;
    pageElements.mainPage.status.className = `btn btn-${currentPrinter?.printerState?.colour?.name} mb-1 btn-block`;
    pageElements.mainPage.host.innerHTML = `<b>Host Status</b><br>${currentPrinter?.hostState?.state}`;
    pageElements.mainPage.host.className = `btn btn-${currentPrinter?.hostState.colour.name} mb-1 btn-block`;
    pageElements.mainPage.socket.innerHTML = `<b>WebSocket Status</b><br>${currentPrinter.webSocketState.desc}`;
    pageElements.mainPage.socket.className = `btn btn-${currentPrinter.webSocketState.colour} mb-1 btn-block`;

    pageElements.connectPage.apiCheck.innerHTML = `<i class="fas fa-users"></i> <b>Users Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.users.date
    )}`;
    pageElements.connectPage.apiCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.users.status} mb-1 btn-block`;
    pageElements.connectPage.filesCheck.innerHTML = `<i class="fas fa-file-code"></i> <b>Files Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.files.date
    )}`;
    pageElements.connectPage.filesCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.files.status} mb-1 btn-block`;
    pageElements.connectPage.stateCheck.innerHTML = `<i class="fas fa-info-circle"></i> <b>State Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.state.date
    )}`;
    pageElements.connectPage.stateCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.state.status} mb-1 btn-block`;
    pageElements.connectPage.profileCheck.innerHTML = `<i class="fas fa-id-card"></i> <b>Profile Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.profile.date
    )}`;
    pageElements.connectPage.profileCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.profile.status} mb-1 btn-block`;
    pageElements.connectPage.settingsCheck.innerHTML = `<i class="fas fa-cog"></i> <b>Settings Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.settings.date
    )}`;
    pageElements.connectPage.settingsCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.settings.status} mb-1 btn-block`;
    pageElements.connectPage.systemCheck.innerHTML = `<i class="fas fa-server"></i> <b>System Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.system.date
    )}`;
    pageElements.connectPage.systemCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.system.status} mb-1 btn-block`;

    pageElements.connectPage.systemInfoCheck.innerHTML = `<i class="fas fa-question-circle"></i> <b>System Info Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.systemInfo.date
    )}`;
    pageElements.connectPage.systemInfoCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.systemInfo.status} mb-1 btn-block`;
    if (currentPrinter?.octoPrintVersion?.includes("1.4")) {
      pageElements.connectPage.systemInfoCheck.disabled = true;
      pageElements.connectPage.systemInfoCheck.innerHTML =
        "<i class=\"fas fa-question-circle\"></i> <b>System Info Check</b><br><b>Never Checked: </b>  - version not supported!";
    }

    pageElements.connectPage.pluginsCheck.innerHTML = `<i class="fas fa-plug"></i> <b>Plugins Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.plugins.date
    )}`;
    pageElements.connectPage.pluginsCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.plugins.status} mb-1 btn-block`;

    pageElements.connectPage.updatesCheck.innerHTML = `<i class="fas fa-wrench"></i> <b>Updates Check</b><br><b>Last Checked: </b>${Calc.dateClean(
      currentPrinter.systemChecks.scanning.updates.date
    )}`;
    pageElements.connectPage.updatesCheck.className = `btn btn-${currentPrinter.systemChecks.scanning.updates.status} mb-1 btn-block`;

    if (!printerOnline) {
      pageElements.menu.printerProfileBtn.disabled = true;
      pageElements.menu.printerGcodeBtn.disabled = true;
      pageElements.menu.printerCameraSettingsBtn.disabled = true;
      pageElements.menu.printerTriggerSettingsBtn.disabled = true;

      if (!pageElements.menu.printerProfileBtn.classList.contains("notyet")) {
        pageElements.menu.printerProfileBtn.classList.add("notyet");
      }
      if (!pageElements.menu.printerGcodeBtn.classList.contains("notyet")) {
        pageElements.menu.printerGcodeBtn.classList.add("notyet");
      }
      if (
        !pageElements.menu.printerCameraSettingsBtn.classList.contains("notyet")
      ) {
        pageElements.menu.printerCameraSettingsBtn.classList.add("notyet");
      }
      if (
        !pageElements.menu.printerTriggerSettingsBtn.classList.contains(
          "notyet"
        )
      ) {
        pageElements.menu.printerTriggerSettingsBtn.classList.add("notyet");
      }
    } else {
      pageElements.mainPage.offlineMessage.innerHTML = "";
      pageElements.menu.printerProfileBtn.disabled = false;
      pageElements.menu.printerGcodeBtn.disabled = false;
      pageElements.menu.printerCameraSettingsBtn.disabled = false;
      pageElements.menu.printerTriggerSettingsBtn.disabled = false;

      if (pageElements.menu.printerProfileBtn.classList.contains("notyet")) {
        pageElements.menu.printerProfileBtn.classList.remove("notyet");
      }
      if (pageElements.menu.printerGcodeBtn.classList.contains("notyet")) {
        pageElements.menu.printerGcodeBtn.classList.remove("notyet");
      }
      if (
        pageElements.menu.printerCameraSettingsBtn.classList.contains("notyet")
      ) {
        pageElements.menu.printerCameraSettingsBtn.classList.remove("notyet");
      }
      if (
        pageElements.menu.printerTriggerSettingsBtn.classList.contains("notyet")
      ) {
        pageElements.menu.printerTriggerSettingsBtn.classList.remove("notyet");
      }
    }
  }
}
