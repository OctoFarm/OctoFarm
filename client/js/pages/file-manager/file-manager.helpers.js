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
