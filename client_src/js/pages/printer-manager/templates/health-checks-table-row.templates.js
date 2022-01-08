// <th scope="col" className="sticky-table table-dark" style="">Printer Name</th>
// <!--                                Printer Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Printer Settings</th>
// <!--                                Webscket Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Websocket Checks</th>
// <!--                                API Checks-->
// <th scope="col" className="sticky-table table-dark" style="">API</th>
// <!--                                Websocket Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Network Issues</th>
// <!--                                Connection Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Printer Connection</th>
// <!--                                Profile Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Printer Profile</th>
// <!--                                Webcam Settings-->
// <th scope="col" className="sticky-table table-dark" style="">Webcam Settings</th>

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
  BAUD: "baud",
  PORT: "port",
  PPROFILE: "profile",
  PROFILE_CHECK: "profileCheck",
  WEBCAM: "webcam",
  H_FFMPEG: "hWebcam",
  H_CODEC: "hCodec",
  H_TIMELAPSE: "hTimelapse"
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
    <div class="alert alert-info" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-info-circle fa-2x textInfo"></i>  
            </div>
            <div class="col textInfo">
               <h5><b>Issue:</b></h5>
               ${info}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!warning) {
    warningTemplate = `
        <div class="alert alert-warning" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-exclamation-triangle fa-2x textActive"></i>
            </div>
            <div class="col textActive">
               <h5><b>Warning:</b></h5>
               ${warning}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!danger) {
    dangerTemplate = `
        <div class="alert alert-danger" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-skull-crossbones fa-2x textOffline"></i> 
            </div>
            <div class="col textOffline">
                  <h5><b>Danger:</b></h5>
               ${danger}
            </div>                    
        </div>
    </div>
    `;
  }
  if (!!fix) {
    fixTemplate = `
        <div class="alert alert-success" role="alert">
        <div class="row"> <!-- add no-gutters to make it narrower -->
            <div class="col-auto align-self-start"> <!-- or align-self-center -->
                <i class="fas fa-wrench textComplete fa-2x"></i>
            </div>
            <div class="col textComplete">
                <h5><b>How to fix:</b></h5>
               ${fix}
            </div>                    
        </div>
    </div>
    `;
  }

  bootbox.dialog({
    title: "<b>What's the problem?</b>",
    message: infoTemplate + warningTemplate + dangerTemplate + fixTemplate
  });
};

const returnNetworkConnection = (issues) => {
  const { apiResponses, webSocketResponses } = issues;

  let html = "";

  if (apiResponses.length < 1) {
    return `
        No connection has ever been established
      `;
  }
  if (webSocketResponses.length < 1) {
    return `
        No connection has ever been established
      `;
  }

  const urlSplit = apiResponses[0].url.split("/");
  const printerURL = urlSplit[0] + "//" + urlSplit[2];
  const pClean = printerURL.replace(/[^\w\-]+/g, "-").toLowerCase();

  const urlSplit_W = webSocketResponses[0].url.split("/");
  const printerURL_W = urlSplit_W[0] + "//" + urlSplit_W[2];
  const pClean_W = printerURL_W.replace(/[^\w\-]+/g, "-").toLowerCase();

  let totalInitial = 0;
  let totalCutOff = 0;

  let throttle = 0;

  apiResponses.forEach((issue) => {
    const endPoint = issue.url.includes("api")
      ? issue.url.replace(printerURL + "/" + urlSplit[3] + "/", "")
      : issue.url.replace(printerURL + "/plugin/", "");

    totalInitial += issue.initialTimeout ? 1 : 0;

    totalCutOff += issue.initialTimeout ? 1 : 0;

    html += `
        <small>${endPoint}: ${returnButton(
      issue.initialTimeout,
      '<i class="fas fa-history"></i>',
      E.NETWORK + endPoint + pClean + "timeout",
      VALID_TIMEOUT("Initial")
    )} | ${returnButton(
      issue.cutOffTimeout,
      '<i class="fas fa-stopwatch"></i>',
      E.NETWORK + endPoint + pClean + "cutoff",
      VALID_TIMEOUT("Cut Off")
    )} </small>
        `;
  });
  webSocketResponses.forEach((issue) => {
    const urlSplit_W = webSocketResponses[0].url.split("/");
    const printerURL_W = urlSplit_W[0] + "//" + urlSplit_W[2];
    const pClean_W = printerURL_W.replace(/[^\w\-]+/g, "-").toLowerCase();
    let endPoint = issue.url.replace(printerURL_W + "/", "");
    endPoint = endPoint.replace("/", "-");
    throttle += issue.throttle ? 1 : 0;

    html += `
        <small>${endPoint}: ${returnButton(
      issue.throttle,
      '<i class="fas fa-motorcycle"></i>',
      E.NETWORK + endPoint + pClean_W + "socket",
      VALID_TIMEOUT("Websocket Throttle")
    )}
        `;
  });

  const collapse = `
    <a class="btn btn-sm btn-outline-info mb-1"  data-toggle="collapse" href="#${
      E.NETWORK + pClean
    }CollapseTimeout" role="button" aria-expanded="false" aria-controls="${
    E.NETWORK + pClean
  }CollapseTimeout">
    ${printerURL} 
    </a><br>
    ${returnButton(
      totalInitial,
      '<i class="fas fa-history"></i>',
      E.NETWORK + pClean + "initial",
      VALID_TIMEOUT("All Initial")
    )}
    ${returnButton(
      totalCutOff,
      '<i class="fas fa-stopwatch"></i>',
      E.NETWORK + pClean + "cuttOff",
      VALID_TIMEOUT("All Cut Off")
    )}
    ${returnButton(
      throttle,
      '<i class="fas fa-motorcycle"></i>',
      E.NETWORK + pClean_W + "throttle",
      VALID_TIMEOUT("Websocket Throttle")
    )}
    <div class="collapse" id="${E.NETWORK + pClean}CollapseTimeout">
      <div class="card card-body">
      ${html} 
      </div>
    </div>

