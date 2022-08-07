import Calc from "../../../utils/calc";

$(document).on("hidden.bs.modal", ".bootbox.modal", function () {
  if ($(".modal").hasClass("show")) {
    $("body").addClass("modal-open");
  }
});

const E = {
  API_CHECK_STATE: "apiCheckState-",
  HISTORY_IN_TO: "historyInTo-",
  HISTORY_CUT_OFF: "historyCutOff-",
  NETWORK: "network-",
  CAM: "cameraURL",
  WEBSOCKET: "websocket",
  PRINTER_URL: "printerURL",
  MATCH: "match",
  PING_PONG: "ping_pong",
  SYSTEM: "system",
  USER: "user",
  FILES: "files",
  STATE: "state",
  SETTINGS: "settings",
  PROFILE: "profile",
  OP_SYS_INFO: "opSystemInfo",
  OP_UPDATES: "opUptates",
  OP_PLUGIN: "opPlugin",
  BAUD: "baud",
  PORT: "port",
  PPROFILE: "profile",
  PROFILE_CHECK: "profileCheck",
  WEBCAM: "webcam",
  H_FFMPEG: "hWebcam",
  H_CODEC: "hCodec",
  H_TIMELAPSE: "hTimelapse",
};

const returnButton = (check, icon, id, message) => {
  const disabled = check ? "disabled" : "";
  const validMessage = check ? message : "Click to find out more!";

  return `
    <button
      title="${validMessage}"
      class="btn btn-outline-${
        check ? "success" : "danger"
      } btn-sm mb-1" id="${id}" ${disabled}>${icon}</button>
    `;
};

