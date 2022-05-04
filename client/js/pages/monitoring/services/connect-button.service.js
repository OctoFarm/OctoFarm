import { printerIsDisconnectedOrError } from "../../../utils/octofarm.utils";
import OctoPrintClient from "../../../services/octoprint/octoprint-client.service";

export const setupConnectButton = (printer) => {
  const {
    connectionOptions: {
      baudrates,
      baudratePreference,
      ports,
      portPreference,
      printerProfiles,
      printerProfilePreference,
    },
  } = printer;

  const { printerURL, _id } = printer;

  const printerPort = document.getElementById("printerPortDrop");
  const printerBaud = document.getElementById("printerBaudDrop");
  const printerProfile = document.getElementById("printerProfileDrop");
  const printerConnect = document.getElementById("printerConnect");

  printerPort.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardSerialPort">Port:</label> </div> <select class="custom-select bg-secondary text-light" id="pmSerialPort"></select></div>
    `;
  printerBaud.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardBaudrate">Baudrate:</label> </div> <select class="custom-select bg-secondary text-light" id="pmBaudrate"></select></div>
    `;
  printerProfile.innerHTML = `
    <div class="input-group mb-1"> <div class="input-group-prepend"> <label class="input-group-text bg-secondary text-light" for="dashboardPrinterProfile">Profile:</label> </div> <select class="custom-select bg-secondary text-light" id="pmProfile"></select></div>
    `;
  baudrates.forEach((baud) => {
    if (baud !== 0) {
      document
        .getElementById("pmBaudrate")
        .insertAdjacentHTML(
          "beforeend",
          `<option value="${baud}">${baud}</option>`
        );
    } else {
      document
        .getElementById("pmBaudrate")
        .insertAdjacentHTML(
          "beforeend",
          `<option value="${baud}">AUTO</option>`
        );
    }
  });
  if (baudratePreference !== null) {
    document.getElementById("pmBaudrate").value =
      printer.connectionOptions.baudratePreference;
  }
  ports.forEach((port) => {
    document
      .getElementById("pmSerialPort")
      .insertAdjacentHTML(
        "beforeend",
        `<option value="${port}">${port}</option>`
      );
  });
  if (portPreference !== null) {
    document.getElementById("pmSerialPort").value =
      printer?.connectionOptions?.portPreference;
  }
  printerProfiles.forEach((profile) => {
    document
      .getElementById("pmProfile")
      .insertAdjacentHTML(
        "beforeend",
        `<option value="${profile.id}">${profile.name}</option>`
      );
  });
  if (printerProfilePreference != null) {
    document.getElementById("pmProfile").value = printerProfilePreference;
  }
  if (printerIsDisconnectedOrError(printer)) {
    printerConnect.innerHTML =
      '<button id="pmConnect" class="btn btn-success inline text-center" value="connect">Connect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
      printerURL +
      '" role="button"><i class="fas fa-globe-europe"></i></a><div id="powerBtn-' +
      _id +
      '" class="btn-group ml-1"></div>';
    document.getElementById("pmSerialPort").disabled = false;
    document.getElementById("pmBaudrate").disabled = false;
    document.getElementById("pmProfile").disabled = false;
  } else {
    printerConnect.innerHTML =
      '<button id="pmConnect" class="btn btn-danger text-center inline" value="disconnect">Disconnect</button><a title="Open your Printers Web Interface" id="pmWebBtn" type="button" class="tag btn btn-info ml-1" target="_blank" href="' +
      printerURL +
      '" role="button"><i class="fas fa-globe-europe"></i></a><div id="pmPowerBtn-' +
      _id +
      '" class="btn-group ml-1"></div>';
    document.getElementById("pmSerialPort").disabled = true;
    document.getElementById("pmBaudrate").disabled = true;
    document.getElementById("pmProfile").disabled = true;
  }
};

export const setupConnectButtonListeners = (printer, connectButton) => {
  connectButton.addEventListener("click", async () => {
    connectButton.disabled = true;
    await OctoPrintClient.connect(connectButton.value, printer);
  });
};

export const updateConnectButtonState = (
  printer,
  statusElement,
  connectButton,
  printerPort,
  printerBaud,
  printerProfile
) => {
  const {
    printerState: {
      state,
      colour: { name },
    },
  } = printer;

  statusElement.innerHTML = state;
  statusElement.className = `btn btn-${name} mb-2`;

  if (!printerIsDisconnectedOrError(printer)) {
    connectButton.value = "disconnect";
    connectButton.innerHTML = "Disconnect";
    connectButton.classList = "btn btn-danger inline";
    connectButton.disabled = false;

    printerPort.disabled = false;
    printerBaud.disabled = false;
    printerProfile.disabled = false;
  } else {
    connectButton.value = "connect";
    connectButton.innerHTML = "Connect";
    connectButton.classList = "btn btn-success inline";
    connectButton.disabled = false;

    printerPort.disabled = true;
    printerBaud.disabled = true;
    printerProfile.disabled = true;
  }
};
