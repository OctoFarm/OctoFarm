import { ClientError } from "../exceptions/client-error.handler";
import { ClientErrors } from "../exceptions/client.exceptions";
import { reloadCurrentWindow } from "../utils/window.util";

// Feeling like I'd prefer state management here, window object works for now.
window.isServerOnline = true;
window.awaitingConnectionRestored = false;

export default class AmIAliveService {
  static getStatus() {
    return window.isServerOnline;
  }
  static setStatus(newStatus) {
    if (typeof newStatus !== "boolean") throw new ClientError(ClientErrors.INCORRECT_TYPE_SUPPLIED);
    window.isServerOnline = newStatus;
  }
  static showModal() {
    $("#lostServerConnection").modal("show");
  }
  static connectionRestored() {
    const modal = document.getElementById("lostServerConnection");
    if (modal.classList.contains("show") && !window.awaitingConnectionRestored) {
      //Connection recovered, re-load printer page
      const spinner = document.getElementById("lostConnectionSpinner");
      const text = document.getElementById("lostConnectionText");
      spinner.className = "fas fa-spinner";
      let countDown = 5;
      setInterval(async () => {
        text.innerHTML =
          "Connection Restored! <br> Reloading the page automatically in " +
          countDown +
          " seconds...";
        text.innerHTML = `Connection Restored! <br> Automatically reloading the page in ${countDown} seconds... <br><br>
                                <button id="reloadBtn" type="button" class="btn btn-success">Reload Now!</button>
                            `;
        document.getElementById("reloadBtn").addEventListener("click", function () {
          reloadCurrentWindow();
        });
        if (countDown === 0) reloadCurrentWindow();
        countDown = countDown - 1;
        window.awaitingConnectionRestored = true;
      }, 1000);
    }
  }
}
