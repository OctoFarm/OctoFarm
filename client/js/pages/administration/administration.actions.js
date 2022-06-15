import OctoFarmClient from "../../services/octofarm-client.service";
import { grabSystemPageSettingsValues, grabThemePageSettingsValues } from "./administration.helpers";
import { handleServerResponse } from "../../utils/server-response.utils";
import e from "../../utils/elements";
import UI from "../../utils/ui";

export const updateTaskListState = async () => {
    const taskManagerState = await OctoFarmClient.getSystemRunningTaskList();
    for (const task in taskManagerState) {
        const theTask = taskManagerState[task];
        const { options: taskOptions } = theTask;
        const { periodic } = taskOptions;

        if (periodic) {
            e.doesElementNeedUpdating(
                e.get("firstExecution-" + task),
                theTask.firstCompletion
                    ? new Date(theTask.firstCompletion)
                        .toLocaleString()
                        .replace(",", ": ")
                    : "Not Started",
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                e.get("lastExecution-" + task),
                theTask.lastExecuted
                    ? new Date(theTask.lastExecuted).toLocaleString().replace(",", ": ")
                    : "Not Finished",
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                e.get("duration-" + task),
                theTask.duration
                    ? UI.generateMilisecondsTime(theTask.duration)
                    : "<i class=\"fas fa-sync fa-spin\"></i>",
                "innerHTML"
            );

            e.doesElementNeedUpdating(
                e.get("next-" + task),
                theTask.nextRun
                    ? new Date(theTask.nextRun).toLocaleString().replace(",", ": ")
                    : "First Not Completed",
                "innerHTML"
            );
        }
    }
}

export const saveSystemSettings = async () => {
    const newSystemSettings = grabSystemPageSettingsValues();
    handleServerResponse(await OctoFarmClient.saveNewSystemSettings(newSystemSettings), "Successfully saved your system settings!")
}

export const saveThemeSettings = async () => {
    const newSystemSettings = grabThemePageSettingsValues();
    console.log(newSystemSettings)
    handleServerResponse(await OctoFarmClient.saveNewThemeSettings(newSystemSettings), "Successfully saved your theme settings!")
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
