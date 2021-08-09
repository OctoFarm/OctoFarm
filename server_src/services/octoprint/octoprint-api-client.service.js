const fs = require("fs");
const request = require("request");
const { OPClientErrors } = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const OctoPrintApiService = require("./octoprint-api.service");
const { ValidationException } = require("../../exceptions/runtime.exceptions");

const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFile = (path) => apiBase + "/files/local/" + path;
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiConnection = apiBase + "/connection";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiUsers = apiBase + "/users";
const apiLogin = (passive = true) => apiBase + "/login" + (passive ? "?passive=true" : "");

const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiPluginManagerRepository1_6_0 = octoPrintBase + "plugin/pluginmanager/repository";
const apiSoftwareUpdateCheck = (force) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiPluginPiSupport = apiBase + "/plugin/pi_support";
const apiPluginFilamentManagerSpools = apiBase + "/plugin/filamentmanager/spools";
const apiPluginFilamentManagerProfiles = apiBase + "/plugin/filamentmanager/profiles";
const apiTimelapse = apiBase + "/timelapse";

const printerValidationErrorMessage = "printer apiKey or URL undefined";

class OctoPrintApiClientService extends OctoPrintApiService {
  constructor({ settingsStore }) {
    super({ settingsStore });
  }

  validatePrinter(printer) {
    if (!printer.apiKey || !printer.printerURL) {
      throw new ValidationException(printerValidationErrorMessage);
    }
  }

  async getWithOptionalRetry(printer, route, retry = false) {
    this.validatePrinter(printer);
    if (retry) {
      return await this.getRetry(printer.printerURL, printer.apiKey, route);
    } else {
      return await this.get(printer.printerURL, printer.apiKey, route);
    }
  }

  async postPrinter(printer, route, data, timeout = false) {
    this.validatePrinter(printer);
    return super.post(printer.printerURL, printer.apiKey, route, data, timeout);
  }

  async deletePrinter(printer, route) {
    this.validatePrinter(printer);
    return super.delete(printer.printerURL, printer.apiKey, route);
  }

  async login(printer, passive = true) {
    return this.postPrinter(printer, apiLogin(passive), {}, false);
  }

  async getSettings(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSettingsPart, retry);
  }

  async getAdminUserOrDefault(printer) {
    const response = await this.getUsers(printer, true);
    if (response.status != 200) throw "Didnt get 200 response";

    const data = await response.json();
    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiUsers, retry);
  }

  /**
   * List files recursively or not.
   * @param printer
   * @param recursive
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFiles(printer, recursive = false) {
    return this.getWithOptionalRetry(printer, apiFiles(recursive), false);
  }

  /**
   * Get a specific file
   * @param printer
   * @param path
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFile(printer, path, retry = false) {
    return this.getWithOptionalRetry(printer, apiFile(path), retry);
  }

  async getConnection(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiConnection, retry);
  }

  async getPrinterProfiles(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiPrinterProfiles, retry);
  }

  async getPluginManager(printer, retry = false) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const route = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;

    return this.getWithOptionalRetry(printer, route, retry);
  }

  async getSystemInfo(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSystemInfo, retry);
  }

  async getSystemCommands(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSystemCommands, retry);
  }

  async getSoftwareUpdateCheck(printer, force, retry = false) {
    return this.getWithOptionalRetry(printer, apiSoftwareUpdateCheck(force), retry);
  }

  async getPluginPiSupport(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiPluginPiSupport, retry);
  }

  async deleteTimeLapse(printer, fileName) {
    if (!fileName) {
      throw new Error("Cant delete timelapse file without providing filename");
    }
    return this.deletePrinter(printer, `${apiTimelapse}/${fileName}`);
  }

  async listUnrenderedTimeLapses(printerConnection) {
    return this.getWithOptionalRetry(printerConnection, apiTimelapse + "?unrendered=true", false);
  }

  async listPluginFilamentManagerProfiles(printer) {
    const getURL = `${apiPluginFilamentManagerProfiles}`;
    return this.getWithOptionalRetry(printer, getURL, false);
  }

  async listPluginFilamentManagerFilament(printer) {
    const getURL = `${apiPluginFilamentManagerSpools}`;
    return this.getWithOptionalRetry(printer, getURL, false);
  }

  async getPluginFilamentManagerFilament(printer, filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }
    const getURL = `${apiPluginFilamentManagerSpools}/${parsedFilamentID}`;
    return this.getWithOptionalRetry(printer, getURL, false);
  }

  async downloadFile(printerConnection, fetchPath, targetPath, callback) {
    const res = await this.getWithOptionalRetry(printerConnection, fetchPath, false);
    const fileStream = fs.createWriteStream(targetPath);
    return await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", async () => {
        await callback(resolve, reject);
      });
    });
  }

  async downloadImage({ printerURL, apiKey }, fetchPath, targetPath, callback) {
    const downloadURL = new URL(fetchPath, printerURL);
    return request.head(downloadURL, (err, res, body) => {
      res.headers["content-type"] = "image/png";
      res.headers["x-api-key"] = apiKey;
      request(url).pipe(fs.createWriteStream(targetPath)).on("close", callback);
    });
  }
}

module.exports = OctoPrintApiClientService;
