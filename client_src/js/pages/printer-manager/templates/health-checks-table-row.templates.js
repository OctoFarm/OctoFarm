// <th scope="col" className="sticky-table table-dark" style="">Printer Name</th>
// <!--                                Printer Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Printer Settings</th>
// <!--                                Connection Checks-->
// <th scope="col" className="sticky-table table-dark" style="">Connection Settings</th>
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

export function returnHealthCheckRow(check) {
  return `
        <tr>
        <td>${check.printerName}</td>
        <td>
          <button
                  class="btn btn-${
                    check.apiChecks.userCheck ? "success" : "danger"
                  } btn-sm mb-1" id="apiCheck"><i class="fas fa-users"></i></button>
          <button
                  class="btn btn-danger btn-sm mb-1" id="stateCheck"><i
                      class="fas fa-info-circle"></i></button>

          <button
                  class="btn btn-danger btn-sm mb-1" id="settingsCheck"><i
                      class="fas fa-cog"></i></button>
          <button
                  class="btn btn-danger btn-sm mb-1" id="systemInfoCheck"><i class="fas fa-question-circle"></i></button>
          <button
                  class="btn btn-danger btn-sm mb-1" id="updatesCheck"><i class="fas fa-wrench"></i></button>
                  <br>
          <button
                class="btn btn-danger btn-sm" id="filesCheck"><i
                    class="fas fa-file-code"></i></button>
          <button
                class="btn btn-danger btn-sm" id="profileCheck"><i
                    class="fas fa-id-card"></i></button>
          <button
                class="btn btn-danger btn-sm" id="systemCheck"><i
                    class="fas fa-server"></i></button>
          <button
                class="btn btn-danger btn-sm" id="pluginsCheck"><i class="fas fa-plug"></i></button>
          </td>
        </tr>
    `;
}
