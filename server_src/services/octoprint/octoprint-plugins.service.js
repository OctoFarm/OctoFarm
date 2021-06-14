"use strict";

const serverSettings = require("../settings.service.js");
const path = require("path");
const { validateURL } = require("../../utils/url.utils.js");
const {
  historyImageDownloader,
} = require("../../utils/file-download.utils.js");
const { findIndex } = require("lodash");

/**
 * Generates the history state value.
 * @throws {Error} If the state is not correctly provided as a Boolean.
 * @param captureState
 * @param filesList
 * @param fileName
 * @param historyId
 */
module.exports.octoprintGrabThumbnail = async (
  captureState = undefined,
  filesList = undefined,
  fileName = undefined,
  historyId = undefined,
  printerURL = undefined,
  printerAPIKEY = undefined
) => {
  // Check whether user wants to capture a thumbnail
  let returnedServerSettings = await serverSettings.list();

  if (!returnedServerSettings) throw new Error("Couldn't find server settings");

  const historyThumbnailSettings = returnedServerSettings?.history?.thumbnails;

  if (!historyThumbnailSettings)
    throw new Error("Couldn't find history thumbnail settings");

  // Check the settings and make sure they exist and user wants us to capture
  let doWeCaptureThumbnail = false;
  switch (captureState) {
    case true:
      // True state = capture onComplete
      if (historyThumbnailSettings?.onComplete) {
        doWeCaptureThumbnail = historyThumbnailSettings?.onComplete;
        break;
      }
      break;
    case false:
      // False state = capture onFailure
      if (historyThumbnailSettings?.onFailure) {
        doWeCaptureThumbnail = historyThumbnailSettings?.onFailure;
        break;
      }
      break;
    default:
      throw new Error("State doesn't exist");
  }
  let octofarmImageLocation = "";
  if (doWeCaptureThumbnail) {
    // What file are we working with?
    const currentFileIndex = findIndex(filesList, function (o) {
      return o.name === fileName;
    });
    let currentFile = filesList[currentFileIndex];
    // Check if file actually exists, hard error if not as it should be synced before this.
    if (!currentFile) throw new Error("File does not exist");
    // Does the file have a thumbnail?
    // Not a hard error due to default setting on capture.
    if (!currentFile?.thumbnail) return octofarmImageLocation;

    let thumbnailURL = `${printerURL}/${currentFile.thumbnail}`;
    // Validate the URL and check if it exists
    const doWeHaveValidURL = await validateURL(thumbnailURL);

    if (!doWeHaveValidURL) return octofarmImageLocation;
    // Download the image file and save to images/historyCollection
    octofarmImageLocation = await historyImageDownloader(
      thumbnailURL,
      historyId,
      currentFile.thumbnail,
      printerAPIKEY
    );

    return octofarmImageLocation;
  } else {
    // User doesn't want thumbnails captured, return blank string as before
    return octofarmImageLocation;
  }
};
