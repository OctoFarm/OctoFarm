const { createController } = require("awilix-express");
const { ensureAuthenticated } = require("../../middleware/auth");
const Logger = require("../../handlers/logger.js");
const { AppConstants } = require("../../app.constants");

class LogsController {
  #logger = new Logger("OctoFarm-API");

  #serverLogsService;

  constructor({ serverLogsService }) {
    this.#serverLogsService = serverLogsService;
  }

  async list(req, res) {
    const serverLogs = await this.#serverLogsService.grabLogs();
    res.send(serverLogs);
  }

  async download(req, res) {
    const download = req.params.name;
    const file = `./logs/${download}`;
    res.download(file, download); // Set disposition and send it.
  }

  async generateLogDumpZip(req, res) {
    // TODO configure the dump let settings = req.body;

    let zipDumpResponse = {
      status: "error",
      msg: "Unable to generate zip file, please check 'OctoFarm-API.log' file for more information.",
      zipDumpPath: ""
    };

    try {
      zipDumpResponse.zipDumpPath = await this.#serverLogsService.generateLogDumpZip();
      zipDumpResponse.status = "success";
      zipDumpResponse.msg = "Successfully generated zip file, please click the download button.";
    } catch (e) {
      this.#logger.error("Error Generating Log Dump Zip File | ", e);
    }

    res.send(zipDumpResponse);
  }
}

// prettier-ignore
module.exports = createController(LogsController)
  .prefix(AppConstants.apiRoute + "/settings/logs")
  .before([ensureAuthenticated])
  .get("", "list")
  .get("/:name", "download")
  .put("/generate-log-dump", "generateLogDumpZip");