const returnBootBox = (
  info = undefined,
  fix = undefined,
  warning = undefined,
  danger = undefined
) => {
  let infoTemplate = "";
  let warningTemplate = "";
  let dangerTemplate = "";
  let fixTemplate = "";
  if (!!info) {
    infoTemplate = `
    <div class="alert text-info" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-info-circle fa-2x"></i>  
            </div>
            <div class="col">
               <h5><b>Issue:</b></h5>
               ${info}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!warning) {
    warningTemplate = `
        <div class="alert text-warning" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-exclamation-triangle fa-2x"></i>
            </div>
            <div class="col">
               <h5><b>Warning:</b></h5>
               ${warning}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!danger) {
    dangerTemplate = `
        <div class="alert text-danger" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-skull-crossbones fa-2x"></i> 
            </div>
            <div class="col">
                  <h5><b>Danger:</b></h5>
               ${danger}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!fix) {
    fixTemplate = `
        <div class="alert text-success" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-wrench fa-2x"></i>
            </div>
            <div class="col">
                <h5><b>How to fix:</b></h5>
               ${fix}
            </div>                    
        </div>
    </div>
    `;
  }

  bootbox.dialog({
    title: "<b>What's the problem?</b>",
    message: infoTemplate + warningTemplate + dangerTemplate + fixTemplate,
  });
};

const returnHistoryCamera = (pClean, history) => {
  return `
    ${returnButton(
      history.ffmpegPath,
      "<i class=\"fas fa-terminal\"></i>",
      E.H_FFMPEG + pClean,
      VALID("The FFmpeg Path")
    )}
    ${returnButton(
      history.ffmpegVideoCodex,
      "<i class=\"fas fa-video\"></i>",
      E.H_CODEC + pClean,
      VALID("The Video Codex")
    )}
    ${returnButton(
      history.timelapseEnabled,
      "<i class=\"fas fa-hourglass-start\"></i>",
      E.H_TIMELAPSE + pClean,
      VALID("The timelapse")
    )}
    `;
};
const VALID = (check) => {
  return `&#x2713; ${check} is valid and setup correctly!`;
};
const VALID_NOT = (check) => {
  return `&#x2713; No recent ${check} failures!`;
};
const VALID_API = (check) => {
  return `&#x2713; ${check} connected and captured!`;
};
const VALID_TIMEOUT = (check) => {
  return `&#x2713; ${check} settings are okay!`;
};

const VALID_CONN = (check) => {
  return `&#x2713; ${check} is saved in database!`;
};

export function returnHealthCheckRow(check) {
  const pClean = check.printerName.replace(/[^\w\-]+/g, "-").toLowerCase();
  return `
        <tr id="healthCheckRow-${check.printerID}">
        <td>${check.printerName}</td>
        <td>       
        ${returnButton(
          check.printerChecks.printerURL,
          "<i class=\"fas fa-print\"></i>",
          E.PRINTER_URL + pClean,
          VALID("Printer URL")
        )}
        ${returnButton(
          check.printerChecks.webSocketURL,
          "<i class=\"fas fa-plug\"></i>",
          E.WEBSOCKET + pClean,
          VALID("WebSocket URL")
        )}
        <br>
        ${returnButton(
          check.printerChecks.match,
          "<i class=\"fas fa-equals\"></i>",
          E.MATCH + pClean,
          VALID("Your http/https websocket connection")
        )}
        ${returnButton(
          check.printerChecks.cameraURL,
          "<i class=\"fas fa-camera\"></i>",
          E.CAM + pClean,
          VALID("Camera URL")
        )}
      
        </td>
        <td>
        ${returnButton(
          parseInt(check.websocketChecks.totalPingPong) <= 5,
          "<i class=\"fas fa-table-tennis\"></i>",
          E.PING_PONG + pClean,
          VALID_NOT("Websocket Ping/Pong")
        )}
        </td>
        <td>
        ${returnButton(
          check.apiChecksRequired.userCheck,
          "<i class=\"fas fa-users\"></i>",
          E.USER + pClean,
          VALID_API("Users")
        )}
        ${returnButton(
          check.apiChecksRequired.stateCheck,
          "<i class=\"fas fa-info-circle\"></i>",
          E.STATE + pClean,
          VALID_API("State")
        )}
       ${returnButton(
         check.apiChecksRequired.settingsCheck,
         "<i class=\"fas fa-cog\"></i>",
         E.SETTINGS + pClean,
         VALID_API("Settings")
       )}
       ${returnButton(
         check.apiChecksRequired.profileCheck,
         "<i class=\"fas fa-id-card\"></i>",
         E.PROFILE + pClean,
         VALID_API("Profile")
       )}
       ${returnButton(
         check.apiChecksRequired.systemCheck,
         "<i class=\"fas fa-server\"></i>",
         E.SYSTEM + pClean,
         VALID_API("System Commands")
       )}
       </td>
       <td>
       ${returnButton(
         check.apiChecksOptional.octoPrintSystemInfo,
         "<i class=\"fas fa-question-circle\"></i>",
         E.OP_SYS_INFO + pClean,
         VALID_API("System Information")
       )}
     ${returnButton(
       check.apiChecksOptional.octoPrintUpdatesCheck,
       "<i class=\"fas fa-wrench\"></i>",
       E.OP_UPDATES + pClean,
       VALID_API("System Updates")
     )}
     ${returnButton(
       check.apiChecksOptional.filesCheck,
       "<i class=\"fas fa-file-code\"></i>",
       E.FILES + pClean,
       VALID_API("Files")
     )}

     ${returnButton(
       check.apiChecksOptional.octoPrintPluginsCheck,
       "<i class=\"fas fa-plug\"></i>",
       E.OP_PLUGIN + pClean,
       VALID_API("Plugin Updates")
     )}
          </td>

          <td>
          ${returnButton(
            check.connectionChecks.baud,
            "<i class=\"fas fa-archway\"></i>",
            E.BAUD + pClean,
            VALID_CONN("Baudrate Default")
          )}
           ${returnButton(
             check.connectionChecks.port,
             "<i class=\"fas fa-plug\"></i>",
             E.PORT + pClean,
             VALID_CONN("Port Default")
           )}
            ${returnButton(
              check.connectionChecks.profile,
              "<i class=\"fas fa-id-card-alt\"></i>",
              E.PROFILE + pClean,
              VALID_CONN("Profile Default")
            )}
        </td>
        <td>
        ${returnButton(
          check.profileChecks,
          "<i class=\"fas fa-print\"></i>",
          E.PROFILE_CHECK + pClean,
          VALID_CONN("Printer Profile")
        )}
        </td>
        <td>
         ${returnButton(
           check.webcamChecks.camSetup,
           "<i class=\"fas fa-camera\"></i>",
           E.WEBCAM + pClean,
           VALID("Webcam")
         )}
        </td>
        <td>
        ${returnHistoryCamera(pClean, check.webcamChecks.historySetup)}
        </td>
        </tr>
    `;
}

export function addHealthCheckListeners(check) {
  const lastUpdated = document.getElementById("lastUpdatedDate");
  lastUpdated.innerHTML =
    " " + new Date(check.dateChecked).toLocaleTimeString();
  const pClean = check.printerName.replace(/[^\w\-]+/g, "-").toLowerCase();

  if (!check.printerChecks.match) {
    document.getElementById(E.MATCH + pClean).addEventListener("click", () => {
      returnBootBox(
        "Your socket url and printer url don't match... either the IP/PORT/URL or the http -> ws / https -> ws protocol doesn't match.",
        "Use either the Printer Settings / Bulk Printer editor and update your printer URL. This should match them both back up.",
        null,
        "This can cause data issues, especially if both are different but from working printers!"
      );
    });
  }
  if (!check.printerChecks.webSocketURL) {
    document
      .getElementById(E.WEBSOCKET + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "Your socket url isn't a valid url format.",
          "Use either the Printer Settings / Bulk Printer editor and update your printer URL.",
          "This will not allow OctoFarm to make a connection to OctoPrints websocket."
        );
      });
  }
  if (!check.printerChecks.printerURL) {
    document
      .getElementById(E.PRINTER_URL + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "Your printer url isn't a valid url format.",
          "Use either the Printer Settings / Bulk Printer editor and update your printer URL.",
          "This will not allow OctoFarm to establish a connection to OctoPrints API."
        );
      });
  }
  if (!check.printerChecks.cameraURL) {
    document.getElementById(E.CAM + pClean).addEventListener("click", () => {
      returnBootBox(
        "Your camera url isn't a valid url format.",
        "Use either the Printer Settings / Bulk Printer editor and update your printers camera URL.",
        "You won't see any active streams in the UI."
      );
    });
  }

  if (
    !check.websocketChecks.totalPingPong ||
    parseInt(check.websocketChecks.totalPingPong) > 5
  ) {
    document
      .getElementById(E.PING_PONG + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "Your socket connection has failed the Ping/Pong check " +
            check.websocketChecks.totalPingPong +
            " times. Ping/Pongs are sent every 20 seconds to ensure there are no drops in the network which can cause a socket to stall.",
          "Investigate the logs and see why the ping pong checks are failing for your printer.",
          "OctoFarm will automatically recover from these issues but it's best to rectify your underlying network issues to resolve this problem. OctoFarm could be reconnecting whilst a print is finishing causing the print capture to fail."
        );
      });
  }

  const apiFixText =
    "Check the logs for network / api and any connection issues that might have occured.";
  const fullyFunctioningText =
    "This endpoint is required to have a fully functioning printer on OctoFarm. Your printer will fail to initialise without it.";

  if (!check.apiChecksRequired.userCheck) {
    document.getElementById(E.USER + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm failed to acquire OctoPrints user information.",
        apiFixText,
        null,
        "OctoFarm will fail hard without this information! You won't be able to continue and receive printer data."
      );
    });
  }
  if (!check.apiChecksRequired.stateCheck) {
    document.getElementById(E.STATE + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm uses the state endpoint to correctly understand some settings defaults if you have them setup on OctoPrint.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksRequired.profileCheck) {
    document
      .getElementById(E.SETTINGS + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoFarm uses the profile to correctly understand your printer specific functionality and allow to connect to the printer from the UI.",
          apiFixText,
          null,
          fullyFunctioningText
        );
      });
  }
  if (!check.apiChecksRequired.systemCheck) {
    document.getElementById(E.SYSTEM + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm uses a lot of OctoPrints settings to base it's setup on and will also use this endpoint to react to Plugin settings that you might have.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksRequired.settingsCheck) {
    document
      .getElementById(E.SETTINGS + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoFarm uses a lot of OctoPrints settings to base it's setup on and will also use this endpoint to react to Plugin settings that you might have.",
          apiFixText,
          null,
          fullyFunctioningText
        );
      });
  }
  if (!check.apiChecksOptional.filesCheck) {
    document.getElementById(E.FILES + pClean).addEventListener("click", () => {
      returnBootBox(
        "This endpoint is not required unless you want to use OctoFarm to action Prints and manage files. The system will handle no files been available.",
        apiFixText
      );
    });
  }
  if (!check.apiChecksOptional.octoPrintPluginsCheck) {
    document
      .getElementById(E.OP_PLUGIN + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "This endpoint will require OctoPrint to have some active internet connection, without it OctoFarm will not scan. The information is only used to alert OctoFarm users of plugin updates and allow the installation of plugins through OctoFarm, it's not required.",
          apiFixText
        );
      });
  }

  if (!check.apiChecksOptional.octoPrintSystemInfo) {
    document
      .getElementById(E.OP_SYS_INFO + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "This endpoint only exists in OctoPrint after V1.4.2, if you have a version below that this will skip the check entirely. The information is only used in Printer Manager and when generating a log dump, it's not required.",
          apiFixText
        );
      });
  }
  if (!check.apiChecksOptional.octoPrintUpdatesCheck) {
    document
      .getElementById(E.OP_UPDATES + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "This endpoint will require OctoPrint to have some active internet connection, without it OctoFarm will not scan. The information is only used to alert OctoFarm users of updates for the OctoPrint service, it's not required.",
          apiFixText
        );
      });
  }

  const profileWarning =
    "This will not affect the normal operation of OctoFarm but you won't be able to use the quick connect functionality. ";
  const profileFix =
    "Either save the values in OctoPrint and do a forced Re-Scan of your API, or use OctoFarm printer settings modal to update both.";

  if (!check.connectionChecks.baud) {
    document.getElementById(E.BAUD + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm has no saved baud rate it's aware of.",
        profileFix,
        profileWarning
      );
    });
  }

  if (!check.connectionChecks.port) {
    document.getElementById(E.PORT + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm has no saved printer port it's aware of.",
        profileFix,
        profileWarning
      );
    });
  }

  if (!check.connectionChecks.profile) {
    document
      .getElementById(E.PPROFILE + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoFarm has no saved printer profile it's aware of.",
          profileFix,
          profileWarning
        );
      });
  }

  if (!check.profileChecks) {
    document
      .getElementById(E.PROFILE_CHECK + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoFarm has no save Printer profile from OctoPrint.",
          "Double check your API settings and that a profile actually exists on OctoPrint.",
          null,
          "The profile is used for quite a lot within OctoFarm, especially file manager and displaying the correct amount of tools. Your printer will hard fail until this is rectified."
        );
      });
  }

  if (!check.webcamChecks.camSetup) {
    document.getElementById(E.WEBCAM + pClean).addEventListener("click", () => {
      returnBootBox(
        "Your webcam settings from OctoPrint do not match your values in OctoFarm.",
        "If you have no camera url inputted into OctoFarm then please turn off the 'Enable Webcam' setting in OctoFarms printer settings modal.",
        "Nothing bad will happen, you will just see the awful little <img src='http://nono.com/no.jpg'> icon in the relevant views."
      );
    });
  }

  const { ffmpegPath, ffmpegVideoCodex, timelapseEnabled } =
    check.webcamChecks.historySetup;

  if (!ffmpegPath) {
    document
      .getElementById(E.H_FFMPEG + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoPrint hasn't got an FFMPEG path setup and your settings in history are utilising the timelapse functionality.",
          "Either enter into OctoPrint your FFMPEG path and do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
          "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
        );
      });
  }
  if (!ffmpegVideoCodex) {
    document
      .getElementById(E.H_CODEC + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoPrint hasn't got the correct codec setup and your settings in history are utilising the timelapse functionality.",
          "Either select the correct .mp4 codec in OctoPrint and do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
          "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
        );
      });
  }
  if (!timelapseEnabled) {
    document
      .getElementById(E.H_TIMELAPSE + pClean)
      .addEventListener("click", () => {
        returnBootBox(
          "OctoPrint hasn't got the timelapse functionality enabled and your settings in history are utilising the timelapse functionality.",
          "Either enable the feature on OctoPrint do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
          "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
        );
      });
  }
}

