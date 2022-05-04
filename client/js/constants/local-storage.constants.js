export const LOCAL_STORAGE_CONSTANTS = () => {
  return {
    FILE_UPLOAD_LIMIT: "file-upload-limit",
    DASHBOARD_CONFIG: "dashboardConfiguration", // REFACTOR - Not dire but could do with changing to kebab case like the rest.
  };
};

export const LOCAL_STORAGE_LIST = () => {
  const LOCAL_STORAGE = LOCAL_STORAGE_CONSTANTS();
  return Object.keys(LOCAL_STORAGE).map(function (key) {
    return LOCAL_STORAGE[key];
  });
};
