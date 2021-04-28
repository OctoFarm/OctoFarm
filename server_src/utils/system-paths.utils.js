const { join } = require("path");
const { lookpath } = require("lookpath");

const systemRoot = "./";
const logFolder = "logs";

function getLogsPath() {
  return join(systemRoot, logFolder);
}
async function checkIfFunctionExistsInPath(systemCommand) {
  return await lookpath(systemCommand);
}

module.exports = { getLogsPath, systemRoot, checkIfFunctionExistsInPath };
