const { getRandomInt } = require("../../../utils/random.util");

const generateOctoFarmCameraURL = (printer) => {
  const { camURL, _id } = printer;

  if (camURL.length === 0) {
    return "";
  }

  if (!_id) {
    return "";
  }
  return `/camera/${_id}?${getRandomInt(1000000, 9999999)}`;
};

module.exports = {
  generateOctoFarmCameraURL
};
