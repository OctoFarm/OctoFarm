import OctoFarmClient from "./services/octofarm-client.service";
import e from "./utils/elements";
import { grabOctoFarmLogList } from "./templates/table-row.templates";
import {areYouSureConfirmToast, createErrorToast, createSuccessToast, createWarningToast} from "./utils/toast";

const generateLogDumpBtn = e.get("log-generate-dump-btn");
const downloadLogDumpBtn = e.get("log-download-dump-btn");
const houseKeepLogsBtn = e.get("log-clear-log-btn");
const logListTableRows = e.get("log-list-table");
const informationLogsModal = e.get("informationLogsModal");
const logsLoader = e.get("log-loading");

let zipDumpPath = "";

const generateLogDump = async () => {
   e.appendLoader(generateLogDumpBtn);
   const logDumpResponse = await OctoFarmClient.generateLogDump();

   if(!!logDumpResponse){
       e.removeLoader(generateLogDumpBtn);
       return;
   }

   // Error detected so no need to create button.
   if (logDumpResponse.status === "error") {
      createErrorToast({ message: logDumpResponse.msg })
       e.removeLoader(generateLogDumpBtn);
      return;
   }

  createSuccessToast({ message: logDumpResponse.msg });
  downloadLogDumpBtn.classList.remove("d-none");
  e.removeLoader(generateLogDumpBtn);
}

const deleteLog = async (event, name) => {
    event.target.disabled = true;
    const deletedLog = await OctoFarmClient.deleteSystemLog(name);
    if(!!deletedLog){
        const logLine = document.getElementById(`log-${name}`);
        createSuccessToast({
            message: "Successfully deleted "+name
        })
        logLine.remove();
    }
}

const houseCleanLogs = async () => {
    const deletedLogs = await OctoFarmClient.houseKeepLogs();

    if(typeof deletedLogs === "undefined"){
        return;
    }

    if(deletedLogs.length === 0){
        createWarningToast({ message: "No logs older than 5 days to delete" })
        return
    }

    let message = "";
    deletedLogs.forEach((log) => {
        const logLine = document.getElementById(`log-${log.replace("../logs/", "")}`);
        if(!!logLine){
            logLine.remove();
        }
        message += `${log}<br>`;
    })
    createSuccessToast({message});
}

const loadLogListTable = async () => {
    const logsList = await OctoFarmClient.getSystemLogsList();
    if(!!logsList){
        logListTableRows.innerHTML = "";
        logsList.forEach((log) => {
            logListTableRows.insertAdjacentHTML("beforeend", grabOctoFarmLogList(log))
            document.getElementById(log.name + "-download").addEventListener("click", () => {
                OctoFarmClient.downloadSystemLog(log.name)
            });
            document.getElementById(log.name + "-delete").addEventListener("click", async (event) => {
                await deleteLog(event, log.name);
            })
        })
        logsLoader.innerHTML = "";
    }
}


informationLogsModal.addEventListener("show.bs.modal", async () => {
    await loadLogListTable();
})

generateLogDumpBtn.addEventListener("click", async () => {
    await generateLogDump();
})

downloadLogDumpBtn.addEventListener("click", async () => {
    await OctoFarmClient.downloadSystemLog(zipDumpPath)
})

houseKeepLogsBtn.addEventListener("click", async () => {
    areYouSureConfirmToast({message: "Logs older than 5 days will be removed, Are you sure?", confirmFunction: houseCleanLogs});
})

