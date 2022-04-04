import UI from "../../utils/ui";
import OctoFarmClient from "../../services/octofarm-client.service";
import FileManagerSortingService from "../../services/file-manager-sorting.service";

export const generatePathList = (folderList) => {
  const options = [];
  const loc = {
    text: "local",
    value: "/",
  };
  options.push(loc);
  folderList.forEach((folder) => {
    const option = {
      text: folder.name,
      value: folder.name,
    };
    options.push(option);
  });
  return options;
};
export const getCurrentUploadLimit = () => {};
export const setCurrentUploadLimit = () => {};
export const getFileListElement = (id) => {
  return document.getElementById(`fileList-${id}`);
};
export const fileActionStatusResponse = async (post, item, action) => {
  const {status} = post;
  if (status === 404) {
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
        "warning",
        `${action} ${item}... please wait.`,
        3000,
        "clicked"
    );
    UI.createAlert(
        "success",
        `Successfully ${action} your ${item}...`,
        3000,
        "clicked"
    );
  }
}
