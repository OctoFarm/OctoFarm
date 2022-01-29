import {restartOctoFarmServer, setupOPTimelapseSettings, updateOctoFarmCommand} from "../server.actions";

const serverBootBoxOptions = {
  OP_TIMELAPSE_SETUP: {
    title: "Are you sure?",
    message:
      // eslint-disable-next-line max-len
      "If you press yes below your timelapse settings will automatically be updated to work with OctoFarms setup. The script will update any online instances and there shouldn't be a restart necassary. It does however presume you have your ffmpeg path setup with your snapshot URL inputted into OctoPrint.",
    buttons: {
      confirm: {
        label: "Yes",
        class: "btn-success"
      },
      cancel: {
        label: "No",
        class: "btn-danger"
      }
    },
    callback: async function (result) {
      if (result) {
        setupOPTimelapseSettings();
      }
    }
  },
  OF_SERVER_RESTART_REQUIRED: {
    message: "Your settings changes require a restart, would you like to do this now?",
    buttons: {
      cancel: {
        label: '<i class="fa fa-times"></i> Cancel'
      },
      confirm: {
        label: '<i class="fa fa-check"></i> Confirm'
      }
    },
    async callback(result) {
      if (result) {
        await restartOctoFarmServer();
      }
    }
  },
  OF_UPDATE_LOCAL_CHANGES: (updateOctoFarmBtn, message) => {
    return {
      title: '<span class="text-warning">Local file changes detected!</span>',
      message: message,
      buttons: {
        cancel: {
          className: "btn-danger",
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          className: "btn-success",
          label: '<i class="fa fa-check"></i> Override'
        }
      },
      async callback(result) {
        if (result) {
          await updateOctoFarmCommand(true);
        } else {
          if (updateOctoFarmBtn) {
            updateOctoFarmBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Update OctoFarm';
            updateOctoFarmBtn.disabled = false;
          }
        }
      }
    };
  },
  OF_UPDATE_MISSING_DEPENDENCIES: (updateOctoFarmBtn, message) => {
    return {
      title: '<span class="text-warning">Missing dependencies detected!</span>',
      message: message,
      buttons: {
        cancel: {
          className: "btn-danger",
          label: '<i class="fa fa-times"></i> Cancel'
        },
        confirm: {
          className: "btn-success",
          label: '<i class="fa fa-check"></i> Confirm'
        }
      },
      callback: function (result) {
        if (result) {
          updateOctoFarmCommand(false, true);
        } else {
          if (updateOctoFarmBtn) {
            updateOctoFarmBtn.innerHTML = '<i class="fas fa-thumbs-up"></i> Update OctoFarm';
            updateOctoFarmBtn.disabled = false;
          }
        }
      }
    };
  }
};

export { serverBootBoxOptions };
