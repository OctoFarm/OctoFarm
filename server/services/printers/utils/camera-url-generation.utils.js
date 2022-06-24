const { getRandomInt } = require("../../../utils/random.util");

const generateOctoFarmCameraURL = (printer) => {
  const { camURL, _id } = printer;

  if (camURL.length === 0) {
    return "";
  }

  if (!!_id) {
    //printer.clientCamURL = `/camera/${_id}?${getRandomInt(1000000, 9999999)}`;
    printer.clientCamURL = camURL;
  }

  return camURL;
};

module.exports = {
  generateOctoFarmCameraURL
};
