const { each } = require("lodash");
/**
 * Function to convert octoprints camera data to usable stream
 * @param currentURL
 * @param printerURL
 * @param streamURL
 * @returns {string}
 */
const acquireWebCamData = (currentURL, printerURL, streamURL) => {
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

const acquirePrinterFilesAndFolderData = function (fileList) {
  const printerFiles = [];
  const printerLocations = [];

  const recursivelyPrintNames = function (entry, depth) {
    // eslint-disable-next-line no-param-reassign
    depth = depth || 0;
    let timeStat = "";
    let filament = [];
    const isFolder = entry.type === "folder";
    if (!isFolder) {
      if (typeof entry.gcodeAnalysis !== "undefined") {
        if (typeof entry.gcodeAnalysis.estimatedPrintTime !== "undefined") {
          timeStat = entry.gcodeAnalysis.estimatedPrintTime;
          // Start collecting multiple tool lengths and information from files....
          Object.keys(entry.gcodeAnalysis.filament).forEach(function (item, i) {
            filament[i] = entry.gcodeAnalysis.filament[item].length;
          });
        } else {
          timeStat = "No Time Estimate";
          filament = null;
        }
      } else {
        timeStat = "No Time Estimate";
        filament = null;
      }

      let path = null;
      if (entry.path.indexOf("/") > -1) {
        path = entry.path.substr(0, entry.path.lastIndexOf("/"));
      } else {
        path = "local";
      }
      let thumbnail = null;

      if (typeof entry.thumbnail !== "undefined") {
        thumbnail = entry.thumbnail;
      }

      let success = 0;
      let failed = 0;
      let last = null;

      if (typeof entry.prints !== "undefined") {
        success = entry.prints.success;
        failed = entry.prints.failure;
        last = entry.prints.last.success;
      }

      const file = {
        path,
        fullPath: entry.path,
        display: entry.display,
        length: filament,
        name: entry.name,
        size: entry.size,
        time: timeStat,
        date: entry.date,
        thumbnail,
        success: success,
        failed: failed,
        last: last
      };
      printerFiles.push(file);
    }

    const folderPaths = {
      name: "",
      path: "",
      display: ""
    };
    if (isFolder) {
      if (entry.path.indexOf("/") > -1) {
        folderPaths.path = entry.path.substr(0, entry.path.lastIndexOf("/"));
      } else {
        folderPaths.path = "local";
      }

      if (entry.path.indexOf("/")) {
        folderPaths.name = entry.path;
        folderPaths.display = entry.path;
      } else {
        folderPaths.name = entry.path.substr(0, entry.path.lastIndexOf("/"));
        folderPaths.display = entry.path.substr(0, entry.path.lastIndexOf("/"));
      }

      printerLocations.push(folderPaths);
    }

    if (isFolder) {
      each(entry.children, function (child) {
        recursivelyPrintNames(child, depth + 1);
      });
    }
  };

  each(fileList, function (entry) {
    recursivelyPrintNames(entry);
  });

  return {
    printerFiles,
    printerLocations
  };
};

module.exports = {
  acquireWebCamData,
  acquirePrinterFilesAndFolderData
};
