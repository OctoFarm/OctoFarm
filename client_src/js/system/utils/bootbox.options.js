import { setupOPTimelapseSettings } from "./server.actions";

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
  }
};

export { serverBootBoxOptions };
