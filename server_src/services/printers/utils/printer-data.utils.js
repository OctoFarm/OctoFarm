/**
 * Function to convert octoprints camera data to usable stream
 * @param currentURL
 * @param printerURL
 * @param streamURL
 * @returns {string}
 */
const acquireWebCamDataFromOP = (currentURL, printerURL, streamURL) => {
  if (typeof currentURL === "undefined" || typeof streamURL === "undefined" || !printerURL) {
    throw new Error("Missing required keys!");
  }

  let returnURL = "";
  // Only acquire camera url if it doesn't already exists / user inputted
  if (currentURL === "" || currentURL === " ") {
    if (!!streamURL) {
      if (streamURL.includes("http")) {
        returnURL = streamURL;
      } else {
        returnURL = printerURL + streamURL;
      }
      return returnURL;
    } else {
      return returnURL;
    }
  } else {
    return returnURL;
  }
};

const acquirePrinterNameDataFromOP = () => {
  if (!farmPrinters[index].settingsAppearance) {
    farmPrinters[index].settingsAppearance = res.appearance;
  } else if (farmPrinters[index].settingsAppearance.name === "") {
    farmPrinters[index].settingsAppearance.name = res.appearance.name;
  }
};

module.exports = {
  acquireWebCamDataFromOP
};
