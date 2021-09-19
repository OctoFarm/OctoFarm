import AxiosClient from "./services/axios.service";

import { TIMERS } from "./constants/timer.constants";

let interval;
const amIAliveStartMessage = `Starting am I alive service checking... ${TIMERS.AMIALIVE}ms`;

(async function () {
  console.log(amIAliveStartMessage);
  await AxiosClient.serverAliveCheck();
  if (!interval) {
    interval = setInterval(async () => {
      await AxiosClient.serverAliveCheck();
    }, TIMERS.AMIALIVE);
  }
})();
