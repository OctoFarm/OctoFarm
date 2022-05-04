import UI from "../../utils/ui";

export const fileActionStatusResponse = (
  status,
  item,
  action,
  actionPastTense
) => {
  if (status === 204 || status === 200) {
    UI.createAlert(
      "error",
      `We could not find the ${item}, does it exist?`,
      3000,
      "clicked"
    );
  } else if (status === 409) {
    UI.createAlert(
      "warning",
      `There was a conflict, ${item} already exists or is in use...`,
      3000,
      "clicked"
    );
  } else {
    UI.createAlert(
      "success",
      `Successfully ${actionPastTense} your ${item}...`,
      3000,
      "clicked"
    );
  }
};
export const printActionStatusResponse = (status, action) => {
  if (status === 204 || status === 200 || status === 201) {
    UI.createAlert(
      "success",
      `Your ${action} command was successful`,
      3000,
      "clicked"
    );
  } else if (status === 409) {
    UI.createAlert(
      "warning",
      `There was a conflict, could not complete the ${action} command.`,
      3000,
      "clicked"
    );
  } else {
    UI.createAlert(
      "error",
      `There was an error with your ${action} command`,
      3000,
      "clicked"
    );
  }
};
