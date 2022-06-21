const generateOctoFarmCameraURL = (printer) => {
  const { camURL, _id } = printer;

  if (camURL.length === 0) {
    return "";
  }

  if (!!_id) {
    printer.clientCamURL = "/camera/" + _id;
  }

  return camURL;
};

module.exports = {
  generateOctoFarmCameraURL
};
