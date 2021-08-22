import UI from "../lib/functions/ui";

const bootboxConfirmTemplate = {
  ARE_YOU_SURE: (printerName, action, confirmCallback) => {
    return {
      message: `Are your sure you want to ${action} ${printerName}?`,
      buttons: {
        cancel: {
          label: '<i class="fa fa-times"></i> No'
        },
        confirm: {
          label: '<i class="fa fa-check"></i> Yes'
        }
      },
      async callback(result) {
        if (result) {
          await confirmCallback();
          UI.createAlert("success", `${printerName}: ${action} was successful`, 3000, "clicked");
        }
      }
    };
  }
};

export { bootboxConfirmTemplate };
