import UI from "./lib/functions/ui.js";
import Script from "./services/octofarm-scripts.service";
import ClientSettings from "./system/client-settings";
import {
  localStorageKeys,
  serverActionsElements,
  serverDatabaseKeys,
  userActionElements,
  returnSaveBtn
} from "./system/server.options";
import {
  generateLogDumpFile,
  exportDatabases,
  nukeDatabases,
  restartOctoFarmServer,
  checkFilamentManagerPluginState,
  updateServerSettings,
  updateOctoFarmCommand,
  checkForOctoFarmUpdates,
  grabOctoFarmLogList,
  startUpdatePageRunner,
  renderSystemCharts,
  createNewUser,
  editUser,
  deleteUser,
  resetUserPassword,
  fillInEditInformation
} from "./system/server.actions";
import { serverBootBoxOptions } from "./system/utils/bootbox.options";

// Setup Page
for (const key in serverDatabaseKeys) {
  if (serverDatabaseKeys.hasOwnProperty(key)) {
    document
      .getElementById(`nuke${serverDatabaseKeys[key]}`)
      .addEventListener("click", async (e) => {
        const alert = UI.createAlert(
          "warning",
          `${UI.returnSpinnerTemplate()} Deleting ${serverDatabaseKeys[key]} database...`
        );
        await nukeDatabases(`${serverDatabaseKeys[key]}DB`, e);
        alert.close();
      });
    if (key !== "ALL") {
      document
        .getElementById(`export${serverDatabaseKeys[key]}`)
        .addEventListener("click", async (e) => {
          const alert = UI.createAlert(
            "warning",
            `${UI.returnSpinnerTemplate()} Preparing ${serverDatabaseKeys[key]} database...`
          );
          await exportDatabases(`${serverDatabaseKeys[key]}DB`, e);
          alert.close();
        });
    }
  }
}

checkFilamentManagerPluginState().then();
grabOctoFarmLogList().then();
Script.get().then();
renderSystemCharts();
startUpdatePageRunner();
ClientSettings.init();

serverActionsElements.OP_TIMELAPSE_SETUP.addEventListener("click", async (e) => {
  bootbox.confirm(serverBootBoxOptions.OP_TIMELAPSE_SETUP);
});

serverActionsElements.LOG_DUMP_GENERATE.addEventListener("click", async (e) => {
  const alert = UI.createAlert(
    "warning",
    `${UI.returnSpinnerTemplate()} Generating log dump, please wait...`
  );
  await generateLogDumpFile();
  alert.close();
});

serverActionsElements.RESET_DASHBOARD.addEventListener("click", (e) => {
  removeLocalStorage(localStorageKeys.DASHBOARD_SETTINGS);
  UI.createAlert("success", "Dashboard data cleared from browser", 3000, "clicked");
});

serverActionsElements.SAVE_SERVER_SETTINGS.addEventListener("click", async (e) => {
  // Validate Printer Form, then Add
  await updateServerSettings();
});
serverActionsElements.RESTART_OCTOFARM.addEventListener("click", async (e) => {
  await restartOctoFarmServer();
});
serverActionsElements.UPDATE_OCTOFARM.addEventListener("click", async (e) => {
  await updateOctoFarmCommand(false);
});
serverActionsElements.CHECK_OCTOFARM_UPDATES.addEventListener("click", async (e) => {
  await checkForOctoFarmUpdates();
});
serverActionsElements.SAVE_CLIENT_SETTINGS.addEventListener("click", async (e) => {
  // Validate Printer Form, then Add
  await ClientSettings.update();
});

// Setup user create btn
userActionElements.createUserBtn.addEventListener("click", (e) => {
  userActionElements.createUserFooter.innerHTML = `
    ${returnSaveBtn()}
  `;
  const userActionSave = document.getElementById("userActionSave");
  userActionSave.addEventListener("click", async () => {
    await createNewUser();
  });
});

// Setup user password resets
const passResetButtons = document.querySelectorAll('*[id^="resetPasswordBtn-"]');
passResetButtons.forEach((btn) => {
  const split = btn.id.split("-");
  btn.addEventListener("click", (e) => {
    userActionElements.resetPasswordFooter.innerHTML = `
    ${returnSaveBtn()}
  `;
    const userActionSave = document.getElementById("userActionSave");
    userActionSave.addEventListener("click", async () => {
      await resetUserPassword(split[1]);
    });
  });
});

// Setup user edits
const userEditButtons = document.querySelectorAll('*[id^="editUserBtn-"]');
userEditButtons.forEach((btn) => {
  const split = btn.id.split("-");
  btn.addEventListener("click", async (e) => {
    userActionElements.editUserFooter.innerHTML = `
    ${returnSaveBtn()}
  `;
    await fillInEditInformation(split[1]);
    const userActionSave = document.getElementById("userActionSave");
    userActionSave.addEventListener("click", async () => {
      await editUser(split[1]);
    });
  });
});

// Setup user deletes
const deleteButtons = document.querySelectorAll('*[id^="deleteUserBtn-"]');
deleteButtons.forEach((btn) => {
  const split = btn.id.split("-");
  btn.addEventListener("click", (e) => {
    deleteUser(split[1]);
  });
});

$("#userCreateModal").on("hidden.bs.modal", function (e) {
  const userActionSave = document.getElementById("userActionSave");
  userActionElements.userCreateMessage.innerHTML = "";
  userActionSave.remove();
});
$("#usersResetPasswordModal").on("hidden.bs.modal", function (e) {
  const userActionSave = document.getElementById("userActionSave");
  userActionElements.userResetMessage.innerHTML = "";
  userActionSave.remove();
});
$("#userEditModal").on("hidden.bs.modal", function (e) {
  const userActionSave = document.getElementById("userActionSave");
  userActionElements.userEditMessage.innerHTML = "";
  userActionSave.remove();
});
