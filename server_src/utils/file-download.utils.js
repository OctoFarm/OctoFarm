"use strict";
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const imagePath = "./images";
const historyCollectionFolderName = "historyCollection";
const historyThumbnailFolderName = "thumbs";

const ensureHistoryCollectionDirExists = async () => {
  const targetHistoryPath = path.join(imagePath, historyCollectionFolderName);
  if (!fs.existsSync(targetHistoryPath)) {
    fs.mkdirSync(targetHistoryPath);
  }
  return fs.existsSync(targetHistoryPath);
};
const ensureThumbnailsDirExists = async () => {
  const targetThumbnailPath = path.join(
    imagePath,
    historyCollectionFolderName,
    historyThumbnailFolderName
  );
  if (!fs.existsSync(targetThumbnailPath)) {
    fs.mkdirSync(targetThumbnailPath);
  }
  return fs.existsSync(targetThumbnailPath);
};
/**
 * Generates the history state value.
 * @param {String} downloadURL
 * @param {Object} historyId
 * @param {String} thumbnail
 * @param {String} apikey
 * @throws {Error} If the state is not correctly provided as a Boolean.
 */
module.exports.historyImageDownloader = async (
  downloadURL = undefined,
  historyId = undefined,
  thumbnail = undefined,
  apikey = undefined
) => {
  if (!downloadURL || !historyId || !thumbnail || !apikey)
    throw new Error("A required value is not defined...");

  const historyDirExists = await ensureHistoryCollectionDirExists();
  const thumbnailDirExists = await ensureThumbnailsDirExists();

  if (!historyDirExists || !thumbnailDirExists)
    throw new Error("HistoryCollection or thumbnail directories do not exist!");

  const targetThumbnailPath = path.join(
    imagePath,
    historyCollectionFolderName,
    historyThumbnailFolderName
  );

  const thumbParts = thumbnail.split("/");
  const result = thumbParts[thumbParts.length - 1];
  const splitAgain = result.split("?");

  const thumbnailFileName = path.join(
    targetThumbnailPath,
    `${historyId}-${splitAgain[0]}`
  );
  const writer = fs.createWriteStream(thumbnailFileName);
  console.warn("Downloading thumbnail from URL", downloadURL);
  const { data } = await axios({
    timeout: 5000,
    url: downloadURL,
    method: "GET",
    responseType: "stream",
    headers: {
      "content-type": "image/png",
      "x-api-key": apikey,
    },
  });
  await data.pipe(writer);
  return thumbnailFileName;
};
