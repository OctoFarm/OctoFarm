import OctoFarmClient from "../../services/octofarm-client.service";
import { grabSystemPageSettingsValues } from "./administration.helpers";
import { handleServerResponse } from "../../utils/server-response.utils";
import e from "../../utils/elements";

export const updateTaskListState = async () => {
    const taskManagerState = await OctoFarmClient.getSystemRunningTaskList();
    for (const task in taskManagerState) {
        const theTask = taskManagerState[task];
        const { options: taskOptions } = theTask;
        const { periodic } = taskOptions;

        if (periodic) {
            e.doesElementNeedUpdating(
                theTask.firstCompletion
                    ? new Date(theTask.firstCompletion)
                        .toLocaleString()
                        .replace(",", ": ")
                    : "Not Started",
                document.getElementById("firstExecution-" + task),
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                theTask.lastExecuted
                    ? new Date(theTask.lastExecuted).toLocaleString().replace(",", ": ")
                    : "Not Finished",
                document.getElementById("lastExecution-" + task),
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                theTask.duration
                    ? UI.generateMilisecondsTime(theTask.duration)
                    : "<i class=\"fas fa-sync fa-spin\"></i>",
                document.getElementById("duration-" + task),
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                theTask.nextRun
                    ? new Date(theTask.nextRun).toLocaleString().replace(",", ": ")
                    : "First Not Completed",
                document.getElementById("next-" + task),
                "innerHTML"
            );
        }
    }
}

export const saveSystemSettings = async () => {
    const newSystemSettings = grabSystemPageSettingsValues();
    handleServerResponse(await OctoFarmClient.saveNewSystemSettings(newSystemSettings), "Successfully saved your system settings!")
}

export const restartOctoFarmServer = () => {
    console.log("RESTARTING SERVER")
  // const systemRestartBtn = document.getElementById("restartOctoFarmBtn");
  // // Make sure the system button is disabled whilst the restart is happening.
  // if (systemRestartBtn) {
  //   systemRestartBtn.disabled = true;
  // }
  // const restart = await OctoFarmClient.restartServer();
  // if (restart) {
  //   UI.createAlert(
  //     "success",
  //     "System restart command was successful, the server will restart in 5 seconds...",
  //     5000,
  //     "clicked"
  //   );
  // } else {
  //   UI.createAlert(
  //     "error",
  //     "Service restart failed... " +
  //       "Please check: " +
  //       "<a type=”noopener” href='https://docs.octofarm.net/installation/setup-service.html'> " +
  //       "OctoFarm Service Setup </a> for more information ",
  //     5000,
  //     "clicked"
  //   );
  // }
  //
  // setTimeout(() => {
  //   if (systemRestartBtn) {
  //     systemRestartBtn.disabled = false;
  //   }
  // }, 5000);
}