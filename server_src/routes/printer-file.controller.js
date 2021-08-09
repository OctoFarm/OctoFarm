const { ensureAuthenticated } = require("../middleware/auth");
const { createController } = require("awilix-express");
const Logger = require("../handlers/logger.js");
const { validateMiddleware } = require("../handlers/validators");
const { AppConstants } = require("../app.constants");

class PrinterFileController {
  #filesStore;

  #logger = new Logger("OctoFarm-API");

  constructor({ filesStore }) {
    this.#filesStore = filesStore;
  }

  async removeFile(req, res) {
    const input = await validateMiddleware(req, crudFileRules, res);

    await this.#filesStore.removeFile(input.id, input.fullPath);
    this.#logger.info(`File reference removed for printerId ${input.id}`, input.fullPath);

    res.send();
  }

  // === TODO BELOW ===
  async resyncFile(req, res) {
    const file = req.body;
    logger.info("Files Re-sync request for: ", file);
    let ret = null;

    // TODO no!
    // if (typeof file.fullPath !== "undefined") {
    //   ret = await Runner.reSyncFile(file.i, file.fullPath);
    // } else {
    //   ret = await Runner.getFiles(file.i, true);
    // }
    // Removed timeout... there's absolutely no reason for it.
    res.send(ret);
  }

  async moveFile(req, res) {
    const data = req.body;
    if (data.newPath === "/") {
      data.newPath = "local";
      data.newFullPath = data.newFullPath.replace("//", "");
    }
    logger.info("Move file request: ", data);
    Runner.moveFile(data.index, data.newPath, data.newFullPath, data.fileName);
    res.send({ msg: "success" });
  }

  async createFile(req, res) {
    const data = req.body;
    logger.info("Adding a new file to server: ", data);
    Runner.newFile(data);
    res.send({ msg: "success" });
  }

  // Folder actions below
  async removeFolder(req, res) {
    const folder = req.body;
    logger.info("Folder deletion request: ", folder.fullPath);
    await Runner.deleteFolder(folder.index, folder.fullPath);
    res.send(true);
  }

  async moveFolder(req, res) {
    const data = req.body;
    logger.info("Move folder request: ", data);
    Runner.moveFolder(data.index, data.oldFolder, data.newFullPath, data.folderName);
    res.send({ msg: "success" });
  }

  async createFolder(req, res) {
    const data = req.body;
    logger.info("New folder request: ", data);
    Runner.newFolder(data);
    res.send({ msg: "success" });
  }
}

// prettier-ignore
module.exports = createController(PrinterFileController)
  .prefix(AppConstants.apiRoute + "/printer-files")
  .before([ensureAuthenticated])
  .delete("/file", "removeFile")
  .post("/file/resync", "resyncFile")
  .post("/file/move", "moveFile")
  .post("/file/create", "createFile")
  .delete("/folder", "removeFolder")
  .delete("/folder/move", "moveFolder")
  .post("/folder/create", "createFolder");