`;

  return collapse;
};

const returnHistoryCamera = (pClean, history) => {
  let html = `
    ${returnButton(
      history.ffmpegPath,
      '<i class="fas fa-terminal"></i>',
      E.H_FFMPEG + pClean,
      VALID("The FFmpeg Path")
    )}
    ${returnButton(
      history.ffmpegVideoCodex,
      '<i class="fas fa-video"></i>',
      E.H_CODEC + pClean,
      VALID("The Video Codex")
    )}
    ${returnButton(
      history.timelapseEnabled,
      '<i class="fas fa-hourglass-start"></i>',
      E.H_TIMELAPSE + pClean,
      VALID("The timelapse")
    )}
    `;
  return html;
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
        <tr>
        <td>${check.printerName}</td>
        <td>       
        ${returnButton(
          check.printerChecks.printerURL,
          '<i class="fas fa-print"></i>',
          E.PRINTER_URL + pClean,
          VALID("Printer URL")
        )}
        ${returnButton(
          check.printerChecks.webSocketURL,
          '<i class="fas fa-plug"></i>',
          E.WEBSOCKET + pClean,
          VALID("WebSocket URL")
        )}
        <br>
        ${returnButton(
          check.printerChecks.match,
          '<i class="fas fa-equals"></i>',
          E.MATCH + pClean,
          VALID("Your http/https websocket connection")
        )}
        ${returnButton(
          check.printerChecks.cameraURL,
          '<i class="fas fa-camera"></i>',
          E.CAM + pClean,
          VALID("Camera URL")
        )}
      
        </td>
        <td>
        ${returnButton(
          parseInt(check.websocketChecks.totalPingPong) <= 5,
          '<i class="fas fa-table-tennis"></i>',
          E.PING_PONG + pClean,
          VALID_NOT("Websocket Ping/Pong")
        )}
        </td>
        <td>
        ${returnButton(
          check.apiChecksRequired.userCheck,
          '<i class="fas fa-users"></i>',
          E.USER + pClean,
          VALID_API("Users")
        )}
        ${returnButton(
          check.apiChecksRequired.stateCheck,
          '<i class="fas fa-info-circle"></i>',
          E.STATE + pClean,
          VALID_API("State")
        )}
       ${returnButton(
         check.apiChecksRequired.settingsCheck,
         '<i class="fas fa-cog"></i>',
         E.SETTINGS + pClean,
         VALID_API("Settings")
       )}
       ${returnButton(
         check.apiChecksRequired.profileCheck,
         '<i class="fas fa-id-card"></i>',
         E.PROFILE + pClean,
         VALID_API("Profile")
       )}
       ${returnButton(
         check.apiChecksRequired.systemCheck,
         '<i class="fas fa-server"></i>',
         E.SYSTEM + pClean,
         VALID_API("System Commands")
       )}
       </td>
       <td>
       ${returnButton(
         check.apiChecksOptional.octoPrintSystemInfo,
         '<i class="fas fa-question-circle"></i>',
         E.OP_SYS_INFO + pClean,
         VALID_API("System Information")
       )}
     ${returnButton(
       check.apiChecksOptional.octoPrintUpdatesCheck,
       '<i class="fas fa-wrench"></i>',
       E.OP_UPDATES + pClean,
       VALID_API("System Updates")
     )}
     ${returnButton(
       check.apiChecksOptional.filesCheck,
       '<i class="fas fa-file-code"></i>',
       E.FILES + pClean,
       VALID_API("Files")
     )}
          </td>
          <td>
          ${returnNetworkConnection(check.connectionIssues)}
          </td>
          <td>
          ${returnButton(
            check.connectionChecks.baud,
            '<i class="fas fa-archway"></i>',
            E.BAUD + pClean,
            VALID_CONN("Baudrate Default")
          )}
           ${returnButton(
             check.connectionChecks.port,
             '<i class="fas fa-plug"></i>',
             E.PORT + pClean,
             VALID_CONN("Port Default")
           )}
            ${returnButton(
              check.connectionChecks.profile,
              '<i class="fas fa-id-card-alt"></i>',
              E.PROFILE + pClean,
              VALID_CONN("Profile Default")
            )}
        </td>
        <td>
        ${returnButton(
          check.profileChecks,
          '<i class="fas fa-print"></i>',
          E.PROFILE_CHECK + pClean,
          VALID_CONN("Printer Profile")
        )}
        </td>
        <td>
         ${returnButton(
           check.webcamChecks.camSetup,
           '<i class="fas fa-camera"></i>',
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
  lastUpdated.innerHTML = " " + new Date(check.dateChecked).toLocaleTimeString();
  const pClean = check.printerName.replace(/[^\w\-]+/g, "-").toLowerCase();

  if (!check.printerChecks.match) {
    document.getElementById(E.MATCH + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "Your socket url and printer url don't match... either the IP/PORT/URL or the http -> ws / https -> ws protocol doesn't match.",
        "Use either the Printer Settings / Bulk Printer editor and update your printer URL. This should match them both back up.",
        null,
        "This can cause data issues, especially if both are different but from working printers!"
      );
    });
  }
  if (!check.printerChecks.webSocketURL) {
    document.getElementById(E.WEBSOCKET + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "Your socket url isn't a valid url format.",
        "Use either the Printer Settings / Bulk Printer editor and update your printer URL.",
        "This will not allow OctoFarm to make a connection to OctoPrints websocket."
      );
    });
  }
  if (!check.printerChecks.printerURL) {
    document.getElementById(E.PRINTER_URL + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "Your printer url isn't a valid url format.",
        "Use either the Printer Settings / Bulk Printer editor and update your printer URL.",
        "This will not allow OctoFarm to establish a connection to OctoPrints API."
      );
    });
  }
  if (!check.printerChecks.cameraURL) {
    document.getElementById(E.CAM + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "Your camera url isn't a valid url format.",
        "Use either the Printer Settings / Bulk Printer editor and update your printers camera URL.",
        "You won't see any active streams in the UI."
      );
    });
  }

  if (!check.websocketChecks.totalPingPong || parseInt(check.websocketChecks.totalPingPong) > 5) {
    document.getElementById(E.PING_PONG + pClean).addEventListener("click", (e) => {
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
    document.getElementById(E.USER + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "OctoFarm failed to acquire OctoPrints user information.",
        apiFixText,
        null,
        "OctoFarm will fail hard without this information! You won't be able to continue and receive printer data."
      );
    });
  }
  if (!check.apiChecksRequired.stateCheck) {
    document.getElementById(E.STATE + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "OctoFarm uses the state endpoint to correctly understand some settings defaults if you have them setup on OctoPrint.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksRequired.profileCheck) {
    document.getElementById(E.SETTINGS + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "OctoFarm uses the profile to correctly understand your printer specific functionality and allow to connect to the printer from the UI.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksRequired.systemCheck) {
    document.getElementById(E.SYSTEM + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "OctoFarm uses a lot of OctoPrints settings to base it's setup on and will also use this endpoint to react to Plugin settings that you might have.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksRequired.settingsCheck) {
    document.getElementById(E.SETTINGS + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "OctoFarm uses a lot of OctoPrints settings to base it's setup on and will also use this endpoint to react to Plugin settings that you might have.",
        apiFixText,
        null,
        fullyFunctioningText
      );
    });
  }
  if (!check.apiChecksOptional.filesCheck) {
    document.getElementById(E.FILES + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "This endpoint is not required unless you want to use OctoFarm to action Prints and manage files. The system will handle no files been available.",
        apiFixText
      );
    });
  }

  if (!check.apiChecksOptional.octoPrintSystemInfo) {
    document.getElementById(E.OP_SYS_INFO + pClean).addEventListener("click", (e) => {
      returnBootBox(
        "This endpoint only exists in OctoPrint after V1.4.2, if you have a version below that this will skip the check entirely. The information is only used in Printer Manager and when generating a log dump, it's not required.",
        apiFixText
      );
    });
  }
  if (!check.apiChecksOptional.octoPrintUpdatesCheck) {
    document.getElementById(E.OP_UPDATES + pClean).addEventListener("click", (e) => {
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
  if (!check.connectionChecks.baud || true) {
    document.getElementById(E.BAUD + pClean).addEventListener("click", () => {
      returnBootBox("OctoFarm has no saved baud rate it's aware of.", profileFix, profileWarning);
    });
  }

  if (check.connectionChecks.port || true) {
    document.getElementById(E.PPROFILE + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm has no saved printer port it's aware of.",
        profileFix,
        profileWarning
      );
    });
  }

  if (check.connectionChecks.profile || true) {
    document.getElementById(E.PPROFILE + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm has no saved printer profile it's aware of.",
        profileFix,
        profileWarning
      );
    });
  }

  if (check.profileChecks || true) {
    document.getElementById(E.PROFILE_CHECK + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoFarm has no save Printer profile from OctoPrint.",
        "Double check your API settings and that a profile actually exists on OctoPrint.",
        null,
        "The profile is used for quite a lot within OctoFarm, especially file manager and displaying the correct amount of tools. Your printer will hard fail until this is rectified."
      );
    });
  }

  if (check.webcamChecks.camSetup || true) {
    document.getElementById(E.WEBCAM + pClean).addEventListener("click", () => {
      returnBootBox(
        "Your webcam settings from OctoPrint do not match your values in OctoFarm.",
        "If you have no camera url inputted into OctoFarm then please turn off the 'Enable Webcam' setting in OctoFarms printer settings modal.",
        "Nothing bad will happen, you will just see the awful little <img src='http://nono.com/no.jpg'> icon in the relevant views."
      );
    });
  }

  const { ffmpegPath, ffmpegVideoCodex, timelapseEnabled } = check.webcamChecks.historySetup;
  if (ffmpegPath || true) {
    document.getElementById(E.H_FFMPEG + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoPrint hasn't got an FFMPEG path setup and your settings in history are utilising the timelapse functionality.",
        "Either enter into OctoPrint your FFMPEG path and do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
        "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
      );
    });
  }
  if (ffmpegVideoCodex || true) {
    document.getElementById(E.H_CODEC + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoPrint hasn't got the correct codec setup and your settings in history are utilising the timelapse functionality.",
        "Either select the correct .mp4 codec in OctoPrint and do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
        "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
      );
    });
  }
  if (timelapseEnabled || true) {
    document.getElementById(E.H_TIMELAPSE + pClean).addEventListener("click", () => {
      returnBootBox(
        "OctoPrint hasn't got the timelapse functionality enabled and your settings in history are utilising the timelapse functionality.",
        "Either enable the feature on OctoPrint do a forced API Re-Scan, or use the functionality System -> Server -> History to update your instances on mass.",
        "There's checks in place to stop this from affecting your history, but you are making OctoFarm do pointless API calls if left."
      );
    });
  }
  const apiSettingsWarning =
    "This will not really effect OctoFarms operations much. It will however effect the user experience as messages may not arrive in the expected time or initial scans of offline printers could take to long to resolve.";
  const { apiResponses, webSocketResponses } = check.connectionIssues;
  if (apiResponses.length < 1) {
    return false;
  }
  if (webSocketResponses.length < 1) {
    return false;
  }

  const socketResponseInfo = (faster, slower) => {
    return `
    Your socket is responding ${faster ? "faster" : ""} ${slower ? "slower" : ""} than expected...
    `;
  };
  const timeoutResponseInfo = (setting) => {
    return `
    Your ${setting} is too high for the response times...
    `;
  };
  const socketResponseFix = (response, settings) => {
    return `
    The socket is responding, on average, in ${
      response ? response : ""
    }ms <br> Your settings are currently: ${settings ? settings : ""}ms and are under by ${
      response - settings
    }ms.
    `;
  };
  const timeoutResponseFix = (response, settings) => {
    return `
    The endpoint is responding, on average, in ${
      response ? response : ""
    }ms <br> Your settings are currently: ${settings ? settings : ""}ms and are under by ${
      response - settings
    }ms.
    `;
  };
  const cutOffTimeoutFix = (response, settings) => {
    return `
    Your endpoint is responding, on average, in ${
      response ? response : ""
    }ms <br> Your settings are currently: ${settings ? settings : ""}ms and overshoot by ${
      settings - response
    }ms.
    `;
  };

  let totalInitial = 0;
  let totalCutOff = 0;

  let throttle = 0;

  const urlSplit = apiResponses[0].url.split("/");

  const printerURL = urlSplit[0] + "//" + urlSplit[2];
  const pCleanURL = printerURL.replace(/[^\w\-]+/g, "-").toLowerCase();

  const urlSplit_W = webSocketResponses[0].url.split("/");
  const printerURL_W = urlSplit_W[0] + "//" + urlSplit_W[2];
  const pClean_W = printerURL_W.replace(/[^\w\-]+/g, "-").toLowerCase();

  if (apiResponses.length > 1) {
    apiResponses.forEach((issue) => {
      const endPoint = issue.url.includes("api")
        ? issue.url.replace(printerURL + "/" + urlSplit[3] + "/", "")
        : issue.url.replace(printerURL + "/plugin/", "");

      totalInitial += issue.initialTimeout ? 1 : 0;

      totalCutOff += issue.initialTimeout ? 1 : 0;
      document
        .getElementById(E.NETWORK + endPoint + pCleanURL + "timeout")
        .addEventListener("click", () => {
          returnBootBox(
            timeoutResponseInfo("timeout"),
            timeoutResponseFix(issue.responsesAverage, issue.timeoutSettings.apiTimeout),
            apiSettingsWarning
          );
        });
      document
        .getElementById(E.NETWORK + endPoint + pCleanURL + "cutoff")
        .addEventListener("click", () => {
          returnBootBox(
            timeoutResponseInfo("cut off"),
            cutOffTimeoutFix(issue.responsesAverage, issue.timeoutSettings.apiRetryCutoff),
            apiSettingsWarning
          );
        });
    });
  }

  document.getElementById(E.NETWORK + pCleanURL + "initial").addEventListener("click", () => {
    returnBootBox(
      "One of your endpoints isn't responding by the time you have setup in your initial timeout",
      "Click the blue button containing your printer url to investigate the specific endpoint further.",
      apiSettingsWarning
    );
  });
  document.getElementById(E.NETWORK + pCleanURL + "cuttOff").addEventListener("click", () => {
    returnBootBox(
      "One of your endpoints is taking longer than your cut off to respond.",
      "Click the blue button containing your printer url to investigate the specific endpoint further.",
      apiSettingsWarning
    );
  });
  if (webSocketResponses.length > 0) {
    webSocketResponses.forEach((issue) => {
      let endPoint = issue.url.replace(printerURL_W + "/", "");
      endPoint = endPoint.replace("/", "-");
      throttle += issue.throttle ? 1 : 0;
      document
        .getElementById(E.NETWORK + endPoint + pClean_W + "socket")
        .addEventListener("click", () => {
          returnBootBox(
            socketResponseInfo(issue.under, issue.over),
            socketResponseFix(issue.responsesAverage, issue.throttleMS),
            apiSettingsWarning
          );
        });
    });
  }
  document.getElementById(E.NETWORK + pClean_W + "throttle").addEventListener("click", () => {
    returnBootBox(
      "The websocket endpoint is not sending data at the speed your Websocket Throttle is set at.",
      "Click the blue button containing your printer url to investigate the specific endpoint further.",
      "This will not really effect OctoFarms operations much. It will however effect the user experience as messages may not arrive in the expected time or initial scans of offline printers could take to long to resolve."
    );
  });
}
