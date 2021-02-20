import "@babel/polyfill";
let interval = false;
let timer = false;

const drawModal = async function () {
  $("#lostServerConnection").modal("show");
};

const reloadWindow = async function () {
  if (location.href.includes("submitEnvironment")) {
    const hostName =
      window.location.protocol + "//" + window.location.host + "";
    window.location.replace(hostName);
    return false;
  } else {
    window.location.reload();
    return false;
  }
};

const serverAliveCheck = async function () {
  if (!interval) {
    setInterval(async () => {
      const modal = document.getElementById("lostServerConnection");
      try {
        let alive = await fetch("/serverChecks/amialive");
        if (alive.status !== 200) throw "No Server Connection";
        alive = await alive.json();
        if (modal.classList.contains("show")) {
          //Connection recovered, re-load printer page
          const spinner = document.getElementById("lostConnectionSpinner");
          const text = document.getElementById("lostConnectionText");
          spinner.className = "fas fa-spinner";
          if (!timer) {
            let countDown = 5;
            timer = true;
            setInterval(async () => {
              text.innerHTML =
                "Connection Restored! <br> Reloading the page automatically in " +
                countDown +
                " seconds...";
              text.innerHTML = `Connection Restored! <br> Automatically reloading the page in ${countDown} seconds... <br><br>
                                    <button id="reloadBtn" type="button" class="btn btn-success">Reload Now!</button>
                                `;
              document
                .getElementById("reloadBtn")
                .addEventListener("click", reloadWindow());
              countDown = countDown - 1;
            }, 1000);
            setTimeout(async () => {
              reloadWindow();
            }, 2500);
          }
        }
      } catch (e) {
        drawModal();
        console.error(e);
        clearInterval(interval);
        interval = false;
        serverAliveCheck();
      }
    }, 5000);
  }
};

serverAliveCheck();
