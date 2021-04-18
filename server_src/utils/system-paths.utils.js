const { join } = require("path");

const systemRoot = "./";
const logFolder = "logs";

function getLogsPath() {
  return join(systemRoot, logFolder);
}

module.exports = { getLogsPath, systemRoot };
