const { existsSync, unlinkSync } = require("fs");

async function checkIfFileFileExistsAndDeleteIfSo(fileName) {
  let fileExists = false;
  if (existsSync(fileName)) await deleteExistingZipFile(fileName);
  return fileExists;
}

function deleteExistingZipFile(fileName) {
  return unlinkSync(fileName);
}

function getDetailsFromFile(fileDetails) {
  const fileAndRow = fileDetails.split("at ").pop().split("(").pop().replace(")", "").split(":");

  const detailsFromFile = {
    file: fileAndRow[0].trim(),
    line: fileAndRow[1],
    row: fileAndRow[2]
  };

  const string = `FILE NAME: ${detailsFromFile.file} | LINENO: ${detailsFromFile.line} | ROW: ${detailsFromFile.row}`;

  return string;
}

module.exports = {
  checkIfFileFileExistsAndDeleteIfSo,
  getDetailsFromFile
};
