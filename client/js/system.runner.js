import UI from "./utils/ui.js";
import Script from "./services/octofarm-scripts.service";
import ClientSettings from "./pages/system/client-settings";
import {
  localStorageKeys,
  returnSaveBtn,
  serverActionsElements,
  userActionElements,
} from "./pages/system/server.options";
import {
  checkFilamentManagerPluginState,
  checkForOctoFarmUpdates,
  clearOldLogs,
  createNewUser,
  deleteUser,
  editUser,
  exportDatabases,
  fillInEditInformation,
  generateLogDumpFile,
  grabOctoFarmLogList,
  nukeDatabases,
  renderSystemCharts,
  resetUserPassword,
  restartOctoFarmServer,
  setupOPFilamentManagerPluginSettings,
  startUpdateInfoRunner,
  startUpdateTasksRunner,
  updateOctoFarmCommand,
  updateServerSettings,
} from "./pages/system/server.actions";
import { serverBootBoxOptions } from "./pages/system/utils/bootbox.options";
import { removeLocalStorage } from "./services/local-storage.service";
import { serverDatabaseKeys } from "../../server/constants/database.constants";

// Setup Page
for (const key in serverDatabaseKeys) {
  if (serverDatabaseKeys.hasOwnProperty(key)) {
    const elementNuke = document.getElementById(
      `nuke${serverDatabaseKeys[key]}`
    );
    if (elementNuke) {
      elementNuke.addEventListener("click", async (e) => {
        const alert = UI.createAlert(
          "warning",
          `${UI.returnSpinnerTemplate()} Deleting ${
            serverDatabaseKeys[key]
          } database...`
        );
        await nukeDatabases(`${serverDatabaseKeys[key]}DB`, e);
        alert.close();
      });
    }

    if (key !== "ALL") {
      const elementExport = document.getElementById(
        `export${serverDatabaseKeys[key]}`
      );

      if (elementExport) {
        elementExport.addEventListener("click", async (e) => {
          const alert = UI.createAlert(
            "warning",
            `${UI.returnSpinnerTemplate()} Preparing ${
              serverDatabaseKeys[key]
            } database...`
          );
          await exportDatabases(`${serverDatabaseKeys[key]}DB`, e);
          alert.close();
        });
      }
    }
  }
}
// HACK Filament Manager and Script functions do not need to be coupled to LOG_DUMP element.
if (serverActionsElements.LOG_DUMP_GENERATE) {
  checkFilamentManagerPluginState().then();
  grabOctoFarmLogList().then();
  Script.get().then();
}

renderSystemCharts().then();
startUpdateTasksRunner();
startUpdateInfoRunner().then();
ClientSettings.init().then();

if (serverActionsElements.CLEAR_OLD_LOGS) {
  serverActionsElements.CLEAR_OLD_LOGS.addEventListener("click", async (e) => {
    await clearOldLogs();
  });
}

if (serverActionsElements.OP_TIMELAPSE_SETUP) {
  serverActionsElements.OP_TIMELAPSE_SETUP.addEventListener(
    "click",
    async (e) => {
      bootbox.dialog(serverBootBoxOptions.OP_TIMELAPSE_SETUP);
    }
  );
}

if (serverActionsElements.OP_FILAMENT_SETUP) {
  serverActionsElements.OP_FILAMENT_SETUP.addEventListener(
    "click",
    async (e) => {
      await setupOPFilamentManagerPluginSettings();
    }
  );
}

if (serverActionsElements.LOG_DUMP_GENERATE) {
  serverActionsElements.LOG_DUMP_GENERATE.addEventListener(
    "click",
    async (e) => {
      const alert = UI.createAlert(
        "warning",
        `${UI.returnSpinnerTemplate()} Generating log dump, please wait...`
      );
      await generateLogDumpFile();
      alert.close();
    }
  );
}

if (serverActionsElements.RESET_DASHBOARD) {
  serverActionsElements.RESET_DASHBOARD.addEventListener("click", (e) => {
    removeLocalStorage(localStorageKeys.DASHBOARD_SETTINGS);
    UI.createAlert(
      "success",
      "Dashboard data cleared from browser",
      3000,
      "clicked"
    );
  });
}

if (serverActionsElements.SAVE_SERVER_SETTINGS) {
  serverActionsElements.SAVE_SERVER_SETTINGS.addEventListener(
    "click",
    async (e) => {
      // Validate Printer Form, then Add
      await updateServerSettings();
    }
  );
}

if (serverActionsElements.RESTART_OCTOFARM) {
  serverActionsElements.RESTART_OCTOFARM.addEventListener(
    "click",
    async (e) => {
      await restartOctoFarmServer();
    }
  );
}

if (serverActionsElements.UPDATE_OCTOFARM) {
  serverActionsElements.UPDATE_OCTOFARM.addEventListener("click", async (e) => {
    await updateOctoFarmCommand(false);
  });
}

if (serverActionsElements.CHECK_OCTOFARM_UPDATES) {
  serverActionsElements.CHECK_OCTOFARM_UPDATES.addEventListener(
    "click",
    async (e) => {
      await checkForOctoFarmUpdates();
    }
  );
}

if (serverActionsElements.SAVE_CLIENT_SETTINGS) {
  serverActionsElements.SAVE_CLIENT_SETTINGS.addEventListener(
    "click",
    async (e) => {
      // Validate Printer Form, then Add
      await ClientSettings.update();
    }
  );
}

if (userActionElements.createUserBtn) {
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
}

// Setup user password resets
const passResetButtons = document.querySelectorAll(
  "*[id^=\"resetPasswordBtn-\"]"
);
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

if (serverActionsElements.RESET_DASHBOARD) {
}
// Setup user edits
const userEditButtons = document.querySelectorAll("*[id^=\"editUserBtn-\"]");
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
const deleteButtons = document.querySelectorAll("*[id^=\"deleteUserBtn-\"]");
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
