import { reloadWindow } from "../utils/window.utils";

let countDownInterval = false;
let triggerTimeout = false;
let countDownSeconds = 5;
let reloadListenerAdded = false;
export const reconnectFrequency = {
  seconds: 3,
  get getSeconds() {
    return this.seconds;
  },
  set setSeconds(seconds) {
    this.seconds = seconds;
  },
};

export const triggerCountDownTimer = (seconds) => {
  countDownSeconds = seconds;
  const lostConnectionTimer = document.getElementById(
    "lostServerConnectionTimer"
  );
  if (!countDownInterval) {
    countDownInterval = setInterval(() => {
      if (countDownSeconds <= 1) {
        //reset the counter
        lostConnectionTimer.innerHTML = "Now!";
        clearInterval(countDownInterval);
        countDownInterval = false;
      } else {
        countDownSeconds--;
        lostConnectionTimer.innerHTML = `${countDownSeconds} seconds...`;
      }
    }, 1000);
  }
};
export const drawModal = async () => {
  if (!reloadListenerAdded) {
    document
      .getElementById("forceRefreshPageButton")
      .addEventListener("click", () => {
        reloadWindow();
      });
  }

  if (!triggerTimeout) {
    triggerTimeout = setTimeout(() => {
      $("#lostServerConnection").modal("show");
      triggerTimeout = false;
    }, 5000);
  }
};
export const closeModal = async () => {
  $("#lostServerConnection").modal("hide");
};
export const setServerAlive = async (message) => {
  window.serverOffline = false;
  const lostServerConnectionModal = document.getElementById(
    "lostServerConnection"
  );
  if (
    lostServerConnectionModal &&
    lostServerConnectionModal.className.includes("show")
  ) {
    // If user has login enabled then we need to refresh the session..
    let reMessage = "";
    if (!!message?.loginRequired) {
      reMessage = "Server is alive, reloading screen...";
    } else {
      reMessage = "Server is alive!";
    }
    document.getElementById("lostServerConnectionTimer").innerHTML = reMessage;
    if (!!message?.loginRequired) {
      await reloadWindow();
    } else {
      await closeModal();
    }
  }
};
