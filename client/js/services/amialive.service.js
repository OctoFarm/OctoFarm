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
    }
};

export const triggerCountDownTimer = (seconds) => {
    console.log(seconds)
    countDownSeconds = seconds
    if(!countDownInterval){
        countDownInterval = setInterval(() => {
            if(countDownSeconds <= 1){
                //reset the counter
                clearInterval(countDownInterval)
                countDownInterval = false;
            }else{
                countDownSeconds--
                document.getElementById("lostServerConnectionTimer").innerHTML = `${countDownSeconds}`;
            }
        },1000)
    }
}
export const drawModal = async () => {
    if(!reloadListenerAdded){
        document.getElementById("forceRefreshPageButton").addEventListener("click", () => {
            reloadWindow();
        })
    }

    if(!triggerTimeout){
        triggerTimeout = setTimeout(() => {
            $("#lostServerConnection").modal("show");
            triggerTimeout = false;
        },5000)
    }
};
export const closeModal = async () => {
    $("#lostServerConnection").modal("hide");
};
export const setServerAlive = async (message) => {
    window.serverOffline = false;
    const lostServerConnectionModal = document.getElementById("lostServerConnection");
    if (lostServerConnectionModal && lostServerConnectionModal.className.includes("show")) {
        // If user has login enabled then we need to refresh the session...
        if(!!message?.loginRequired){
            await reloadWindow();
        }else{
            await closeModal();
        }

    }
}