export function returnFarmOverviewTableRow(
  currentPrinter,
  printer,
  octoSysInfo,
  printerSuccessRate,
  printerActivityRate,
  printerCancelRate,
  printerErrorRate,
  printerIdleRate,
  printerOfflineRate,
  octoPi
) {
  const NO_DATA = "No Data";
  const octoPiTableRows = document.querySelectorAll("[id^=\"trOctoPi-\"]");
  let octoPiColumns = "";
  if (!!octoPi && Object.keys(octoPi).length !== 0) {
    const { octopi_version, model, throttle_state } = octoPi;
    octoPiColumns = `
      <td>${model ? model : NO_DATA}</td>
      <td>${octopi_version ? octopi_version : NO_DATA}</td>
      <td>${
        throttle_state?.current_issue
          ? "<i title=\"OctoPi is reporting that it's in a throttled state! Please check your power supply!\" class=\"fas fa-thumbs-down text-danger\"></i>"
          : "<i title=\"OctoPi is reporting it's not in a throttled state!\" class=\"fas fa-thumbs-up text-success\"></i>"
      }</td>
      <td>${
        throttle_state?.current_overheat
          ? "<i title=\"OctoPi is reporting an overheating issue! Blow on it and ReScan the API!\" class=\"fa-solid fa-fire text-danger\"></i>"
          : "<i title=\"OctoPi is running cool!\" class=\"fa-solid fa-fire text-success\"></i>"
      }</td>
      <td>${
        throttle_state?.current_undervoltage
          ? "<i title=\"OctoPi is reporting that it's undervoltaged! Fix your PSU and Re-Scan the API.\" class=\"fa-solid fa-plug-circle-bolt text-danger\"></i>"
          : "<i title=\"OctoPi is juiced up!\" class=\"fa-solid fa-plug-circle-bolt text-success\"></i>"
      }</td>
    `;
    octoPiTableRows.forEach((tableRow) => {
      tableRow.classList.remove("d-none");
    });
  } else {
    octoPiColumns = `
      <td class="d-none"></td>
      <td class="d-none"></td>
      <td class="d-none"></td>
      <td class="d-none"></td>
      <td class="d-none"></td>
    `;
  }

  return `
  <tr>
      <th scope="row">${currentPrinter.printerName}  </th>
      <td>${printer?.octoPrintVersion ? printer.octoPrintVersion : NO_DATA}</td>
      <td>${printer?.printerFirmware ? printer.printerFirmware : NO_DATA} </td>
      <td>${
        octoSysInfo?.["env.python.version"]
          ? octoSysInfo?.["env.python.version"]
          : NO_DATA
      } </td>
      <td>${
        octoSysInfo?.["env.python.pip"]
          ? octoSysInfo?.["env.python.pip"]
          : NO_DATA
      } </td>
      <td>${
        octoSysInfo?.["env.os.platform"]
          ? octoSysInfo?.["env.os.platform"]
          : NO_DATA
      } </td>
      <td>${
        octoSysInfo?.["env.hardware.cores"]
          ? octoSysInfo?.["env.hardware.cores"]
          : NO_DATA
      } </td>
      <td>${
        octoSysInfo?.["env.hardware.ram"]
          ? Calc.bytes(octoSysInfo?.["env.hardware.ram"])
          : NO_DATA
      }  </td>
      <td>${
        octoSysInfo?.["octoprint.safe_mode"]
          ? "<i title=\"Something maybe wrong with your system? Detecting safe mode\" class=\"fas fa-thumbs-down text-danger\"></i>"
          : "<i title=\"You are not in safe mode, all is fine\" class=\"fas fa-thumbs-up text-success\"></i>"
      } </td>
      <td>
        <div class="progress" title="Success:  ${printerSuccessRate.toFixed(
          0
        )}% / Cancel: ${printerCancelRate.toFixed(
    0
  )}% / Error: ${printerErrorRate.toFixed(0)}%">
          <div class="progress-bar bg-success progress-bar-striped text-dark" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerSuccessRate}%;"> ${printerSuccessRate.toFixed(
    0
  )}% </div>
          <div class="progress-bar bg-warning progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerCancelRate}%;"> ${printerCancelRate.toFixed(
    0
  )}% </div>
          <div class="progress-bar bg-danger progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerErrorRate}%;"> ${printerErrorRate.toFixed(
    0
  )}% </div>
        </div>
      </td>
      <td>
        <div class="progress" title="Active:  ${printerActivityRate.toFixed(
          0
        )}% / Idle: ${printerIdleRate.toFixed(
    0
  )}% / Offline: ${printerOfflineRate.toFixed(0)}%">
          <div class="progress-bar bg-success progress-bar-striped text-dark" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerActivityRate}%;"> ${printerActivityRate.toFixed(
    0
  )}%</div>
          <div class="progress-bar bg-secondary progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerIdleRate}%;"> ${printerIdleRate.toFixed(
    0
  )}%</div>
          <div class="progress-bar bg-danger progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"  style="width: ${printerOfflineRate}%;"> ${printerOfflineRate.toFixed(
    0
  )}%</div>
        </div>
      </td>
      <td>${currentPrinter.printerResendRatioTotal} %</td>
      ${octoPiColumns}
    </tr>
  `;
}
