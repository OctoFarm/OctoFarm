const { SettingsClean } = require("../../settings-cleaner.service");

const generateOctoFarmCameraURL = (printer, live) => {
  const { camURL, _id } = printer;

  if (SettingsClean.isProxyCamerasEnabled()) {
    return camURL;
  }

  if (camURL.length === 0) {
    return "";
  }

  if (!_id) {
    return "";
  }

  return `/camera/${_id}`;
};

module.exports = {
  generateOctoFarmCameraURL
};
