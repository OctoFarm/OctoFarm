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

  HISTORY_IN_TO: "historyInTo",
  HISTORY_CUT_OFF: "historyCutOff"
};

const returnButton = (check, icon, id, message) => {
  const disabled = check ? "disabled" : "";
  const validMessage = check ? message : "";

  return `
    <button
      title="${validMessage}"
      class="btn btn-outline-${
        check ? "success" : "danger"
      } btn-sm mb-1" id="${id}" ${disabled}>${icon}</button>
    `;
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
      ? issue.url.replace(printerURL + "/" + urlSplit[3], "")
      : issue.url.replace(printerURL + "/plugin", "");

    totalInitial += issue.initialTimeout ? 1 : 0;

    totalCutOff += issue.initialTimeout ? 1 : 0;

    html += `
        <small>${endPoint}: ${returnButton(
      issue.initialTimeout,
      '<i class="fas fa-history"></i>',
      E.HISTORY_IN_TO + endPoint + pClean,
      VALID_TIMEOUT("Initial")
    )} | ${returnButton(
      issue.cutOffTimeout,
      '<i class="fas fa-stopwatch"></i>',
      E.HISTORY_CUT_OFF + endPoint + pClean,
      VALID_TIMEOUT("Cut Off")
    )} </small><br>
        `;
  });
  webSocketResponses.forEach((issue) => {
    const endPoint = issue.url.replace(printerURL_W + "/sockjs/websocket", "");

    throttle += issue.throttle ? 1 : 0;

    html += `
        <small>${endPoint}: ${returnButton(
      issue.initialTimeout,
      '<i class="fas fa-history"></i>',
      E.HISTORY_IN_TO + endPoint + pClean,
      VALID_TIMEOUT("Initial")
    )}
        `;
  });

  const collapse = `
    <a class="btn btn-sm btn-outline-info"  data-toggle="collapse" href="#${
      E.HISTORY_CUT_OFF + pClean
    }CollapseTimeout" role="button" aria-expanded="false" aria-controls="${
    E.HISTORY_CUT_OFF + pClean
  }CollapseTimeout">
    ${printerURL} 
    </a>
    ${returnButton(
      totalInitial,
      '<i class="fas fa-history"></i>',
      E.HISTORY_CUT_OFF + pClean,
      VALID_TIMEOUT("All Initial")
    )}
    ${returnButton(
      totalCutOff,
      '<i class="fas fa-stopwatch"></i>',
      E.HISTORY_CUT_OFF + pClean,
      VALID_TIMEOUT("All Cut Off")
    )}
    ${returnButton(
      throttle,
      '<i class="fas fa-stopwatch"></i>',
      E.HISTORY_CUT_OFF + pClean_W,
      VALID_TIMEOUT("Websocket Throttle")
    )}
    <div class="collapse" id="${E.HISTORY_CUT_OFF + pClean}CollapseTimeout">
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
      pClean,
      VALID("The FFmpeg Path")
    )}
    ${returnButton(
      history.ffmpegVideoCodex,
      '<i class="fas fa-video"></i>',
      pClean,
      VALID("The Video Codex")
    )}
    ${returnButton(
      history.timelapseEnabled,
      '<i class="fas fa-hourglass-start"></i>',
      pClean,
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
  return `&#x2713; ${check} timeout settings are okay!`;
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
          pClean,
          VALID("Printer URL")
        )}
        ${returnButton(
          check.printerChecks.webSocketURL,
          '<i class="fas fa-plug"></i>',
          pClean,
          VALID("WebSocket URL")
        )}
        <br>
        ${returnButton(
          check.printerChecks.match,
          '<i class="fas fa-equals"></i>',
          pClean,
          VALID("Your http/https websocket connection")
        )}
        ${returnButton(
          check.printerChecks.camURL,
          '<i class="fas fa-camera"></i>',
          pClean,
          VALID("Camera URL")
        )}
      
        </td>
        <td>
        ${returnButton(
          parseInt(check.websocketChecks.totalPingPong) <= 5,
          '<i class="fas fa-table-tennis"></i>',
          pClean,
          VALID_NOT("Websocket Ping/Pong")
        )}
        </td>
        <td>
        ${returnButton(
          check.apiChecks.userCheck,
          '<i class="fas fa-users"></i>',
          pClean,
          VALID_API("Users")
        )}
        ${returnButton(
          check.apiChecks.stateCheck,
          '<i class="fas fa-info-circle"></i>',
          pClean,
          VALID_API("State")
        )}
       ${returnButton(
         check.apiChecks.settingsCheck,
         '<i class="fas fa-cog"></i>',
         pClean,
         VALID_API("Settings")
       )}
       ${returnButton(
         check.apiChecks.octoPrintSystemInfo,
         '<i class="fas fa-question-circle"></i>',
         pClean,
         VALID_API("System Information")
       )}
     ${returnButton(
       check.apiChecks.octoPrintUpdatesCheck,
       '<i class="fas fa-wrench"></i>',
       pClean,
       VALID_API("System Updates")
     )}
      <br>
     ${returnButton(
       check.apiChecks.filesCheck,
       '<i class="fas fa-file-code"></i>',
       pClean,
       VALID_API("Files")
     )}
     ${returnButton(
       check.apiChecks.profileCheck,
       '<i class="fas fa-id-card"></i>',
       pClean,
       VALID_API("Profile")
     )}
     ${returnButton(
       check.apiChecks.systemCheck,
       '<i class="fas fa-server"></i>',
       pClean,
       VALID_API("System Commands")
     )}
     ${returnButton(
       check.apiChecks.octoPrintPluginsCheck,
       '<i class="fas fa-plug"></i>',
       pClean,
       VALID_API("Plugin Updates")
     )}
          </td>
          <td>
          ${returnNetworkConnection(check.connectionIssues)}
          </td>
          <td>
          ${returnButton(
            check.connectionChecks.baud,
            '<i class="fas fa-archway"></i>',
            pClean,
            VALID_CONN("Baudrate Default")
          )}
           ${returnButton(
             check.connectionChecks.port,
             '<i class="fas fa-plug"></i>',
             pClean,
             VALID_CONN("Port Default")
           )}
            ${returnButton(
              check.connectionChecks.profile,
              '<i class="fas fa-id-card-alt"></i>',
              pClean,
              VALID_CONN("Profile Default")
            )}
        </td>
        <td>
        ${returnButton(
          check.profileChecks,
          '<i class="fas fa-print"></i>',
          pClean,
          VALID_CONN("Printer Profile")
        )}
        </td>
        <td>
         ${returnButton(
           check.webcamChecks.camSetup,
           '<i class="fas fa-camera"></i>',
           pClean,
           VALID("Webcam")
         )}
        </td>
        <td>
        ${returnHistoryCamera(pClean, check.webcamChecks.historySetup)}
        </td>
        </tr>
    `;
}
